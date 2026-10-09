// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The window functions keep their state in O(1) (or O(log n)) per bar instead of copying and
 * rescanning their window. These tests pin what that state must preserve:
 *  - the values match a direct computation from the definition over a long history (no drift),
 *  - a bar evaluated again (live bar) starts from the window committed on the previous bar,
 *  - a call inside a condition sees the history TradingView gives that function there: its calls,
 *    the bars with the skipped ones repeating the last call, or the calls of the last `length` bars
 *    (local-block-semantics.test.ts checks the same against TradingView's values).
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Series } from '../../../src/Series';
import { Context } from '../../../src/Context.class';
import TechnicalAnalysis from '../../../src/namespaces/ta/ta.index';
import { sum as mathSum } from '../../../src/namespaces/math/methods/sum';

function randomWalk(n: number, seed: number) {
    let s = seed;
    const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    const out: { open: number; high: number; low: number; close: number; volume: number; openTime: number; closeTime: number }[] = [];
    let price = 30000;
    for (let i = 0; i < n; i++) {
        const open = price;
        const close = Math.max(100, open + (rnd() - 0.5) * 400);
        const high = Math.max(open, close) + rnd() * 100;
        const low = Math.min(open, close) - rnd() * 100;
        out.push({ open, high, low, close, volume: 1000 + Math.floor(rnd() * 1000), openTime: i * 3_600_000, closeTime: (i + 1) * 3_600_000 - 1 });
        price = close;
    }
    return out;
}

const close = (bars: any[]) => bars.map((b) => b.close);
/** The last `n` values of `x` up to index `i`, newest first. */
const last = (x: number[], i: number, n: number) => Array.from({ length: n }, (_, k) => x[i - k]);
const sorted = (v: number[]) => [...v].sort((a, b) => a - b);

// Direct computations of the definitions (newest value first)
const ref = {
    sma: (w: number[]) => w.reduce((a, b) => a + b, 0) / w.length,
    wma: (w: number[]) => w.reduce((a, v, i) => a + v * (w.length - i), 0) / ((w.length * (w.length + 1)) / 2),
    linreg: (w: number[], offset: number) => {
        const n = w.length;
        let sx = 0,
            sy = 0,
            sxy = 0,
            sxx = 0;
        w.forEach((y, j) => {
            const x = n - 1 - j;
            sx += x;
            sy += y;
            sxy += x * y;
            sxx += x * x;
        });
        const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
        return (sy - slope * sx) / n + slope * (n - 1 - offset);
    },
    cog: (w: number[]) => -w.reduce((a, v, i) => a + v * (i + 1), 0) / w.reduce((a, b) => a + b, 0),
    // newest first; the newest among equal values (TradingView since Oct 9, 2026)
    highestbars: (w: number[]) => {
        let best = 0;
        w.forEach((v, i) => v > w[best] && (best = i));
        return -best;
    },
    median: (w: number[]) => {
        const s = sorted(w);
        return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    },
    percentrank: (w: number[]) => (w.slice(1).filter((v) => v <= w[0]).length / (w.length - 1)) * 100,
    pli: (w: number[], p: number) => {
        const s = sorted(w);
        const idx = Math.min(Math.max((p / 100) * s.length - 0.5, 0), s.length - 1);
        const lo = Math.floor(idx);
        return s[lo] + (idx - lo) * (s[Math.ceil(idx)] - s[lo]);
    },
    pnr: (w: number[], p: number) => sorted(w)[Math.min(Math.max(Math.ceil((p / 100) * w.length) - 1, 0), w.length - 1)],
    mode: (w: number[]) => {
        const c = new Map<number, number>();
        w.forEach((v) => c.set(v, (c.get(v) ?? 0) + 1));
        let best = NaN;
        let n = 0;
        for (const [v, k] of c) if (k > n || (k === n && v < best)) [best, n] = [v, k];
        return best;
    },
    rci: (w: number[]) => {
        const x = [...w].reverse();
        const order = x.map((_, i) => i).sort((a, b) => x[a] - x[b]);
        const ranks: number[] = [];
        for (let i = 0; i < x.length;) {
            let j = i;
            while (j + 1 < x.length && x[order[j + 1]] === x[order[i]]) j++;
            for (let k = i; k <= j; k++) ranks[order[k]] = (i + j) / 2 + 1;
            i = j + 1;
        }
        const m = (x.length + 1) / 2;
        let cov = 0,
            vx = 0,
            vy = 0;
        x.forEach((_, i) => {
            cov += (i + 1 - m) * (ranks[i] - m);
            vx += (i + 1 - m) ** 2;
            vy += (ranks[i] - m) ** 2;
        });
        return (cov / Math.sqrt(vx * vy)) * 100;
    },
};

