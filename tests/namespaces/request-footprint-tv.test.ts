import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import fixture from './request-footprint-tv.fixture.json';

/**
 * Ground truth from TradingView: each fixture bar is the output of a Pine v6 script
 * that dumped `fp.rows()` (down price, buy, sell, imbalance flags) together with the
 * bar's `low`/`high`, `footprint.poc/vah/val` and the volume totals, captured on
 * BINANCE:BTCUSDT 60 (2500 ticks/row, VA 70 %, imbalance 300 %), ETHUSDT 15
 * (200 / 60 / 200) and SOLUSDT 5 (20 / 50 / 150). The bars were picked for the
 * edge cases that pin the algorithm: tied POC rows (odd and even counts), empty
 * rows at the candle's extremes, a value area that is the POC alone, a value area
 * that lands a hair (less than 0.01 volume units) over its target, and rows imbalanced on both sides.
 *
 * TV's rows are fed back as levels — WITHOUT the empty ones, so the row range must
 * come from the candle's `low`/`high` exactly as TV derives it.
 */
interface TvBar {
    why: string;
    symbol: string;
    ticksPerRow: number;
    vaPercent: number;
    imbalancePercent: number;
    mintick: number;
    t: number;
    low: number;
    high: number;
    buy: number;
    sell: number;
    poc: number;
    vah: number;
    val: number;
    /** `[down_price, buy_volume, sell_volume, has_buy_imbalance, has_sell_imbalance]` per row, lowest first. */
    rows: [number, number, number, number, number][];
}

const MINUTE = 60_000;

async function runBar(bar: TvBar) {
    const candle = {
        openTime: bar.t,
        closeTime: bar.t + MINUTE,
        open: bar.low,
        high: bar.high,
        low: bar.low,
        close: bar.high,
        volume: bar.buy + bar.sell,
    };
    const provider = {
        getMarketData: async () => [candle],
        getSymbolInfo: async () => ({ ticker: bar.symbol, tickerid: bar.symbol, mintick: bar.mintick }),
        getFootprintData: async () => [
            {
                openTime: bar.t,
                levels: bar.rows.filter(([, buy, sell]) => buy + sell > 0).map(([price, buy, sell]) => ({ price, buyVolume: buy, sellVolume: sell })),
            },
        ],
    };
    const pine = new PineTS(provider as any, bar.symbol, '1');
    await pine.ready();
    const ctx = await pine.run(
        `//@version=6
indicator("tv")
footprint fp = request.footprint(${bar.ticksPerRow}, ${bar.vaPercent}, ${bar.imbalancePercent})
// Imbalance flags packed as bits: bit 2i = buy imbalance of row i, bit 2i+1 = sell imbalance.
float flags = 0
if not na(fp)
    int i = 0
    for row in fp.rows()
        flags += (row.has_buy_imbalance() ? math.pow(2, 2 * i) : 0) + (row.has_sell_imbalance() ? math.pow(2, 2 * i + 1) : 0)
        i += 1
plot(array.size(fp.rows()), "n")
plot(fp.rows().first().down_price(), "firstDown")
plot(fp.rows().last().up_price(), "lastUp")
plot(fp.buy_volume(), "buy")
plot(fp.sell_volume(), "sell")
plot(fp.poc().down_price(), "poc")
plot(fp.vah().up_price(), "vah")
plot(fp.val().down_price(), "val")
plot(flags, "flags")
`,
    );
    const at = (title: string) => ctx.plots[title].data[0].value;
    return {
        n: at('n'),
        firstDown: at('firstDown'),
        lastUp: at('lastUp'),
        buy: at('buy'),
        sell: at('sell'),
        poc: at('poc'),
        vah: at('vah'),
        val: at('val'),
        flags: at('flags'),
    };
}

const packFlags = (rows: TvBar['rows']) => rows.reduce((acc, [, , , bi, si], i) => acc + bi * 2 ** (2 * i) + si * 2 ** (2 * i + 1), 0);

describe('request.footprint — parity with TradingView footprints', () => {
    for (const bar of fixture as TvBar[]) {
        it(`${bar.symbol} ${bar.ticksPerRow}/${bar.vaPercent}/${bar.imbalancePercent} @${bar.t}: ${bar.why}`, async () => {
            const got = await runBar(bar);
            const rowSize = bar.ticksPerRow * bar.mintick;
            expect(got.n).toBe(bar.rows.length);
            expect(got.firstDown).toBeCloseTo(bar.rows[0][0], 8);
            expect(got.lastUp).toBeCloseTo(bar.rows[bar.rows.length - 1][0] + rowSize, 8);
            expect(got.buy).toBeCloseTo(bar.buy, 4);
            expect(got.sell).toBeCloseTo(bar.sell, 4);
            expect(got.poc).toBeCloseTo(bar.poc, 8);
            expect(got.vah).toBeCloseTo(bar.vah, 8);
            expect(got.val).toBeCloseTo(bar.val, 8);
            // Rows never exceed 24 in the fixture, so the packed flags stay within 2^48 (exact in a double).
            expect(got.flags).toBe(packFlags(bar.rows));
        });
    }
});
