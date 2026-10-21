// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Order, StrategyState, Trade } from './types';
import { Series } from '../../Series';
import { isNamedArgsBag } from '../utils';

// strategy() parameters in the TradingView reference order.
//prettier-ignore
const STRATEGY_PARAMS = [
    'title', 'shorttitle', 'overlay', 'format', 'precision', 'scale', 'pyramiding', 'calc_on_order_fills',
    'calc_on_every_tick', 'max_bars_back', 'backtest_fill_limits_assumption', 'default_qty_type',
    'default_qty_value', 'initial_capital', 'currency', 'slippage', 'commission_type', 'commission_value',
    'process_orders_on_close', 'close_entries_rule', 'margin_long', 'margin_short', 'explicit_plot_zorder',
    'max_lines_count', 'max_labels_count', 'max_boxes_count', 'calc_bars_count', 'risk_free_rate',
    'use_bar_magnifier', 'fill_orders_on_standard_ohlc', 'max_polylines_count', 'dynamic_requests',
    'behind_chart', 'calc_on_every_history_tick',
];

/**
 * Parse strategy() function arguments: positional arguments by their place in the signature,
 * then the transpiler's trailing named-arguments object (`strategy("t", overlay = true)` →
 * `strategy("t", {overlay: true})`).
 */
export function parseStrategyOptions(args: any[]): any {
    const value = (v: any) => (v instanceof Series ? v.get(0) : v);
    const options: any = {};
    args.forEach((a, i) => {
        if (isNamedArgsBag(a)) {
            for (const key of Object.keys(a)) options[key] = value(a[key]);
        } else if (i < STRATEGY_PARAMS.length && a !== undefined) {
            options[STRATEGY_PARAMS[i]] = value(a);
        }
    });
    return options;
}

/**
 * `base` moved by `ticks` mintick steps (strategy.exit profit / loss legs). When `base` is on the
 * tick grid the result is the exact grid price, so 62,629.99 + 20001 ticks equals a 62,830.00 high
 * instead of missing it by float noise (62,830.000000000004).
 */
export function tickLevel(base: number, ticks: number, mintick: number): number {
    const raw = base + ticks * mintick;
    if (!mintick || mintick <= 0) return raw;
    const n = base / mintick + ticks;
    const r = Math.round(n);
    if (Math.abs(n - r) > 1e-6) return raw;
    return gridPrice(r, mintick);
}

function gridPrice(ticks: number, mintick: number): number {
    const s = String(mintick);
    const decimals = s.includes('e-') ? Number(s.split('e-')[1]) + (s.split('e-')[0].split('.')[1]?.length ?? 0) : (s.split('.')[1]?.length ?? 0);
    return Number((ticks * mintick).toFixed(decimals));
}

/**
 * `price` moved to the nearest price on the tick grid. Split / dividend adjusted equity feeds carry
 * prices off the grid (AAPL 40.8125 with a 0.01 tick); TradingView's broker trades them at the
 * nearest tick (40.81) while the script still sees the raw value.
 */
export function snapToTick(price: number, mintick: number): number {
    if (!mintick || mintick <= 0 || !Number.isFinite(price)) return price;
    return gridPrice(Math.round(price / mintick), mintick);
}

/** A bar price as the broker sees it: on the tick grid unless PineTS.setFillsOnTickGrid(false). */
export function brokerPrice(context: any, price: number): number {
    return context._fillsOnTickGrid ? snapToTick(price, context.pine?.syminfo?.mintick) : price;
}

/**
 * The trailing stop's view of an off-grid bar (broker on the tick grid): its peak follows the raw
 * high / low, and its trigger rounds to the grid away from the market. TradingView, AAPL 1h, mintick
 * 0.01, 114-tick offset: high 233.405 (traded as 233.41) fires a long's trail at 232.26 = floor(233.405
 * - 1.14); AAPL 1D, 37-tick offset: low 71.5325 fires a short's trail at 71.91 = ceil(71.5325 + 0.37).
 */
function offGridTrail(context: any): { peakAt: (p: number) => number } | undefined {
    const mintick = context.pine?.syminfo?.mintick;
    if (!context._fillsOnTickGrid || !mintick) return undefined;
    const raw = context._rawBar;
    if (!raw) return { peakAt: (p: number) => p };
    const high = snapToTick(raw.high, mintick);
    const low = snapToTick(raw.low, mintick);
    const open = snapToTick(raw.open, mintick);
    return { peakAt: (p: number) => (p === high ? raw.high : p === low ? raw.low : p === open ? raw.open : p) };
}

/**
 * Round a stop/limit price to the symbol's mintick grid, AWAY from the
 * reference price (typically the current bar's close at order placement).
 *
 * Pine's broker emulator places stop/limit orders on the mintick grid
 * conservatively — a buy stop at 4188.4541 above current 4184 becomes
 * 4188.46 (ceiling), not 4188.45. This makes the order trigger LATER
 * (requires more price movement), mirroring real-broker order placement.
 *
 * The rule:
 *   price > referencePrice → ceil to mintick (push price UP)
 *   price < referencePrice → floor to mintick (push price DOWN)
 *   price === referencePrice → return as-is
 *
 * Covers all four cases naturally:
 *   - Buy stop above current  → ceil
 *   - Sell stop below current → floor
 *   - Buy limit below current → floor
 *   - Sell limit above current → ceil
 *   - Long TP above entry / SL below entry → ceil / floor
 *   - Short TP below entry / SL above entry → floor / ceil
 *
 * For mintick === 0 or undefined (defensive), returns the price unchanged.
 */
export function roundToMintick(price: number, referencePrice: number, mintick: number): number {
    if (!mintick || mintick <= 0 || !Number.isFinite(price)) return price;
    if (price === referencePrice) return price;
    const ticks = price / mintick;
    // Tolerance (in ticks) for a value already on the grid: a ta.sma of 85,311.77 comes out as
    // 85,311.7699999999, and TradingView fills `close + 0.2 * atr` = 64,277.98000025 (2.5e-5 ticks
    // above the grid) at 64,277.98, not 64,277.99.
    const EPS = 1e-4;
    return gridPrice(price > referencePrice ? Math.ceil(ticks - EPS) : Math.floor(ticks + EPS), mintick);
}

/**
 * An entry's limit / stop level on the mintick grid, rounded by the order's side whatever the
 * market: a buy limit rounds down, a buy stop up, a sell limit up, a sell stop down. This matches
 * roundToMintick for an order away from the market and differs for a marketable one (TradingView,
 * NVDA 1D: a buy limit at 23.487 placed with the close at 23.288 works at 23.48, not 23.49).
 */
export function roundOrderLevel(price: number, dir: number, kind: 'limit' | 'stop', mintick: number): number {
    if (!mintick || mintick <= 0 || !Number.isFinite(price)) return price;
    const ticks = price / mintick;
    const EPS = 1e-4;
    const up = (kind === 'stop') === (dir === 1);
    return gridPrice(up ? Math.ceil(ticks - EPS) : Math.floor(ticks + EPS), mintick);
}

/**
 * Denominator of a trade's `*_percent` getters: entry notional plus THAT trade's entry-leg
 * commission (TradingView: 87.0330 / (4,999.64 + 5) = 1.73905% with a 5 USDT cash_per_order fee).
 * Rows closed before the entry leg was recorded fall back to half the total commission.
 */
export function tradeCostBasis(t: Trade, pointValue: number): number {
    const entryCommission = t._entry_commission ?? (t.status === 'open' ? t.commission ?? 0 : (t.commission ?? 0) / 2);
    return Math.abs(t.size) * t.entry_price * pointValue + entryCommission;
}

/**
 * Margin required to hold a position of `qty` contracts at `price`, given
 * the `marginPct` (% of notional that must be posted as collateral). The
 * pointValue factor converts price units to account-currency dollars
 * (1 for crypto, varies for futures).
 *
 * Pine docs (strategy() declaration): `margin_long` / `margin_short` is
 * the percentage of notional held as collateral. 100 = no leverage, 20 =
 * 5× leverage, etc.
 */
export function computeRequiredMargin(qty: number, price: number, marginPct: number, pointValue: number): number {
    return (Math.abs(qty) * price * pointValue * marginPct) / 100;
}

/**
 * Account equity computed AS IF the marketprice were `atPrice` — used to
 * check what equity would be at a hypothetical intra-bar price (e.g. the
 * bar's adverse extreme for a margin-call check).
 *
 *   equity_at_price = initial_capital + netprofit + unrealizedPnL_at_price
 *
 * The mark-to-market is computed against EVERY open trade's entry price.
 */
export function computeEquityAtPrice(context: any, atPrice: number): number {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let unrealized = 0;
    for (const lot of ledgerOpenLots(strategy)) {
        const priceChange = lot.dir === 1 ? atPrice - lot.entry_price : lot.entry_price - atPrice;
        unrealized += priceChange * lot.qty * pointValue;
    }
    return strategy.initial_capital + strategy.netprofit + unrealized;
}

/**
 * Total margin currently held by all open positions, valued at `atPrice`.
 * Per-position margin uses `margin_long` for longs and `margin_short` for
 * shorts (Pine semantic — see strategy() declaration).
 */
export function computeHeldMargin(context: any, atPrice: number): number {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let total = 0;
    for (const trade of strategy.opentrades) {
        const dir = Math.sign(trade.size);
        const marginPct = dir === 1 ? (strategy.config.margin_long ?? 100) : (strategy.config.margin_short ?? 100);
        total += computeRequiredMargin(trade.size, atPrice, marginPct, pointValue);
    }
    return total;
}

/**
 * Calculate order quantity based on strategy configuration
 */
/**
 * Order quantity. Cash and percent-of-equity orders are sized at the expected fill price, slippage
 * included when the order would take it (`withSlippage`: market and stop orders, not limits).
 * `signed`: a negative quantity (negative fill price) is kept, truncated toward zero, instead of 0.
 */
export function calculateOrderQty(context: any, specifiedQty: number | undefined, direction: number, fillPrice: number, withSlippage = true, signed = false): number {
    const strategy: StrategyState = context.strategy;

    // Get qty type and value, calling functions if needed
    let qtyType = strategy.config.default_qty_type || 'fixed';
    let qtyValue = strategy.config.default_qty_value ?? 1;

    // If qtyType is a function, call it to get the actual string value
    if (typeof qtyType === 'function') {
        qtyType = (qtyType as Function)();
    }

    // If qtyValue is a function, call it to get the actual numeric value
    if (typeof qtyValue === 'function') {
        qtyValue = (qtyValue as Function)();
    }

    // Every path (explicit qty, fixed, cash, percent_of_equity) is floored to the symbol's
    // quantity step, as TradingView's broker emulator does. `qty = na` uses the default.
    if (specifiedQty !== undefined && specifiedQty !== null && !Number.isNaN(specifiedQty)) {
        return floorQty(context, Math.abs(specifiedQty));
    }

    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    if (withSlippage) fillPrice = applySlippage(context, direction, fillPrice);
    let rawQty: number;
    switch (qtyType) {
        case 'fixed':
            rawQty = qtyValue;
            break;

        case 'cash':
            // Futures contracts cost price × point value, rather than price alone.
            rawQty = qtyValue / (fillPrice * pointValue);
            break;

        case 'percent_of_equity': {
            // qty_value = 10 is 10% of equity. The order is sized so that the position AND its
            // entry commission fit in that amount (TradingView): a percent commission scales the
            // unit cost, a per-contract one adds to it, a per-order one is taken off the amount.
            // Without a margin model (margin 0) it is capped at 100% of equity (TV: 120%, 150% and
            // 300% at margin 0 all size 10,000 / 63,465.51 = 0.158; at margin 50%, 150% is used).
            const marginPct = Number(direction === -1 ? strategy.config.margin_short : strategy.config.margin_long);
            const pct = marginPct === 0 ? Math.min(qtyValue, 100) : qtyValue;
            const positionValue = (strategy.equity * pct) / 100;
            const unitCost = fillPrice * pointValue;
            const commType = strategy.config.commission_type ?? 'percent';
            const commValue = Number(strategy.config.commission_value ?? 0) || 0;
            if (commType === 'cash_per_contract') rawQty = positionValue / (unitCost + commValue);
            else if (commType === 'cash_per_order') rawQty = (positionValue - commValue) / unitCost;
            else rawQty = positionValue / (unitCost * (1 + commValue / 100));
            break;
        }

        default:
            rawQty = qtyValue;
    }
    if (signed && rawQty < 0) return -floorQty(context, -rawQty);
    return floorQty(context, rawQty);
}

/**
 * The price cash / percent-of-equity sizing uses: the stop price of a stop or stop-limit order,
 * the limit price of a limit order, else `fallback` (the signal bar's close). An na leg is absent.
 * `dir` is the order's side (1 buy, -1 sell).
 */
export function sizingPrice(stop: number | undefined, limit: number | undefined, fallback: number, dir: number): number {
    const isPrice = (p: number | undefined): p is number => typeof p === 'number' && Number.isFinite(p);
    // An order already marketable at the close is sized there, as a market order (TV, TSLA 1D: a buy
    // limit at 13.66 placed with the close at 13.48 is sized at 13.48).
    if (isPrice(stop)) return (dir === 1 ? fallback >= stop : fallback <= stop) ? fallback : stop;
    if (isPrice(limit)) return (dir === 1 ? fallback <= limit : fallback >= limit) ? fallback : limit;
    return fallback;
}

/**
 * How far past a limit price the bar must trade for the limit to fill intrabar:
 * `strategy(backtest_fill_limits_assumption = N)` ticks (0 by default).
 */
export function limitFillSlack(context: any): number {
    const ticks = Number(context.strategy?.config?.backtest_fill_limits_assumption ?? 0);
    if (!Number.isFinite(ticks) || ticks <= 0) return 0;
    return ticks * (context.pine?.syminfo?.mintick ?? 0.01);
}

/** The current value of a strategy.* argument, which may arrive as a Series, an array or a getter. */
export function argValue(val: any): any {
    if (val === undefined || val === null) return val;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
    if (typeof val === 'function') return val();
    if (val instanceof Series) return val.get(0);
    if (Array.isArray(val)) return val[val.length - 1];
    if (typeof val === 'object' && val.get !== undefined) return val.get(0);
    return val;
}

/** An argument value that is `na`: a strategy.* argument given as na is absent. */
export function isNaArg(v: any): boolean {
    return (typeof v === 'number' && Number.isNaN(v)) || (typeof v === 'object' && v !== null && '__value' in v);
}

/**
 * The smallest tradable quantity: `syminfo.mincontract` (0.00001 for BINANCE:BTCUSDT), or
 * 0.000001 when the provider does not report one.
 */
export function qtyStep(context: any): number {
    const mincontract = context.pine?.syminfo?.mincontract;
    return typeof mincontract === 'number' && mincontract > 0 ? mincontract : 1e-6;
}

/**
 * Floors a quantity to the symbol's quantity step, as TradingView sizes orders (a fixed
 * 0.123456789 fills 0.12345, 1.99999999 fills 1.99999). The 1e-10 relative slack only absorbs
 * binary noise in the division (0.15 / 0.00001 is 14999.999999999998).
 */
export function floorQty(context: any, qty: number): number {
    if (!Number.isFinite(qty) || qty <= 0) return 0;
    const step = qtyStep(context);
    const steps = Math.floor((qty / step) * (1 + 1e-10));
    const decimals = Math.min(10, Math.max(0, Math.ceil(-Math.log10(step))));
    return Number((steps * step).toFixed(decimals));
}

/**
 * Quantity closed by a partial exit (`qty_percent`): floored to the quantity step, at least one
 * step (a 50% close of 0.00001 closes it), never more than the position.
 */
export function partialCloseQty(context: any, positionQty: number, percent: number): number {
    const step = qtyStep(context);
    return Math.min(positionQty, Math.max(step, floorQty(context, (positionQty * percent) / 100)));
}

/**
 * Process pending orders and execute them
 */
/** The bar's assumed intra-bar path (TV broker emulator): open → nearer extreme → farther extreme → close. */
export function barPath(open: number, high: number, low: number, close: number): number[] {
    return Math.abs(high - open) <= Math.abs(open - low) ? [open, high, low, close] : [open, low, high, close];
}

/**
 * Where on `path` price first reaches `level` moving `rising` (up) or not (down), as segment index +
 * fraction; 0 when the open is already past it, undefined when the bar never reaches it.
 */
function pathPosition(path: number[], level: number, rising: boolean): number | undefined {
    if (rising ? path[0] >= level : path[0] <= level) return 0;
    for (let i = 0; i < 3; i++) {
        const a = path[i], b = path[i + 1];
        if (rising ? a <= level && b >= level : a >= level && b <= level) return i + (b === a ? 0 : (level - a) / (b - a));
    }
    return undefined;
}

/**
 * A trailing stop along the bar's path, from `start` (the open, or a fill inside the bar). The
 * trail arms where price first reaches `armPrice`; the peak follows favorable moves; it fires where
 * an adverse move reaches peak ∓ offset ticks, at that level. TradingView:
 *   - a trail armed on an earlier bar fills at the open when the bar opens past its trigger
 *     (short trail at 3,752, next open 3,760.75 → 3,760.75);
 *   - armed on the way to the bar's high, it fires on the way down (trail 79,690 below a high of
 *     79,890 fills before a stop at 78,842.56);
 *   - `trail_points = 0` arms at the entry (a short entered at the open fires at entry + offset
 *     when the bar rises first); `trail_offset = 0` fires at the arming price itself.
 * Returns the fill (price and path position), if any, and the state at the end of the bar.
 */
function walkTrail(
    path: number[],
    start: { at: number; price: number },
    s: { armed: boolean; peak: number; armPrice?: number; offset: number; dir: number; mintick: number; offGrid?: { peakAt: (p: number) => number } },
): { fill?: { price: number; at: number; level: number }; armed: boolean; peak: number } {
    const { dir, mintick } = s;
    const u = (p: number) => dir * p; // favorable is up
    const trigger = (peak: number) => {
        const level = tickLevel(peak, -dir * s.offset, mintick);
        if (!s.offGrid || !mintick) return level;
        const ticks = level / mintick;
        return gridPrice(dir === 1 ? Math.floor(ticks + 1e-6) : Math.ceil(ticks - 1e-6), mintick);
    };
    const peakAt = s.offGrid?.peakAt ?? ((p: number) => p);
    let armed = s.armed;
    let peak = s.peak;
    const points: Array<{ at: number; price: number }> = [start];
    for (let i = Math.floor(start.at) + 1; i < path.length; i++) points.push({ at: i, price: path[i] });

    // At the start point: a gap past the trigger of an armed trail, or arming right there.
    if (armed && u(start.price) <= u(trigger(peak))) return { fill: { price: start.price, at: start.at, level: trigger(peak) }, armed, peak };
    // A favorable gap moves the peak to the open (TV, AAPL 1D: a short's trail peaked at 125.60, the
    // next bar opens at 123.76 and rallies: it fires at 123.76 + 0.65 = 124.41, not 125.60 + 0.65).
    if (armed && u(peakAt(start.price)) > u(peak)) {
        peak = peakAt(start.price);
        // With a zero offset the stop is then at the open itself (TV, BTC: a trail armed at a 63,650
        // close fills at the 63,650.01 open).
        if (u(start.price) <= u(trigger(peak))) return { fill: { price: start.price, at: start.at, level: trigger(peak) }, armed, peak };
    }
    if (!armed && s.armPrice !== undefined && u(start.price) >= u(s.armPrice)) {
        armed = true;
        peak = peakAt(start.price);
        // Armed at a gapped open, a zero offset waits for the first adverse move (TV, AAPL: a long's
        // trail armed at the 33.08 open fires at the 33.28 high it reaches first).
        if (s.offset <= 0 && start.at > 0) return { fill: { price: start.price, at: start.at, level: start.price }, armed, peak };
    }
    for (let k = 0; k + 1 < points.length; k++) {
        const a = points[k], b = points[k + 1];
        const pos = (price: number) => (a.price === b.price ? a.at : a.at + ((price - a.price) / (b.price - a.price)) * (b.at - a.at));
        if (u(b.price) > u(a.price)) {
            if (!armed && s.armPrice !== undefined && u(b.price) >= u(s.armPrice)) {
                armed = true;
                peak = s.armPrice;
                if (s.offset <= 0) return { fill: { price: s.armPrice, at: pos(s.armPrice), level: s.armPrice }, armed, peak };
            }
            if (armed && u(peakAt(b.price)) > u(peak)) peak = peakAt(b.price);
        } else if (armed && u(b.price) < u(a.price)) {
            const trig = trigger(peak);
            if (u(b.price) <= u(trig)) return { fill: { price: trig, at: pos(trig), level: trig }, armed, peak };
        }
    }
    return { armed, peak };
}

/**
 * A strategy.exit's take-profit and stop-loss levels for one trade. Given both a price (limit / stop)
 * and a tick distance (profit / loss), the level expected to fill first is used, the nearer to the
 * entry (TV: a long from 64,296.59 with profit → 64,553.70 and limit 64,728.26 takes profit at 64,553.70).
 * Pine v5 scripts keep the price legs (see Order._priceLegsWin).
 */
function exitBracket(o: Order, entry: number, dir: number, mintick: number): { tp?: number; sl?: number } {
    const tpTicks = o.profit !== undefined ? tickLevel(entry, dir * o.profit, mintick) : undefined;
    const slTicks = o.loss !== undefined ? tickLevel(entry, -dir * o.loss, mintick) : undefined;
    // Pine v5: the price leg wins ("the command ignores profit if the limit value is not na").
    const nearer = (a: number | undefined, b: number | undefined, pick: (x: number, y: number) => number) =>
        a === undefined ? b : b === undefined || o._priceLegsWin ? a : pick(a, b);
    return {
        tp: nearer(o.limit, tpTicks, dir === 1 ? Math.min : Math.max),
        sl: nearer(o.stop, slTicks, dir === 1 ? Math.max : Math.min),
    };
}