const near = (got: number, want: number) => Math.abs(got - want) <= 1e-9 * Math.max(1, Math.abs(want));

describe('rolling windows over a long history', () => {
    it('match a direct computation on every bar (no drift)', async () => {
        const bars = randomWalk(3000, 7);
        const c = close(bars);
        const q = c.map((v) => Math.round(v / 50));
        const { plots } = await new PineTS(bars, 'X', '60').run(`//@version=6
indicator("windows")
q = math.round(close / 50)
plot(ta.sma(close, 50), "sma")
plot(ta.wma(close, 50), "wma")
plot(ta.hma(close, 49), "hma")
plot(ta.linreg(close, 50, 0), "linreg")
plot(ta.linreg(close, 30, 4), "linreg4")
plot(ta.cog(close, 40), "cog")
plot(math.sum(close, 50), "sum")
plot(ta.highest(close, 50), "highest")
plot(ta.lowest(close, 50), "lowest")
plot(ta.highestbars(q, 50), "highestbars")
plot(ta.median(close, 50), "median")
plot(ta.percentrank(q, 50), "percentrank")
plot(ta.percentile_linear_interpolation(close, 50, 30), "pli")
plot(ta.percentile_nearest_rank(q, 50, 70), "pnr")
plot(ta.mode(q, 50), "mode")
plot(ta.rci(q, 40), "rci")
plot(ta.change(close, 50), "change")
plot(ta.valuewhen(close > open, close, 3), "valuewhen")
plot(ta.pivothigh(high, 5, 5), "pivothigh")
`);
        const v = (t: string) => plots[t].data.map((d: any) => d.value);
        const wma = (i: number, n: number) => ref.wma(last(c, i, n));
        const checks: [string, (i: number) => number, number][] = [
            ['sma', (i) => ref.sma(last(c, i, 50)), 49],
            ['wma', (i) => ref.wma(last(c, i, 50)), 49],
            // hma = wma(2 wma(n/2) - wma(n), sqrt(n))
            ['hma', (i) => ref.wma(Array.from({ length: 7 }, (_, k) => 2 * wma(i - k, 24) - wma(i - k, 49))), 60],
            ['linreg', (i) => ref.linreg(last(c, i, 50), 0), 49],
            ['linreg4', (i) => ref.linreg(last(c, i, 30), 4), 29],
            ['cog', (i) => ref.cog(last(c, i, 40)), 39],
            ['sum', (i) => ref.sma(last(c, i, 50)) * 50, 49],
            ['highest', (i) => Math.max(...last(c, i, 50)), 49],
            ['lowest', (i) => Math.min(...last(c, i, 50)), 49],
            ['highestbars', (i) => ref.highestbars(last(q, i, 50)), 49],
            ['median', (i) => ref.median(last(c, i, 50)), 49],
            ['percentrank', (i) => ref.percentrank(last(q, i, 51)), 50],
            ['pli', (i) => ref.pli(last(c, i, 50), 30), 49],
            ['pnr', (i) => ref.pnr(last(q, i, 50), 70), 49],
            ['mode', (i) => ref.mode(last(q, i, 50)), 49],
            ['rci', (i) => ref.rci(last(q, i, 40)), 40],
            ['change', (i) => c[i] - c[i - 50], 50],
        ];
        for (const [name, f, from] of checks) {
            const got = v(name);
            const bad: string[] = [];
            for (let i = from; i < bars.length; i++) if (!near(got[i], f(i))) bad.push(`bar ${i}: ${got[i]} vs ${f(i)}`);
            expect(bad.slice(0, 3), name).toEqual([]);
        }

        // value of the 4th most recent bar where close > open, pivots confirmed 5 bars later
        const up = bars.map((b, i) => (b.close > b.open ? i : -1)).filter((i) => i >= 0);
        const vw = v('valuewhen');
        for (let i = 0; i < bars.length; i++) {
            const seen = up.filter((k) => k <= i);
            const want = seen.length > 3 ? c[seen[seen.length - 4]] : NaN;
            expect(Number.isNaN(want) ? Number.isNaN(vw[i]) : near(vw[i], want), `valuewhen bar ${i}`).toBe(true);
        }
        const h = bars.map((b) => b.high);
        const ph = v('pivothigh');
        for (let i = 10; i < bars.length; i++) {
            const p = h[i - 5];
            const isPivot = [1, 2, 3, 4, 5].every((j) => h[i - 5 - j] <= p) && [1, 2, 3, 4, 5].every((j) => h[i - 5 + j] < p);
            expect(isPivot ? near(ph[i], p) : Number.isNaN(ph[i]), `pivothigh bar ${i}`).toBe(true);
        }
    });
});

