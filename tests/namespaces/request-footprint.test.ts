import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import type { FootprintBar } from '../../src/marketData/types';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture: 6 one-minute bars, syminfo.mintick = 0.5. Footprint data exists for
// bars 1..4 only (bar 0 and the last bar have none → `na`).
//
// Bar 2 is the hand-computed reference. With ticks_per_row = 2 (row = 1.0):
//
//   level 100.0  b10 s5  ┐
//   level 100.5  b20 s5  ┘ row0 [100,101)  buy 30  sell 10  total 40
//   level 101.0  b5  s40 ┐
//   level 101.5  b0  s10 ┘ row1 [101,102)  buy  5  sell 50  total 55
//   level 102.0  b60 s6    row2 [102,103)  buy 60  sell  6  total 66  ← POC
//   (no level)             row3 [103,104)  buy  0  sell  0  total  0
//   level 104.5  b20 s1    row4 [104,105)  buy 20  sell  1  total 21
//
//   totals: buy 115, sell 67, total 182, delta 48
//   The candle spans low 101 .. high 105, so the rows (100..104) already cover it.
//   VA 70% (target 127.4): start row2 (66), remaining 61.4 → row1 below (55) beats
//   row3 above (0) and fits → remaining 6.4 → row0 below (40) beats row3 (0) but
//   would exceed → stop  ⇒  VAL = row1, VAH = row2 (TV's rule: never cross the target)
//   imbalance 300%: row2 sell 6 ≥ 3 × buys[row3]=0 → sell imbalance;
//                   row4 buy 20 ≥ 3 × sells[row3]=0 → buy imbalance; nothing else.
//
//   Bars 1, 3, 4 carry ONE level; their rows still span the candle's low..high
//   (e.g. bar 1: low 100.5 .. high 104.5 → rows 100..104 → 5 rows).
// ─────────────────────────────────────────────────────────────────────────────

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

function makeCandle(i: number) {
    const close = 102 + i * 0.5;
    return { openTime: T0 + i * MINUTE, closeTime: T0 + (i + 1) * MINUTE, open: close - 0.5, high: close + 2, low: close - 2, close, volume: 100 };
}

const REFERENCE_LEVELS = [
    { price: 100.0, buyVolume: 10, sellVolume: 5 },
    { price: 100.5, buyVolume: 20, sellVolume: 5 },
    { price: 101.0, buyVolume: 5, sellVolume: 40 },
    { price: 101.5, buyVolume: 0, sellVolume: 10 },
    { price: 102.0, buyVolume: 60, sellVolume: 6 },
    { price: 104.5, buyVolume: 20, sellVolume: 1 },
];

/** Footprints for bars 1..4; bar 2 carries the reference levels, the others a single level. */
function makeFootprints(): FootprintBar[] {
    return [1, 2, 3, 4].map((i) => ({
        openTime: T0 + i * MINUTE,
        tick: 0.5,
        levels: i === 2 ? REFERENCE_LEVELS : [{ price: 100 + i, buyVolume: i * 10, sellVolume: i }],
    }));
}

function makeProvider(candles: any[], footprints: FootprintBar[] | null, log: any[] = []) {
    return {
        getMarketData: async (_t: string, _tf: string, _limit?: number, sDate?: number) =>
            sDate === undefined ? candles : candles.filter((c) => c.openTime >= sDate),
        getSymbolInfo: async () => ({ ticker: 'TEST', tickerid: 'TEST', mintick: 0.5, pricescale: 2, minmove: 1, timezone: 'UTC', session: '24x7' }),
        ...(footprints
            ? {
                  getFootprintData: async (ticker: string, tf: string, limit?: number, sDate?: number, eDate?: number) => {
                      log.push({ ticker, tf, limit, sDate, eDate });
                      return footprints.filter((b) => (sDate === undefined || b.openTime >= sDate) && (eDate === undefined || b.openTime < eDate));
                  },
              }
            : {}),
    };
}

const last = (arr: any[]) => arr[arr.length - 1];
const nth = (ctx: any, key: string, i: number) => ctx.result[key][i];