/** A trailing exit's activation level for one trade: of trail_price and trail_points, the one reached first. */
export function trailArmPrice(o: Order, entry: number, dir: number, mintick: number): number {
    const byPoints = o.trail_points !== undefined ? tickLevel(entry, dir * (o.trail_points as number), mintick) : undefined;
    if (o.trail_price === undefined) return byPoints as number;
    if (byPoints === undefined || o._priceLegsWin) return o.trail_price;
    return dir === 1 ? Math.min(o.trail_price, byPoints) : Math.max(o.trail_price, byPoints);
}

/** Where a trade's trailing stop starts walking the bar: a trade a limit / stop entry opened inside it only sees the path after its fill. */
function trailStart(context: any, t: any, path: number[]): { at: number; price: number } {
    const entered = t._intrabarEntry?.bar === context.idx ? t._intrabarEntry : undefined;
    if (entered) {
        const rising = !((entered.type === 'limit') === (entered.dir === 1));
        const at = pathPosition(path, entered.level, rising);
        if (at !== undefined) return { at, price: entered.level };
    }
    return { at: 0, price: path[0] };
}

/**
 * Earliest point on the path where a pending strategy.exit price leg of the open position fills
 * (stop / limit, or profit / loss ticks from each trade's entry). Trailing legs count with `withTrail`.
 */
function firstExitLegOnPath(context: any, path: number[], withTrail = false): number | undefined {
    let first: number | undefined;
    for (const leg of exitLegsOnPath(context, path, withTrail)) if (first === undefined || leg.at < first) first = leg.at;
    return first;
}

/** Every pending strategy.exit leg of the open position the bar's path reaches (see firstExitLegOnPath). */
function exitLegsOnPath(context: any, path: number[], withTrail: boolean): Array<{ at: number; level: number; order: Order; trade: any }> {
    const strategy: StrategyState = context.strategy;
    const dir = Math.sign(strategy.position_size);
    const legs: Array<{ at: number; level: number; order: Order; trade: any }> = [];
    if (dir === 0) return legs;
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    const slack = limitFillSlack(context);
    for (const o of strategy.pending_orders) {
        if (o.status !== 'pending' || (o.category ?? 'entry') !== 'exit' || o.bar >= context.idx) continue;
        for (const t of strategy.opentrades) {
            if (o.from_entry && t.entry_id !== o.from_entry) continue;
            if (t._exits_filled?.has(o.id)) continue;
            const consider = (at: number | undefined, level: number) => {
                if (at !== undefined) legs.push({ at, level, order: o, trade: t });
            };
            const entry = t._bracket_entry ?? t.entry_price;
            const { tp, sl } = exitBracket(o, entry, dir, mintick);
            if (tp !== undefined) consider(pathPosition(path, tp + dir * slack, dir === 1), tp);
            if (sl !== undefined) consider(pathPosition(path, sl, dir !== 1), sl);
            if (withTrail && o.trail_offset !== undefined && (o.trail_price !== undefined || o.trail_points !== undefined)) {
                const armPrice = trailArmPrice(o, entry, dir, mintick);
                const state = o._trailByTrade?.[t.id] ?? { armed: false, peak: NaN };
                const fill = walkTrail(path, trailStart(context, t, path), { ...state, armPrice, offset: o.trail_offset, dir, mintick, offGrid: offGridTrail(context) }).fill;
                if (fill) consider(fill.at, fill.level);
            }
        }
    }
    return legs;
}

/** Queues an entry or exit order, numbering it in placement order across both kinds. */
export function placeOrder(strategy: StrategyState, order: Order): void {
    const s = strategy as any;
    order._placed = s._placeCount = (s._placeCount ?? 0) + 1;
    strategy.pending_orders.push(order);
}

/** An entry / order in an OCA group that acts on its siblings (strategy.oca.cancel / reduce). */
function ocaGrouped(o: Order): boolean {
    return !!o.oca_name && (o.oca_type === 'cancel' || o.oca_type === 'reduce');
}

/**
 * Where on the bar's path an entry order fills (see pathPosition), or undefined when it does not
 * fill on this bar. `fillPrice` is the price already computed for it, when known.
 */
function entryPathPosition(o: Order, fillPrice: number | undefined, path: number[]): number | undefined {
    const dir = parseDirection(o.direction);
    if (o.type === 'market') return 0;
    const level = o.type === 'limit' ? o.limit : o.stop;
    if (level === undefined) return undefined;
    const rising = o.type === 'limit' ? dir === -1 : dir === 1;
    return pathPosition(path, fillPrice ?? level, rising);
}

/**
 * A filled OCA order acts on the other pending orders of its group: strategy.oca.cancel cancels
 * them, strategy.oca.reduce takes the filled quantity off them (cancelled when nothing is left).
 */
function applyOca(strategy: StrategyState, filled: Order, filledQty?: number, notReduced?: (o: Order) => boolean): void {
    const qty = filledQty ?? Math.abs((filled as any)._base_qty ?? filled.qty);
    for (const o of strategy.pending_orders) {
        // A group is its name and its type together (TV: a reduce-type and a cancel-type order sharing a
        // name both fill).
        if (o === filled || o.status !== 'pending' || o.oca_name !== filled.oca_name || o.oca_type !== filled.oca_type) continue;
        if (filled.oca_type === 'cancel') o.status = 'cancelled';
        else if (notReduced?.(o)) {
            // triggered together with the filled order (see processStrategyOrders)
        } else if ((o.category ?? 'entry') === 'exit' && !(o.qty > 0)) {
            // an exit without a fixed quantity covers whatever is left: nothing to take off it
        } else {
            o.qty = Math.max(0, o.qty - qty);
            if ((o as any)._base_qty !== undefined) (o as any)._base_qty = Math.max(0, (o as any)._base_qty - qty);
            if (o.qty <= 1e-9) o.status = 'cancelled';
        }
    }
}

/**
 * On a bar whose first move is against the position: is an exit leg of the position reached on the
 * way from the open to that adverse extreme? It then fills before the margin check at the extreme
 * (TV: a short's stop at 77,965.92 below the high of 77,999.99 closes the trade; no margin call).
 */
export function exitBeforeAdverseExtreme(context: any): boolean {
    if (!context.strategy || context.strategy.position_size === 0) return false;
    const open = Series.from(context.data.open).get(0);
    const high = Series.from(context.data.high).get(0);
    const low = Series.from(context.data.low).get(0);
    const close = Series.from(context.data.close).get(0);
    const at = firstExitLegOnPath(context, barPath(open, high, low, close));
    return at !== undefined && at < 1;
}

/**
 * Where on the path the first stop / limit leg (absolute or in ticks from each trade's entry) of one
 * exit order is reached; Infinity when none is on this bar. Market closes and trailing legs: 0.
 */
function exitFirstLegAt(context: any, o: Order, path: number[]): number {
    if (isMarketCloseOrder(o)) return 0;
    const strategy: StrategyState = context.strategy;
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    const slack = limitFillSlack(context);
    let first = Infinity;
    for (const t of strategy.opentrades) {
        if (o.from_entry && t.entry_id !== o.from_entry) continue;
        const dir = Math.sign(t.size);
        const entry = t._bracket_entry ?? t.entry_price;
        const { tp, sl } = exitBracket(o, entry, dir, mintick);
        if (tp !== undefined) first = Math.min(first, pathPosition(path, tp + dir * slack, dir === 1) ?? Infinity);
        if (sl !== undefined) first = Math.min(first, pathPosition(path, sl, dir !== 1) ?? Infinity);
        if (o.trail_offset !== undefined && (o.trail_price !== undefined || o.trail_points !== undefined)) {
            const armPrice = trailArmPrice(o, entry, dir, mintick);
            const state = o._trailByTrade?.[t.id] ?? { armed: false, peak: NaN };
            const walk = walkTrail(path, { at: 0, price: path[0] }, { ...state, armPrice, offset: o.trail_offset, dir, mintick, offGrid: offGridTrail(context) });
            if (walk.fill) first = Math.min(first, walk.fill.at);
        }
    }
    return first;
}

/**
 * How far from `open` the nearest stop / limit leg of an exit is, among the legs the bar opens past;
 * undefined when it opens past none.
 */
function exitGapDistance(context: any, o: Order, open: number): number | undefined {
    if (isMarketCloseOrder(o)) return undefined;
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    let nearest: number | undefined;
    for (const t of context.strategy.opentrades) {
        if (o.from_entry && t.entry_id !== o.from_entry) continue;
        const dir = Math.sign(t.size);
        const { tp, sl } = exitBracket(o, t._bracket_entry ?? t.entry_price, dir, mintick);
        if (tp !== undefined && dir * (open - tp) >= 0) nearest = Math.min(nearest ?? Infinity, Math.abs(open - tp));
        if (sl !== undefined && dir * (sl - open) >= 0) nearest = Math.min(nearest ?? Infinity, Math.abs(open - sl));
    }
    return nearest;
}

/**
 * Entries held back by processStrategyOrders because an exit of the position they reverse is
 * reached first on the bar's path: they fill after the intrabar exits, from what those leave. The
 * trades they open then meet their own exits on the rest of the path (TV: a long's stop, then a
 * short stop entry near the low, then that short's stop on the way back up, all on one bar).
 */
export function processDeferredEntries(context: any): void {
    const strategy: StrategyState | undefined = context.strategy;
    if (!strategy || !strategy.pending_orders.some((o) => o._deferredPastExits === context.idx)) return;
    const before = new Set(strategy.opentrades.map((t) => t.id));
    processStrategyOrders(context, true);
    const opened = new Set(strategy.opentrades.filter((t) => !before.has(t.id)).map((t) => t.id));
    if (opened.size > 0) processExitOrders(context, 'intrabar', opened);
}

export function processStrategyOrders(context: any, deferredOnly = false): void {
    if (!context.strategy) return;

    const strategy: StrategyState = context.strategy;
    const { pending_orders } = strategy;

    // Get current bar's OHLC data
    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);

    // Mark-to-market at OPEN price so fill logic / risk checks see accurate equity.
    // Excursions follow the bar's path (see excEndBar / excReplay).
    markToMarket(context, openPrice);

    const limitSlack = limitFillSlack(context);

    // Process each pending order that was placed on a previous bar
    // Entry orders fill in the order the bar's path reaches them (market orders at the open, in
    // queue order): a buy limit below and a sell limit above, both pending from flat, fill buy
    // first on a bar that goes down first (TV), whatever order they were placed in.
    const entryPath = barPath(openPrice, highPrice, lowPrice, closePrice);
    const fillAt = (o: Order): number => {
        if ((o.category ?? 'entry') === 'exit' || o.status !== 'pending' || o.bar >= context.idx || o.type === 'market') return 0;
        const dir = parseDirection(o.direction);
        const level = o.type === 'limit' ? o.limit : o.stop;
        if (level === undefined) return 0;
        return pathPosition(entryPath, level, o.type === 'limit' ? dir === -1 : dir === 1) ?? Infinity;
    };
    // Market orders filling together at the open: buy orders before sell orders, whatever the order
    // they were placed in (TV: strategy.order / strategy.entry short then long, or long then short,
    // both fill the long first).
    const sideAtOpen = (o: Order, at: number) => (at === 0 && o.type === 'market' && (o.category ?? 'entry') !== 'exit' ? (parseDirection(o.direction) === 1 ? 0 : 1) : 0);
    // A stop and a limit reached at the same point fill stop first, whatever their sides and the
    // order they were placed in (TV, AAPL / NVDA / TSLA 1D, a stop and a limit at the close, ~1,600
    // events: a buy stop before a sell limit at a gap-up open or both at 28.50 on the way up, a sell
    // stop before a buy limit at a gap-down open).
    // Market orders fill at the open before the stops and limits the bar opens past (TV, AAPL / NVDA
    // / TSLA 1D: a market long and an older short stop entry gapped through fill long first).
    const typeRank = (o: Order) => ((o.category ?? 'entry') === 'exit' ? 0 : o.type === 'market' ? 0 : o.type === 'limit' ? 2 : 1);
    // Stops or limits the bar opens past fill nearest the open first, whatever the order they were
    // placed in (TV, AAPL 1D: buy stops at 27.23 / 27.31 and an open of 27.7775 fill 27.31 first).
    const gapDistance = (o: Order, at: number) => {
        if (at !== 0 || o.type === 'market' || (o.category ?? 'entry') === 'exit') return 0;
        const level = o.type === 'limit' ? o.limit : o.stop;
        return level === undefined ? 0 : Math.abs(level - openPrice);
    };
    const queue = pending_orders
        .map((o, i) => ({ o, i, at: fillAt(o) }))
        .sort((a, b) => a.at - b.at || typeRank(a.o) - typeRank(b.o) || gapDistance(a.o, a.at) - gapDistance(b.o, b.at) || sideAtOpen(a.o, a.at) - sideAtOpen(b.o, b.at) || a.i - b.i)
        .map((x) => x.o);
    // The position held before this bar's fills: margin is checked against it (see fillEntryOrder).
    if (!deferredOnly) (strategy as any)._preFillSize = { idx: context.idx, size: strategy.position_size };

    for (const order of queue) {
        if (order.status !== 'pending') continue;

        // Skip exit-category orders — processExitOrders handles them.
        if ((order.category ?? 'entry') === 'exit') continue;
        if (deferredOnly && order._deferredPastExits !== context.idx) continue;

        // Orders placed on bar N can only fill on bar N+1 or later
        // Skip if this order was placed on the current bar (context.idx)
        if (order.bar >= context.idx) {
            continue;
        }

        let shouldFill = false;
        let fillPrice = openPrice;

        // Determine if order should be filled based on type
        switch (order.type) {
            case 'market':
                // Market orders fill at current bar's open (which is "next bar's open" from order placement)
                shouldFill = true;
                fillPrice = openPrice;
                break;

            case 'limit':
                // Limit orders fill when price reaches the limit level (past it by
                // backtest_fill_limits_assumption ticks), at the open when the bar opens
                // beyond it (a better price, as on TradingView: limit 7,119.35, open 7,102.50 → 7,102.50).
                // An open past the limit by fewer than those ticks fills at the limit (TV, AAPL 1D,
                // N = 200: limit 51.95, open 50.10, low 49.165 → 51.95).
                if (order.limit !== undefined) {
                    const direction = parseDirection(order.direction);
                    if (direction === 1 && lowPrice <= order.limit - limitSlack) {
                        // Long limit order - buy when price drops to limit
                        shouldFill = true;
                        fillPrice = openPrice <= order.limit - limitSlack ? openPrice : order.limit;
                    } else if (direction === -1 && highPrice >= order.limit + limitSlack) {
                        // Short limit order - sell when price rises to limit
                        shouldFill = true;
                        fillPrice = openPrice >= order.limit + limitSlack ? openPrice : order.limit;
                    }
                }
                break;

            case 'stop':
                // Stop orders fill when price crosses the stop level, at the open when the bar
                // opens beyond it (TradingView: all 120 gapped stop entries on AAPL / ES).
                if (order.stop !== undefined) {
                    const direction = parseDirection(order.direction);
                    if (direction === 1 && highPrice >= order.stop) {
                        // Long stop order - buy when price rises to stop
                        shouldFill = true;
                        fillPrice = Math.max(openPrice, order.stop);
                    } else if (direction === -1 && lowPrice <= order.stop) {
                        // Short stop order - sell when price falls to stop
                        shouldFill = true;
                        fillPrice = Math.min(openPrice, order.stop);
                    }
                }
                break;

            case 'stop-limit':
                // Reaching the stop turns the order into a limit order (possibly filled on the
                // same bar): it fills at the activation price when that is within the limit,
                // else at the limit once price comes back to it.
                if (order.stop !== undefined && order.limit !== undefined) {
                    const direction = parseDirection(order.direction);
                    let activation: number | undefined;
                    if (order._stopTriggered) activation = openPrice;
                    else if (direction === 1 ? highPrice >= order.stop : lowPrice <= order.stop) {
                        order._stopTriggered = true;
                        activation = direction === 1 ? Math.max(openPrice, order.stop) : Math.min(openPrice, order.stop);
                    }
                    if (activation !== undefined) {
                        if (direction === 1 ? activation <= order.limit : activation >= order.limit) {
                            shouldFill = true;
                            fillPrice = activation;
                        } else if (direction === 1 ? lowPrice <= order.limit - limitSlack : highPrice >= order.limit + limitSlack) {
                            shouldFill = true;
                            fillPrice = order.limit;
                        }
                    }
                }
                break;
        }
        if (deferredOnly && (order as any)._deferredFillPrice !== undefined) {
            shouldFill = true;
            fillPrice = (order as any)._deferredFillPrice;
            (order as any)._deferredFillPrice = undefined;
        }

        // A limit / stop / stop-limit entry against the open position fills where the path reaches
        // it. When an exit of that position is reached earlier on the path, the exit fills first and
        // the entry fills after it, with the quantity it was queued with (TV, #316; a stop-limit
        // long filling at 64,664 after the short's stop at 64,614, controlled case 22).
        // An exit reached at the same point as the entry: at a gap open, the order whose level is
        // nearer the open fills first; at the same level, the one placed first (TV, AAPL / NVDA /
        // TSLA 1D, BTCUSDT 1h). Both fill in full: an exit after the entry still sells / buys its
        // quantity, opening a position under its own id (a long's stop and a short stop entry at
        // one level, the entry placed first: the entry reverses to short 1, the exit adds short 1).
        let tiedExits: Array<{ order: Order; trade: any }> = [];
        if (shouldFill && !deferredOnly && (order.type === 'limit' || order.type === 'stop' || order.type === 'stop-limit')) {
            const dir = parseDirection(order.direction);
            const posDir = Math.sign(strategy.position_size);
            if (posDir !== 0 && posDir !== dir) {
                const path = barPath(openPrice, highPrice, lowPrice, closePrice);
                const entryAt = pathPosition(path, fillPrice, order.type === 'limit' ? dir === -1 : dir === 1);
                const legs = entryAt === undefined ? [] : exitLegsOnPath(context, path, true);
                const entryLevel = (order.type === 'limit' ? order.limit : order.stop) as number;
                // Only the exits of trades held before this bar can be reached at the entry's point
                // together with it; a trade opened at that same open is not.
                const tied = (leg: { at: number; trade: any }) => Math.abs(leg.at - (entryAt as number)) <= 1e-9 && leg.trade.entry_bar_index < context.idx;
                // An exit's level is its tightest working stop: with the stop-loss and an armed trail
                // both past the open, the trail's (TV, AAPL 1D: trail 71.70 / stop-loss 67.50 / short
                // stop entry 68.24, open 65.94: the entry is nearer the open and fills first).
                const exitLevelDistance = new Map<string, number>();
                for (const leg of legs) {
                    if (!tied(leg)) continue;
                    const key = `${leg.order._placed}:${leg.trade.id}`;
                    exitLevelDistance.set(key, Math.max(exitLevelDistance.get(key) ?? 0, Math.abs(leg.level - openPrice)));
                }
                const dEntry = Math.abs(entryLevel - openPrice);
                const exitFirst = legs.some((leg) => {
                    if (leg.at < (entryAt as number) - 1e-9) return true;
                    if (!tied(leg)) return false;
                    const dExit = exitLevelDistance.get(`${leg.order._placed}:${leg.trade.id}`) as number;
                    if (entryAt === 0 && Math.abs(dExit - dEntry) > 1e-9) return dExit < dEntry;
                    return (leg.order._placed ?? 0) < (order._placed ?? 0);
                });
                if (exitFirst) {
                    order._deferredPastExits = context.idx;
                    // fills there later (a stop-limit is marked triggered by now)
                    (order as any)._deferredFillPrice = fillPrice;
                    continue;
                }
                const seen = new Set<string>();
                for (const leg of legs) {
                    const key = `${leg.order._placed}:${leg.trade.id}`;
                    if (tied(leg) && !seen.has(key)) {
                        seen.add(key);
                        tiedExits.push({ order: leg.order, trade: leg.trade });
                    }
                }
            }
        }

        // One-cancels-all: when several orders of a group trigger on this bar, the one the path
        // reaches first fills (and cancels or reduces the others below).
        if (shouldFill && ocaGrouped(order)) {
            const path = barPath(openPrice, highPrice, lowPrice, closePrice);
            const at = entryPathPosition(order, fillPrice, path);
            const earlierSibling = pending_orders.some(
                (o) =>
                    o !== order &&
                    o.status === 'pending' &&
                    o.oca_name === order.oca_name &&
                    o.oca_type === order.oca_type &&
                    ocaGrouped(o) &&
                    (o.category ?? 'entry') !== 'exit' &&
                    o.bar < context.idx &&
                    (entryPathPosition(o, undefined, path) ?? Infinity) < (at ?? Infinity),
            );
            if (earlierSibling) continue;
        }

        if (shouldFill) {
            const tiedQty = tiedExits.map(({ trade }) => Math.abs(trade.size));
            setFillAt(context, order.type === 'market' ? 0 : (entryPathPosition(order, fillPrice, entryPath) ?? 0));
            context._fillOnVertex = order.type === 'market' || fillPrice === openPrice;
            fillEntryOrder(context, order, fillPrice, currentTime, openPrice);
            context._fillOnVertex = undefined;
            if ((order.status as Order['status']) === 'filled') {
                tiedExits.forEach(({ order: exit, trade }, i) => {
                    if (strategy.opentrades.includes(trade) || !(tiedQty[i] > 1e-9)) return;
                    const fill: Order = {
                        id: exit.id,
                        comment: exit.comment,
                        direction: -Math.sign(trade.size),
                        qty: tiedQty[i],
                        type: exit.stop !== undefined || exit.loss !== undefined ? 'stop' : 'limit',
                        bar: context.idx,
                        time: currentTime,
                        status: 'pending',
                    } as Order;
                    fillEntryOrder(context, fill, fillPrice, currentTime, openPrice);
                });
            }
            if ((order.status as Order['status']) === 'filled' && ocaGrouped(order)) {
                // Stops the bar opens past all trigger at the open: a reduce-type fill does not reduce the
                // others (TV, AAPL 1D: stop entries of 3 and 2 both fill in full; limits are reduced, and
                // a cancel-type fill still cancels).
                const gappedStop = (o: Order) =>
                    o.type === 'stop' && o.stop !== undefined && o.bar < context.idx && (o.category ?? 'entry') !== 'exit' && (parseDirection(o.direction) === 1 ? openPrice >= o.stop : openPrice <= o.stop);
                applyOca(strategy, order, undefined, gappedStop(order) ? gappedStop : undefined);
            }
            // A limit / stop fill at its level inside the bar: tag the trades it opened, so their exits
            // on this bar only see the path after the fill (see entryBarPathExit).
            if ((order.status as Order['status']) === 'filled' && order.type !== 'market' && fillPrice !== openPrice) {
                const type: 'limit' | 'stop' = order.type === 'limit' || (order.type === 'stop-limit' && fillPrice === order.limit) ? 'limit' : 'stop';
                for (const t of strategy.opentrades) {
                    if (t.entry_id === order.id && t.entry_bar_index === context.idx && !t._intrabarEntry) {
                        t._intrabarEntry = { bar: context.idx, level: fillPrice, type, dir: parseDirection(order.direction) };
                    }
                }
            }
        }
    }

    // Remove filled and cancelled orders
    strategy.pending_orders = pending_orders.filter((o) => o.status === 'pending');

    // Refresh equity at CLOSE for processExitOrders' opening read.
    // Peaks are latched at the bar's end inside processExitOrders.
    markToMarket(context, closePrice);
    updateStrategyMetrics(context);
}