// ---- the functions driven directly, with the call sequence under control

function harness() {
    const data = { close: new Series([]), open: new Series([]), high: new Series([]), low: new Series([]), volume: new Series([]) };
    const ctx: any = { idx: -1, taState: {}, precision: Context.prototype.precision, get: Context.prototype.get, data, pine: {} };
    ctx.pine.ta = new TechnicalAnalysis(ctx);
    ctx.pine.ta.sum = mathSum(ctx);
    return ctx;
}

type Call = (ta: any, src: Series) => any;
const CALLS: Record<string, Call> = {
    sma: (ta, s) => ta.sma(s, 10, 'k'),
    wma: (ta, s) => ta.wma(s, 10, 'k'),
    hma: (ta, s) => ta.hma(s, 9, 'k'),
    linreg: (ta, s) => ta.linreg(s, 10, 1, 'k'),
    alma: (ta, s) => ta.alma(s, 10, 0.85, 6, 'k'),
    stdev: (ta, s) => ta.stdev(s, 10, 'k'),
    median: (ta, s) => ta.median(s, 10, 'k'),
    highest: (ta, s) => ta.highest(s, 10, 'k'),
    lowest: (ta, s) => ta.lowest(s, 10, 'k'),
    dev: (ta, s) => ta.dev(s, 10, 'k'),
    cci: (ta, s) => ta.cci(s, 10, 'k'),
    bb: (ta, s) => ta.bb(s, 10, 2, 'k'),
    change: (ta, s) => ta.change(s, 10, 'k'),
    roc: (ta, s) => ta.roc(s, 10, 'k'),
    range: (ta, s) => ta.range(s, 10, 'k'),
    stoch: (ta, s) => ta.stoch(s, s, s, 10, 'k'),
    cmo: (ta, s) => ta.cmo(s, 10, 'k'),
    mfi: (ta, s) => ta.mfi(s, 10, 'k'),
    rsi: (ta, s) => ta.rsi(s, 10, 'k'),
    rci: (ta, s) => ta.rci(s, 10, 'k'),
    valuewhen: (ta, s) => ta.valuewhen(s.get(0) > s.get(1), s, 2, 'k'),
    cog: (ta, s) => ta.cog(s, 10, 'k'),
    highestbars: (ta, s) => ta.highestbars(s, 10, 'k'),
    percentrank: (ta, s) => ta.percentrank(s, 10, 'k'),
    pli: (ta, s) => ta.percentile_linear_interpolation(s, 10, 30, 'k'),
    pnr: (ta, s) => ta.percentile_nearest_rank(s, 10, 70, 'k'),
    mode: (ta, s) => ta.mode(s, 10, 'k'),
    sum: (ta, s) => ta.sum(s, 10, 'k'),
};

