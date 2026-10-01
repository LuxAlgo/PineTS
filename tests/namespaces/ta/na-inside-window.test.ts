// SPDX-License-Identifier: AGPL-3.0-only

/**
 * `na` inside the window of the ta functions and math.sum.
 *
 * TradingView values: `data/na-window-btcusdt.json` holds 60 BINANCE:BTCUSDT 1h candles and
 * TradingView's output on the last 12 of them for three na patterns, all on the same bars:
 *   g = na every 7th bar, h = na every 3rd bar, r = runs of three na (bar_index % 11 < 3).
 * These functions only look a few bars back, so 60 candles reproduce TradingView's numbers exactly.
 *
 * The long-memory averages (rma, rsi, tsi) are checked against a hand computation of the rule that
 * matched TradingView on 399 consecutive bars: an na bar is skipped (na out, state untouched), and the
 * change on the bar after it is na too.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const fixture = JSON.parse(readFileSync(new URL('./data/na-window-btcusdt.json', import.meta.url), 'utf8'));
const F: number = fixture.firstBarIndex;

const isNa = (v: any) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));
const b = (x: string) => `(${x} ? 1 : 0)`;

// Plot title -> Pine expression. The titles are the keys of `fixture.tv`.
const EXPR: Record<string, string> = {};
for (const s of ['g', 'h']) {
    Object.assign(EXPR, {
        [`sma ${s}`]: `ta.sma(${s}, 5)`,
        [`sum ${s}`]: `math.sum(${s}, 5)`,
        [`wma ${s}`]: `ta.wma(${s}, 5)`,
        [`vwma ${s}`]: `ta.vwma(${s}, 5)`,
        [`variance ${s}`]: `ta.variance(${s}, 5)`,
        [`stdev ${s}`]: `ta.stdev(${s}, 5)`,
        [`dev ${s}`]: `ta.dev(${s}, 5)`,
        [`median ${s}`]: `ta.median(${s}, 5)`,
        [`prank ${s}`]: `ta.percentrank(${s}, 5)`,
        [`cci ${s}`]: `ta.cci(${s}, 5)`,
    });
}
Object.assign(EXPR, {
    'hma g': 'ta.hma(g, 9)',
    'corr g close': 'ta.correlation(g, close, 5)',
    'corr h volume': 'ta.correlation(h, volume, 5)',
    'stoch g': 'ta.stoch(g, high, low, 5)',
    'stoch close g h': 'ta.stoch(close, g, h, 5)',
    'rising g 3': b('ta.rising(g, 3)'),
    'falling g 3': b('ta.falling(g, 3)'),
    'rising h 2': b('ta.rising(h, 2)'),
    'falling h 2': b('ta.falling(h, 2)'),
    'crossover g': b('ta.crossover(g, ta.sma(close, 5))'),
    'crossunder g': b('ta.crossunder(g, ta.sma(close, 5))'),
    'crossover sma h': b('ta.crossover(ta.sma(close, 5), h)'),
    'cross g': b('ta.cross(g, ta.sma(close, 5))'),
    'sma r': 'ta.sma(r, 5)',
    'sum r': 'math.sum(r, 5)',
    'wma r': 'ta.wma(r, 5)',
    'variance r': 'ta.variance(r, 5)',
    'median r': 'ta.median(r, 5)',
    'dev r': 'ta.dev(r, 5)',
    'prank r': 'ta.percentrank(r, 5)',
    'cci r': 'ta.cci(r, 5)',
    'stoch r': 'ta.stoch(r, high, low, 5)',
    'rising 3 r': b('ta.rising(r, 3)'),
    'falling 2 r': b('ta.falling(r, 2)'),
    'crossover r': b('ta.crossover(r, ta.sma(close, 5))'),
    'cross r': b('ta.cross(r, ta.sma(close, 5))'),
    'stoch flat': 'ta.stoch(x, x, x, 5)',
    'stoch flat hl': 'ta.stoch(close, x, x, 5)',
});

describe('na inside a ta window (TradingView parity)', () => {
    it('matches TradingView on BTCUSDT 1h for na every 7th / every 3rd bar and runs of three na', async () => {
        expect(Object.keys(EXPR).sort()).toEqual(Object.keys(fixture.tv).sort());
        const script = `//@version=6
indicator("na window")
int bi = bar_index + ${F}
g = bi % 7 == 0 ? na : close
h = bi % 3 == 0 ? na : close
r = bi % 11 < 3 ? na : close
x = bi % 20 < 8 ? 5.0 : close
${Object.entries(EXPR).map(([title, e]) => `plot(${e}, "${title}")`).join('\n')}
`;
        const { plots } = await new PineTS(fixture.candles).run(script);

        const mismatches: string[] = [];
        for (const [title, want] of Object.entries<(number | null)[]>(fixture.tv)) {
            const got = plots[title].data.slice(-want.length).map((d: any) => d.value);
            want.forEach((w, i) => {
                const g = got[i];
                const ok = isNa(w) ? isNa(g) : !isNa(g) && Math.abs(g - w) <= 1e-6 * Math.max(1, Math.abs(w));
                if (!ok) mismatches.push(`${title} bar ${fixture.checkFromBarIndex + i}: TradingView ${w}, PineTS ${g}`);
            });
        }
        expect(mismatches).toEqual([]);
    });
});

// ---- long-memory averages: hand computation of TradingView's rule

const N = 60;
const SRC = Array.from({ length: N }, (_, i) => (i % 6 === 4 ? NaN : 100 + 10 * Math.sin(i / 3) + (i % 5)));

/** Wilder / exponential average that skips na: na out, state untouched; seeded with an SMA of the first `n` values. */
function skipAverage(x: number[], n: number, alpha: number) {
    const out: number[] = [];
    let st = NaN;
    let cnt = 0;
    let sum = 0;
    for (const v of x) {
        if (isNa(v)) {
            out.push(NaN);
            continue;
        }
        if (cnt < n) {
            sum += v;
            cnt++;
            st = cnt === n ? sum / n : NaN;
        } else st = alpha * v + (1 - alpha) * st;
        out.push(st);
    }
    return out;
}
const change = (x: number[]) => x.map((v, i) => (i === 0 ? NaN : v - x[i - 1]));

