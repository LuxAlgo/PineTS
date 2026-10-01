// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Expected values are computed here from the plotted OHLCV with the formulas TradingView uses,
// or taken from TradingView's output (math.round, math.random). Every relation below was
// checked against TradingView on BINANCE:BTCUSDT 1h.

async function run(body: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-06').getTime());
    const { plots } = await pineTS.run(
        `//@version=6\nindicator("t")\nplot(open, "open")\nplot(high, "high")\nplot(low, "low")\nplot(close, "close")\nplot(volume, "volume")\n${body}`,
    );
    return (title: string): number[] => plots[title].data.map((d: any) => d.value);
}

const close = (a: number, b: number, digits = 6) => expect(a).toBeCloseTo(b, digits);
const isNa = (v: any) => v === null || v === undefined || Number.isNaN(v);

function almaAt(src: number[], i: number, len: number, offset: number, sigma: number, floor: boolean) {
    const m = floor ? Math.floor(offset * (len - 1)) : offset * (len - 1);
    const s = len / sigma;
    let num = 0;
    let den = 0;
    for (let k = 0; k < len; k++) {
        const w = Math.exp(-((k - m) ** 2) / (2 * s * s));
        num += w * src[i - (len - 1) + k];
        den += w;
    }
    return num / den;
}
const window = (src: number[], i: number, len: number) => src.slice(i - len + 1, i + 1);
const mean = (w: number[]) => w.reduce((a, b) => a + b, 0) / w.length;
const varianceOf = (w: number[], biased: boolean) => {
    const m = mean(w);
    return w.reduce((a, b) => a + (b - m) ** 2, 0) / (biased ? w.length : w.length - 1);
};

