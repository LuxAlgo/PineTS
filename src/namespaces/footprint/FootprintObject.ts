// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { FootprintLevel } from '../../marketData/types';
import { PineArrayObject, PineArrayType } from '../array/PineArrayObject';
import { VolumeRowObject } from './VolumeRowObject';
import { resolveArg } from './resolve';

/** Parameters of the `request.footprint()` call a footprint was built for. */
export interface FootprintParams {
    /** Row height in ticks (`ticks_per_row`). */
    ticksPerRow: number;
    /** `syminfo.mintick` — the size of one tick in price units. */
    mintick: number;
    /** Share of the total volume the value area must contain (`va_percent`). */
    vaPercent: number;
    /** Ratio (in percent) one side must reach against its diagonal neighbour (`imbalance_percent`). */
    imbalancePercent: number;
}

/**
 * Comparison tolerance shared with the transpiled `>=` helper (`math.__ge`), so a
 * row whose buy volume is exactly 3× the neighbour's sell volume still counts as
 * imbalanced when binary rounding lands a hair below the threshold.
 */
const EPSILON = 1e-10;

/**
 * Volume by which the value area may overshoot its `va_percent` target before a
 * row is refused. TradingView admits a row that lands less than 0.01 volume units
 * over the target (whatever the symbol's volume scale) and refuses one 0.0101
 * over, so a strict comparison would stop one row short on those bars.
 */
const VA_VOLUME_TOLERANCE = 0.01;

/** TradingView answers `na` rather than build a footprint with more rows than this. */
const MAX_ROWS = 2000;

/** The bar's price range, used to extend the footprint's rows over the whole candle. */
export interface FootprintRange {
    low: number;
    high: number;
}

/** `Math.floor` guarded against values that sit a rounding error below an integer. */
function floorTolerant(x: number): number {
    return Math.floor(x + 1e-6);
}

/**
 * The row a tick falls into. A level's price is the LOW edge of its bucket, so
 * the tick that contains it is `round(price / mintick)`; rows are then
 * `ticks_per_row` consecutive ticks anchored at price 0, which keeps every row of
 * every bar on one shared grid (the same convention as a footprint chart's rows).
 */
function rowIndexOfTick(tickIndex: number, ticksPerRow: number): number {
    return Math.floor(tickIndex / ticksPerRow);
}

/** The row that contains `price` — the same grid as {@link rowIndexOfTick}. */
function rowIndexOfPrice(price: number, mintick: number, ticksPerRow: number): number {
    return rowIndexOfTick(Math.round(price / mintick), ticksPerRow);
}

/**
 * A bar's volume footprint (Pine's `footprint` type): contiguous rows covering the
 * bar's whole `low..high` range (and every priced level), each
 * `ticks_per_row × mintick` high, plus the bar-level aggregates derived from them.
 * Built once per bar and parameter set; immutable afterwards.
 *
 * The derived values follow TradingView's footprint, verified row-for-row against
 * its `request.footprint()` output: rows sit on a grid anchored at price 0; the
 * POC is the row with the largest total volume, a tie going to the row closest to
 * the middle of the footprint (the lower one when equidistant); the value area
 * grows from the POC by the larger adjacent row (a tie going to the row closer to
 * the POC, then upward) and stops BEFORE the row that would carry it past
 * `va_percent`; imbalances are diagonal at `imbalance_percent / 100`.
 *
 * Instance methods mirror the `footprint.*` namespace functions so both Pine
 * call styles work: `footprint.poc(fp)` and `fp.poc()`.
 */
export class FootprintObject {
    /** Rows ascending by price — index 0 is the lowest row. */
    public readonly rowList: readonly VolumeRowObject[];
    public readonly buyVolume: number;
    public readonly sellVolume: number;
    public readonly totalVolume: number;
    public readonly deltaVolume: number;
    /** Index (into `rowList`) of the Point of Control row. */
    public readonly pocIndex: number;
    /** Index of the highest row inside the value area. */
    public readonly vahIndex: number;
    /** Index of the lowest row inside the value area. */
    public readonly valIndex: number;