/**
 * Fills an entry order at `fillPrice` (before slippage) after the risk and margin checks, or
 * cancels it. `markPrice` values the positions that stay open for the margin check.
 */
function fillEntryOrder(context: any, order: Order, fillPrice: number, currentTime: number, markPrice: number): void {
    const strategy: StrategyState = context.strategy;
    if (riskBlocksOrder(context, order)) {
        order.status = 'cancelled';
        return;
    }
    // Pyramiding is counted when the order fills: two strategy.entry adds queued on one bar with
    // room for one more entry fill only the first (TV, case "21": pyramiding 3, 2 open, 2 adds).
    // strategy.order is not limited by pyramiding.
    if (order.category === 'entry' && Math.sign(strategy.position_size) === parseDirection(order.direction) && wouldExceedPyramiding(strategy, parseDirection(order.direction))) {
        order.status = 'cancelled';
        return;
    }

    // Apply slippage against the trade direction (longs fill higher,
    // shorts fill lower). slippage is in ticks of syminfo.mintick and
    // applies to market and stop orders only: a limit fills at its price.
    const direction = parseDirection(order.direction);
    if (order.type === 'market' || order.type === 'stop') fillPrice = applySlippage(context, direction, fillPrice);

    // strategy.risk.allow_entry_in / max_position_size act on strategy.entry (TV, case "16"): an
    // entry in the direction not allowed closes the position open in the allowed one, under the
    // entry's id, and opens nothing; an entry is reduced so the position stays within the size.
    const rules = strategy.risk_rules ?? {};
    if (order.category === 'entry') {
        const posSize = strategy.position_size;
        const allowed = rules.allow_entry_in === 'long' ? 1 : rules.allow_entry_in === 'short' ? -1 : 0;
        if (allowed !== 0 && direction !== allowed) {
            if (Math.sign(posSize) === allowed) {
                closePartialPosition(context, Math.abs(posSize), fillPrice, currentTime, { exitId: order.id, exitComment: order.comment });
                order.status = 'filled';
                order.fill_price = fillPrice;
                order.fill_bar = context.idx;
                order.fill_time = currentTime;
                riskAfterFill(context, fillPrice);
                return;
            }
            // Placed against a position in the allowed direction that another exit closed before it
            // filled: it sells / buys that position's size, opening a position (TV, BTCUSDT 1h: a sell
            // stop of 0.08051 after the long of 0.08051 was closed by its exit, then a short of 0.08051).
            const exitQty = order._isReversalEntry && (order as any)._base_qty !== undefined ? order.qty - (order as any)._base_qty : 0;
            if (posSize !== 0 || !(exitQty > 1e-9)) {
                order.status = 'cancelled';
                return;
            }
            order.qty = exitQty;
            (order as any)._base_qty = exitQty;
        }
        if (rules.max_position_size !== undefined) {
            const max = Number(rules.max_position_size);
            const reversing = posSize !== 0 && Math.sign(posSize) !== direction;
            const closing = reversing ? Math.abs(posSize) : 0;
            const held = reversing ? 0 : Math.abs(posSize);
            const opening = Math.max(0, order.qty - closing);
            const room = floorQty(context, Math.max(0, max - held));
            if (opening > room + 1e-9) {
                if (room <= 0 && closing === 0) {
                    order.status = 'cancelled';
                    return;
                }
                order.qty = closing + room;
                if ((order as any)._base_qty !== undefined) (order as any)._base_qty = room;
            }
        }
    }

    // Pre-trade margin check (Pine broker emulator). When the
    // required margin for the new position would exceed available
    // equity at fill time, the order is silently dropped — no
    // trade record, no log. For reversals the close leg always
    // succeeds (frees its prior margin) and only the new open leg
    // is checked. For pyramiding (same-direction adds), held
    // margin from existing positions stays locked.
    //
    // Runs for ALL margin percentages. At 100% margin the required
    // margin equals the full notional (qty * price * pointValue * 1),
    // matching TV's broker-emulator behavior of rejecting entries
    // whose notional exceeds available equity even with no leverage.
    const marginPct = direction === 1 ? (strategy.config.margin_long ?? 100) : (strategy.config.margin_short ?? 100);
    {
        const oldSize = strategy.position_size;
        const oldSign = Math.sign(oldSize);
        const isReversal = oldSign !== 0 && oldSign !== direction;
        // Margin is checked against the position held before this bar's fills: an order reversing a
        // position another order opened at this same open is checked for its whole quantity, and
        // dropped whole when it fails (TV: a long, then a short of 2 sized to reverse it, at 100,000
        // with BTC at 83,952 → the long only; at 200,000 the short reverses it).
        const pre = (strategy as any)._preFillSize;
        const preSize = pre && pre.idx === context.idx ? pre.size : oldSize;
        const reversesHeld = isReversal && Math.sign(preSize) === oldSign;
        const newOpenQty = reversesHeld ? Math.max(0, order.qty - Math.abs(oldSize)) : order.qty;

        // Margin 0 disables the margin model: entries are not checked against equity. The
        // max_cons_loss_days close-out order is not checked either (TV fills it on top of a
        // reversal, leaving twice the position).
        if (newOpenQty > 0 && marginPct > 0 && !(order as any)._risk) {
            const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
            // Equity is already MtM'd at OPEN by markToMarket() at the
            // top of processStrategyOrders, so strategy.equity is the
            // current account value. Subtract margin held by positions
            // that will REMAIN after this order:
            //   - reversal: nothing remains from old position.
            //   - pyramiding (same dir): existing held margin stays.
            //   - fresh entry: nothing held to begin with.
            // An order filling inside the bar is checked against the equity at its fill (TV: a sell
            // stop reversal needing 10,044.06 at 64,257.33, equity 10,044.53 at the open but 10,035.06
            // at the fill: the long closes, no short opens).
            const intrabar = (context._pathAt ?? 0) > 0 && (context._pathAt ?? 0) < 3;
            // A market order filling at the open is checked against the account where it was placed
            // (the previous close), its margin at the fill price (TV, AAPL 1D, 100 % of equity: equity
            // 11,869.15 at the signal's close, 255 × 46.60 = 11,883.00 at the next open → no fill,
            // although the equity at that open was 11,912.50).
            const placement = (strategy as any)._placement;
            const atPlacement = order.type === 'market' && context._pathAt === 0 && placement?.idx === context.idx ? placement : undefined;
            let heldMarginRemaining = 0;
            if (oldSign === direction) {
                heldMarginRemaining = computeHeldMargin(context, intrabar ? fillPrice : atPlacement ? atPlacement.price : markPrice);
            }
            const equityNow = atPlacement ? atPlacement.equity : intrabar && oldSize !== 0 ? computeEquityAtPrice(context, fillPrice) : strategy.equity;
            const availableEquity = equityNow - heldMarginRemaining;
            // A stop / limit entry sized to reverse a position that another exit closed before it
            // filled is checked for its own quantity only; it fills whole and the margin call trims it
            // (TV, ES1! 1D: 2 + 2 contracts at 4,363.25 for equity 865,776 after the long's stop exit,
            // then a margin call of 1 contract).
            const orphanedReversal = oldSize === 0 && order._isReversalEntry && !(order as any)._reversesPending && order.type !== 'market' && (order as any)._base_qty !== undefined;
            const checkedQty = orphanedReversal ? Math.min((order as any)._base_qty, newOpenQty) : newOpenQty;
            const requiredMargin = computeRequiredMargin(checkedQty, fillPrice, marginPct, pointValue);
            // An entry sized to reverse the position the orders queued before it would open (its own
            // quantity b plus their s), filling while flat and too large for the account. Fitted on
            // TradingView probes (BTC at 83,952, quantities 1–3, capital 60,000–400,000), not
            // understood: with m = min(b, s), it is dropped when b + s − m fits the account, else it
            // fills m when m fits (a short of 1 and a long of 2: up to 2 × price the long of 1 fills,
            // from 2 × to 3 × price only the short, from 3 × price the long of 3).
            const baseQty = (order as any)._base_qty;
            const part = Math.min(baseQty, order.qty - baseQty);
            const fits = (q: number) => computeRequiredMargin(q, fillPrice, marginPct, pointValue) <= availableEquity;
            const partFills =
                requiredMargin > availableEquity && (order as any)._reversesPending && oldSize === 0 && part > 0 && !fits(order.qty - part) && fits(part);
            if (partFills) order.qty = part;

            // ...and when its own quantity does not fit, the part sized to close the position fills
            // alone (TV, AAPL 1D: 205 + 209 shares after the long of 205 closed at 44.95, 209 × 44.95 =
            // 9,394.55 against 9,348.77 → a short of 205).
            if (requiredMargin > availableEquity && orphanedReversal && order.qty - baseQty > 1e-9) {
                order.qty -= baseQty;
            } else if (requiredMargin > availableEquity && !partFills) {
                // TV broker emulator: the margin check only guards the
                // OPEN leg. On a reversal, the close leg always
                // executes (it frees margin / realizes the position) —
                // TV's exit shows the reversal order's id as exit id
                // while no opposite position appears. Verified against
                // QA margin_calls xlsx: after a partial margin-call
                // liquidation, the remainder was closed by the next
                // reversal order whose open leg was margin-rejected.
                // A market reversal whose open leg fitted the account at its placement price is
                // dropped whole instead: the position stays open (TV, AAPL 1D above: the long is held
                // to a later signal; a fixed 1 BTC reversal not fitting at placement closes the short).
                const qtyToClose = Math.min(Math.abs(oldSize), order.qty);
                const fittedAtPlacement = atPlacement && computeRequiredMargin(newOpenQty, atPlacement.price, marginPct, pointValue) <= availableEquity;
                if (reversesHeld && qtyToClose > 0 && !fittedAtPlacement) {
                    closePartialPosition(context, qtyToClose, fillPrice, currentTime, {
                        exitId: order.id,
                        exitComment: order.comment,
                    });
                    order.status = 'filled';
                    order.fill_price = fillPrice;
                    order.fill_bar = context.idx;
                    order.fill_time = currentTime;
                    riskAfterFill(context, fillPrice);
                } else {
                    order.status = 'cancelled';
                }
                return;
            }
        }
    }

    // Execute the order using the pre-calculated qty
    executeOrder(context, order, fillPrice, currentTime);
    order.status = 'filled';
    order.fill_price = fillPrice;
    order.fill_bar = context.idx;
    order.fill_time = currentTime;
    riskAfterFill(context, fillPrice);
}

/**
 * Orders placed on this bar that fill at its close, after the script ran: every market order
 * with `strategy(process_orders_on_close = true)`, and `strategy.close` / `close_all` with
 * `immediately = true`. With process_orders_on_close, a strategy.exit placed on this bar fills at
 * the close when the close has reached its stop or limit (see fillExitAtClose). Limit and stop
 * entries keep working from the next bar.
 */
export function processOrdersOnClose(context: any): void {
    const strategy: StrategyState = context.strategy;
    if (!strategy || strategy.pending_orders.length === 0) return;
    const onClose = strategy.config.process_orders_on_close === true;
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    setFillAt(context, 3);
    const isMarketClose = (o: Order) =>
        o.category === 'exit' &&
        o.type === 'market' &&
        o.profit === undefined &&
        o.loss === undefined &&
        o.limit === undefined &&
        o.stop === undefined &&
        o.trail_price === undefined &&
        o.trail_points === undefined;

    for (const [queuedAt, order] of strategy.pending_orders.entries()) {
        if (order.status !== 'pending' || order.bar !== context.idx) continue;
        if (isMarketClose(order)) {
            if (!onClose && !order.immediately) continue;
            let matching = strategy.opentrades.filter((t) => !order.from_entry || t.entry_id === order.from_entry);
            if (order._intended_trade_ids) {
                const snapshot = new Set(order._intended_trade_ids);
                matching = matching.filter((t) => snapshot.has(t.id));
            }
            if (matching.length === 0) {
                order.status = 'cancelled';
                continue;
            }
            // `immediately` without process_orders_on_close: a market entry queued earlier on this
            // bar that reverses these trades takes precedence, so the close does not fill (TV, #316).
            if (!onClose) {
                const posDir = Math.sign(matching[0].size);
                const reversedFirst = strategy.pending_orders
                    .slice(0, queuedAt)
                    .some(
                        (o) =>
                            o.status === 'pending' &&
                            o.bar === context.idx &&
                            (o.category ?? 'entry') === 'entry' &&
                            o.type === 'market' &&
                            parseDirection(o.direction) === -posDir,
                    );
                if (reversedFirst) {
                    order.status = 'cancelled';
                    continue;
                }
            }
            const matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
            let qtyToClose = matchingQty;
            if (order.qty && order.qty > 0) qtyToClose = Math.min(order.qty, matchingQty);
            else if (order.qty_percent && order.qty_percent > 0) qtyToClose = partialCloseQty(context, matchingQty, order.qty_percent);
            const fillPrice = applySlippage(context, -Math.sign(matching[0].size), closePrice);
            closeMatching(context, order.from_entry, qtyToClose, fillPrice, currentTime, { exitId: order.id, exitComment: order.comment });
            order.status = 'filled';
            order.fill_price = fillPrice;
            order.fill_bar = context.idx;
            order.fill_time = currentTime;
            riskAfterFill(context, fillPrice);
        } else if (onClose && (order.category ?? 'entry') === 'entry' && order.type === 'market') {
            markToMarket(context, closePrice);
            fillEntryOrder(context, order, closePrice, currentTime, closePrice);
        } else if (onClose && (order.category ?? 'entry') !== 'exit' && marketableAtClose(order, closePrice)) {
            // A limit / stop entry the close has already reached fills at that close (TV, zc01: a buy limit
            // 50 ticks above the close, a sell stop above it… fill on the bar that placed them).
            markToMarket(context, closePrice);
            fillEntryOrder(context, order, closePrice, currentTime, closePrice);
        } else if (onClose && (order.category ?? 'entry') === 'exit') {
            fillExitAtClose(context, order, closePrice, currentTime);
        }
    }

    strategy.pending_orders = strategy.pending_orders.filter((o) => o.status === 'pending');
    markToMarket(context, closePrice);
    updateStrategyMetrics(context);
}

/** A limit / stop / stop-limit entry order whose level(s) the price has reached. */
function marketableAtClose(order: Order, price: number): boolean {
    const dir = parseDirection(order.direction);
    const limitOk = order.limit === undefined || (dir === 1 ? price <= order.limit : price >= order.limit);
    const stopOk = order.stop === undefined || (dir === 1 ? price >= order.stop : price <= order.stop);
    return (order.type === 'limit' || order.type === 'stop' || order.type === 'stop-limit') && limitOk && stopOk;
}

/**
 * process_orders_on_close: a strategy.exit placed on this bar whose stop or limit the close has
 * already reached fills at that close (TradingView: a stop at or beyond the close fills at the
 * close less slippage, a limit at the close; a level only crossed earlier in the bar waits for the
 * next bar). Trailing legs are left to the next bar.
 */
function fillExitAtClose(context: any, order: Order, closePrice: number, currentTime: number): void {
    const strategy: StrategyState = context.strategy;
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    const matching = strategy.opentrades.filter((t) => !order.from_entry || t.entry_id === order.from_entry);
    if (matching.length === 0) return;
    const dir = Math.sign(matching[0].size);
    const capacity = exitCapacity(context, order, matching);
    let cap = capacity.total;
    let closed = false;
    for (const t of matching) {
        if (cap <= 1e-9) break;
        if (t._exits_filled?.has(order.id) || !((capacity.perTrade.get(t) ?? 0) > 1e-9)) continue;
        const entry = t._bracket_entry ?? t.entry_price;
        const { tp, sl } = exitBracket(order, entry, dir, mintick);
        const slHit = sl !== undefined && (dir === 1 ? closePrice <= sl : closePrice >= sl);
        const tpHit = !slHit && tp !== undefined && (dir === 1 ? closePrice >= tp : closePrice <= tp);
        if (!slHit && !tpHit) continue;
        const qty = Math.min(capacity.perTrade.get(t) ?? 0, cap);
        const kind: 'profit' | 'loss' = slHit ? 'loss' : 'profit';
        const fillPrice = kind === 'loss' ? applySlippage(context, -dir, closePrice) : closePrice;
        const comment = kind === 'profit' ? (order.comment_profit ?? order.comment) : (order.comment_loss ?? order.comment);
        closeMatching(context, order.from_entry, qty, fillPrice, currentTime, { triggerKind: kind, exitId: order.id, exitComment: comment }, t.id);
        if (order.oca_name && order.oca_type === 'reduce') applyOca(strategy, order, qty);
        (t._exits_filled ??= new Set()).add(order.id);
        cap -= qty;
        closed = true;
        riskAfterFill(context, fillPrice);
    }
    const left = strategy.opentrades.some((t) => (!order.from_entry || t.entry_id === order.from_entry) && !t._exits_filled?.has(order.id));
    if (closed && (!left || cap <= 1e-9)) {
        order.status = 'filled';
        order.fill_bar = context.idx;
        order.fill_time = currentTime;
    }
}

/**
 * Parse direction string/number to numeric value
 */
export function parseDirection(direction: number | string): number {
    if (typeof direction === 'number') return direction;
    if (direction === 'long') return 1;
    if (direction === 'short') return -1;
    return 0;
}

/**
 * Charge commission for one fill leg (entry OR exit) given the qty filled and
 * the price at fill. Returns the dollar amount to deduct.
 *
 * Pine commission types:
 *   - strategy.commission.percent          : commission_value % of leg notional
 *   - strategy.commission.cash_per_contract: commission_value per contract filled
 *   - strategy.commission.cash_per_order   : commission_value flat per fill leg
 */
function computeLegCommission(context: any, strategy: StrategyState, qty: number, price: number): number {
    const type = strategy.config.commission_type ?? 'percent';
    const value = strategy.config.commission_value ?? 0;
    if (!value || value === 0) return 0;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    switch (type) {
        case 'percent':
            // Notional = qty × price × pointValue, commission is value% of it.
            return Math.abs(qty) * price * pointValue * (value / 100);
        case 'cash_per_contract':
            // value is in account currency per contract — no pointValue factor.
            return Math.abs(qty) * value;
        case 'cash_per_order':
            return value;
        default:
            return 0;
    }
}

/**
 * Apply slippage to a nominal fill price, shifting against the trade's
 * direction (longs fill higher, shorts fill lower). slippage is expressed in
 * ticks of `syminfo.mintick`. Returns the adjusted fill price.
 */
function applySlippage(context: any, direction: number, nominalPrice: number): number {
    const strategy: StrategyState = context.strategy;
    const slippage = strategy.config.slippage ?? 0;
    if (!slippage || slippage === 0) return nominalPrice;
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    const slippageAmount = slippage * mintick;
    return direction === 1 ? nominalPrice + slippageAmount : nominalPrice - slippageAmount;
}

/**
 * Update max_contracts_held_* peaks after a position-size change.
 * Called whenever position_size mutates (openTrade / closePartialPosition).
 * Order fills at the bar's open are collected instead (see flushOpenFills): `delta` is the fill's
 * signed change of the position, `price` its price, `orderFill` false for margin calls and risk
 * close-outs.
 */
function updateMaxContractsHeld(strategy: StrategyState, context?: any, delta = 0, price = NaN, orderFill = true): void {
    const batch = (strategy as any)._openFills;
    const atOpen = () => {
        const open = Series.from(context.data.open).get(0);
        const slip = (strategy.config.slippage ?? 0) * (context.pine?.syminfo?.mintick ?? 0.01);
        return Math.abs(price - open) <= slip + 1e-9 * Math.abs(open);
    };
    if (batch && orderFill && context && batch.idx === context.idx && context._pathAt === 0 && atOpen()) {
        if (delta > 0) batch.buys += delta;
        else batch.sells += delta;
        batch.real.push(strategy.position_size);
        return;
    }
    latchContractsHeld(strategy, strategy.position_size);
}

function latchContractsHeld(strategy: StrategyState, size: number): void {
    const abs = Math.abs(size);
    if (abs > strategy.max_contracts_held_all) strategy.max_contracts_held_all = abs;
    if (size > strategy.max_contracts_held_long) strategy.max_contracts_held_long = size;
    if (-size > strategy.max_contracts_held_short) strategy.max_contracts_held_short = -size;
}

/**
 * max_contracts_held_* over the order fills at the bar's open, in TradingView's order there: the
 * buys, then the sells (TV, BINANCE:BTCUSDT 1h: strategy.close("L") + strategy.entry("L") on one bar
 * → long 2 for a position of 1; a short add and a breached strategy.exit stop at one open → short 1,
 * the stop closing the old short). The fills themselves are booked in PineTS's own order; when the
 * buys-first position would be on a side neither the start nor the end of the open is on, the
 * positions PineTS went through are used.
 */