describe('ta signatures and formulas', () => {
    it('ta.iii is (2 * close - high - low) / (high - low) * volume (T2)', async () => {
        const s = await run('plot(ta.iii, "iii")');
        const [c, h, l, v, iii] = ['close', 'high', 'low', 'volume', 'iii'].map(s);
        iii.forEach((x, i) => close(x, ((2 * c[i] - h[i] - l[i]) / (h[i] - l[i])) * v[i], 4));
    });

    it('ta.alma floor argument and ta.variance / ta.stdev biased argument (T3)', async () => {
        const s = await run(`plot(ta.alma(close, 9, 0.85, 6, true), "a9f")
plot(ta.alma(close, 20, 0.85, 6, true), "a20f")
plot(ta.alma(close, 9, 0.85, 6, false), "a9")
plot(ta.variance(close, 10, false), "vu")
plot(ta.variance(close, 10, true), "vb")
plot(ta.variance(close, 20, false), "vu20")
plot(ta.stdev(close, 10, false), "su")`);
        const [c, a9f, a20f, a9, vu, vb, vu20, su] = ['close', 'a9f', 'a20f', 'a9', 'vu', 'vb', 'vu20', 'su'].map(s);
        for (let i = 0; i < c.length; i++) {
            if (i >= 8) {
                close(a9f[i], almaAt(c, i, 9, 0.85, 6, true));
                close(a9[i], almaAt(c, i, 9, 0.85, 6, false));
            } else {
                expect(isNa(a9f[i])).toBe(true);
            }
            if (i >= 9) {
                close(vu[i], varianceOf(window(c, i, 10), false), 3);
                close(vb[i], varianceOf(window(c, i, 10), true), 3);
                close(su[i], Math.sqrt(varianceOf(window(c, i, 10), false)), 5);
            }
            if (i >= 19) {
                close(a20f[i], almaAt(c, i, 20, 0.85, 6, true));
                close(vu20[i], varianceOf(window(c, i, 20), false), 3);
            }
        }
        // floor = true moves the peak from 6.8 to 6
        expect(a9f.slice(8).some((x, k) => Math.abs(x - a9[k + 8]) > 1e-6)).toBe(true);
    });

    it('ta.highestbars(length) / ta.lowestbars(length) use high / low (T4)', async () => {
        const s = await run(`plot(ta.highestbars(10), "hb")
plot(ta.lowestbars(10), "lb")
plot(ta.highestbars(high, 10), "hbh")
plot(ta.lowestbars(low, 10), "lbl")`);
        const [h, l, hb, lb, hbh, lbl] = ['high', 'low', 'hb', 'lb', 'hbh', 'lbl'].map(s);
        for (let i = 9; i < h.length; i++) {
            const hw = window(h, i, 10).reverse();
            const lw = window(l, i, 10).reverse();
            expect(hb[i]).toBe(-hw.lastIndexOf(Math.max(...hw)));
            expect(lb[i]).toBe(-lw.lastIndexOf(Math.min(...lw)));
            expect(hb[i]).toBe(hbh[i]);
            expect(lb[i]).toBe(lbl[i]);
        }
    });

    it('series lengths in ta.sma, ta.stdev, ta.cmo, ta.alma, ta.variance (T5)', async () => {
        const s = await run(`len = bar_index % 17 + 3
plot(len, "len")
plot(ta.sma(close, len), "sma")
plot(ta.stdev(close, len), "stdev")
plot(ta.cmo(close, len), "cmo")
plot(ta.alma(close, len, 0.85, 6), "alma")
plot(ta.variance(close, len), "variance")`);
        const [c, len, sma, sd, cmo, alma, variance] = ['close', 'len', 'sma', 'stdev', 'cmo', 'alma', 'variance'].map(s);
        let checked = 0;
        for (let i = 25; i < c.length; i++) {
            const n = len[i];
            const w = window(c, i, n);
            close(sma[i], mean(w));
            close(sd[i], Math.sqrt(varianceOf(w, true)), 5);
            close(variance[i], varianceOf(w, true), 3);
            close(alma[i], almaAt(c, i, n, 0.85, 6, false));
            let up = 0;
            let down = 0;
            for (let k = i - n + 1; k <= i; k++) {
                const m = c[k] - c[k - 1];
                if (m >= 0) up += m;
                else down -= m;
            }
            close(cmo[i], (100 * (up - down)) / (up + down), 4);
            checked++;
        }
        expect(checked).toBeGreaterThan(80);
    });

    it('ta.supertrend with a series factor keeps the first bar factor (T6)', async () => {
        const s = await run(`f = bar_index == 0 ? 3.0 : 2.0
[st, dir] = ta.supertrend(f, 10)
[st3, dir3] = ta.supertrend(3.0, 10)
[st2, dir2] = ta.supertrend(2.0, 10)
plot(st, "st")
plot(st3, "st3")
plot(st2, "st2")`);
        const [st, st3, st2] = ['st', 'st3', 'st2'].map(s);
        st.forEach((x, i) => (isNa(st3[i]) ? expect(isNa(x)).toBe(true) : expect(x).toBe(st3[i])));
        expect(st.some((x, i) => !isNa(x) && x !== st2[i])).toBe(true);
    });

    it('ta.vwap as a variable, with an anchor, and the band tuple (T7 / item 13)', async () => {
        const s = await run(`anchor = bar_index % 24 == 5
plot(anchor ? 1 : 0, "anchor")
plot(ta.vwap, "bare")
plot(ta.vwap(hlc3), "hlc3")
plot(ta.vwap(close, anchor), "anchored")
[m, u, l] = ta.vwap(close, anchor, 2.0)
plot(m, "m")
plot(u, "u")
plot(l, "l")`);
        const [c, v, anchor, bare, hlc3, anchored, m, u, l] = ['close', 'volume', 'anchor', 'bare', 'hlc3', 'anchored', 'm', 'u', 'l'].map(s);
        expect(bare).toEqual(hlc3);
        expect(bare.every((x) => !isNa(x))).toBe(true);
        let pv = 0;
        let vol = 0;
        let ppv = 0;
        let started = false;
        for (let i = 0; i < c.length; i++) {
            if (anchor[i] === 1) {
                pv = vol = ppv = 0;
                started = true;
            }
            if (!started) {
                expect(isNa(anchored[i]) && isNa(m[i]) && isNa(u[i]) && isNa(l[i])).toBe(true);
                continue;
            }
            pv += c[i] * v[i];
            vol += v[i];
            ppv += c[i] * c[i] * v[i];
            const vw = pv / vol;
            const dev = Math.sqrt(Math.max(ppv / vol - vw * vw, 0));
            close(anchored[i], vw);
            close(m[i], vw);
            close(u[i], vw + 2 * dev, 4);
            close(l[i], vw - 2 * dev, 4);
        }
    });

    it('math.round with a precision matches TradingView (T8)', async () => {
        // [value, precision, TradingView]
        const cases: [number, number, number][] = [
            [1.005, 2, 1.01], [2.675, 2, 2.68], [-1.005, 2, -1.01], [0.125, 2, 0.13], [1.45, 1, 1.5], [8.345, 2, 8.35],
            [1.0049, 2, 1], [1.00449, 2, 1], [1.00499, 2, 1.01], [1.0049999, 2, 1.01], [0.0149999, 2, 0.02],
            [12.34999999, 1, 12.4], [1.000499, 3, 1], [1.0004999, 3, 1.001], [0.049, 1, 0.1], [2.000049, 4, 2],
            [2.00005, 4, 2.0001], [1234.5678, 3, 1234.568], [0.4999999999, 0, 0], [2.5, 0, 3], [-2.5, 0, -3],
        ];
        const s = await run(cases.map(([x, p], k) => `plot(math.round(${x}, ${p}), "r${k}")`).join('\n'));
        cases.forEach(([, , want], k) => expect(s(`r${k}`)[0]).toBe(want));
    });

    it('math.random(min, max, seed) draws the seeded sequence per call site', async () => {
        const s = await run(`a = math.random(0, 1, 42)
b = math.random(10, 20, 42)
f() => math.random(0, 1, 42)
c = f()
d = f()
e = bar_index % 2 == 0 ? math.random(0, 1, 42) : na
g = math.random(5, 6)
plot(a, "a")
plot(b, "b")
plot(c, "c")
plot(d, "d")
plot(e, "e")
plot(g, "g")
plot(math.random(0, 1, 1), "s1")`);
        const [a, b, c, d, e, g, s1] = ['a', 'b', 'c', 'd', 'e', 'g', 's1'].map(s);
        // TradingView's first values (java.util.Random nextDouble for the seed); plots keep 8 decimals
        [0.7275636800328681, 0.6832234717598454, 0.30871945533265976].forEach((want, i) => close(a[i], want, 8));
        [0.7308781907032909, 0.41008081149220166].forEach((want, i) => close(s1[i], want, 8));
        a.forEach((x, i) => {
            close(b[i], 10 + 10 * x, 6);
            // user function results go through $.precision (10 decimals)
            close(c[i], x, 9);
            close(d[i], x, 9);
        });
        // a call that runs on every other bar gets the next value each time it runs
        expect([e[0], e[2], e[4]]).toEqual(a.slice(0, 3));
        expect(g.every((x) => x >= 5 && x < 6)).toBe(true);
    });
});