    private readonly _rowSize: number;
    private readonly _firstRowIndex: number;
    private readonly _context: any;

    private constructor(
        context: any,
        rows: VolumeRowObject[],
        rowSize: number,
        firstRowIndex: number,
        totals: { buy: number; sell: number; total: number; delta: number },
        poc: number,
        va: { lo: number; hi: number },
    ) {
        this._context = context;
        this.rowList = rows;
        this._rowSize = rowSize;
        this._firstRowIndex = firstRowIndex;
        this.buyVolume = totals.buy;
        this.sellVolume = totals.sell;
        this.totalVolume = totals.total;
        this.deltaVolume = totals.delta;
        this.pocIndex = poc;
        this.valIndex = va.lo;
        this.vahIndex = va.hi;
    }

    /**
     * Build the footprint of one bar from its price levels. `range` (the bar's
     * `low`/`high`) extends the rows over the whole candle, so a wick that traded
     * nothing on the source's grid still gets its (empty) row, as on the chart.
     *
     * Returns `null` (Pine `na`) when the bar has no usable level or would need
     * more than 2000 rows.
     */
    static build(context: any, levels: readonly FootprintLevel[], params: FootprintParams, range?: FootprintRange): FootprintObject | null {
        const precision = (v: number) => context.precision(v);
        const { ticksPerRow, mintick } = params;
        const rowSize = ticksPerRow * mintick;

        // Accumulate per row index; the row grid is anchored at price 0.
        const buyByRow = new Map<number, number>();
        const sellByRow = new Map<number, number>();
        let minRow = Infinity;
        let maxRow = -Infinity;
        for (const level of levels) {
            if (!level || !Number.isFinite(level.price)) continue;
            const buy = Number.isFinite(level.buyVolume) ? level.buyVolume : 0;
            const sell = Number.isFinite(level.sellVolume) ? level.sellVolume : 0;
            const row = rowIndexOfPrice(level.price, mintick, ticksPerRow);
            buyByRow.set(row, (buyByRow.get(row) ?? 0) + buy);
            sellByRow.set(row, (sellByRow.get(row) ?? 0) + sell);
            if (row < minRow) minRow = row;
            if (row > maxRow) maxRow = row;
        }
        if (!Number.isFinite(minRow)) return null;
        if (range && Number.isFinite(range.low) && Number.isFinite(range.high) && range.low <= range.high) {
            // The top row is the one whose UPPER edge reaches `high`: a high sitting
            // exactly on a grid line closes the row below it rather than opening a new one.
            minRow = Math.min(minRow, rowIndexOfPrice(range.low, mintick, ticksPerRow));
            maxRow = Math.max(maxRow, minRow, rowIndexOfTick(Math.round(range.high / mintick) - 1, ticksPerRow));
        }

        const count = maxRow - minRow + 1;
        if (count > MAX_ROWS) return null;
        const buys = new Array<number>(count);
        const sells = new Array<number>(count);
        const totals = new Array<number>(count);
        let sumBuy = 0;
        let sumSell = 0;
        for (let i = 0; i < count; i++) {
            const buy = buyByRow.get(minRow + i) ?? 0;
            const sell = sellByRow.get(minRow + i) ?? 0;
            buys[i] = buy;
            sells[i] = sell;
            totals[i] = buy + sell;
            sumBuy += buy;
            sumSell += sell;
        }

        // Point of Control: the row with the most total volume. Tied rows resolve
        // to the one closest to the middle of the footprint, the lower of two
        // equidistant rows — an evenly spread bar puts its POC mid-range.
        let maxTotal = totals[0];
        for (let i = 1; i < count; i++) if (totals[i] > maxTotal) maxTotal = totals[i];
        const middle = (count - 1) / 2;
        let poc = -1;
        for (let i = 0; i < count; i++) {
            if (totals[i] + EPSILON < maxTotal) continue;
            if (poc < 0 || Math.abs(i - middle) < Math.abs(poc - middle) - EPSILON) poc = i;
        }

        // Value area: from the POC, repeatedly look at the row just above and the
        // row just below the area and take the larger one (a tie goes to the row
        // closer to the POC, then to the upper row). A row that would carry the
        // area more than VA_VOLUME_TOLERANCE past `va_percent` of the bar's volume is
        // refused and ends the area, so the value area holds at most the requested
        // share (plus the POC). An `na` share counts as 0.
        const grandTotal = sumBuy + sumSell;
        const vaPercent = Number.isNaN(params.vaPercent) ? 0 : params.vaPercent;
        const limit = grandTotal > 0 ? (grandTotal * vaPercent) / 100 + VA_VOLUME_TOLERANCE : 0;
        let lo = poc;
        let hi = poc;
        let inArea = totals[poc];
        while (lo > 0 || hi < count - 1) {
            const hasAbove = hi < count - 1;
            const hasBelow = lo > 0;
            const above = hasAbove ? totals[hi + 1] : -Infinity;
            const below = hasBelow ? totals[lo - 1] : -Infinity;
            let takeAbove: boolean;
            if (!hasBelow) takeAbove = true;
            else if (!hasAbove) takeAbove = false;
            else if (Math.abs(above - below) <= EPSILON) takeAbove = hi + 1 - poc <= poc - (lo - 1);
            else takeAbove = above > below;
            const next = takeAbove ? above : below;
            if (inArea + next > limit) break;
            inArea += next;
            if (takeAbove) hi++;
            else lo--;
        }

        // Imbalances are diagonal: a row's buys against the sells one row below,
        // its sells against the buys one row above. The extreme rows have no
        // counterpart on that side and never flag there. A percentage below 100 acts
        // as 100 (one side must at least match the other); `na` flags nothing.
        const ratio = Math.max(params.imbalancePercent / 100, 1);
        const rows: VolumeRowObject[] = new Array(count);
        for (let i = 0; i < count; i++) {
            const buy = buys[i];
            const sell = sells[i];
            const buyImbalance = i > 0 && buy > 0 && buy + EPSILON >= ratio * sells[i - 1];
            const sellImbalance = i < count - 1 && sell > 0 && sell + EPSILON >= ratio * buys[i + 1];
            const downPrice = precision((minRow + i) * rowSize);
            const upPrice = precision((minRow + i + 1) * rowSize);
            rows[i] = new VolumeRowObject({
                downPrice,
                upPrice,
                buyVolume: precision(buy),
                sellVolume: precision(sell),
                totalVolume: precision(buy + sell),
                delta: precision(buy - sell),
                buyImbalance,
                sellImbalance,
            });
        }

        return new FootprintObject(
            context,
            rows,
            rowSize,
            minRow,
            { buy: precision(sumBuy), sell: precision(sumSell), total: precision(grandTotal), delta: precision(sumBuy - sumSell) },
            poc,
            { lo, hi },
        );
    }

    buy_volume(): number {
        return this.buyVolume;
    }

    sell_volume(): number {
        return this.sellVolume;
    }

    total_volume(): number {
        return this.totalVolume;
    }

    delta(): number {
        return this.deltaVolume;
    }

    poc(): VolumeRowObject {
        return this.rowList[this.pocIndex];
    }

    vah(): VolumeRowObject {
        return this.rowList[this.vahIndex];
    }

    val(): VolumeRowObject {
        return this.rowList[this.valIndex];
    }

    /** A NEW Pine array of the rows, lowest first — callers may mutate it freely. */
    rows(): PineArrayObject {
        return new PineArrayObject([...this.rowList], PineArrayType.any, this._context);
    }

    /** The row whose `[down_price, up_price)` range contains `price`; `na` outside the footprint. */
    get_row_by_price(priceArg: any): VolumeRowObject | number {
        const price = resolveArg(priceArg);
        if (typeof price !== 'number' || !Number.isFinite(price)) return NaN;
        const index = floorTolerant(price / this._rowSize) - this._firstRowIndex;
        if (index < 0 || index >= this.rowList.length) return NaN;
        return this.rowList[index];
    }
}