function flushOpenFills(strategy: StrategyState): void {
    const batch = (strategy as any)._openFills;
    (strategy as any)._openFills = undefined;
    if (!batch || batch.real.length === 0) return;
    const afterBuys = batch.start + batch.buys;
    const end = batch.start + batch.buys + batch.sells;
    const side = Math.sign(Math.abs(afterBuys) < 1e-9 ? 0 : afterBuys);
    if (side === 0 || side === Math.sign(batch.start) || side === Math.sign(Math.abs(end) < 1e-9 ? 0 : end)) {
        latchContractsHeld(strategy, afterBuys);
        latchContractsHeld(strategy, Math.abs(end) < 1e-9 ? 0 : end);
    } else {
        for (const size of batch.real) latchContractsHeld(strategy, size);
    }
}

/**
 * Returns true if adding a same-direction entry would exceed the strategy's
 * pyramiding cap. Counts existing open trades in the requested direction.
 *
 * `strategy.entry()` (when implemented) consults this; `strategy.order()` does
 * NOT — Pine treats strategy.order as a low-level primitive that ignores the
 * pyramiding limit.
 */
export function wouldExceedPyramiding(strategy: StrategyState, direction: number): boolean {
    const cap = strategy.config.pyramiding ?? 1;
    let openSameSide = 0;
    for (const t of strategy.opentrades) {
        if (Math.sign(t.size) === direction) openSameSide++;
    }
    return openSameSide >= cap;
}

// ---------------------------------------------------------------- strategy.risk.* (TradingView)
//
// Day: the bar's date in the exchange timezone (each bar on charts of 1D and above).
//   - max_intraday_filled_orders(n): the fill that brings the day's filled orders to n is followed
//     by a close of the position at that fill price; pending orders are cancelled and no order is
//     placed until the next day (case "17": the 4th fill of the day, a reversal at the open, then
//     "Close Position (Max number of filled orders in one day)" at that open).
//   - max_drawdown(v, type): drawdown of realized equity (initial capital + net profit) from its
//     peak, checked after each fill; then the position is closed at that fill price, pending orders
//     are cancelled and trading stops for good (case "18").
//   - max_intraday_loss(v, type): equity at the start of the day minus equity at the bar's adverse
//     extreme (or at a fill); then the position is closed at that price and trading stops until
//     the next day (case "19": a short closed at the bar's high).
//   - max_cons_loss_days(n): a day whose closing equity is below the previous day's is a losing
//     day; after n in a row a market order sized against the position at that close is queued,
//     behind the script's pending orders, for the next open; trading then stops for good (case
//     "20": a pending reversal fills first, so the order opens a second short).
//   - allow_entry_in / max_position_size act on strategy.entry when it fills (see fillEntryOrder).

const RISK_REASON = {
    orders: 'Close Position (Max number of filled orders in one day)',
    drawdown: 'Close Position (Max Drawdown)',
    intraday: 'Close Position (Max intraday Loss)',
    consDays: 'Close Position (Max consecutive loss days)',
} as const;

type RiskState = {
    day?: string;
    dayStartEquity: number;
    dayMaxEquity: number;
    dayFills: number;
    prevDayEndEquity: number;
    consLossDays: number;
    realizedPeak: number;
    blockedDay?: string;
    blockFrom?: number; // orders placed from this bar to blockTo (the end of the blocked day) are rejected
    blockTo?: number;
    haltedFrom?: number; // orders placed on or after this bar are rejected
    dayStartBar?: number; // the day's first bar, until its open fills are done (see riskOpenFills)
};