describe('request.footprint — bar-level aggregates', () => {
    it('sums buy/sell volume, total and delta over the bar, and is na where the source has no bar', async () => {
        const candles = Array.from({ length: 6 }, (_, i) => makeCandle(i));
        const log: any[] = [];
        const pine = new PineTS(makeProvider(candles, makeFootprints(), log) as any, 'TEST', '1');
        await pine.ready();

        const ctx = await pine.run(($: any) => {
            const { request, footprint, na } = $.pine;
            const fp = request.footprint(2, 70, 300);
            const missing = na(fp);
            const buy = missing ? NaN : footprint.buy_volume(fp);
            const sell = missing ? NaN : footprint.sell_volume(fp);
            const total = missing ? NaN : footprint.total_volume(fp);
            const delta = missing ? NaN : footprint.delta(fp);
            return { missing, buy, sell, total, delta };
        });

        expect(ctx.result.missing).toEqual([true, false, false, false, false, true]);
        expect(nth(ctx, 'buy', 2)).toBe(115);
        expect(nth(ctx, 'sell', 2)).toBe(67);
        expect(nth(ctx, 'total', 2)).toBe(182);
        expect(nth(ctx, 'delta', 2)).toBe(48);
        // One request for the whole loaded history, sized like the kline load.
        expect(log).toHaveLength(1);
        expect(log[0]).toMatchObject({ ticker: 'TEST', tf: '1', limit: 6, sDate: T0, eDate: T0 + 6 * MINUTE });
    });

    it('returns na on every bar (with a single warning) when the source has no footprint surface', async () => {
        const candles = Array.from({ length: 4 }, (_, i) => makeCandle(i));
        const pine = new PineTS(makeProvider(candles, null) as any, 'TEST', '1');
        await pine.ready();

        const ctx = await pine.run(($: any) => {
            const { request, footprint, na } = $.pine;
            const fp = request.footprint(2);
            const missing = na(fp);
            return { missing };
        });

        expect(ctx.result.missing).toEqual([true, true, true, true]);
        expect(ctx.warnings.filter((w: any) => w.method === 'request.footprint')).toHaveLength(1);
    });
});