describe('na in rma / rsi / tsi', () => {
    const run = async () => {
        const { plots } = await new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 10)).run(`//@version=6
indicator("t")
var vals = array.from(${SRC.map((v) => (isNa(v) ? 'na' : v.toFixed(10))).join(', ')})
float s = bar_index < vals.size() ? vals.get(bar_index) : na
plot(ta.rma(s, 5), "rma")
plot(ta.rsi(s, 5), "rsi")
plot(ta.tsi(s, 5, 9), "tsi")
plot(ta.rma(math.max(ta.change(s), 0), 5), "rma up")
`);
        return (t: string) => plots[t].data.slice(0, N).map((d: any) => d.value);
    };

    const expectSeries = (got: number[], want: number[]) => {
        want.forEach((w, i) => {
            if (isNa(w)) expect(isNa(got[i]), `bar ${i}: expected na, got ${got[i]}`).toBe(true);
            else expect(got[i], `bar ${i}`).toBeCloseTo(w, 8);
        });
    };

    it('ta.rma skips an na bar instead of counting it as 0', async () => {
        const v = await run();
        expectSeries(v('rma'), skipAverage(SRC, 5, 1 / 5));
        // ta.change is na on the first bar and around each na: those bars are skipped too.
        const up = change(SRC).map((c) => (isNa(c) ? NaN : Math.max(c, 0)));
        expectSeries(v('rma up'), skipAverage(up, 5, 1 / 5));
    });

    it('ta.rsi / ta.tsi are na on an na bar and on the bar after it, and resume from the same state', async () => {
        const v = await run();
        const ch = change(SRC);
        const up = skipAverage(ch.map((c) => (isNa(c) ? NaN : Math.max(c, 0))), 5, 1 / 5);
        const dn = skipAverage(ch.map((c) => (isNa(c) ? NaN : Math.max(-c, 0))), 5, 1 / 5);
        expectSeries(v('rsi'), up.map((u, i) => (isNa(u) ? NaN : dn[i] === 0 ? 100 : 100 - 100 / (1 + u / dn[i]))));

        const ema = (x: number[], n: number) => skipAverage(x, n, 2 / (n + 1));
        const num = ema(ema(ch, 9), 5);
        const den = ema(ema(ch.map((c) => Math.abs(c)), 9), 5);
        expectSeries(v('tsi'), num.map((a, i) => a / den[i]));

        // concretely: the bar after each na is na for both
        for (let i = 0; i < N; i++) {
            if (!isNa(SRC[i])) continue;
            expect(isNa(v('rsi')[i + 1])).toBe(true);
            expect(isNa(v('tsi')[i + 1])).toBe(true);
        }
    });
});