function riskState(context: any): RiskState {
    const strategy = context.strategy as any;
    return (strategy._risk ??= {
        dayStartEquity: strategy.initial_capital,
        dayMaxEquity: strategy.initial_capital,
        dayFills: 0,
        prevDayEndEquity: strategy.initial_capital,
        consLossDays: 0,
        realizedPeak: strategy.initial_capital,
    });
}

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
function tradingDay(context: any): string {
    const open = Series.from(context.data.openTime).get(0);
    const close = Series.from(context.data.closeTime).get(0);
    if (Number.isFinite(close) && close - open >= 86400000 - 1000) return String(open);
    const tz = context.pine?.syminfo?.timezone || 'UTC';
    let f = dayFormatters.get(tz);
    if (!f) {
        try {
            f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch {
            f = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
        }
        dayFormatters.set(tz, f);
    }
    return f.format(new Date(open));
}

/** Whether the risk rules reject an order (halted for good, or for the rest of the day). */
export function riskBlocksOrder(context: any, order: Order): boolean {
    const st = (context.strategy as any)._risk as RiskState | undefined;
    if (!st) return false;
    if (st.haltedFrom !== undefined && order.bar >= st.haltedFrom) return true;
    // Blocked for the rest of the day: also an order placed then and due to fill the next day.
    return st.blockFrom !== undefined && order.bar >= st.blockFrom && order.bar <= (st.blockTo ?? Infinity);
}

/** Close the whole position at `price` under a risk rule and cancel the pending orders. */
function riskCloseOut(context: any, reason: string, price: number, scope: 'day' | 'forever'): void {
    const strategy: StrategyState = context.strategy;
    const st = riskState(context);
    const time = Series.from(context.data.openTime).get(0);
    // strategy.close / close_all orders due at the open where the rule triggers still fill there first
    // (TV, BTCUSDT 1h, max_intraday_filled_orders(4): close_all queued after a pyramiding add, both at
    // one open → the three older lots "Close position order", only the add closed under the rule).
    if (context._pathAt === 0 && !(st as any)._closingOut) {
        (st as any)._closingOut = true;
        processExitOrders(context, 'market');
        (st as any)._closingOut = false;
        setFillAt(context, 0);
    }
    if (strategy.opentrades.length > 0 && strategy.position_size !== 0) {
        closePartialPosition(context, Math.abs(strategy.position_size), price, time, { exitId: reason, exitComment: reason, forced: true });
    }
    for (const o of strategy.pending_orders) if (o.status === 'pending') o.status = 'cancelled';
    if (scope === 'day') {
        st.blockedDay = st.day;
        st.blockFrom = context.idx;
        st.blockTo = undefined;
    } else st.haltedFrom = context.idx;
}

/**
 * Start of a bar, before its orders: day rollover (losing-day count, day-start equity, filled
 * orders, end of an intraday block).
 */
export function riskStartBar(context: any): void {
    const strategy: StrategyState = context.strategy;
    const rules = strategy?.risk_rules;
    if (!rules || Object.keys(rules).length === 0) return;
    const st = riskState(context);
    const day = tradingDay(context);
    if (day === st.day) return;
    if (st.blockFrom !== undefined && st.blockTo === undefined) st.blockTo = context.idx - 1;
    if (st.day !== undefined) {
        // the previous bar closed the previous day
        const dayEnd = strategy.equity;
        if (rules.max_cons_loss_days && st.haltedFrom === undefined) {
            st.consLossDays = dayEnd < st.prevDayEndEquity - 1e-9 ? st.consLossDays + 1 : 0;
            if (st.consLossDays >= rules.max_cons_loss_days.count) {
                if (strategy.position_size !== 0) {
                    strategy.pending_orders.push({
                        id: RISK_REASON.consDays,
                        direction: -Math.sign(strategy.position_size),
                        qty: Math.abs(strategy.position_size),
                        type: 'market',
                        bar: context.idx - 1,
                        time: Series.from(context.data.openTime).get(0),
                        status: 'pending',
                        comment: RISK_REASON.consDays,
                        _risk: true,
                    } as Order);
                }
                st.haltedFrom = context.idx;
            }
        }
        st.prevDayEndEquity = dayEnd;
    }
    st.day = day;
    st.dayStartEquity = strategy.equity;
    st.dayMaxEquity = strategy.equity;
    st.dayFills = 0;
    st.dayStartBar = context.idx;
}

/**
 * max_intraday_loss: the day starts at the open of its first bar, after the fills there, which are
 * not checked against it (TV, AAPL 1D, 1 %: a gap down from 55.60 to 52.39 keeps the trade, the loss
 * counted from the open; BTCUSDT 1D: a long reversed at the open for +1,996 against a 1,500 limit
 * goes on). Called before the bar's fills and after each fill at the open.
 */
function riskOpenFills(context: any): boolean {
    const st = (context.strategy as any)._risk as RiskState | undefined;
    if (!st || st.dayStartBar !== context.idx || !(context._pathAt === undefined || context._pathAt === 0)) return false;
    const seg = context._excSeg;
    if (seg && seg.scale > 0) return false;
    st.dayStartEquity = st.dayMaxEquity = computeEquityAtPrice(context, Series.from(context.data.open).get(0));
    return true;
}

/** After an order filled at `price`: filled-order count, realized drawdown, intraday loss. */
export function riskAfterFill(context: any, price: number): void {
    const strategy: StrategyState = context.strategy;
    // Order fills (entries, exits, closes; not margin calls or risk close-outs): calc_on_order_fills
    // runs the script again after the bar points where this count moved.
    if (strategy) (strategy as any)._fillCount = ((strategy as any)._fillCount ?? 0) + 1;
    const fillPnl = (strategy as any)?._fillPnl ?? 0;
    if (strategy) (strategy as any)._fillPnl = 0;
    const rules = strategy?.risk_rules;
    if (!rules || Object.keys(rules).length === 0) return;
    const st = riskState(context);
    if (st.haltedFrom !== undefined || (st as any)._closingOut) return;
    st.dayFills++;
    const realized = strategy.initial_capital + strategy.netprofit;
    st.realizedPeak = Math.max(st.realizedPeak, realized);
    if (rules.max_drawdown && st.haltedFrom === undefined) {
        const dd = st.realizedPeak - realized;
        const v = Number(rules.max_drawdown.value);
        const hit = rules.max_drawdown.type === 'percent_of_equity' ? (100 * dd) / st.realizedPeak >= v - 1e-12 : dd >= v - 1e-9;
        if (hit) return riskCloseOut(context, RISK_REASON.drawdown, price, 'forever');
    }
    if (rules.max_intraday_filled_orders && st.dayFills >= Number(rules.max_intraday_filled_orders.count)) {
        return riskCloseOut(context, RISK_REASON.orders, price, 'day');
    }
    // The check after a reversal sees the equity before the P&L its closing leg booked (TV, BTCUSDT 1h,
    // 1,500 cash: a short held from the previous day reversed for +1,260.68, equity 93,183.19 for
    // 93,462.83 at the day start → closed at that open; 27 halts of 27). After a close order the P&L
    // is booked (BTCUSDT 1h, 1 %: close_all at +228 mid-day, trading goes on).
    if (rules.max_intraday_loss && !riskOpenFills(context)) riskIntradayLoss(context, price, fillPnl);
}

function riskIntradayLoss(context: any, price: number, unbooked = 0): boolean {
    const strategy: StrategyState = context.strategy;
    const rule = strategy.risk_rules.max_intraday_loss;
    if (!rule) return false;
    const st = riskState(context);
    if (st.blockedDay === st.day) return false;
    const equity = strategy.position_size !== 0 ? computeEquityAtPrice(context, price) : strategy.initial_capital + strategy.netprofit;
    st.dayMaxEquity = Math.max(st.dayMaxEquity, equity);
    const loss = st.dayStartEquity - (equity - unbooked);
    const v = Number(rule.value);
    const limit = rule.type === 'percent_of_equity' ? (v / 100) * st.dayMaxEquity : v;
    if (loss >= limit - 1e-9) {
        riskCloseOut(context, RISK_REASON.intraday, price, 'day');
        return true;
    }
    return false;
}

/**
 * After a margin call at `price`: max_drawdown on the equity there, open profit included; when reached,
 * the position is closed at the bar's close, after the script (see riskAtBarClose). TV, BTCUSDT 1h,
 * 100 % of equity: a call at the 66,011.47 high leaves 9,690.60, 3.0940 % under the 10,000 peak →
 * closed at the 65,978.79 close with limits up to 3.092 %, not 3.10 %; 3.047 % at that close.
 */
function riskAfterMarginCall(context: any, price: number): void {
    const strategy: StrategyState = context.strategy;
    const rule = strategy.risk_rules?.max_drawdown;
    if (!rule) return;
    const st = riskState(context);
    if (st.haltedFrom !== undefined) return;
    const dd = st.realizedPeak - computeEquityAtPrice(context, price);
    const v = Number(rule.value);
    if (rule.type === 'percent_of_equity' ? (100 * dd) / st.realizedPeak >= v - 1e-12 : dd >= v - 1e-9) (st as any)._drawdownAtClose = context.idx;
}

/** At the bar's close, after the script: a max_drawdown close-out scheduled by a margin call on this bar. */
export function riskAtBarClose(context: any): void {
    const st = (context.strategy as any)?._risk as RiskState | undefined;
    if (!st || (st as any)._drawdownAtClose !== context.idx) return;
    (st as any)._drawdownAtClose = undefined;
    setFillAt(context, 3);
    riskCloseOut(context, RISK_REASON.drawdown, Series.from(context.data.close).get(0), 'forever');
}

/** After the bar's fills: max_intraday_loss at the bar's adverse extreme for the open position. */
export function riskEndOfBarFills(context: any): void {
    const strategy: StrategyState = context.strategy;
    if (!strategy?.risk_rules?.max_intraday_loss || strategy.position_size === 0) return;
    const st = riskState(context);
    if (st.haltedFrom !== undefined && st.haltedFrom <= context.idx) return;
    const dir = Math.sign(strategy.position_size);
    const fav = Series.from(context.data[dir === 1 ? 'high' : 'low']).get(0);
    st.dayMaxEquity = Math.max(st.dayMaxEquity, computeEquityAtPrice(context, fav));
    const adverse = Series.from(context.data[dir === 1 ? 'low' : 'high']).get(0);
    const path = barPath(Series.from(context.data.open).get(0), Series.from(context.data.high).get(0), Series.from(context.data.low).get(0), Series.from(context.data.close).get(0));
    setFillAt(context, path[1] === adverse ? 1 : 2);
    riskIntradayLoss(context, adverse);
}

/**
 * Open a new trade.
 *
 * @param direction +1 long, -1 short
 * @param qty       unsigned contract count
 * @param price     fill price
 * @param time      fill time (ms)
 */
export function openTrade(
    context: any,
    entryId: string,
    direction: number,
    qty: number,
    price: number,
    time: number,
    entryComment?: string,
    reversalShare?: number,
): void {
    const strategy: StrategyState = context.strategy;
    const tradeNum = strategy.opentrades.length + strategy.closedtrades.length;

    // Charge entry-leg commission up front; trade.commission will be increased
    // by the exit leg when it closes (or proportional share on partial close).
    //
    // A reversal order pays one cash_per_order fee, split between its legs in proportion to their
    // quantities (TV: closing 0.08103 and opening 0.07953 with a 5 fee → 2.5233 / 2.4767).
    // `reversalShare` is this leg's part of the order's quantity.
    const isReversalOpen = reversalShare !== undefined;
    const commTypeOpen = strategy.config.commission_type ?? 'percent';
    const shareFlat = isReversalOpen && commTypeOpen === 'cash_per_order';
    const rawEntryCommission = computeLegCommission(context, strategy, qty, price);
    const entryCommission = shareFlat ? rawEntryCommission * reversalShare : rawEntryCommission;

    const trade: Trade = {
        id: `trade_${tradeNum}`,
        entry_id: entryId,
        // TV's strategy.closedtrades.entry_comment falls back to the entry id
        // when no explicit comment was passed to strategy.entry/order. Mirror
        // that by stamping the id as the entry comment when none is given.
        entry_comment: entryComment ?? entryId,
        entry_price: price,
        _bracket_entry: price,
        entry_bar_index: context.idx,
        entry_time: time,
        size: direction * qty, // SIGNED — matches Pine's closedtrades.size()
        commission: entryCommission,
        max_drawdown: 0,
        max_runup: 0,
        status: 'open',
    };

    // A strategy.exit qty_percent is a share of the trade's entry quantity, not of what is left.
    trade._entry_qty = Math.abs(trade.size);
    strategy.opentrades.push(trade);

    // Latch the slippage-adjusted entry price of the FIRST trade ever opened —
    // the anchor for the buy-and-hold benchmark (see finalizeStrategyRun).
    if (strategy._first_entry_price === undefined) {
        strategy._first_entry_price = price;
    }

    // FIFO ledger-entry record for TV-style exit pairing (see
    // consumeLedger / closePartialPosition): TV's xlsx pairs exit fills
    // with entry records oldest-first, splitting at record boundaries.
    const ledgerRecord: any = {
        entry_id: entryId,
        entry_price: price,
        entry_time: time,
        entry_bar_index: context.idx,
        entry_comment: trade.entry_comment,
        qty,
        commission: entryCommission,
    };
    ((strategy as any)._ledger_entries ??= []).push(ledgerRecord);

    // Realize the entry commission immediately as a cash outflow. TV reports
    // strategy.netprofit and strategy.grossloss net of entry commission the
    // moment the trade opens (commission is a real cost paid at fill, not
    // Entry commission hits strategy.netprofit (and grossloss as a pending
    // liability) AT FILL TIME — matches TV's `strategy.netprofit` value
    // during an open trade (verified against xlsx exports: TV's "Net profit"
    // line during an open position equals closed-trades-total minus the
    // sum of open trades' entry commissions). The exit commission is
    // realized in closePartialPosition when the trade actually closes.
    //
    // Drawdown compensation: `updateEquityPeaks` adds the open trades'
    // entry commission BACK to the drawdown formula. This mirrors TV's
    // drawdown formula which has an explicit `+ openCommission` term —
    // the result is correct for any peak timing (before vs during open
    // trade), see math in the QA-drawdown analysis notes.
    if (entryCommission > 0) {
        strategy.netprofit -= entryCommission;
        strategy.grossloss += entryCommission;
    }

    // Margin is not checked at points of the bar before this fill (see processMarginCall).
    const fillAt = context._pathAt ?? 0;
    const marginFrom = (strategy as any)._marginFrom;
    if (fillAt > 0 && !(marginFrom?.idx === context.idx && marginFrom.at >= fillAt)) (strategy as any)._marginFrom = { idx: context.idx, at: fillAt };
    // Excursions start at the fill (see excOpen); the equity replay sees the new lot.
    ledgerRecord._dir = direction;
    excOpen(context, trade, direction);
    excOpen(context, ledgerRecord, direction);
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    const opened = excMoney(trade._fav, trade._adv, qty, pointValue, entryCommission);
    trade.max_runup = opened.runup;
    trade.max_drawdown = opened.drawdown;
    excEvent(context, { price, np: -entryCommission, add: { ref: ledgerRecord, dir: direction, qty, entry: price, comm: entryCommission } });

    // Update flat position scalars
    const oldSize = strategy.position_size;
    const newSize = oldSize + trade.size;

    if (oldSize === 0) {
        // Opening fresh position
        strategy.position_size = newSize;
        strategy.position_avg_price = price;
        strategy.position_entry_name = entryId;
    } else if (Math.sign(oldSize) === Math.sign(newSize)) {
        // Adding to existing same-direction position — weighted-avg the entry price
        const totalCost = Math.abs(oldSize) * strategy.position_avg_price + qty * price;
        const totalQty = Math.abs(newSize);
        strategy.position_avg_price = totalCost / totalQty;
        strategy.position_size = newSize;
    }

    updateMaxContractsHeld(strategy, context, trade.size, price);
}

/**
 * Execute an order
 * strategy.order() modifies the net position directly
 */
function executeOrder(context: any, order: Order, fillPrice: number, fillTime: number): void {
    const strategy: StrategyState = context.strategy;
    const direction = parseDirection(order.direction);
    const oldPosition = strategy.position_size;
    const oldSign = Math.sign(oldPosition);

    // Check if we are reducing/reversing the position
    // (Long position and selling, or Short position and buying)
    const isReducing = (oldSign === 1 && direction === -1) || (oldSign === -1 && direction === 1);

    if (isReducing) {
        // We are reducing or reversing
        // First, use the order to close existing trades. For a reversal,
        // the reversing order's id/comment become the EXIT id/comment of
        // the prior trade — that's TV behavior.
        const qtyToClose = Math.min(Math.abs(oldPosition), order.qty);
        const remainingQty = order.qty - qtyToClose;
        // True reversal: the SAME order both flattens the prior position
        // AND opens a new one in the opposite direction. For cash_per_order
        // commission, TV charges the order's flat fee ONCE, split between the
        // closing and the opening leg in proportion to their quantities.
        const isReversal = remainingQty > 0;
        closePartialPosition(context, qtyToClose, fillPrice, fillTime, {
            exitId: order.id,
            exitComment: order.comment,
            isImplicitReversal: isReversal,
            reversalShare: qtyToClose / order.qty,
        });

        // If there is remaining quantity (reversal), open a new trade.
        // When the close leg consumed LESS than the order anticipated at
        // queue time (a deferred close-margin-call shrank the position
        // between queue and fill), the remaining qty exceeds the ordered
        // base size. TV books the intended base size and the overshoot as
        // TWO separate lots (each with its own exit bracket and ledger
        // row — xlsx 2021-10-02: longs 5 + 0.263108 at the same fill).
        if (remainingQty > 0) {
            // The reversed position takes its exits without from_entry with it, as when it goes
            // flat: the new position gets the exits placed for it (TV).
            for (const o of strategy.pending_orders) {
                if (o.status === 'pending' && (o.category ?? 'entry') === 'exit' && !o.from_entry && o._placedWithPosition && o._placedDir === oldSign) o.status = 'cancelled';
            }
            const baseQty = (order as any)._base_qty;
            if (baseQty !== undefined && remainingQty > baseQty + 1e-9) {
                openTrade(context, order.id, direction, baseQty, fillPrice, fillTime, order.comment, baseQty / order.qty);
                openTrade(context, order.id, direction, remainingQty - baseQty, fillPrice, fillTime, order.comment, (remainingQty - baseQty) / order.qty);
            } else {
                openTrade(context, order.id, direction, remainingQty, fillPrice, fillTime, order.comment, remainingQty / order.qty);
            }
        }
    } else {
        // We are increasing position or opening fresh
        openTrade(context, order.id, direction, order.qty, fillPrice, fillTime, order.comment);
    }
}

/**
 * Close partial or full position.
 *
 * FIFO accounting: closes oldest open trades first. Splits a trade if the
 * close qty is smaller than the trade's remaining qty.
 */
export interface CloseInfo {
    /** Which exit leg triggered ('profit'/'loss'/'trailing'), null otherwise. */
    triggerKind?: 'profit' | 'loss' | 'trailing' | null;
    /** Exit order's id, set onto the closed trade as trade.exit_id. */
    exitId?: string;
    /** Resolved exit comment (the matching comment_profit/loss/trailing). */
    exitComment?: string;
    /**
     * True when this close is part of a single REVERSAL order that will
     * also open a new trade in the opposite direction. Affects
     * `cash_per_order` commission: TV charges the flat fee ONCE per order
     * placement, attributed to the new entry — the implicit close leg of
     * the reversal does NOT incur a second flat charge. Per-leg types
     * (percent, cash_per_contract) are unaffected by this flag.
     */
    isImplicitReversal?: boolean;
    /** The closing leg's part of the reversal order's quantity (its share of a cash_per_order fee). */
    reversalShare?: number;
    /** A margin call or a risk-rule close-out, not an order fill. */
    forced?: boolean;
}

type LedgerSlice = {
    entry_id: string;
    qty: number;
    entry_price: number;
    entry_time: number;
    entry_bar_index: number;
    entry_comment?: string;
    commission: number;
    /** The ledger record the slice came from (absent for the physical-lot fallback). */
    rec?: any;
};

/**
 * Consume `qty` from the strategy's FIFO ledger-entry queue, splitting
 * records at boundaries. Returns the consumed slices (entry attributes +
 * pro-rata entry commission). Under `close_entries_rule = "FIFO"` (the
 * default) any exit pairs with the oldest open entries whatever their id:
 * `strategy.close("B")` books the older "A" first (TV, #316 item 4). Under
 * "ANY" it pairs with the closing lot's own entry id.
 * Falls back to the physical lot's own attributes for any quantity the
 * queue cannot supply (hand-built test states have no queue records).
 */
function consumeLedger(strategy: StrategyState, physical: Trade, qty: number): LedgerSlice[] {
    const out: LedgerSlice[] = [];
    let need = qty;
    const queue: any[] = (strategy as any)._ledger_entries ?? [];
    const anyId = String(strategy.config.close_entries_rule ?? 'FIFO').toUpperCase() === 'ANY';
    for (const rec of queue) {
        if (need <= 1e-9) break;
        if ((anyId && rec.entry_id !== physical.entry_id) || rec.qty <= 1e-9) continue;
        const take = Math.min(rec.qty, need);
        const commShare = rec.qty > 0 ? rec.commission * (take / rec.qty) : 0;
        out.push({
            rec,
            entry_id: rec.entry_id,
            qty: take,
            entry_price: rec.entry_price,
            entry_time: rec.entry_time,
            entry_bar_index: rec.entry_bar_index,
            entry_comment: rec.entry_comment,
            commission: commShare,
        });
        rec.qty -= take;
        rec.commission -= commShare;
        need -= take;
    }
    (strategy as any)._ledger_entries = queue.filter((r) => r.qty > 1e-9);
    if (need > 1e-9) {
        const physQty = Math.abs(physical.size);
        out.push({
            entry_id: physical.entry_id,
            qty: need,
            entry_price: physical.entry_price,
            entry_time: physical.entry_time,
            entry_bar_index: physical.entry_bar_index,
            entry_comment: physical.entry_comment,
            commission: physQty > 0 ? (physical.commission ?? 0) * (need / physQty) : 0,
        });
    }
    return out;
}

/** Add (sign 1) or remove (sign -1) a closed row's contribution to the win / loss tallies. */
function tallyClosedRow(strategy: StrategyState, row: Trade, sign: 1 | -1): void {
    const p = row.profit ?? 0;
    if (p > 0) {
        strategy.grossprofit += sign * p;
        strategy.wintrades += sign;
        strategy.wintrades_total_profit += sign * p;
    } else if (p < 0) {
        strategy.grossloss += sign * Math.abs(p);
        strategy.losstrades += sign;
        strategy.losstrades_total_loss += sign * Math.abs(p);
    } else {
        strategy.eventrades += sign;
    }
}

export function closePartialPosition(context: any, qtyToClose: number, exitPrice: number, exitTime: number, closeInfo?: CloseInfo): void {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let remainingQty = qtyToClose;
    const netprofitBefore = strategy.netprofit;

    // Close trades from oldest to newest (FIFO)
    const tradesToClose = [...strategy.opentrades];
    strategy.opentrades = [];
    let lastRow: { rec: any; row: Trade } | null = null;

    for (const trade of tradesToClose) {
        if (remainingQty <= 0) {
            // Keep this trade open
            strategy.opentrades.push(trade);
            continue;
        }

        const tradeQty = Math.abs(trade.size);
        const qtyClosing = Math.min(tradeQty, remainingQty);
        const tradeDirection = Math.sign(trade.size);

        // TV LEDGER PAIRING: exit fills pair against a FIFO queue of ENTRY
        // RECORDS (per entry_id), SPLITTING at record boundaries — a fill
        // of 5 contracts can consume 4.74018 of the oldest unpaired entry
        // plus 0.25982 of the next, producing TWO ledger rows (TV xlsx
        // 2021-11-16). Physical lots (this loop) only drive position,
        // margin and bracket levels; the closed-trade ROWS and the
        // financial aggregates follow the ledger slices. `consumeLedger`
        // falls back to the physical lot's own attributes when no queue
        // records exist (hand-built tests).
        //
        // Per-row semantics preserved from the previous implementation:
        //   - netprofit increment = gross − exit-commission share (the
        //     entry leg was realized at fill), per the TV convention
        //     verified in the drawdown/margin QA sessions;
        //   - grossloss rollback of the entry-commission share;
        //   - cash_per_order half-fee on implicit-reversal closes.
        // Each row's excursion is its entry record's path moves up to this exit (see excClosedRow).
        const emitClosedRows = (qtyClosed: number) => {
            const commType = strategy.config.commission_type ?? 'percent';
            // A cash_per_order fee is the order's, shared by the trades it closes in proportion to their
            // quantity (TV: close_all of two trades of 1 with a 5 fee charges 2.5 to each).
            const perOrder = commType === 'cash_per_order';
            const shareFlat = closeInfo?.isImplicitReversal && perOrder;
            const rawExitCommission = perOrder
                ? computeLegCommission(context, strategy, qtyToClose, exitPrice) * (qtyToClose > 0 ? qtyClosed / qtyToClose : 1)
                : computeLegCommission(context, strategy, qtyClosed, exitPrice);
            const exitCommTotal = shareFlat ? rawExitCommission * (closeInfo?.reversalShare ?? 0.5) : rawExitCommission;

            const slices = consumeLedger(strategy, trade, qtyClosed);
            for (const s of slices) {
                const exitCommShare = exitCommTotal * (s.qty / qtyClosed);
                const priceChange = tradeDirection === 1 ? exitPrice - s.entry_price : s.entry_price - exitPrice;
                const gross = priceChange * s.qty * pointValue;
                const exc = excClosedRow(context, s.rec ?? trade, tradeDirection, exitPrice, closeInfo?.exitId);
                const excRow = excMoney(exc.fav, exc.adv, s.qty, pointValue, s.commission);
                excEvent(context, { price: exitPrice, np: gross - exitCommShare, remove: { ref: s.rec ?? trade, qty: s.qty, comm: s.commission } });

                const row: Trade = {
                    id: `trade_${strategy.opentrades.length + strategy.closedtrades.length + tradesToClose.length}`,
                    entry_id: s.entry_id,
                    entry_comment: s.entry_comment,
                    entry_price: s.entry_price,
                    _bracket_entry: trade._bracket_entry,
                    entry_bar_index: s.entry_bar_index,
                    entry_time: s.entry_time,
                    size: tradeDirection * s.qty,
                    commission: s.commission + exitCommShare,
                    _entry_commission: s.commission,
                    max_drawdown: excRow.drawdown,
                    max_runup: excRow.runup,
                    status: 'closed',
                    exit_price: exitPrice,
                    exit_bar_index: context.idx,
                    exit_time: exitTime,
                    exit_id: closeInfo?.exitId ?? trade.exit_id,
                    exit_comment: closeInfo?.exitComment ?? trade.exit_comment,
                    profit: gross - s.commission - exitCommShare,
                };
                strategy.netprofit += gross - exitCommShare;
                strategy.grossloss -= s.commission;
                // One fill closing an entry record across several physical lots is one row (TV).
                if (s.rec && lastRow?.rec === s.rec) {
                    const merged = lastRow.row;
                    tallyClosedRow(strategy, merged, -1);
                    merged.size = (merged.size as number) + (row.size as number);
                    merged.commission = (merged.commission ?? 0) + (row.commission ?? 0);
                    merged.profit = (merged.profit ?? 0) + (row.profit ?? 0);
                    merged._entry_commission = (merged._entry_commission ?? 0) + s.commission;
                    const m = excMoney(exc.fav, exc.adv, Math.abs(merged.size as number), pointValue, merged._entry_commission ?? 0);
                    merged.max_runup = m.runup;
                    merged.max_drawdown = m.drawdown;
                    tallyClosedRow(strategy, merged, 1);
                    continue;
                }
                tallyClosedRow(strategy, row, 1);
                strategy.closedtrades.push(row);
                lastRow = { rec: s.rec, row };
            }
        };

        // Epsilon on the full-close decision: when the requested qty is a
        // float hair short of the trade's size (fractional margin-call
        // remainders), treat it as a full close instead of leaving a
        // ~1e-15 ghost portion open.
        if (qtyClosing >= tradeQty - 1e-9) {
            // Fully close this physical lot.
            trade.status = 'closed';
            trade.exit_price = exitPrice;
            trade.exit_bar_index = context.idx;
            trade.exit_time = exitTime;
            emitClosedRows(tradeQty);
            remainingQty -= qtyClosing;
        } else {
            // Partially close this physical lot — emit ledger rows for the
            // closed quantity, keep the remainder open with its residual
            // PHYSICAL entry-commission share (used by the equity-peak
            // basis and margin checks).
            emitClosedRows(qtyClosing);
            const entryCommissionShare = (trade.commission ?? 0) * (qtyClosing / tradeQty);

            // The remaining open portion keeps the residual entry commission share.
            trade.size = tradeDirection * (tradeQty - qtyClosing);
            trade.commission = (trade.commission ?? 0) - entryCommissionShare;
            strategy.opentrades.push(trade);
            remainingQty = 0;
        }
    }

    // Update flat position scalars from the (possibly shrunken) open-trade book
    const currentSize = strategy.position_size;
    const sizeReduction = Math.sign(currentSize) * qtyToClose; // Reduce magnitude
    let newSize = currentSize - sizeReduction;

    // Epsilon-snap to flat: fractional quantities (margin-call partial
    // liquidations) leave float residuals (~1e-15) when the position fully
    // unwinds. An exact `=== 0` check then misses the flatten, leaving
    // position_avg_price alive on a ghost position — the script captures
    // stale TP/SL prices from it and the next entry gets phantom-exited at
    // its own entry price (QA pyramiding xlsx, 2021-11-09 BTCUSDC).
    if (Math.abs(newSize) < 1e-9) newSize = 0;

    strategy.position_size = newSize;
    updateMaxContractsHeld(strategy, context, newSize - currentSize, exitPrice, !closeInfo?.forced);
    // The P&L a reversal's closing leg books, for the risk check after the fill (see riskAfterFill).
    if (closeInfo?.isImplicitReversal) (strategy as any)._fillPnl = ((strategy as any)._fillPnl ?? 0) + (strategy.netprofit - netprofitBefore);

    if (newSize === 0) {
        strategy.position_avg_price = NaN;
        strategy.position_entry_name = '';
    } else if (strategy.opentrades.length > 0) {
        // Recompute average entry price from the remaining open book
        // (LEDGER view — see ledgerOpenLots). Crucial because closing
        // older entries (FIFO pairing) changes the weighted average if
        // the position was built from multiple entries at different
        // prices.
        let totalCost = 0;
        let totalQty = 0;
        for (const t of ledgerOpenLots(strategy)) {
            totalCost += t.qty * t.entry_price;
            totalQty += t.qty;
        }
        strategy.position_avg_price = totalCost / totalQty;
        // The entry that opened the oldest still-open ledger record (under FIFO an exit of a newer
        // entry leaves the older one open).
        strategy.position_entry_name = (strategy as any)._ledger_entries?.[0]?.entry_id ?? strategy.opentrades[0].entry_id;
    }
}

/**
 * The open book in LEDGER view: the FIFO entry records not yet paired
 * with exit fills. ALL equity-side computations (unrealized PnL, average
 * entry, open entry commissions) must use this view so they stay
 * consistent with `netprofit`, whose increments follow the ledger slices
 * — TV's equity is fully ledger-based, and mixing ledger-realized with
 * physical-unrealized breaks total-equity invariance whenever exit
 * pairing crosses lot boundaries. Falls back to the physical lots when
 * no records exist (hand-built test states).
 */
function ledgerOpenLots(strategy: StrategyState): Array<{ qty: number; entry_price: number; commission: number; dir: number }> {
    const records: any[] = (strategy as any)._ledger_entries ?? [];
    const dir = Math.sign(strategy.position_size) || 1;
    if (records.length > 0) {
        return records.map((r) => ({ qty: r.qty, entry_price: r.entry_price, commission: r.commission, dir }));
    }
    return strategy.opentrades.map((t) => ({
        qty: Math.abs(t.size),
        entry_price: t.entry_price,
        commission: t.commission ?? 0,
        dir: Math.sign(t.size),
    }));
}

/**
 * The open trades as the script sees them (strategy.opentrades.*, capital_held): the entry records
 * not yet paired with exits, oldest first. Closes and exits for an entry id are booked against the
 * oldest trades under FIFO, while the physical lots keep each id's own quantity (what a close or an
 * exit for that id may still take). TradingView, close_entries_rule FIFO, A 1 / B 2 / C 3 open:
 * close("C", qty = 1) leaves the trades B 2, C 3 (C's own quantity is then 2). Falls back to the
 * physical lots when no records exist (hand-built states).
 */
export function openTradeList(context: any): Trade[] {
    const strategy: StrategyState | undefined = context.strategy;
    if (!strategy) return [];
    const records: any[] = (strategy as any)._ledger_entries ?? [];
    if (records.length === 0) return strategy.opentrades.slice();
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    const dir = Math.sign(strategy.position_size) || 1;
    return records.map((r, i) => {
        const m = excMoney(r._fav, r._adv, r.qty, pointValue, r.commission);
        return {
            id: `open_${i}`,
            entry_id: r.entry_id,
            entry_comment: r.entry_comment,
            entry_price: r.entry_price,
            entry_bar_index: r.entry_bar_index,
            entry_time: r.entry_time,
            size: (r._dir ?? dir) * r.qty,
            commission: r.commission,
            max_runup: m.runup,
            max_drawdown: m.drawdown,
            status: 'open',
        } as Trade;
    });
}

/**
 * Mark-to-market the open positions to `currentPrice`, updating
 * `strategy.openprofit` and `strategy.equity`. Does NOT touch the
 * max_drawdown / max_runup peaks — those are latched once per bar by
 * `updateEquityPeaks` AFTER all entry+exit fills have settled, so that
 * trades closed mid-bar by TP / SL are reflected as realized P&L (rather
 * than as a phantom intra-bar excursion against the bar's raw H/L).
 */
function markToMarket(context: any, currentPrice: number): void {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let unrealizedPnL = 0;
    for (const lot of ledgerOpenLots(strategy)) {
        const priceChange = lot.dir === 1 ? currentPrice - lot.entry_price : lot.entry_price - currentPrice;
        unrealizedPnL += priceChange * lot.qty * pointValue;
    }
    strategy.openprofit = unrealizedPnL;
    strategy.equity = strategy.initial_capital + strategy.netprofit + unrealizedPnL;
}

// ── Excursions on the bar path ───────────────────────────────────────────────────────────────
// TradingView walks each bar as open → nearer extreme → farther extreme → close. A trade sees the
// path vertices strictly after its entry fill (the fill vertex itself only for a fill at the open
// or at the close), up to its exit fill, and its exit fill price; per ledger row:
//   max_runup    = max(0, best favourable move × qty × pointvalue − entry commission)
//   max_drawdown = max(0, worst adverse move × qty × pointvalue + entry commission)
// with signed moves (a trade that only ever saw prices in its favour has a drawdown below its
// commission). A trade opened and closed at the same path position reports 0 / 0.
// The strategy's max_drawdown / max_runup follow the equity at every path vertex and after every fill.

/** Per-unit excursion state of a lot or an entry record. */
type ExcHolder = { entry_price: number; _fav?: number; _adv?: number; _obsFrom?: number; _openBar?: number; _openAt?: number };

/** Where on the bar's path the fill being processed is (a calc_on_order_fills segment maps onto the whole bar's path). */
export function setFillAt(context: any, localAt: number): void {
    const seg = context._excSeg;
    context._pathAt = seg ? seg.offset + localAt * seg.scale : localAt;
}

function excSee(h: ExcHolder, dir: number, price: number): void {
    const f = dir * (price - h.entry_price);
    if (!(f <= (h._fav as number))) h._fav = f;
    if (!(-f <= (h._adv as number))) h._adv = -f;
}

/** The bar's path vertices strictly after `from`, up to `to` (included with `withTo`). */
function excSeeVertices(context: any, h: ExcHolder, dir: number, from: number, to: number, withTo: boolean): void {
    const path: number[] | undefined = context._exc?.path;
    if (!path) return;
    for (let i = 0; i < path.length; i++) {
        if (i > from + 1e-9 && (withTo ? i <= to + 1e-9 : i < to - 1e-9)) excSee(h, dir, path[i]);
    }
}

function excMoney(fav: number | undefined, adv: number | undefined, qty: number, pointValue: number, commission: number): { runup: number; drawdown: number } {
    if (!(qty > 0)) return { runup: 0, drawdown: 0 };
    const runup = fav === undefined ? 0 : Math.max(0, fav * qty * pointValue - commission);
    const drawdown = adv === undefined ? 0 : Math.max(0, adv * qty * pointValue + commission);
    return { runup, drawdown };
}

/** The open lots by ledger record (physical lots without records), for the equity replay. */
function excLots(strategy: StrategyState): Array<{ ref: any; dir: number; qty: number; entry: number; comm: number }> {
    const records: any[] = (strategy as any)._ledger_entries ?? [];
    const dir = Math.sign(strategy.position_size) || 1;
    if (records.length > 0) return records.map((r) => ({ ref: r, dir: r._dir ?? dir, qty: r.qty, entry: r.entry_price, comm: r.commission }));
    return strategy.opentrades.map((t) => ({ ref: t, dir: Math.sign(t.size), qty: Math.abs(t.size), entry: t.entry_price, comm: t.commission ?? 0 }));
}

/** A fill changing the open book, for the equity replay of the bar (see excReplay). */
function excEvent(context: any, ev: { price: number; np: number; add?: any; remove?: any }): void {
    const ex = context._exc;
    if (!ex || ex.bar !== context.idx) return;
    // Fills at the close after the bar's script (process_orders_on_close): the next bar starts from them.
    if (ex.finalized) {
        ((context.strategy as any)._excPreTicks ??= []).push(ev.price);
        return;
    }
    let at = context._pathAt ?? 0;
    // A lot opened on this bar closes at or after the point it opened.
    const ref = ev.remove?.ref;
    if (ref?._openBar === context.idx && Number.isFinite(ref._openAt)) at = Math.max(at, ref._openAt);
    ex.events.push({ at, seq: ex.events.length, ...ev });
}

/**
 * Start of a bar's broker work: the bar's path, the open book it starts from, and every open lot /
 * entry record observing the bar from its open.
 */
export function beginStrategyBar(context: any): void {
    const strategy: StrategyState | undefined = context.strategy;
    if (!strategy) return;
    const path = barPath(
        Series.from(context.data.open).get(0),
        Series.from(context.data.high).get(0),
        Series.from(context.data.low).get(0),
        Series.from(context.data.close).get(0),
    );
    const s: any = strategy;
    context._exc = { bar: context.idx, path, events: [], start: { netprofit: strategy.netprofit, lots: excLots(strategy) }, pre: s._excPreTicks ?? [] };
    s._excPreTicks = [];
    context._pathAt = undefined;
    context._excSeg = undefined;
    for (const t of strategy.opentrades) t._obsFrom = -0.5;
    for (const r of s._ledger_entries ?? []) r._obsFrom = -0.5;
}

/** A new lot / entry record starts observing at its fill (the fill vertex itself for a fill at the open or the close). */
function excOpen(context: any, h: ExcHolder, dir: number): void {
    const at = context._pathAt ?? 0;
    h._fav = undefined;
    h._adv = undefined;
    h._openBar = context.idx;
    h._openAt = at;
    h._obsFrom = at;
    const path: number[] | undefined = context._exc?.bar === context.idx ? context._exc.path : undefined;
    const onVertex = context._fillOnVertex ?? (at === 0 || at === 3);
    if (path && onVertex && Number.isInteger(at) && at >= 0 && at < path.length) excSee(h, dir, path[at]);
}

/** A closed row's excursion: the holder's moves so far, the path up to the exit, and the exit price. */
function excClosedRow(context: any, h: ExcHolder, dir: number, exitPrice: number, exitId: string | undefined): { fav?: number; adv?: number } {
    let x = context._pathAt ?? 3;
    // An exit of a lot opened on this bar is at or after the point it opened.
    if (h._openBar === context.idx && Number.isFinite(h._openAt)) x = Math.max(x, h._openAt as number);
    const view: ExcHolder = { entry_price: h.entry_price, _fav: h._fav, _adv: h._adv };
    const sameTick = h._openBar === context.idx && Math.abs((h._openAt ?? NaN) - x) < 1e-9;
    if (sameTick && exitId !== MARGIN_CALL_EXIT_ID) return {};
    {
        if (context._exc?.bar === context.idx) excSeeVertices(context, view, dir, h._obsFrom ?? -0.5, x, false);
        excSee(view, dir, exitPrice);
    }
    return { fav: view._fav, adv: view._adv };
}

/** End of the bar's broker work: open lots / records take the rest of the path; open trades' excursion getters refresh. */
function excEndBar(context: any): void {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    const ex = context._exc;
    const live = ex?.bar === context.idx && !ex.finalized;
    for (const t of strategy.opentrades) {
        const dir = Math.sign(t.size);
        if (live) excSeeVertices(context, t, dir, t._obsFrom ?? -0.5, 3, true);
        t._obsFrom = 3;
        const m = excMoney(t._fav, t._adv, Math.abs(t.size), pointValue, t.commission ?? 0);
        t.max_runup = m.runup;
        t.max_drawdown = m.drawdown;
    }
    for (const r of (strategy as any)._ledger_entries ?? []) {
        if (live) excSeeVertices(context, r, r._dir ?? Math.sign(strategy.position_size), r._obsFrom ?? -0.5, 3, true);
        r._obsFrom = 3;
    }
}

/**
 * strategy.max_drawdown / max_runup (and their percents): the equity at every vertex of the bar's
 * path and right after every fill, in path order (TV broker emulator). With `realized` the
 * closed rows' profit (open entry fees not deducted) and `fees` the open entry commissions:
 *   peak   = running max of min(realized, equity + fees)
 *   trough = running min of max(realized − fees, equity)
 *   max_drawdown = max(peak − equity), max_runup = max(equity − trough),
 *   percents: running max of (peak − equity) / peak and (equity − trough) / equity.
 */
function excReplay(context: any): void {
    const strategy: StrategyState = context.strategy;
    const ex = context._exc;
    if (!ex || ex.bar !== context.idx || ex.finalized) return;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    const s: any = strategy;
    const lots = new Map<any, { dir: number; qty: number; entry: number; comm: number }>();
    for (const l of ex.start.lots) lots.set(l.ref, { dir: l.dir, qty: l.qty, entry: l.entry, comm: l.comm });
    let netprofit = ex.start.netprofit;
    const tick = (price: number) => {
        let unrealized = 0;
        let fees = 0;
        for (const l of lots.values()) {
            unrealized += (price - l.entry) * l.dir * l.qty * pointValue;
            fees += l.comm;
        }
        const equity = strategy.initial_capital + netprofit + unrealized;
        const realized = strategy.initial_capital + netprofit + fees;
        s.equity_peak = Math.max(s.equity_peak, Math.min(realized, equity + fees));
        s.equity_trough = Math.min(s.equity_trough, Math.max(realized - fees, equity));
        const dd = s.equity_peak - equity;
        const ru = equity - s.equity_trough;
        if (dd > s.max_drawdown) s.max_drawdown = dd;
        if (ru > s.max_runup) s.max_runup = ru;        if (s.equity_peak > 0) s.max_drawdown_percent_value = Math.max(s.max_drawdown_percent_value, (100 * dd) / s.equity_peak);
        if (equity > 0) s.max_runup_percent_value = Math.max(s.max_runup_percent_value, (100 * ru) / equity);
    };
    const apply = (e: any) => {
        if (e.add) {
            const l = lots.get(e.add.ref);
            if (l) {
                l.entry = (l.entry * l.qty + e.add.entry * e.add.qty) / (l.qty + e.add.qty);
                l.qty += e.add.qty;
                l.comm += e.add.comm;
            } else lots.set(e.add.ref, { dir: e.add.dir, qty: e.add.qty, entry: e.add.entry, comm: e.add.comm });
        }
        if (e.remove) {
            const l = lots.get(e.remove.ref);
            if (l) {
                l.qty -= e.remove.qty;
                l.comm -= e.remove.comm;
                if (l.qty <= 1e-12) lots.delete(e.remove.ref);
            }
        }
        netprofit += e.np;
    };
    for (const p of ex.pre) tick(p);
    const items = [
        ...ex.path.map((price: number, i: number) => ({ at: i, price, vertex: true, seq: -1 })),
        ...ex.events.map((e: any) => ({ ...e, vertex: false })),
    ].sort((a: any, b: any) => a.at - b.at || Number(a.vertex) - Number(b.vertex) || a.seq - b.seq);
    // A fill is sampled once, after it (a trade's exit is not valued at its exit price beforehand).
    for (const it of items) {
        if (!it.vertex) apply(it);
        tick(it.price);
    }
}

/**
 * FIFO close of `qtyToClose` contracts from open trades, optionally filtered
 * by `fromEntry` — when set, only trades whose `entry_id === fromEntry` are
 * eligible. Falls back to closing across all open trades when empty/undefined.
 *
 * Wraps `closePartialPosition` by temporarily putting the matching lots at the head of the queue
 * (the closed-trade rows still pair with the oldest entry records, see consumeLedger).
 */
export function closeMatching(
    context: any,
    fromEntry: string | undefined,
    qtyToClose: number,
    exitPrice: number,
    exitTime: number,
    closeInfo?: CloseInfo,
    specificTradeId?: string,
): void {
    const strategy: StrategyState = context.strategy;
    // The lots go back to their order afterwards: a later unnamed fill (strategy.order, close_all, a
    // margin call) takes each id's quantity oldest first (TV: after close("C") with A / B / C open,
    // strategy.order short 1.5 takes A's 1 and 0.5 of B).
    const order = new Map(strategy.opentrades.map((t, i) => [t, i]));
    const restoreOrder = () => strategy.opentrades.sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity));

    // Per-LOT close (exit brackets): TV binds each bracket to the physical
    // entry lot whose entry price computed its level — the fill closes
    // THAT lot, not the oldest. FIFO entry/exit pairing for the ledger is
    // handled inside closePartialPosition (see the ledger-swap there).
    if (specificTradeId !== undefined) {
        const target: Trade[] = [];
        const others: Trade[] = [];
        for (const t of strategy.opentrades) {
            if (t.id === specificTradeId) target.push(t);
            else others.push(t);
        }
        if (target.length === 0) return;
        const targetQty = Math.abs(target[0].size);
        strategy.opentrades = [...target, ...others];
        closePartialPosition(context, Math.min(qtyToClose, targetQty), exitPrice, exitTime, closeInfo);
        restoreOrder();
        return;
    }

    if (!fromEntry || fromEntry === '') {
        // No filter — close FIFO across all open trades.
        closePartialPosition(context, qtyToClose, exitPrice, exitTime, closeInfo);
        return;
    }

    // Reorder: matching trades first (preserving their relative order),
    // non-matching second. closePartialPosition closes FIFO from the front
    // so this gives us a filtered FIFO.
    const matching: Trade[] = [];
    const others: Trade[] = [];
    for (const t of strategy.opentrades) {
        if (t.entry_id === fromEntry) matching.push(t);
        else others.push(t);
    }
    const matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
    if (matchingQty === 0) return;
    const effectiveClose = Math.min(qtyToClose, matchingQty);

    strategy.opentrades = [...matching, ...others];
    closePartialPosition(context, effectiveClose, exitPrice, exitTime, closeInfo);
    restoreOrder();
}