describe('request.footprint — rows, POC, value area, imbalances', () => {
    async function runReference(script: (pine: any) => any) {
        const candles = Array.from({ length: 6 }, (_, i) => makeCandle(i));
        const pine = new PineTS(makeProvider(candles, makeFootprints()) as any, 'TEST', '1');
        await pine.ready();
        return pine.run(script);
    }

    it('bins levels into ticks_per_row × mintick rows, contiguous from the lowest to the highest level', async () => {
        const ctx = await runReference(($: any) => {
            const { request, footprint, volume_row, array, na } = $.pine;
            const fp = request.footprint(2);
            let n = NaN;
            let r0_down = NaN;
            let r0_up = NaN;
            let r0_buy = NaN;
            let r0_sell = NaN;
            let r0_total = NaN;
            let r1_delta = NaN;
            let r3_total = NaN;
            let r4_down = NaN;
            let r4_up = NaN;
            if (!na(fp)) {
                const rows = footprint.rows(fp);
                n = array.size(rows);
                const r0 = array.get(rows, 0);
                r0_down = volume_row.down_price(r0);
                r0_up = volume_row.up_price(r0);
                r0_buy = volume_row.buy_volume(r0);
                r0_sell = volume_row.sell_volume(r0);
                r0_total = volume_row.total_volume(r0);
                if (n > 4) {
                    const r1 = array.get(rows, 1);
                    const r3 = array.get(rows, 3);
                    r1_delta = volume_row.delta(r1);
                    const r4 = array.get(rows, 4);
                    r3_total = volume_row.total_volume(r3);
                    r4_down = volume_row.down_price(r4);
                    r4_up = volume_row.up_price(r4);
                }
            }
            return { n, r0_down, r0_up, r0_buy, r0_sell, r0_total, r1_delta, r3_total, r4_down, r4_up };
        });

        expect(nth(ctx, 'n', 2)).toBe(5);
        expect(nth(ctx, 'r0_down', 2)).toBe(100);
        expect(nth(ctx, 'r0_up', 2)).toBe(101);
        expect(nth(ctx, 'r0_buy', 2)).toBe(30);
        expect(nth(ctx, 'r0_sell', 2)).toBe(10);
        expect(nth(ctx, 'r0_total', 2)).toBe(40);
        expect(nth(ctx, 'r1_delta', 2)).toBe(-45);
        // The empty row between 102-103 and 104-105 exists with zero volume.
        expect(nth(ctx, 'r3_total', 2)).toBe(0);
        expect(nth(ctx, 'r4_down', 2)).toBe(104);
        expect(nth(ctx, 'r4_up', 2)).toBe(105);
        // A single-level bar still spans its candle (low 100.5 .. high 104.5 → 5 rows);
        // bars without data yield na.
        expect(nth(ctx, 'n', 1)).toBe(5);
        expect(nth(ctx, 'n', 0)).toBeNaN();
    });

    it('finds the POC and the value area boundaries', async () => {
        const ctx = await runReference(($: any) => {
            const { request, footprint, volume_row, na } = $.pine;
            const fp = request.footprint(2, 70);
            let poc_down = NaN;
            let poc_total = NaN;
            let vah_up = NaN;
            let val_down = NaN;
            if (!na(fp)) {
                const poc = footprint.poc(fp);
                poc_down = volume_row.down_price(poc);
                poc_total = volume_row.total_volume(poc);
                vah_up = volume_row.up_price(footprint.vah(fp));
                val_down = volume_row.down_price(footprint.val(fp));
            }
            return { poc_down, poc_total, vah_up, val_down };
        });

        expect(nth(ctx, 'poc_down', 2)).toBe(102);
        expect(nth(ctx, 'poc_total', 2)).toBe(66);
        // The value area never crosses the 70 % target: rows 1..2 (55 + 66 = 121 ≤ 127.4);
        // the next larger neighbour, row0 (40), would exceed it and ends the area.
        expect(nth(ctx, 'vah_up', 2)).toBe(103);
        expect(nth(ctx, 'val_down', 2)).toBe(101);
    });

    it('flags diagonal imbalances against the imbalance_percent of the request', async () => {
        const ctx = await runReference(($: any) => {
            const { request, footprint, volume_row, array, na } = $.pine;
            const fp = request.footprint(2, 70, 300);
            let buy = '';
            let sell = '';
            if (!na(fp)) {
                const rows = footprint.rows(fp);
                for (let i = 0; i < array.size(rows); i++) {
                    const row = array.get(rows, i);
                    buy = buy + (volume_row.has_buy_imbalance(row) ? '1' : '0');
                    sell = sell + (volume_row.has_sell_imbalance(row) ? '1' : '0');
                }
            }
            return { buy, sell };
        });

        expect(nth(ctx, 'buy', 2)).toBe('00001');
        expect(nth(ctx, 'sell', 2)).toBe('00100');
    });

    it('lowers the imbalance bar when imbalance_percent is 100', async () => {
        const ctx = await runReference(($: any) => {
            const { request, footprint, volume_row, array, na } = $.pine;
            const fp = request.footprint(2, 70, 100);
            let buy = '';
            let sell = '';
            if (!na(fp)) {
                const rows = footprint.rows(fp);
                for (let i = 0; i < array.size(rows); i++) {
                    const row = array.get(rows, i);
                    buy = buy + (volume_row.has_buy_imbalance(row) ? '1' : '0');
                    sell = sell + (volume_row.has_sell_imbalance(row) ? '1' : '0');
                }
            }
            return { buy, sell };
        });

        // ratio 1: row2 buy 60 ≥ sells[row1] 50; row4 buy 20 ≥ 0
        //          row0 sell 10 ≥ buys[row1] 5; row2 sell 6 ≥ 0
        expect(nth(ctx, 'buy', 2)).toBe('00101');
        expect(nth(ctx, 'sell', 2)).toBe('10100');
    });

    it('resolves a price to the row whose [down_price, up_price) range contains it', async () => {
        const ctx = await runReference(($: any) => {
            const { request, footprint, volume_row, na } = $.pine;
            const fp = request.footprint(2);
            let inside = NaN;
            let lowEdge = NaN;
            let topRow = NaN;
            let emptyRow = NaN;
            let above = false;
            let below = false;
            if (!na(fp)) {
                // Other bars span other prices, where a lookup can be na.
                const rInside = footprint.get_row_by_price(fp, 101.7);
                const rLow = footprint.get_row_by_price(fp, 100);
                const rTop = footprint.get_row_by_price(fp, 104.99);
                const rEmpty = footprint.get_row_by_price(fp, 103.2);
                inside = na(rInside) ? NaN : volume_row.down_price(rInside);
                lowEdge = na(rLow) ? NaN : volume_row.down_price(rLow);
                topRow = na(rTop) ? NaN : volume_row.down_price(rTop);
                emptyRow = na(rEmpty) ? NaN : volume_row.total_volume(rEmpty);
                above = na(footprint.get_row_by_price(fp, 105));
                below = na(footprint.get_row_by_price(fp, 99.9));
            }
            return { inside, lowEdge, topRow, emptyRow, above, below };
        });

        expect(nth(ctx, 'inside', 2)).toBe(101);
        expect(nth(ctx, 'lowEdge', 2)).toBe(100);
        expect(nth(ctx, 'topRow', 2)).toBe(104);
        expect(nth(ctx, 'emptyRow', 2)).toBe(0);
        expect(nth(ctx, 'above', 2)).toBe(true);
        expect(nth(ctx, 'below', 2)).toBe(true);
    });

    it('breaks POC ties toward the middle of the footprint and value-area ties toward the POC, never crossing the target', async () => {
        // ticks_per_row = 1 → rows of 0.5; totals per row: 20, 30, 30, 20, 10 (sum 110).
        // The candle spans exactly these rows (low 100, high 102.5).
        const candles = [makeCandle(0), { ...makeCandle(1), low: 100, high: 102.5, open: 100.5, close: 102 }];
        const footprints: FootprintBar[] = [
            {
                openTime: T0 + MINUTE,
                levels: [
                    { price: 100.0, buyVolume: 10, sellVolume: 10 },
                    { price: 100.5, buyVolume: 15, sellVolume: 15 },
                    { price: 101.0, buyVolume: 15, sellVolume: 15 },
                    { price: 101.5, buyVolume: 10, sellVolume: 10 },
                    { price: 102.0, buyVolume: 5, sellVolume: 5 },
                ],
            },
        ];
        const pine = new PineTS(makeProvider(candles, footprints) as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.run(($: any) => {
            const { request, footprint, volume_row, array, na } = $.pine;
            const fp = request.footprint(1, 70);
            let n = NaN;
            let poc = NaN;
            let val = NaN;
            let vah = NaN;
            if (!na(fp)) {
                n = array.size(footprint.rows(fp));
                poc = volume_row.down_price(footprint.poc(fp));
                val = volume_row.down_price(footprint.val(fp));
                vah = volume_row.up_price(footprint.vah(fp));
            }
            return { n, poc, val, vah };
        });
        expect(last(ctx.result.n)).toBe(5);
        // POC: rows 1 and 2 tie at 30; the middle of the 5 rows is index 2 → row 101.0-101.5.
        expect(last(ctx.result.poc)).toBe(101);
        // VA (target 77): POC 30, remaining 47 → below (30) beats above (20) → remaining 17
        // → below (20) and above (20) tie, the row above is closer to the POC → 20 > 17 → stop.
        expect(last(ctx.result.val)).toBe(100.5);
        expect(last(ctx.result.vah)).toBe(101.5);
    });

    it('admits a value-area row that overshoots the target by less than 0.01 volume units, as TradingView does', async () => {
        // Rows of 0.5: 100.0 (40), 100.5 (POC, 50), 101.0 (v2). VA 70 %: after the POC, row 100.0 (40) is the
        // larger neighbour and lands 27 − 0.7·v2 over the target. TradingView admitted overshoots up to 0.00995
        // and refused them from 0.0101 (5,813 near-miss bars on BTC / ETH / SOL).
        const valOf = async (over: number) => {
            const v2 = (27 - over) / 0.7;
            const candles = [makeCandle(0), { ...makeCandle(1), low: 100, high: 101.5, open: 100.5, close: 101 }];
            const footprints: FootprintBar[] = [
                {
                    openTime: T0 + MINUTE,
                    levels: [
                        { price: 100.0, buyVolume: 40, sellVolume: 0 },
                        { price: 100.5, buyVolume: 50, sellVolume: 0 },
                        { price: 101.0, buyVolume: v2, sellVolume: 0 },
                    ],
                },
            ];
            const pine = new PineTS(makeProvider(candles, footprints) as any, 'TEST', '1');
            await pine.ready();
            const ctx = await pine.run(`//@version=6
indicator("va tolerance")
fp = request.footprint(1, 70)
plot(na(fp) ? na : fp.val().down_price(), "val")
plot(na(fp) ? na : fp.vah().up_price(), "vah")
`);
            return { val: ctx.plots['val'].data[1].value, vah: ctx.plots['vah'].data[1].value };
        };
        expect(await valOf(0.009)).toEqual({ val: 100, vah: 101 });
        expect(await valOf(0.011)).toEqual({ val: 100.5, vah: 101 });
    });

    it('an equidistant POC tie goes to the lower row and the value area stops before crossing the target', async () => {
        // ticks_per_row = 1 → rows of 0.5; totals: 20, 30, 30, 20 (sum 100), candle 100 .. 102.
        const candles = [makeCandle(0), { ...makeCandle(1), low: 100, high: 102, open: 100.5, close: 101.5 }];
        const footprints: FootprintBar[] = [
            {
                openTime: T0 + MINUTE,
                levels: [
                    { price: 100.0, buyVolume: 10, sellVolume: 10 },
                    { price: 100.5, buyVolume: 15, sellVolume: 15 },
                    { price: 101.0, buyVolume: 15, sellVolume: 15 },
                    { price: 101.5, buyVolume: 10, sellVolume: 10 },
                ],
            },
        ];
        const pine = new PineTS(makeProvider(candles, footprints) as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.run(($: any) => {
            const { request, footprint, volume_row, na } = $.pine;
            const fp = request.footprint(1, 70);
            let poc = NaN;
            let val = NaN;
            let vah = NaN;
            if (!na(fp)) {
                poc = volume_row.down_price(footprint.poc(fp));
                val = volume_row.down_price(footprint.val(fp));
                vah = volume_row.up_price(footprint.vah(fp));
            }
            return { poc, val, vah };
        });
        // Rows 1 and 2 are equidistant from the middle (1.5) → the lower one, 100.5-101.0.
        expect(last(ctx.result.poc)).toBe(100.5);
        // VA (target 70): POC 30, remaining 40 → above (30) beats below (20) → remaining 10
        // → 20 vs 20 tie, below is closer to the POC → 20 > 10 → stop. VA = rows 1..2 (60).
        expect(last(ctx.result.val)).toBe(100.5);
        expect(last(ctx.result.vah)).toBe(101.5);
    });
});

describe('request.footprint — Pine Script v6 syntax', () => {
    const plotAt = (ctx: any, title: string, i: number) => ctx.plots[title].data[i].value;

    async function runPine(source: string) {
        const candles = Array.from({ length: 6 }, (_, i) => makeCandle(i));
        const pine = new PineTS(makeProvider(candles, makeFootprints()) as any, 'TEST', '1');
        await pine.ready();
        return pine.run(source);
    }

    it('supports the typed declarations, method-call syntax and row iteration of the reference manual', async () => {
        const ctx = await runPine(`//@version=6
indicator("Footprint", overlay = true)
int ticks = input.int(2, "Ticks per row")
footprint fp = request.footprint(ticks, 70, 300)
float d = na
float pocUp = na
float vahUp = na
float valDown = na
int n = na
int buyImb = 0
int sellImb = 0
float rowAtClose = na
if not na(fp)
    d := fp.delta()
    volume_row poc = fp.poc()
    pocUp := poc.up_price()
    vahUp := fp.vah().up_price()
    valDown := fp.val().down_price()
    array<volume_row> rows = fp.rows()
    n := array.size(rows)
    for row in rows
        if row.has_buy_imbalance()
            buyImb += 1
        if row.has_sell_imbalance()
            sellImb += 1
    volume_row atClose = fp.get_row_by_price(101.5)
    rowAtClose := na(atClose) ? na : volume_row.total_volume(atClose)
plot(d, "d")
plot(pocUp, "pocUp")
plot(vahUp, "vahUp")
plot(valDown, "valDown")
plot(n, "n")
plot(buyImb, "buyImb")
plot(sellImb, "sellImb")
plot(rowAtClose, "rowAtClose")
`);
        expect(plotAt(ctx, 'd', 2)).toBe(48);
        expect(plotAt(ctx, 'pocUp', 2)).toBe(103);
        expect(plotAt(ctx, 'vahUp', 2)).toBe(103);
        expect(plotAt(ctx, 'valDown', 2)).toBe(101);
        expect(plotAt(ctx, 'n', 2)).toBe(5);
        expect(plotAt(ctx, 'buyImb', 2)).toBe(1);
        expect(plotAt(ctx, 'sellImb', 2)).toBe(1);
        expect(plotAt(ctx, 'rowAtClose', 2)).toBe(55);
        // Bars without data keep the na defaults.
        expect(plotAt(ctx, 'd', 0)).toBeNaN();
        expect(plotAt(ctx, 'n', 5)).toBeNaN();
        expect(plotAt(ctx, 'buyImb', 5)).toBe(0);
    });

    it('treats footprint ids as series (history access), supports typed na declarations, typed arrays and user methods', async () => {
        const ctx = await runPine(`//@version=6
indicator("Footprint types")
method doubledBuy(volume_row row) => row.buy_volume() * 2
var array<volume_row> pocs = array.new<volume_row>()
footprint fp = request.footprint(2)
footprint prev = fp[1]
footprint casted = na
volume_row rowCast = na
float prevDelta = na(prev) ? na : prev.delta()
float pocDoubled = na
if not na(fp)
    volume_row poc = fp.poc()
    array.push(pocs, poc)
    pocDoubled := poc.doubledBuy()
plot(prevDelta, "prevDelta")
plot(na(casted) ? 1 : 0, "castedNa")
plot(na(rowCast) ? 1 : 0, "rowCastNa")
plot(array.size(pocs), "pocs")
plot(pocDoubled, "pocDoubled")
`);
        // Bar 3 sees bar 2's footprint through fp[1].
        expect(plotAt(ctx, 'prevDelta', 3)).toBe(48);
        expect(plotAt(ctx, 'prevDelta', 1)).toBeNaN();
        expect(plotAt(ctx, 'castedNa', 2)).toBe(1);
        expect(plotAt(ctx, 'rowCastNa', 2)).toBe(1);
        // One POC pushed per bar with data (bars 1..4).
        expect(plotAt(ctx, 'pocs', 5)).toBe(4);
        expect(plotAt(ctx, 'pocDoubled', 2)).toBe(120);
    });

    it('rejects footprint(x) / volume_row(x): unlike line(x) or box(x), TradingView has no cast function for these types', async () => {
        await expect(runPine(`//@version=6\nindicator("cast")\nf = footprint(na)\nplot(na(f) ? 1 : 0)\n`)).rejects.toThrow(
            "Could not find function or function reference 'footprint'",
        );
        await expect(runPine(`//@version=6\nindicator("cast")\nr = volume_row(na)\nplot(na(r) ? 1 : 0)\n`)).rejects.toThrow(
            "Could not find function or function reference 'volume_row'",
        );
    });

    it('supports the reference-type usages of the type system: UDT fields, map / matrix / array elements, const and ternaries', async () => {
        const ctx = await runPine(`//@version=6
indicator("footprint type system")
type Snap
    footprint fp
    volume_row poc
pocOf(footprint x) => x.poc()
rowSpan(volume_row r) => r.up_price() - r.down_price()
const footprint fp = request.footprint(2)
footprint none = na
footprint picked = bar_index % 2 == 0 ? fp : none
var map<int, volume_row> pocs = map.new<int, volume_row>()
var matrix<volume_row> grid = matrix.new<volume_row>(0, 1)
var array<footprint> hist = array.new<footprint>()
float udtDelta = na
float fnSpan = na
float mapTotal = na
int nRows = na
float pickedDelta = na
if not na(fp)
    Snap s = Snap.new(fp, pocOf(fp))
    udtDelta := s.fp.delta()
    fnSpan := rowSpan(s.poc)
    pocs.put(bar_index, fp.poc())
    grid.add_row(grid.rows(), array.from(fp.vah()))
    hist.push(fp)
    mapTotal := pocs.get(bar_index).total_volume()
    int n = 0
    for [i, r] in fp.rows()
        n += 1
    nRows := n
if not na(picked)
    pickedDelta := picked.delta()
plot(udtDelta, "udtDelta")
plot(fnSpan, "fnSpan")
plot(mapTotal, "mapTotal")
plot(nRows, "nRows")
plot(pickedDelta, "pickedDelta")
plot(grid.rows(), "gridRows")
plot(hist.size(), "histSize")
`);
        expect(plotAt(ctx, 'udtDelta', 2)).toBe(48);
        expect(plotAt(ctx, 'fnSpan', 2)).toBe(1);
        expect(plotAt(ctx, 'mapTotal', 2)).toBe(66);
        expect(plotAt(ctx, 'nRows', 2)).toBe(5);
        // The ternary keeps the footprint on even bars only.
        expect(plotAt(ctx, 'pickedDelta', 2)).toBe(48);
        expect(plotAt(ctx, 'pickedDelta', 3)).toBeNaN();
        // Bars 1..4 carry data.
        expect(plotAt(ctx, 'gridRows', 5)).toBe(4);
        expect(plotAt(ctx, 'histSize', 5)).toBe(4);
    });

    it('dispatches user methods on UNTYPED footprint / volume_row variables (static type inferred from the producing call)', async () => {
        const ctx = await runPine(`//@version=6
indicator("Footprint inference")
method halfDelta(footprint f) => f.delta() / 2
method rowRange(volume_row r) => r.up_price() - r.down_price()
fp = request.footprint(2)
float half = na
float span = na
if not na(fp)
    half := fp.halfDelta()
    poc = footprint.poc(fp)
    span := poc.rowRange()
plot(half, "half")
plot(span, "span")
`);
        expect(plotAt(ctx, 'half', 2)).toBe(24);
        expect(plotAt(ctx, 'span', 2)).toBe(1);
        expect(plotAt(ctx, 'half', 0)).toBeNaN();
    });
});

// Every expectation below was observed on TradingView (BINANCE:BTCUSDT 60, Premium
// account) by running the same call and logging the result per bar.
describe('request.footprint — TradingView argument and runtime rules', () => {
    async function run(script: any, candles = Array.from({ length: 6 }, (_, i) => makeCandle(i)), footprints = makeFootprints()) {
        const pine = new PineTS(makeProvider(candles, footprints) as any, 'TEST', '1');
        await pine.ready();
        return pine.run(script);
    }

    it('answers na on every bar for ticks_per_row = 0 or na, without an error', async () => {
        const ctx = await run(($: any) => {
            const { request, na } = $.pine;
            const zero = na(request.footprint(0));
            return { zero };
        });
        expect(ctx.result.zero).toEqual([true, true, true, true, true, true]);

        const ctxNa = await run(($: any) => {
            const { request, na } = $.pine;
            const missing = na(request.footprint(NaN));
            return { missing };
        });
        expect(ctxNa.result.missing).toEqual([true, true, true, true, true, true]);
    });

    it('rejects a negative ticks_per_row, va_percent or imbalance_percent with the TradingView message', async () => {
        const call = (args: string) => run(`//@version=6\nindicator("neg")\nfp = request.footprint(${args})\nplot(na(fp) ? 0 : 1)\n`);
        await expect(call('-5')).rejects.toThrow(
            "Invalid value of the 'ticks_per_row' argument (-5) in the 'request.footprint' function. It must be >= 0.",
        );
        await expect(call('2, -10')).rejects.toThrow(
            "Invalid value of the 'va_percent' argument (-10) in the 'request.footprint' function. It must be >= 0.",
        );
        await expect(call('2, 70, -50')).rejects.toThrow(
            "Invalid value of the 'imbalance_percent' argument (-50) in the 'request.footprint' function. It must be >= 0.",
        );
    });

    it('limits the value area to the POC row when va_percent is na, and to all rows above 100', async () => {
        const vaOf = (va: string) =>
            run(`//@version=6
indicator("va")
fp = request.footprint(2, ${va})
plot(na(fp) ? na : fp.val().down_price(), "val")
plot(na(fp) ? na : fp.vah().up_price(), "vah")
`);
        const at = (ctx: any, title: string) => ctx.plots[title].data[2].value;
        // Reference bar: POC is row2 [102, 103); the rows span 100 .. 105.
        const atNa = await vaOf('na');
        expect(at(atNa, 'val')).toBe(102);
        expect(at(atNa, 'vah')).toBe(103);
        const at150 = await vaOf('150');
        expect(at(at150, 'val')).toBe(100);
        expect(at(at150, 'vah')).toBe(105);
    });

    it('treats an imbalance_percent below 100 as 100, and flags nothing when it is na', async () => {
        // Flags packed as bits: bit i = the flag of row i (row 0 lowest).
        const flagsOf = (imb: string) =>
            run(`//@version=6
indicator("imb")
fp = request.footprint(2, 70, ${imb})
float buy = 0
float sell = 0
if not na(fp)
    int i = 0
    for row in fp.rows()
        buy += row.has_buy_imbalance() ? math.pow(2, i) : 0
        sell += row.has_sell_imbalance() ? math.pow(2, i) : 0
        i += 1
plot(buy, "buy")
plot(sell, "sell")
`);
        const at = (ctx: any, title: string) => ctx.plots[title].data[2].value;
        for (const imb of ['0', '50', '99']) {
            const ctx = await flagsOf(imb);
            // Same flags as imbalance_percent = 100 (see 'lowers the imbalance bar …'):
            // buy on rows 2 and 4, sell on rows 0 and 2.
            expect(at(ctx, 'buy')).toBe(4 + 16);
            expect(at(ctx, 'sell')).toBe(1 + 4);
        }
        const ctxNa = await flagsOf('na');
        expect(at(ctxNa, 'buy')).toBe(0);
        expect(at(ctxNa, 'sell')).toBe(0);
    });

    it('answers na for a footprint of more than 2000 rows', async () => {
        // mintick 0.5, ticks_per_row 1 → rows of 0.5 from 100: high 1100 closes row 1999 (2000 rows),
        // high 1100.5 needs a 2001st row.
        const candle = (i: number, high: number) => ({ ...makeCandle(i), low: 100, high, open: 100, close: 101 });
        const candles = [candle(0, 1100), candle(1, 1100.5)];
        const footprints: FootprintBar[] = [0, 1].map((i) => ({ openTime: T0 + i * MINUTE, levels: [{ price: 100, buyVolume: 1, sellVolume: 1 }] }));
        const ctx = await run(
            ($: any) => {
                const { request, footprint, array, na } = $.pine;
                const fp = request.footprint(1);
                const n = na(fp) ? NaN : array.size(footprint.rows(fp));
                return { n };
            },
            candles,
            footprints,
        );
        expect(ctx.result.n[0]).toBe(2000);
        expect(ctx.result.n[1]).toBeNaN();
    });

    it('raises a runtime error when an accessor receives an na footprint or volume_row', async () => {
        await expect(
            run(($: any) => {
                const { request, footprint } = $.pine;
                const d = footprint.delta(request.footprint(2));
                return { d };
            }),
        ).rejects.toThrow('The `footprint` ID used in the `delta()` call cannot be `na`.');
        await expect(
            run(`//@version=6
indicator("na footprint")
footprint fp = na
plot(fp.total_volume())
`),
        ).rejects.toThrow('The `footprint` ID used in the `total_volume()` call cannot be `na`.');
        await expect(
            run(`//@version=6
indicator("na row")
volume_row r = na
plot(r.up_price())
`),
        ).rejects.toThrow('The `volume_row` ID used in the `up_price()` call cannot be `na`.');
        // A chained accessor on a row lookup outside the footprint.
        await expect(
            run(`//@version=6
indicator("na row chain")
footprint fp = request.footprint(2)
plot(na(fp) ? na : fp.get_row_by_price(1000).delta())
`),
        ).rejects.toThrow('The `volume_row` ID used in the `delta()` call cannot be `na`.');
    });

    it('allows several calls only when they request the same footprint', async () => {
        const ok = await run(`//@version=6
indicator("same footprint")
g(simple int t) => request.footprint(t)
a = request.footprint(2)
b = request.footprint(2)
c = g(2)
plot(na(a) ? na : a.delta() + b.delta() + c.delta(), "sum")
`);
        expect(ok.plots['sum'].data[2].value).toBe(3 * 48);

        await expect(
            run(`//@version=6
indicator("two footprints")
a = request.footprint(2)
b = request.footprint(4)
plot(na(a) ? na : a.delta() + b.delta())
`),
        ).rejects.toThrow('The script executes too many `request.footprint()` function calls.');
        await expect(
            run(`//@version=6
indicator("two va")
a = request.footprint(2, 70)
b = request.footprint(2, 60)
plot(na(a) ? na : a.delta() + b.delta())
`),
        ).rejects.toThrow('The script executes too many `request.footprint()` function calls.');
    });

    it('works inside request.security(), on the requested context’s own bars', async () => {
        const candles = Array.from({ length: 4 }, (_, i) => makeCandle(i));
        const byTicker: Record<string, FootprintBar[]> = {
            TEST: makeFootprints(),
            OTHER: candles.map((c, i) => ({ openTime: c.openTime, levels: [{ price: 102, buyVolume: 100 + i, sellVolume: 1 }] })),
        };
        const provider = {
            getMarketData: async () => candles,
            getSymbolInfo: async () => ({ ticker: 'TEST', tickerid: 'TEST', mintick: 0.5 }),
            getFootprintData: async (ticker: string) => byTicker[ticker] ?? [],
        };
        const pine = new PineTS(provider as any, 'TEST', '1');
        await pine.ready();
        const ctx = await pine.run(`//@version=6
indicator("footprint in security")
g() =>
    fp = request.footprint(2)
    na(fp) ? -1.0 : fp.delta()
plot(request.security("OTHER", "1", g()), "other")
`);
        expect(ctx.plots['other'].data.map((p: any) => p.value)).toEqual([99, 100, 101, 102]);
    });
});

describe('request.footprint — live updates', () => {
    it('re-reads the forming bar from the source after a market data update', async () => {
        const N = 4;
        const candles = Array.from({ length: N }, (_, i) => makeCandle(i));
        const lastOpen = candles[N - 1].openTime;
        // The forming bar's footprint grows between polls: one level first, two later.
        let phase = 0;
        const footprintsFor = (): FootprintBar[] => [
            { openTime: candles[1].openTime, levels: [{ price: 100, buyVolume: 1, sellVolume: 1 }] },
            {
                openTime: lastOpen,
                levels:
                    phase === 0
                        ? [{ price: 103, buyVolume: 10, sellVolume: 4 }]
                        : [
                              { price: 103, buyVolume: 10, sellVolume: 4 },
                              { price: 103.5, buyVolume: 7, sellVolume: 3 },
                          ],
            },
        ];
        const log: any[] = [];
        const provider = {
            getMarketData: async (_t: string, _tf: string, _l?: number, sDate?: number) => {
                if (sDate !== undefined && sDate >= lastOpen) return [{ ...candles[N - 1], close: candles[N - 1].close + 0.5 }];
                return candles;
            },
            getSymbolInfo: async () => ({ ticker: 'TEST', mintick: 0.5 }),
            getFootprintData: async (_t: string, _tf: string, _l?: number, sDate?: number) => {
                log.push(sDate);
                return footprintsFor().filter((b) => sDate === undefined || b.openTime >= sDate);
            },
        };
        const pine = new PineTS(provider as any, 'TEST', '1');
        await pine.ready();

        const ctx = await pine.run(($: any) => {
            const { request, footprint, na } = $.pine;
            const fp = request.footprint(1);
            const delta = na(fp) ? NaN : footprint.delta(fp);
            const total = na(fp) ? NaN : footprint.total_volume(fp);
            return { delta, total };
        });
        expect(last(ctx.result.delta)).toBe(6);
        expect(last(ctx.result.total)).toBe(14);
        // The initial load spans the whole history, from the first bar's openTime.
        expect(log).toEqual([T0]);

        phase = 1;
        expect(await pine.updateTail(ctx)).toBe(true);
        // Only the tail was re-requested, from the forming bar's openTime.
        expect(log).toEqual([T0, lastOpen]);
        expect(last(ctx.result.delta)).toBe(10);
        expect(last(ctx.result.total)).toBe(24);
        // History is untouched.
        expect(ctx.result.total[1]).toBe(2);
    });
});