const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

describe('rolling window state', () => {
    const values = close(randomWalk(300, 3)).map((v, i) => (i % 17 === 5 ? NaN : Math.round(v / 20)));

    for (const [name, call] of Object.entries(CALLS)) {
        it(`${name}: a bar evaluated again starts from the window of the previous bar`, () => {
            const run = (provisional: boolean) => {
                const ctx = harness();
                const src = new Series([]);
                ctx.data.volume = src;
                const out: any[] = [];
                values.forEach((v, i) => {
                    ctx.idx = i;
                    src.data.push(v);
                    if (provisional) {
                        // live updates of the bar before its final value
                        for (const p of [v * 1.5, NaN, v - 3]) {
                            src.data[i] = p;
                            call(ctx.pine.ta, src);
                        }
                        src.data[i] = v;
                    }
                    out.push(call(ctx.pine.ta, src));
                });
                return out;
            };
            expect(same(run(true), run(false))).toBe(true);
        });
    }

    it('a call inside a condition sees its calls, the bars with the skipped ones repeating the last call, or TradingView slots', () => {
        // irregular gaps: a call on about 3 bars in 5
        const vals = close(randomWalk(400, 5)).map((v) => Math.round(v / 20));
        const on = vals.map((v, i) => (v * 7 + i) % 5 < 3);
        const fns = ['sma', 'median', 'sum', 'wma', 'change', 'percentrank', 'highest', 'rci'];
        const got: Record<string, number[]> = {};
        for (const f of fns) {
            const ctx = harness();
            const src = new Series([]);
            got[f] = [];
            vals.forEach((v, i) => {
                ctx.idx = i;
                src.data.push(v);
                got[f].push(on[i] ? CALLS[f](ctx.pine.ta, src) : NaN);
            });
        }
        // the last n values of the calls, or of the bars with a skipped bar repeating the last call
        const calls = (i: number, n: number) => {
            const out: number[] = [];
            for (let j = i; j >= 0 && out.length < n; j--) if (on[j]) out.push(vals[j]);
            return out;
        };
        const carry = (i: number, n: number) =>
            Array.from({ length: n }, (_, k) => {
                let j = i - k;
                while (!on[j]) j--;
                return vals[j];
            });
        // TradingView's rci reads bar b from slot b % (n + 1), last written by the call on a bar
        // b - m(n + 1) (0 if none; the bars before the first call hold their own value: backfill)
        const firstCall = on.indexOf(true);
        const slot = (b: number, n: number) => {
            for (let j = b; j >= 0; j -= n + 1) if (on[j]) return vals[j];
            return b < firstCall ? vals[b] : 0;
        };
        const slots = (i: number, n: number) => Array.from({ length: n }, (_, k) => slot(i - k, n));
        for (let i = 100; i < vals.length; i++) {
            if (!on[i]) continue;
            expect(got.sma[i], `sma ${i}`).toBeCloseTo(ref.sma(calls(i, 10)), 8);
            expect(got.median[i], `median ${i}`).toBe(ref.median(calls(i, 10)));
            expect(got.sum[i], `sum ${i}`).toBeCloseTo(ref.sma(calls(i, 10)) * 10, 8);
            expect(got.rci[i], `rci ${i}`).toBeCloseTo(ref.rci(slots(i, 10)), 8);
            expect(got.wma[i], `wma ${i}`).toBeCloseTo(ref.wma(carry(i, 10)), 8);
            expect(got.change[i], `change ${i}`).toBe(vals[i] - carry(i, 11)[10]);
            expect(got.percentrank[i], `percentrank ${i}`).toBeCloseTo(ref.percentrank(carry(i, 11)), 8);
            expect(got.highest[i], `highest ${i}`).toBe(Math.max(...calls(i, 10)));
        }
    });
});