/**
 * Process exit-category orders each bar (after entry-order fills, before the
 * user script runs). Handles:
 *   - Market exits from strategy.close() / strategy.close_all() (fill at
 *     current bar's open if placed previously).
 *   - Conditional exits from strategy.exit() — TP / SL / trailing-stop
 *     triggers evaluated against current bar's high/low. Trailing-stop
 *     peak (trade.trail_peak) is updated each bar even when not triggered.
 */
/**
 * Exit of a trade that a limit / stop entry filled inside the current bar (TradingView broker
 * emulator): the bar moves open → nearer extreme → farther extreme → close, the entry fills where
 * that path first reaches its level, and only the path after it can trigger the exit legs. A leg
 * already breached at the fill fills there, at the fill price; otherwise the first leg the rest of
 * the path reaches fills at its own price. Returns null when no leg is reached on this bar, and
 * undefined when the fill cannot be placed on the path (the caller then uses the whole bar).
 */
function entryBarPathExit(
    entry: { level: number; type: 'limit' | 'stop'; dir: number },
    tp: number | undefined,
    sl: number | undefined,
    isLong: boolean,
    bar: { open: number; high: number; low: number; close: number },
    limitSlack: number,
): { kind: 'profit' | 'loss'; price: number } | null | undefined {
    const { open, high, low, close } = bar;
    const path = Math.abs(high - open) <= Math.abs(open - low) ? [open, high, low, close] : [open, low, high, close];
    // A buy limit and a sell stop fill on a falling move, a buy stop and a sell limit on a rising one.
    const falling = (entry.type === 'limit') === (entry.dir === 1);
    const at = entry.level;
    let segment = -1;
    for (let i = 0; i < 3; i++) {
        const a = path[i], b = path[i + 1];
        if (falling ? a >= at && b <= at : a <= at && b >= at) {
            segment = i;
            break;
        }
    }
    if (segment < 0) return undefined;
    if (tp !== undefined && (isLong ? at >= tp : at <= tp)) return { kind: 'profit', price: at };
    if (sl !== undefined && (isLong ? at <= sl : at >= sl)) return { kind: 'loss', price: at };
    const rest = [at, ...path.slice(segment + 1)];
    for (let i = 0; i + 1 < rest.length; i++) {
        const a = rest[i], b = rest[i + 1];
        if (b > a) {
            if (isLong && tp !== undefined && b >= tp + limitSlack) return { kind: 'profit', price: tp };
            if (!isLong && sl !== undefined && b >= sl) return { kind: 'loss', price: sl };
        } else if (b < a) {
            if (isLong && sl !== undefined && b <= sl) return { kind: 'loss', price: sl };
            if (!isLong && tp !== undefined && b <= tp - limitSlack) return { kind: 'profit', price: tp };
        }
    }
    return null;
}

/**
 * How much of `matching` (the open trades it applies to) a strategy.exit may close. Exits share an
 * entry's quantity in the order they were placed (TradingView): each takes its `qty`, or its
 * `qty_percent` of the entry quantity, or all of it without either, out of what the exits placed
 * before it and still working have not taken. A 50% target placed before a qty-less stop leaves
 * the stop half the position; the qty-less stop placed first takes all of it and the target
 * never fills; 60% + 60% gives the second 40%; on whole contracts 50% of 1 takes the contract.
 */
function exitCapacity(context: any, order: Order, matching: Trade[]): { total: number; perTrade: Map<Trade, number> } {
    const strategy: StrategyState = context.strategy;
    // What exit `o` takes of each trade it applies to: qty_percent of that trade's entry quantity,
    // an absolute qty spread over the trades oldest first, or all of each without either.
    const shares = (o: Order, ts: Trade[]): Map<Trade, number> => {
        const m = new Map<Trade, number>();
        let left = o.qty && o.qty > 0 ? o.qty : Infinity;
        for (const t of ts) {
            const want = o.qty_percent && o.qty_percent > 0 && !(o.qty && o.qty > 0) ? partialCloseQty(context, t._entry_qty ?? Math.abs(t.size), o.qty_percent) : left;
            const take = Math.min(want, Math.abs(t.size));
            m.set(t, take);
            if (o.qty && o.qty > 0) left -= take;
        }
        return m;
    };
    const free = new Map<Trade, number>(matching.map((t) => [t, Math.abs(t.size)]));
    const earlier = strategy.pending_orders
        .filter((o) => o !== order && o.status === 'pending' && (o.category ?? 'entry') === 'exit' && !isMarketCloseOrder(o) && (o._seq ?? Infinity) < (order._seq ?? Infinity))
        .sort((a, b) => (a._seq ?? 0) - (b._seq ?? 0));
    for (const o of earlier) {
        const its = matching.filter((t) => (!o.from_entry || t.entry_id === o.from_entry) && !t._exits_filled?.has(o.id));
        for (const [t, q] of shares(o, its)) free.set(t, Math.max(0, (free.get(t) ?? 0) - q));
    }
    const perTrade = new Map<Trade, number>();
    let total = 0;
    for (const [t, q] of shares(order, matching)) {
        const c = Math.min(q, free.get(t) ?? 0);
        perTrade.set(t, c);
        total += c;
    }
    return { total, perTrade };
}

/** A market order from `strategy.close` / `strategy.close_all` (an exit with no price leg). */
export function isMarketCloseOrder(o: Order): boolean {
    return (
        (o.category ?? 'entry') === 'exit' &&
        o.type === 'market' &&
        o.profit === undefined &&
        o.loss === undefined &&
        o.limit === undefined &&
        o.stop === undefined &&
        o.trail_price === undefined &&
        o.trail_points === undefined
    );
}