describe('na in ta.cum', () => {
    it('is na on an na bar (and before the first value) and keeps summing the non-na values', async () => {
        // TradingView: every na bar of the source is na, and cum[i+1] - cum[i-1] = source[i+1] across it.
        const { plots } = await new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 10)).run(`//@version=6
indicator("t")
var vals = array.from(${SRC.map((v) => (isNa(v) ? 'na' : v.toFixed(10))).join(', ')})
float s = bar_index < vals.size() ? vals.get(bar_index) : na
plot(ta.cum(s), "cum")
plot(ta.cum(bar_index < 3 ? na : s), "cum lead")
`);
        const cum = plots['cum'].data.slice(0, N).map((d: any) => d.value);
        const lead = plots['cum lead'].data.slice(0, N).map((d: any) => d.value);
        let total = 0;
        let totalLead = 0;
        SRC.forEach((v, i) => {
            if (isNa(v)) {
                expect(isNa(cum[i]), `bar ${i}`).toBe(true);
                expect(isNa(lead[i]), `bar ${i}`).toBe(true);
                return;
            }
            total += v;
            expect(cum[i], `bar ${i}`).toBeCloseTo(total, 6);
            if (i < 3) expect(isNa(lead[i]), `bar ${i}`).toBe(true);
            else expect(lead[i], `bar ${i}`).toBeCloseTo((totalLead += v), 6);
        });
    });
});

describe('call-site isolation of the stateful na handling', () => {
    it('two call sites with the same arguments agree, different lengths differ', async () => {
        const { plots } = await new PineTS(fixture.candles).run(`//@version=6
indicator("t")
g = (bar_index + ${F}) % 7 == 0 ? na : close
plot(ta.sma(g, 5), "a")
plot(ta.sma(g, 5), "b")
plot(ta.sma(g, 7), "c")
plot(${b('ta.crossover(g, open)')}, "x1")
plot(${b('ta.crossover(g, open)')}, "x2")
plot(${b('ta.rising(g, 2)')}, "r1")
plot(${b('ta.rising(g, 2)')}, "r2")
`);
        const v = (t: string) => plots[t].data.map((d: any) => d.value);
        expect(v('a')).toEqual(v('b'));
        expect(v('c').slice(20)).not.toEqual(v('a').slice(20));
        expect(v('x1')).toEqual(v('x2'));
        expect(v('r1')).toEqual(v('r2'));
    });

    it('a cross in an if condition inside a function called from two places keeps each caller apart', async () => {
        // Such a call gets the same state key for both callers; the second one (whose level is
        // always na) must not overwrite the first one's previous values.
        const { plots } = await new PineTS(fixture.candles).run(`//@version=6
indicator("t")
f(float lvl) =>
    int hit = 0
    if ta.crossover(close, lvl) and bar_index > 0
        hit := 1
    if ta.rising(close - lvl, 2)
        hit += 2
    hit
float never = na
a = f(open)
b = f(never)
plot(a, "a")
plot(b, "b")
`);
        const a = plots['a'].data.map((d: any) => d.value);
        const c = fixture.candles;
        for (let i = 3; i < c.length; i++) {
            const d = (k: number) => c[k].close - c[k].open;
            const cross = c[i].close > c[i].open && c[i - 1].close <= c[i - 1].open ? 1 : 0;
            const rise = d(i) > d(i - 1) && d(i - 1) > d(i - 2) ? 2 : 0;
            expect(a[i], `bar ${i}`).toBe(cross + rise);
        }
        expect(plots['b'].data.every((d: any) => d.value === 0)).toBe(true);
    });
});