export function processExitOrders(context: any, phase: 'market' | 'open' | 'intrabar' = 'intrabar', onlyTrades?: Set<string>): void {
    if (!context.strategy) return;
    const strategy: StrategyState = context.strategy;
    if (strategy.pending_orders.length === 0) return;

    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    let anyExitFilledThisBar = false;
    const limitSlack = limitFillSlack(context);

    // Two-phase evaluation (TV broker-emulator order precedence at the
    // bar's open):
    //   phase 'open'     — runs BEFORE entry fills. Only conditional-exit
    //                      GAP-FILLS execute (the bar opened already past a
    //                      bracket's trigger → fill at the open). Brackets
    //                      consumed here never extend to entries filling at
    //                      the same open.
    //   phase 'market'   — runs BEFORE entry fills. Only market closes from
    //                      strategy.close / close_all queued on an earlier bar:
    //                      they fill at the open ahead of entry orders (a
    //                      limit / stop entry fills later on the path; a
    //                      market entry fills at the same open, so one queued
    //                      BEFORE the close keeps precedence). TV: a close
    //                      followed by a reversing entry exits at the open
    //                      under the close's id and comment (#316).
    //   phase 'intrabar' — runs AFTER entry fills. Everything else:
    //                      market closes, intra-bar crossings, trail, and
    //                      gap-fills for trades that ATTACHED at this bar's
    //                      open (an exit order waiting on a not-yet-filled
    //                      entry brackets it at fill time — if the open is
    //                      already past the trigger it exits immediately).
    //
    // QA evidence (pyramiding avg_price xlsx, BTCUSDC 1D): a stop
    // gap-firing at the open closes ONLY the prior stack — the pyramid
    // entry filling at that same open survives (2024-03-21); while an exit
    // order surviving to intra-bar crossing closes same-bar entries too
    // (2020-12-17), and a waiting order attaches to a reversal entry and
    // gap-exits it at its own fill price (2021-09-08).
    //
    // Exit orders are taken in the order the bar's path reaches their first stop / limit leg: a
    // second exit's stop reached before the first exit's target fills first (TV).
    const exitPath = barPath(
        Series.from(context.data.open).get(0),
        Series.from(context.data.high).get(0),
        Series.from(context.data.low).get(0),
        Series.from(context.data.close).get(0),
    );
    const ranked = strategy.pending_orders
        .map((o, i) => ({ o, i, at: phase === 'intrabar' && (o.category ?? 'entry') === 'exit' ? exitFirstLegAt(context, o, exitPath) : 0 }))
        .sort((a, b) => a.at - b.at || a.i - b.i);
    // Exits whose stop / limit the bar opens past fill nearest the open first (TV, AAPL 1D: take-profits
    // at 27.43 and 27.52 with an open of 27.95 book the 27.52 one first); other orders keep their place.
    const gapped = ranked
        .map((x, slot) => ({ x, slot, d: x.at === 0 && (x.o.category ?? 'entry') === 'exit' ? exitGapDistance(context, x.o, openPrice) : undefined }))
        .filter((g): g is { x: (typeof ranked)[number]; slot: number; d: number } => g.d !== undefined);
    const slots = gapped.map((g) => g.slot);
    gapped.sort((a, b) => a.d - b.d || a.slot - b.slot).forEach((g, j) => (ranked[slots[j]] = g.x));
    const ordered = ranked.map((x) => x.o);
    for (const order of ordered) {
        if (order.status !== 'pending') continue;
        if ((order.category ?? 'entry') !== 'exit') continue;
        if (phase === 'market' && !isMarketCloseOrder(order)) continue;

        // Gather matching open trades (from_entry filter; '' = all).
        // For market closes from strategy.close_all() / strategy.close(id),
        // additionally restrict to the trade IDs captured at QUEUE time —
        // these orders are bound to the position state at call time, not
        // fill time. If a reversal entry implicitly closed the snapshotted
        // trades before this order fires, the order has no target and gets
        // cancelled, mirroring TV's behavior of treating
        // strategy.close_all() as a no-op when its intended position is
        // already gone.
        let matching = strategy.opentrades.filter((t) => !order.from_entry || t.entry_id === order.from_entry);
        if (order._intended_trade_ids) {
            const snapshot = new Set(order._intended_trade_ids);
            matching = matching.filter((t) => snapshot.has(t.id));
        }
        if (matching.length === 0) {
            // Nothing to exit. In the pre-entry phases the order may be
            // WAITING on an entry that fills at this bar's open (TV: exit
            // orders placed before their entry wait for it) — leave it
            // pending. After entries have filled (intrabar phase), check
            // if there's still a pending entry order for this exit's
            // from_entry — if so, keep the exit waiting; otherwise it's
            // orphaned and should be cancelled.
            if (phase === 'intrabar') {
                const hasPendingEntry = order.from_entry
                    ? strategy.pending_orders.some(
                          (o) => o.status === 'pending' && (o.category ?? 'entry') === 'entry' && o.id === order.from_entry
                      )
                    : false;
                if (!hasPendingEntry) order.status = 'cancelled';
            }
            continue;
        }
        if (onlyTrades) {
            if (isMarketCloseOrder(order)) continue;
            matching = matching.filter((t) => onlyTrades.has(t.id));
            if (matching.length === 0) continue;
        }

        let matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
        const matchingDir = Math.sign(matching[0].size); // direction of the position to close

        // ---- Market exits from close() / close_all() ----
        if (isMarketCloseOrder(order)) {
            if (phase === 'open') continue;
            // Skip orders placed on the current bar — they fill on the next bar's open.
            if (order.bar >= context.idx) continue;
            if (phase === 'market') {
                // `immediately` closes are handled at their own bar's close.
                if (order.immediately) continue;
                // A market entry queued before this close fills first at the same open; the
                // close then fills in the intrabar phase (cancelled if that entry reversed it).
                const queuedAt = strategy.pending_orders.indexOf(order);
                const earlierMarketEntry = strategy.pending_orders
                    .slice(0, queuedAt)
                    .some((o) => o.status === 'pending' && (o.category ?? 'entry') === 'entry' && o.type === 'market' && o.bar < context.idx);
                if (earlierMarketEntry) continue;
            }

            // Determine fill price; immediately=true (when supported) would fire
            // at current close; default is current bar's open.
            let fillPrice = order.immediately ? closePrice : openPrice;
            // Apply slippage against the close direction (opposite of position direction).
            fillPrice = applySlippage(context, -matchingDir, fillPrice);
            setFillAt(context, order.immediately ? 3 : 0);

            let qtyToClose = matchingQty;
            if (order.qty && order.qty > 0) qtyToClose = Math.min(order.qty, matchingQty);
            else if (order.qty_percent && order.qty_percent > 0) {
                qtyToClose = partialCloseQty(context, matchingQty, order.qty_percent);
            }

            closeMatching(context, order.from_entry, qtyToClose, fillPrice, currentTime, {
                exitId: order.id,
                exitComment: order.comment,
            });
            order.status = 'filled';
            order.fill_price = fillPrice;
            order.fill_bar = context.idx;
            order.fill_time = currentTime;
            riskAfterFill(context, fillPrice);
            continue;
        }

        // ---- Conditional exits from exit() ----
        // An exit id fills once per trade: after `strategy.exit("tp1", "L", qty_percent = 50)`
        // has closed half of a trade, calling it again does not close half of the rest.
        matching = matching.filter((t) => !t._exits_filled?.has(order.id));
        if (matching.length === 0) {
            if (phase === 'intrabar') order.status = 'cancelled';
            continue;
        }
        matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
        const sizesBefore = new Map(matching.map((t) => [t, Math.abs(t.size)]));
        // PER-TRADE exit brackets (TV broker-emulator semantics): when a
        // strategy.exit matches multiple open trades (pyramiding), TV
        // creates an independent exit bracket for EACH trade:
        //   - profit / loss (tick) legs compute the trigger from THAT
        //     trade's own entry price;
        //   - limit / stop (absolute price) legs are shared by all trades.
        // When several brackets trigger inside one bar, the fills execute
        // in intra-bar crossing order and each fill closes the OLDEST
        // remaining trades first (FIFO) — NOT necessarily the trade whose
        // bracket computed the level. Verified against the QA pyramiding
        // xlsx (BTCUSDC 1D, 2020-03-12 crash bar: five short TPs filled
        // at five different prices, assigned to trades strictly
        // oldest-first).
        //
        // Trailing legs are per trade too (see walkTrail below).
        let totalCost = 0;
        for (const t of matching) totalCost += Math.abs(t.size) * t.entry_price;
        const avgEntry = totalCost / matchingQty;
        const isLong = matchingDir === 1;

        // A stop / limit on the wrong side of the entry is kept: it is already breached and fills
        // at once (TV: an exit waiting for a long entry, its stop 64,066.01 above the 63,974.01
        // fill, closes the trade at that fill on the entry bar).

        // Trailing-stop state.
        // Two arming modes:
        //   trail_price: armed when market reaches the absolute price level
        //   trail_points: armed when market moves N ticks in favor from entry
        // After arming, ride at trail_offset ticks behind the running peak.
        //
        // Pine semantic: the trail cannot arm and trigger on the same
        // bar. The arming bar establishes the running peak; the trigger
        // check is suppressed for that bar only. SL and TP triggers are
        // independent and still fire on the arming bar.
        // Trail arming + evaluation are intra-bar phenomena — they run in
        // the 'intrabar' phase only (arming twice per bar would corrupt
        // trailArmedThisBar, making the segment model treat the arming bar
        // as an armed-prior bar).
        // Peak update is now deferred to checkTrail so we can split it
        // around the intra-bar segment that TV's broker emulator assumes
        // (favorable-first: peak updates BEFORE trigger check;
        //  adverse-first: peak updates AFTER segment-1 check against the
        //  OLD peak's trigger). Eager peak update produced phantom early
        //  fires on adverse-first bars where the bar's high established
        //  the new peak only AFTER the low had already passed.

        // The trail trigger is now computed inside checkTrail's
        // segment branches (using OLD peak for segment 1, NEW peak for
        // segment 3 on adverse-first; new peak unconditionally on
        // favorable-first). See checkTrail below.

        // Evaluate triggers against this bar.
        //
        // TV's intra-bar order assumption — when both TP and SL could've fired,
        // which fires first is determined by the bar's open's PROXIMITY to high
        // vs low (TV docs, "Concepts / Strategies / Broker emulator"):
        //   open closer to HIGH → assumed order: open → high → low → close
        //                         (first move is up — favorable for longs, adverse for shorts)
        //   open closer to LOW  → assumed order: open → low → high → close
        //                         (first move is down — adverse for longs, favorable for shorts)
        //
        // For a long: open-near-high fires TP first, open-near-low fires SL first.
        // For a short: open-near-high fires SL first, open-near-low fires TP first.
        // Trail is treated as an adverse-side trigger (it kicks in on a retrace
        // against the favorable peak), so it fires together with SL.
        const openCloserToHigh = Math.abs(highPrice - openPrice) <= Math.abs(openPrice - lowPrice);
        const favorableFirst = isLong ? openCloserToHigh : !openCloserToHigh;

        // Per-trade bracket evaluation. Each triggered bracket becomes a
        // fill EVENT; events execute in intra-bar crossing order, and each
        // closes the oldest remaining matching trades first (FIFO).
        //
        // Gap-fill rule: if the bar's OPEN is already past a trigger, the
        // fill price is the OPEN, not the literal trigger price. This
        // mirrors real broker behavior — if you'd planned a stop at $100
        // and the bar opens at $95, you fill at $95.
        // `at`: where on the bar's path the leg fills (see pathPosition); events fill in that order.
        type FillEvent = { qty: number; price: number; kind: 'profit' | 'loss' | 'trailing'; tradeId?: string; at?: number };
        const tpEvents: FillEvent[] = [];
        const slEvents: FillEvent[] = [];

        // Margin-call bracket lock: after a same-bar margin call, only the
        // bracket of the lot the MC partially consumed stays working for
        // the rest of the bar — the other lots' brackets are canceled and
        // re-created by the next strategy.exit call (see processMarginCall
        // for the QA evidence).
        const mcLock = (strategy as any)._mc_exit_lock;
        const mcLocked = mcLock && mcLock.bar === context.idx;

        // What this exit may close of each trade, after the exits placed before it.
        const capacity = exitCapacity(context, order, matching);
        for (const t of matching) {
            if (mcLocked && t.id !== mcLock.tradeId) continue;
            // Tick legs compute from the lot's PHYSICAL entry — immutable
            // under FIFO ledger pairing (see closePartialPosition).
            const entry = t._bracket_entry ?? t.entry_price;
            const tQty = capacity.perTrade.get(t) ?? 0;
            if (!(tQty > 1e-9)) continue;
            const { tp, sl } = exitBracket(order, entry, isLong ? 1 : -1, mintick);

            // A trade a limit / stop entry opened inside this bar: only the path after the fill counts
            // (a leg on the wrong side of the fill exits at the fill).
            const intrabar = phase === 'intrabar' && t._intrabarEntry?.bar === context.idx ? t._intrabarEntry : undefined;
            if (intrabar && !mcLocked) {
                const hit = entryBarPathExit(intrabar, tp, sl, isLong, { open: openPrice, high: highPrice, low: lowPrice, close: closePrice }, limitSlack);
                if (hit !== undefined) {
                    if (hit) (hit.kind === 'profit' ? tpEvents : slEvents).push({ qty: tQty, price: hit.price, kind: hit.kind, tradeId: t.id });
                    continue;
                }
            }

            // In the pre-entry 'open' phase only GAP conditions count (the
            // bar opened already past the trigger); intra-bar crossings
            // belong to the 'intrabar' phase.
            // The take-profit leg is a limit order: intrabar it needs price past it by
            // backtest_fill_limits_assumption ticks.
            const tpHit =
                tp !== undefined &&
                (phase === 'open' ? (isLong ? openPrice >= tp : openPrice <= tp) : isLong ? highPrice >= tp + limitSlack : lowPrice <= tp - limitSlack);
            const slHit =
                sl !== undefined && (phase === 'open' ? (isLong ? openPrice <= sl : openPrice >= sl) : isLong ? lowPrice <= sl : highPrice >= sl);

            const openPastSl = sl !== undefined && (isLong ? openPrice <= sl : openPrice >= sl);
            const openPastTp = tp !== undefined && (isLong ? openPrice >= tp + limitSlack : openPrice <= tp - limitSlack);

            // TV asymmetry: a BUY-stop (the SL leg of a SHORT) already past at the open does not
            // catch a short ADDED at that same open to a short held before the bar, and that add
            // leaves the exit for good, take-profit included (BTCUSDT 1h / AAPL 1D, pyramiding 2: the
            // held trade exits, the add is closed by close_all later, 297 / 299). Sell-stops and
            // both-side limits always catch, and so does a buy-stop for a short opened from flat
            // (market, stop and limit entries with their exit stop below the fill exit at the fill,
            // 100 / 100 each).
            if (slHit && openPastSl && !isLong && t.entry_bar_index === context.idx) {
                const preFill = (strategy as any)._preFillSize;
                if ((preFill?.idx === context.idx ? preFill.size : 0) < 0) {
                    (t._exits_filled ??= new Set()).add(order.id);
                    continue;
                }
            }

            // OCO per trade: when both legs are reachable within the bar, a leg the bar opens past
            // fills at the open (TV, AAPL 1D: a short's stop breached at the open fills there before a
            // take-profit the bar reaches later); otherwise the leg crossed FIRST along the assumed
            // intra-bar path wins (favorable-first → TP, adverse-first → SL).
            let kind: 'profit' | 'loss' | null = null;
            if (tpHit && slHit) kind = openPastSl ? 'loss' : openPastTp ? 'profit' : favorableFirst ? 'profit' : 'loss';
            else if (tpHit) kind = 'profit';
            else if (slHit) kind = 'loss';

            if (kind === 'loss') slEvents.push({ qty: tQty, price: openPastSl ? openPrice : (sl as number), kind: 'loss', tradeId: t.id });
            if (kind === 'profit') tpEvents.push({ qty: tQty, price: openPastTp ? openPrice : (tp as number), kind: 'profit', tradeId: t.id });
        }

        // Crossing order within each leg: the TP leg is crossed while
        // price travels toward the FAVORABLE extreme (ascending prices for
        // a long, descending for a short); the SL leg while traveling
        // toward the ADVERSE extreme (the reverse). Gap-fills carry
        // price = open and naturally sort to the front of their leg.
        tpEvents.sort((a, b) => (isLong ? a.price - b.price : b.price - a.price));
        slEvents.sort((a, b) => (isLong ? b.price - a.price : a.price - b.price));
        // Composite trailing leg — same intra-bar segment model as before
        // (TV broker emulator), emitting an event for the REMAINING qty
        // instead of firing directly:
        //
        // Favorable-first (open closer to high for long; open closer to
        // low for short):
        //   Phase 1: open → favorable extreme (price rides to bar H for
        //            long / bar L for short). Peak updates to that.
        //   Phase 2: favorable extreme → adverse extreme. Trigger
        //            (= NEW peak ± offset) may be crossed.
        //   Phase 3: adverse extreme → close. (Already covered.)
        //
        // Adverse-first (open closer to adverse extreme):
        //   Phase 1: open → adverse extreme. Peak is still PRIOR. Check
        //            trigger using OLD peak; if crossed, fire there.
        //   Phase 2: adverse → favorable extreme. Peak updates now.
        //   Phase 3: favorable → close. If close descends/rises
        //            through the NEW trigger, fire at the NEW trigger.
        //
        // Arming THIS bar is a sub-case: the peak was JUST established
        // at the arming moment (bar's H for long / L for short). The
        // segment-1 check with OLD peak doesn't apply (trail wasn't
        // armed yet). Only phase 2 (favorable-first) or phase 3
        // (adverse-first) can fire on the arming bar.
        //
        // The fill is always the LITERAL trigger price — gap-fill at
        // open is incorrect for trail (the bar's open precedes any
        // peak update for this trade).
        const path = barPath(openPrice, highPrice, lowPrice, closePrice);
        // Each trade has its own trail, armed from its own entry (TV: two pyramided longs under one
        // trailing exit — the first one's trail arms and fires while the second's is not armed).
        const trailEvents: FillEvent[] = [];
        if (phase === 'intrabar' && !mcLocked && order.trail_offset !== undefined && (order.trail_price !== undefined || order.trail_points !== undefined)) {
            const states = (order._trailByTrade ??= {});
            for (const t of matching) {
                const start = trailStart(context, t, path);
                const state = states[t.id] ?? { armed: false, peak: NaN };
                const armPrice = trailArmPrice(order, t._bracket_entry ?? t.entry_price, isLong ? 1 : -1, mintick);
                const fired = walkTrail(path, start, { ...state, armPrice, offset: order.trail_offset as number, dir: isLong ? 1 : -1, mintick, offGrid: offGridTrail(context) });
                states[t.id] = { armed: fired.armed, peak: fired.peak };
                const tQty = capacity.perTrade.get(t) ?? 0;
                if (fired.fill && tQty > 1e-9) trailEvents.push({ qty: tQty, price: fired.fill.price, kind: 'trailing', at: fired.fill.at, tradeId: t.id });
            }
        }

        // Events fill in the order the bar's path reaches them: a long's trail armed on the way up
        // fires on the way down before a stop-loss further below (TV, case "05" bar 2375: trail
        // 79,690 before the stop at 78,842.56). Equal positions keep the leg order (take-profit
        // first on favorable-first bars; stop, then trail, then take-profit otherwise).
        for (const ev of tpEvents) ev.at ??= pathPosition(path, ev.price + (isLong ? limitSlack : -limitSlack), isLong) ?? 0;
        for (const ev of slEvents) ev.at ??= pathPosition(path, ev.price, !isLong) ?? 0;
        const events: FillEvent[] = (
            favorableFirst
                ? [...tpEvents, ...slEvents, ...trailEvents]
                : [...slEvents, ...trailEvents, ...tpEvents]
        ).sort((a, b) => (a.at ?? 0) - (b.at ?? 0));

        if (events.length > 0) {
            // qty / qty_percent caps apply to the TOTAL closed by this order, after what the exits
            // placed before it reserve.
            let capRemaining = capacity.total;

            const remainingMatchingQty = () =>
                strategy.opentrades.filter((t) => !order.from_entry || t.entry_id === order.from_entry).reduce((sum, t) => sum + Math.abs(t.size), 0);

            let lastFill = NaN;
            let closedAny = false;
            for (const ev of events) {
                if (capRemaining <= 1e-9) break;
                const remaining = remainingMatchingQty();
                if (remaining <= 1e-9) break;
                const qtyThis = Math.min(ev.qty === Infinity ? remaining : ev.qty, capRemaining, remaining);
                // Slippage (closing side direction) applies to the stop and trailing legs;
                // the take-profit leg is a limit order and fills at its price.
                const fillPrice = ev.kind === 'profit' ? ev.price : applySlippage(context, -matchingDir, ev.price);

                // Resolve which per-leg comment to stamp on the closed
                // trade. strategy.exit() exposes comment_profit /
                // comment_loss / comment_trailing — each fires only when
                // its leg triggers. Fall back to the generic `comment`.
                const legComment =
                    ev.kind === 'profit'
                        ? (order.comment_profit ?? order.comment)
                        : ev.kind === 'loss'
                          ? (order.comment_loss ?? order.comment)
                          : (order.comment_trailing ?? order.comment);

                // Bracket fills close their SOURCE lot (per-lot binding);
                // the trail event has no source lot and closes FIFO.
                setFillAt(context, phase === 'intrabar' ? (ev.at ?? 0) : 0);
                closeMatching(
                    context,
                    order.from_entry,
                    qtyThis,
                    fillPrice,
                    currentTime,
                    {
                        triggerKind: ev.kind,
                        exitId: order.id,
                        exitComment: legComment,
                    },
                    ev.tradeId,
                );
                // An exit in an OCA group acts as a reduce-type member (TV: its 1-unit fill takes 1 off a
                // reduce-type strategy.order of 2 in the group).
                if (order.oca_name && order.oca_type === 'reduce') applyOca(strategy, order, qtyThis);
                capRemaining -= qtyThis;
                lastFill = fillPrice;
                closedAny = true;
            }

            // The order is consumed when nothing matching remains open or
            // its qty cap is exhausted; otherwise it stays pending so the
            // surviving trades' brackets remain active on later bars (TV
            // brackets persist until filled or replaced).
            if (closedAny) {
                anyExitFilledThisBar = true;
                riskAfterFill(context, lastFill);
            }
            if (closedAny && (remainingMatchingQty() <= 1e-9 || capRemaining <= 1e-9)) {
                order.status = 'filled';
                order.fill_price = lastFill;
                order.fill_bar = context.idx;
                order.fill_time = currentTime;
            }
            // Trades this order reduced: it (and a later call with its id) no longer applies to them.
            for (const [t, before] of sizesBefore) {
                if (Math.abs(t.size) < before) (t._exits_filled ??= new Set()).add(order.id);
            }
        }
    }

    // A position that is now flat takes its exit orders with it: every still-pending exit that was placed while that
    // position was open is cancelled, so it cannot survive the flat period and attach to a LATER entry with stale
    // levels (e.g. `loss` ticks computed from an earlier bar). Exits placed while flat (waiting for an entry) stay,
    // and so do exits for another entry than the closed trades' (TV: a long's exit placed while a short was open
    // fills the long, entered later on the bar the short's stop closed it; controlled case 22).
    if (anyExitFilledThisBar && strategy.opentrades.length === 0) {
        const closedEntries = new Set(strategy.closedtrades.filter((t) => t.exit_bar_index === context.idx).map((t) => t.entry_id));
        for (const o of strategy.pending_orders) {
            if (o.status === 'pending' && (o.category ?? 'entry') === 'exit' && o._placedWithPosition && (!o.from_entry || closedEntries.has(o.from_entry))) {
                o.status = 'cancelled';
            }
        }
    }

    // Remove filled/cancelled exit orders.
    strategy.pending_orders = strategy.pending_orders.filter((o) => o.status === 'pending');

    // Refresh equity for any caller reading metrics between processExitOrders
    // and the bar-finalize step. Peaks are latched in finalizeBar().
    markToMarket(context, closePrice);
}

/**
 * Apply a SECOND margin call scheduled by the phantom re-check (see
 * processMarginCall). TV books that fill at the PREVIOUS bar's close,
 * AFTER the script's on-close evaluation — so the script and any order
 * it queued saw the pre-MC#2 position. PineTS mirrors this by booking
 * the fill at the very start of the NEXT bar, before entries process:
 * a reversal queued at the MC bar's close (qty frozen at queue time)
 * then naturally overshoots by exactly q2, reproducing TV's phantom
 * opposite-side position (xlsx-confirmed: 2021-10-02 reversal long
 * 5.263108 = 5 + 0.263108).
 *
 * Same-direction (non-reversal) entries queued on the MC bar are
 * CANCELED — TV's transient post-MC state rejects them (2022-04-19: the
 * add queued at the 04-18 close never filled; the next add was accepted
 * a bar later). Opposite-direction reversals are unaffected (E1), and a
 * close-MC that flattens the position leaves nothing to gate (IC=900k
 * experiment: next-open entry from flat was admitted).
 */
// TradingView books a margin-call liquidation as a position close, with the reason in the comment.
const MARGIN_CALL_EXIT_ID = 'Close position order';

export function applyPendingCloseMarginCall(context: any): void {
    const strategy: StrategyState = context.strategy;
    if (!strategy) return;
    const pending = (strategy as any)._pending_close_mc;
    if (!pending) return;
    (strategy as any)._pending_close_mc = null;

    if (strategy.opentrades.length === 0 || Math.sign(strategy.position_size) !== pending.dir) return;

    // It fills at the previous bar's close, before this bar's path.
    setFillAt(context, -1);
    closePartialPosition(context, Math.min(pending.qty, Math.abs(strategy.position_size)), applySlippage(context, -pending.dir, pending.price), pending.time, {
        exitId: MARGIN_CALL_EXIT_ID,
        exitComment: 'Margin call',
        forced: true,
    });

    if (Math.abs(strategy.position_size) > 1e-9) {
        for (const o of strategy.pending_orders) {
            if (o.status === 'pending' && (o.category ?? 'entry') === 'entry' && !o._isReversalEntry && parseDirection(o.direction) === pending.dir) {
                o.status = 'cancelled';
            }
        }
        strategy.pending_orders = strategy.pending_orders.filter((o) => o.status === 'pending');
    }
}

/**
 * True when the bar's first intra-bar move is ADVERSE for the current
 * position (TV broker-emulator path assumption: open closer to high →
 * open→high→low→close; open closer to low → open→low→high→close).
 * Used to path-order the margin-call checkpoint against exit fills.
 */
export function isAdverseFirstBar(context: any): boolean {
    const strategy: StrategyState = context.strategy;
    const dir = Math.sign(strategy?.position_size ?? 0);
    if (dir === 0) return false;
    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const openCloserToHigh = Math.abs(highPrice - openPrice) <= Math.abs(openPrice - lowPrice);
    return dir === 1 ? !openCloserToHigh : openCloserToHigh;
}

/**
 * Margin-call check (TV broker emulator) at one of two intra-bar
 * CHECKPOINTS along the assumed price path:
 *
 *   'open'    — right after entries fill at the bar's open: equity and
 *               required margin evaluated AT THE OPEN, liquidation fills
 *               at the open price.
 *   'extreme' — at the bar's adverse extreme (low for longs, high for
 *               shorts), liquidation fills at the extreme itself — the
 *               pessimistic broker model (intra-bar tick order unknown).
 *   'close'   — at the bar's close, after all exits: if the (possibly
 *               already-trimmed) position still breaches at the closing
 *               price, another partial liquidation fills at the close.
 *               Evidence: 2021-10-01 (profit QA) shows TWO same-bar MC
 *               prices — 4×cover at the high, then a further 0.263108
 *               at 48,147.38 (the close).
 *
 * TV checks margin along the path, interleaved with exit fills — proven
 * by the MC-ordering probe (BTCUSDT 1D, 2026-02-05): a 5-lot short
 * entered at the open was split within one bar into MC 0.00228 at the
 * OPEN price, MC 0.0888 at the high, then a TP fill of 4.90892 at the
 * lows. The caller orders the 'extreme' checkpoint BEFORE exit
 * processing on adverse-first bars and AFTER it on favorable-first bars
 * (favorable exits free margin before the adverse extreme is reached).
 *
 * Runs for ALL margin percentages including 100%. At 100% margin the
 * trader still needs full notional collateral; adverse price movement
 * that drops account equity below the position's current notional
 * triggers a margin call. This matches TV's broker-emulator behavior
 * (the "Margin calls" stat in the Strategy Tester is non-zero on 100%
 * margin runs whenever a position's mark-to-market loss exceeds equity).
 */
export function processMarginCall(context: any, checkpoint: 'open' | 'extreme' | 'favorable' | 'close' = 'extreme'): boolean {
    const strategy: StrategyState = context.strategy;
    if (!strategy || strategy.opentrades.length === 0) return false;

    const positionDir = Math.sign(strategy.position_size);
    if (positionDir === 0) return false;

    const marginPct = positionDir === 1 ? (strategy.config.margin_long ?? 100) : (strategy.config.margin_short ?? 100);
    // Margin 0 disables the margin model: no margin call, even with negative equity.
    if (!(marginPct > 0)) return false;
    // Nor after a risk rule stopped the strategy for good (TV, case "20": twice the position held
    // to the end, far below margin, never margin-called).
    if ((strategy as any)._risk?.haltedFrom !== undefined) return false;

    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;

    // 'favorable' is the bar's other extreme: a margin call's own commission can leave the account
    // short there too (TV, cash_per_order 20: calls at the high, then at the low, of one bar).
    const adversePrice =
        checkpoint === 'open'
            ? openPrice
            : checkpoint === 'close'
              ? closePrice
              : (checkpoint === 'favorable') === (positionDir === 1)
                ? highPrice
                : lowPrice;
    // A checkpoint the bar's path reached before an entry filled inside the bar is not checked: the
    // position did not hold there (TV: a sell stop filled on the way down from the high is checked at
    // the low and the close, not at the open or the high).
    const checkpointAt = checkpoint === 'open' ? 0 : checkpoint === 'close' ? 3 : barPath(openPrice, highPrice, lowPrice, closePrice)[1] === adversePrice ? 1 : 2;
    const seg = context._excSeg;
    const marginFrom = (strategy as any)._marginFrom;
    if (marginFrom?.idx === context.idx && (seg ? seg.offset + checkpointAt * seg.scale : checkpointAt) < marginFrom.at - 1e-9) return false;

    const totalQty = Math.abs(strategy.position_size);
    const equityAtAdverse = computeEquityAtPrice(context, adversePrice);
    const requiredMarginAtAdverse = computeRequiredMargin(totalQty, adversePrice, marginPct, pointValue);

    if (equityAtAdverse < requiredMarginAtAdverse) {
        // PARTIAL liquidation (TV broker-emulator rule): compute the margin
        // deficit at the adverse extreme, convert it to contracts at that
        // price, and liquidate 4× that amount — the 4× buffer prevents the
        // trimmed position from being immediately margin-called again on
        // the next tick. The remainder of the position stays open. Capped
        // at the full position size for catastrophic deficits.
        //
        // Verified against TV xlsx exports (MACD/BTCUSDT 1D, 100% margin):
        // TV liquidated 1.21312 of a 5-contract short (deficit $33,603.64
        // at price 110,797.38 → 4 × 0.30328) and 0.48244 of another
        // (deficit $10,924.98 at 90,574.00 → 4 × 0.12061).
        const deficit = requiredMarginAtAdverse - equityAtAdverse;
        // The cover is floored to the symbol's quantity step (syminfo.mincontract)
        // BEFORE the 4× multiplier, so a liquidation is always 4 whole steps per
        // step of cover (or the whole position). A fixed 5-decimal floor fitted
        // BTCUSDT (step 0.00001) but not symbols with a finer step, which is why
        // the step comes from syminfo.
        //
        // The marginPct/100 divisor matters below 100%: TV liquidates
        // 4×deficit/(price·m) — verified exactly on fresh TV captures at
        // margin_long/short = 50 (close-MC investigation, 2026-06-12).
        const marginFrac = marginPct / 100;
        // A cover smaller than one step liquidates one unit (TV: 1 share of 159 on AAPL, 1 ES contract of
        // 2 or 4, 1.0 BTC of 1.75417), the whole position when it is smaller.
        const coverQty = floorQty(context, deficit / (adversePrice * pointValue * marginFrac));
        const qtyToLiquidate = coverQty > 0 ? Math.min(totalQty, Number((4 * coverQty).toFixed(10))) : Math.min(totalQty, 1);

        // Remember the FIFO order before the close so we can identify the
        // PARTIALLY-consumed lot afterwards (the liquidation eats whole
        // lots from the front; the first lot still open afterwards is the
        // one it bit into).
        const fifoBefore = [...strategy.opentrades];
        const frontPiece = fifoBefore[0];
        const frontQty = Math.abs(frontPiece.size);
        const frontEntry = frontPiece.entry_price;

        // The liquidation is a market order: slippage applies against the position.
        setFillAt(context, checkpointAt);
        closePartialPosition(context, qtyToLiquidate, applySlippage(context, -positionDir, adversePrice), currentTime, {
            exitId: MARGIN_CALL_EXIT_ID,
            exitComment: 'Margin call',
            forced: true,
        });
        riskAfterMarginCall(context, adversePrice);

        // ---- Phantom re-check → SECOND margin call at the bar's CLOSE ----
        // TV broker-emulator behavior (reverse-engineered 2026-06-12,
        // exact on 6 TV-captured events incl. margin=50% and full-cap
        // variants; 122+ negative controls): when the margin call closed
        // the FIRST (oldest) FIFO piece ENTIRELY, TV re-evaluates the
        // margin condition in a transient state where that piece's margin
        // is freed and its unrealized PnL removed from equity, but its
        // realized PnL has NOT yet been booked. The residual deficit is
        //   D2 = D1 − p1·(p·m·pv) + u1,   u1 = p1·(p − e1)·dir·pv
        // (p1/e1 = first piece qty/entry, p = the adverse checkpoint
        // price, dir = +1 long / −1 short). If D2 > 0, a second margin
        // call q2 = min(remaining, 4·trunc6(D2/(p·m·pv))) fires — FILLED
        // AT THE BAR'S CLOSE and booked AFTER the script's on-close
        // evaluation, so the script (and any order it queues this bar)
        // still sees the pre-MC#2 position. A reversal queued at that
        // close therefore overshoots by exactly q2 on the next bar (TV
        // xlsx 2021-10-02: reversal long 5.263108 = 5 + q2). Application
        // is deferred to the start of the next bar via
        // `_pending_close_mc` (see applyPendingCloseMarginCall).
        //
        // Single-piece margin calls can never fire this (D2 < 0
        // algebraically) — only calls that consume the whole front piece
        // and span into deeper lots qualify, and even then rarely.
        if (checkpoint === 'extreme' && qtyToLiquidate >= frontQty - 1e-9 && Math.abs(strategy.position_size) > 1e-9) {
            const freedMargin = computeRequiredMargin(frontQty, adversePrice, marginPct, pointValue);
            const u1 = frontQty * (adversePrice - frontEntry) * positionDir * pointValue;
            const d2 = deficit - freedMargin + u1;
            if (d2 > 0) {
                const closeP = Series.from(context.data.close).get(0);
                const trunc6 = (x: number) => Math.trunc(x * 1e6) / 1e6;
                const cover2 = trunc6(d2 / (adversePrice * pointValue * marginFrac));
                const q2 = Math.min(Math.abs(strategy.position_size), 4 * cover2);
                if (q2 > 1e-9) {
                    (strategy as any)._pending_close_mc = {
                        qty: q2,
                        price: closeP,
                        time: currentTime,
                        dir: positionDir,
                    };
                }
            }
        }

        // TV broker-emulator rule (QA evidence): a margin call CANCELS all
        // working exit brackets for the rest of the bar EXCEPT the bracket
        // of the lot it partially consumed. The canceled lots get fresh
        // brackets from the next strategy.exit call (next bar).
        // Evidence: 2024-08-03 (avg_price QA) — after MC 0.59552 at the
        // high, the shared TP at 59,954 filled ONLY the touched lot's
        // remainder 4.40448; the other covered lot exited next day at the
        // refreshed level. Same split on 2021-05-16 (profit QA: only the
        // MC-touched lot's TP filled same-bar, untouched lots filled next
        // day at their own levels) and on the MC-probe triple bar
        // 2026-02-05 (the only lot was the touched one → its TP filled).
        const survivor = fifoBefore.find((t) => t.status === 'open');
        (strategy as any)._mc_exit_lock = { bar: context.idx, tradeId: survivor?.id ?? null };
        return true;
    }
    return false;
}

/**
 * The broker's fills on the bar held in context.data (before the script runs): closes and entries
 * at the open, then the margin checkpoints and the intrabar exits along the bar's path.
 */
export function processBarOrders(context: any): void {
    if (context.strategy) (context.strategy as any)._openFills = { idx: context.idx, start: context.strategy.position_size, buys: 0, sells: 0, real: [] };
    if (context.strategy?.risk_rules?.max_intraday_loss) riskOpenFills(context);
    // The account where the market orders filling at this open were placed: the previous close (a
    // calc_on_order_fills segment after the first: its starting point), for their margin check.
    if (context.strategy) {
        const seg = context._excSeg;
        const at = seg && seg.scale > 0 ? Series.from(context.data.open).get(0) : Series.from(context.data.close).get(1);
        if (Number.isFinite(at)) (context.strategy as any)._placement = { idx: context.idx, price: at, equity: computeEquityAtPrice(context, at) };
    }
    // strategy.close / close_all market orders fill at the open ahead of entries (see
    // processExitOrders' 'market' phase).
    processExitOrders(context, 'market');
    processStrategyOrders(context);
    // Margin checkpoints along the intra-bar path (TV broker emulator): first at the OPEN right
    // after entries fill; then at the adverse extreme — BEFORE exit fills when the bar's first move
    // is adverse for the position (the extreme precedes the favorable exits on the path), AFTER them
    // otherwise (favorable exits free margin first). The 'extreme' checkpoint may schedule a
    // deferred second margin call at this bar's close (phantom re-check).
    processMarginCall(context, 'open');
    // An exit reached before the adverse extreme fills before that margin check.
    const adverseFirst = isAdverseFirstBar(context) && !exitBeforeAdverseExtreme(context);
    // strategy.risk.max_intraday_loss is checked at the adverse extreme before the margin is (TV
    // closes under the risk rule, then has nothing to margin-call).
    if (adverseFirst) {
        riskEndOfBarFills(context);
        processMarginCall(context, 'extreme');
    }
    processExitOrders(context, 'intrabar');
    processDeferredEntries(context);
    processMarginCall(context, 'favorable');
    if (!adverseFirst) {
        riskEndOfBarFills(context);
        processMarginCall(context, 'extreme');
    }
    if (context.strategy) flushOpenFills(context.strategy);
}

/**
 * End-of-bar finalize: refresh equity at CLOSE and latch
 * `strategy.max_drawdown` / `strategy.max_runup` using the bar's H/L. Runs
 * UNCONDITIONALLY once per bar (after entry+exit fills are done), regardless
 * of whether the strategy uses exit orders.
 */
export function finalizeStrategyBar(context: any): void {
    if (!context.strategy) return;
    const strategy: StrategyState = context.strategy;
    const closePrice = Series.from(context.data.close).get(0);
    markToMarket(context, closePrice);
    if (context._exc?.bar !== context.idx) beginStrategyBar(context);
    excEndBar(context);
    excReplay(context);
    if (context._exc?.bar === context.idx) context._exc.finalized = true;

    // Record the MARK-TO-MARKET equity at each calendar month's last bar,
    // for the end-of-run Sharpe / Sortino ratios (see
    // finalizeStrategyRun). TV samples the equity curve monthly regardless
    // of the chart timeframe; we keep the last bar's equity per UTC
    // calendar month (overwrite within a month, append on rollover).
    const barTime = Series.from(context.data.openTime).get(0);
    if (Number.isFinite(barTime)) {
        const d = new Date(barTime);
        const monthKey = d.getUTCFullYear() * 12 + d.getUTCMonth();
        const series = (strategy._monthly_equity ??= []);
        if (strategy._last_month_key === monthKey && series.length > 0) {
            series[series.length - 1] = strategy.equity;
        } else {
            series.push(strategy.equity);
            strategy._last_month_key = monthKey;
        }
    }
}

/**
 * End-of-run finalize: compute the risk-adjusted performance ratios
 * (Sharpe / Sortino) from the monthly equity curve captured during the
 * run. Called ONCE after the last bar (see PineTS.class.ts).
 *
 * TV broker-emulator formula (confirmed against the Help Center docs and
 * reverse-engineered to the third decimal across 7 QA datasets,
 * 2026-06-15):
 *   - Sample the MARK-TO-MARKET equity at each calendar month's close.
 *   - Monthly simple returns rᵢ = Eᵢ / Eᵢ₋₁ − 1, anchored at the initial
 *     capital (the first return runs from initial_capital to month 1).
 *   - MR = mean(rᵢ);  RFR = risk_free_rate / 100 / 12 (annual % → monthly).
 *   - Sharpe  = (MR − RFR) / SD,  SD = √(Σ(rᵢ − MR)² / N)   (population).
 *   - Sortino = (MR − RFR) / DD,  DD = √(Σ min(0, rᵢ − RFR)² / N)
 *     (downside deviation over ALL N returns, target = RFR — per TV's
 *     documented DD = sqrt(sum(min(0, Xᵢ − T))² / N)).
 *   - No annualization.
 *
 * Note: the ratios are only as accurate as the bar-by-bar equity path;
 * they ride on the strategy engine's mark-to-market fidelity. With < 2
 * monthly returns (very short backtests) they are left at 0.
 */
export function finalizeStrategyRun(context: any): void {
    const strategy: StrategyState = context?.strategy;
    if (!strategy) return;

    // CAGR is independent of the monthly equity curve (it only needs the
    // first/last bar times and the realized P&L), so compute it before the
    // Sharpe / Sortino short-circuit below.
    strategy.cagr = computeCagr(context);

    // Buy-and-hold benchmark (independent of the monthly equity curve too).
    computeBuyAndHold(context);

    const series = strategy._monthly_equity ?? [];
    const equities = [strategy.initial_capital, ...series];
    const returns: number[] = [];
    for (let i = 1; i < equities.length; i++) {
        const prev = equities[i - 1];
        if (prev !== 0 && Number.isFinite(prev) && Number.isFinite(equities[i])) {
            returns.push(equities[i] / prev - 1);
        }
    }

    if (returns.length < 2) {
        strategy.sharpe_ratio = 0;
        strategy.sortino_ratio = 0;
        return;
    }

    const rfrMonthly = (strategy.config.risk_free_rate ?? 2) / 100 / 12;
    const n = returns.length;
    const mean = returns.reduce((s, r) => s + r, 0) / n;
    const excess = mean - rfrMonthly;

    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);

    const downsideSq = returns.reduce((s, r) => s + Math.min(0, r - rfrMonthly) ** 2, 0) / n;
    const dd = Math.sqrt(downsideSq);

    strategy.sharpe_ratio = sd > 0 ? excess / sd : 0;
    strategy.sortino_ratio = dd > 0 ? excess / dd : 0;
}

/**
 * Compound Annual Growth Rate (%) of strategy equity over the full backtest
 * window. Mirrors the LuxAlgo `cagr()` Pine helper applied to the strategy
 * leg: entry = (firstBarTime, initial_capital), exit = (lastBarTime,
 * initial_capital + netprofit).
*
*   daysBetween = (lastBarTime − firstBarTime) / MS_IN_ONE_DAY
*   years       = daysBetween / 365
*   CAGR%       = 100 × ((exit / entry) ^ (1 / years) − 1)
*
* The window spans the FIRST to the LAST loaded bar's open time (Pine's
* `var int firstTime = time` latched on bar 0, and `last_bar_time`). With a
* span under one day, or non-finite capital figures, the result is NaN —
* matching the Pine helper's `na` branch.
*/
const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;

function computeCagr(context: any): number {
    const strategy: StrategyState = context?.strategy;
    if (!strategy) return NaN;

    const candles = context?.marketData;
    if (!Array.isArray(candles) || candles.length === 0) return NaN;

    const firstTime = candles[0]?.openTime;
    const lastTime = candles[candles.length - 1]?.openTime;
    if (!Number.isFinite(firstTime) || !Number.isFinite(lastTime)) return NaN;

    const entryPrice = strategy.initial_capital ?? 0;
    const exitPrice = entryPrice + (strategy.netprofit ?? 0);
    const daysBetween = (lastTime - firstTime) / MS_IN_ONE_DAY;
    if (daysBetween < 1 || !Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || entryPrice === 0) {
        return NaN;
    }

    const years = daysBetween / 365;
    return 100 * (Math.pow(exitPrice / entryPrice, 1 / years) - 1);
}

/**
 * Buy-and-hold benchmark statistics (TV's "Buy & Hold Return" report).
 *
 * Models a single long position bought with the ENTIRE initial capital at the
 * FIRST trade's entry price and held open through the last bar:
 *   - The anchor (price_start) is strategy._first_entry_price — the first
 *     trade's fill price, with slippage ALREADY applied by the engine. This
 *     is why the benchmark is affected by the slippage property.
 *   - The position is never sold (always open), so there is no exit leg:
 *     commissions never apply and price_end carries no slippage.
 *   - price_end is the last bar's close.
 *
 *   qty                     = initial_capital / price_start
 *   buy_and_hold_pnl        = qty × (price_end − price_start)
 *                           = initial_capital × (price_end − price_start) / price_start
 *   buy_and_hold_per_gain   = (price_end − price_start) / price_start × 100
 *   strategy_outperformance = netprofit − buy_and_hold_pnl
 *
 * Left at NaN when no trade ever opened (no entry price to anchor on) or the
 * figures are non-finite.
 */
function computeBuyAndHold(context: any): void {
    const strategy: StrategyState = context?.strategy;
    if (!strategy) return;

    const priceStart = strategy._first_entry_price;
    const candles = context?.marketData;
    const priceEnd = Array.isArray(candles) && candles.length > 0 ? candles[candles.length - 1]?.close : NaN;

    if (!Number.isFinite(priceStart) || !Number.isFinite(priceEnd) || (priceStart as number) === 0) {
        strategy.buy_and_hold_pnl = NaN;
        strategy.buy_and_hold_per_gain = NaN;
        strategy.strategy_outperformance = NaN;
        return;
    }

    const start = priceStart as number;
    const ratio = (priceEnd - start) / start;
    strategy.buy_and_hold_per_gain = ratio * 100;
    strategy.buy_and_hold_pnl = (strategy.initial_capital ?? 0) * ratio;
    strategy.strategy_outperformance = (strategy.netprofit ?? 0) - strategy.buy_and_hold_pnl;
}

/**
 * Update strategy metrics
 */
function updateStrategyMetrics(context: any): void {
    const strategy: StrategyState = context.strategy;

    // Net profit is already calculated when trades close.
    // Equity is updated with unrealized P&L.
    // Equity-curve peaks (max_drawdown / max_runup) and aggregate
    // win/loss stats are deferred to a later pass when those scalar
    // getters are implemented.
    void strategy;
}

/**
 * Initialize strategy state
 */
export function initializeStrategy(context: any, config: any): void {
    const defaults = {
        title: '',
        shorttitle: '',
        overlay: false,
        format: 'inherit',
        precision: 10,
        scale: 'right',
        pyramiding: 1,
        calc_on_order_fills: false,
        calc_on_every_tick: false,
        max_bars_back: 0,
        backtest_fill_limits_assumption: 0,
        default_qty_type: 'fixed',
        default_qty_value: 1,
        initial_capital: 1000000,
        currency: 'USD',
        slippage: 0,
        commission_type: 'percent',
        commission_value: 0,
        margin_long: 100,
        margin_short: 100,
        explicit_plot_zorder: false,
        max_lines_count: 50,
        max_labels_count: 50,
        max_boxes_count: 50,
        max_polylines_count: 50,
        risk_free_rate: 2,
        use_bar_magnifier: false,
        fill_orders_on_standard_ohlc: false,
    };

    // Layer order: spec defaults ← source call args ← user .prop overrides (latest wins).
    const given = { ...config, ...(context._propOverrides ?? {}) };
    // Pine v5 defaults to no margin model (margin 0) where v6 defaults to 100%: a v5 strategy sized at
    // 150% of equity trades on TradingView, where margin 100% rejects every order.
    const v5Margins = context.pineVersion === 5 ? { margin_long: 0, margin_short: 0 } : {};
    const finalConfig = { ...defaults, ...v5Margins, ...given };
    const initialCapital = finalConfig.initial_capital;
    // Without `currency`, the account currency is the symbol's (TV: USDT on BINANCE:BTCUSDT).
    const accountCurrency = given.currency || context.pine?.syminfo?.currency || finalConfig.currency || 'USD';

    context.strategy = {
        config: finalConfig,

        // Trade collections
        opentrades: [],
        closedtrades: [],
        pending_orders: [],

        // Flat position scalars
        position_size: 0,
        position_avg_price: NaN, // Pine returns NaN when flat
        position_entry_name: '',

        // Account info
        initial_capital: initialCapital,
        account_currency: accountCurrency,
        equity: initialCapital,
        netprofit: 0,
        grossprofit: 0,
        grossloss: 0,
        openprofit: 0,

        // Peaks
        max_drawdown: 0,
        max_runup: 0,
        equity_peak: initialCapital,
        equity_trough: initialCapital,
        equity_at_runup_peak: initialCapital,
        equity_at_drawdown_peak: initialCapital,
        max_drawdown_percent_value: 0,
        max_runup_percent_value: 0,

        // Risk-adjusted ratios (computed at end-of-run) + their internal
        // monthly-equity accumulator.
        sharpe_ratio: 0,
        sortino_ratio: 0,
        cagr: NaN,

        // Buy-and-hold benchmark (computed at end-of-run; NaN until then).
        buy_and_hold_pnl: NaN,
        buy_and_hold_per_gain: NaN,
        strategy_outperformance: NaN,
        _first_entry_price: undefined,

        _monthly_equity: [],
        _last_month_key: -1,

        // Trade-stat counters
        wintrades: 0,
        losstrades: 0,
        eventrades: 0,
        wintrades_total_profit: 0,
        losstrades_total_loss: 0,

        // Position-size peaks
        max_contracts_held_all: 0,
        max_contracts_held_long: 0,
        max_contracts_held_short: 0,

        // Risk-management rules (configured via strategy.risk.*)
        risk_rules: {},
        risk_halted: false,
    };
}

/**
 * Deep-clone a plain-data value (primitives, arrays, plain objects, Map).
 * Strategy state holds only plain data — Trade/Order/ledger rows are object
 * literals, and the few Maps hold plain values — so this covers
 * every field without a structuredClone dependency.
 */
function clonePlainValue<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(clonePlainValue) as unknown as T;
    }
    if (value instanceof Map) {
        const copy = new Map();
        value.forEach((v, k) => copy.set(k, clonePlainValue(v)));
        return copy as unknown as T;
    }
    if (value !== null && typeof value === 'object') {
        const copy: any = {};
        for (const key of Object.keys(value)) {
            copy[key] = clonePlainValue((value as any)[key]);
        }
        return copy;
    }
    return value;
}

/**
 * Snapshot the full strategy ledger for streaming rollback.
 *
 * Iterates the ACTUAL own keys of the state object instead of a hand-kept
 * field list, so internal fields written via `(strategy as any)`
 * (`_ledger_entries`, `_mc_exit_lock`, `_pending_close_mc`, ...) are covered
 * even though they are absent from the StrategyState type.
 *
 * Two fields get special treatment:
 *   - `config`: skipped — rebuilt by `strategy.any()` on every script
 *     evaluation, so the live value is always current.
 *   - `closedtrades`: length-only. The array is append-only (single write
 *     site: the `push` in closePartialPosition) and rows are fresh literals
 *     never mutated afterwards, so truncation restores it exactly. This
 *     keeps the snapshot O(open state), not O(backtest length).
 *
 * Returns null for indicator contexts (no strategy declared).
 */
export function snapshotStrategyState(strategy: StrategyState | undefined): any | null {
    if (!strategy) return null;
    const fields: Record<string, any> = {};
    for (const key of Object.keys(strategy)) {
        if (key === 'config' || key === 'closedtrades') continue;
        fields[key] = clonePlainValue((strategy as any)[key]);
    }
    return { fields, closedtradesLength: strategy.closedtrades.length };
}

/**
 * Restore the strategy ledger from a snapshotStrategyState() snapshot.
 *
 * MUTATES the existing state object in place — `Context.strategy` is public
 * and documented as "the same object every getter reads from", so its
 * identity must never change. The snapshot may be applied many times (once
 * per streaming tick), so values are cloned OUT of it: handing the live
 * state the snapshot's own arrays would let the next re-execution corrupt
 * the restore point.
 *
 * Keys added to the state after the snapshot was taken (i.e. during a
 * discarded execution of the forming bar) are deleted.
 */
export function restoreStrategyState(strategy: StrategyState | undefined, snapshot: any | null): void {
    if (!strategy || !snapshot) return;

    for (const key of Object.keys(strategy)) {
        if (key === 'config' || key === 'closedtrades') continue;
        if (!Object.prototype.hasOwnProperty.call(snapshot.fields, key)) {
            delete (strategy as any)[key];
        }
    }

    if (strategy.closedtrades.length > snapshot.closedtradesLength) {
        strategy.closedtrades.length = snapshot.closedtradesLength;
    }

    for (const key of Object.keys(snapshot.fields)) {
        (strategy as any)[key] = clonePlainValue(snapshot.fields[key]);
    }
}
