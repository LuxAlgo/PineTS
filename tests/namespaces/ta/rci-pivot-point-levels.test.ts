// SPDX-License-Identifier: AGPL-3.0-only
// ta.rci and ta.pivot_point_levels.
// ta.rci: the windows below are BINANCE:BTCUSDT 1h closes, the expected values TradingView's for them.
// ta.pivot_point_levels: TradingView's Pivot Points Standard formulas, which matched TradingView on every
// level of every type (360 bars, daily anchor); here they are recomputed from the Mock bars.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const newPineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 5));

/** ta.rci over `values` fed from bar 1 (bar 0 holds a filler value: the first result comes at bar_index = length). */
async function rciOf(values: number[], length: number) {
    const { plots } = await newPineTS().run(`//@version=6
indicator("t")
vals = array.from(${values.map((v) => v.toFixed(2)).join(', ')})
float src = bar_index == 0 ? 0.0 : bar_index <= vals.size() ? vals.get(bar_index - 1) : na
plot(ta.rci(src, ${length}), "r")
`);
    return plots['r'].data.map((d: any) => d.value);
}

describe('ta.rci', () => {
    it('matches TradingView on a window of closes', async () => {
        const closes = [77328.94, 77338.87, 77284, 77348.01, 77316, 76714, 76842.01, 76808, 77118.97, 77600];
        const r = await rciOf(closes, 10);
        expect(r[10]).toBeCloseTo(-23.636363636363637, 8);
    });

    it('gives tied values their average rank (Pearson on ranks), as TradingView', async () => {
        const r = await rciOf([387, 386, 387, 387, 384, 384, 384, 386, 388], 9);
        expect(r[9]).toBeCloseTo(-12.13042238123418, 8);
    });

    it('is 100 / -100 for a steadily rising / falling source, na until bar_index = length', async () => {
        const { plots } = await newPineTS().run(`//@version=6
indicator("t")
plot(ta.rci(bar_index, 5), "up")
plot(ta.rci(-bar_index, 5), "down")
plot(ta.rci(close, 1), "len1")
plot(ta.rci(close, 5), "a")
plot(ta.rci(close, 5), "b")
plot(ta.rci(close, 7), "c")
`);
        const v = (t: string) => plots[t].data.map((d: any) => d.value);
        // TradingView: ta.rci(x, 5) is na on bars 0..4 and defined from bar 5.
        expect(v('up').slice(0, 5).every((x: number) => isNaN(x))).toBe(true);
        expect(v('up').slice(5).every((x: number) => x === 100)).toBe(true);
        expect(v('down').slice(5).every((x: number) => x === -100)).toBe(true);
        expect(v('len1').every((x: number) => isNaN(x))).toBe(true);
        // Separate call sites with the same arguments agree; a different length differs.
        expect(v('a')).toEqual(v('b'));
        expect(v('c').slice(10)).not.toEqual(v('a').slice(10));
    });
});

type Bar = { t: number; o: number; h: number; l: number; c: number };

function expectedLevels(type: string, p: { h: number; l: number; c: number; o: number }, open: number): number[] {
    const { h, l, c } = p;
    const range = h - l;
    const pp = (h + l + c) / 3;
    if (type === 'Traditional') return [pp, pp * 2 - l, pp * 2 - h, pp + range, pp - range, pp * 2 + (h - 2 * l), pp * 2 - (2 * h - l), pp * 3 + (h - 3 * l), pp * 3 - (3 * h - l), pp * 4 + (h - 4 * l), pp * 4 - (4 * h - l)];
    if (type === 'Woodie') {
        const w = (h + l + 2 * open) / 4;
        return [w, 2 * w - l, 2 * w - h, w + range, w - range, h + 2 * (w - l), l - 2 * (h - w), h + 2 * (w - l) + range, l - 2 * (h - w) - range, NaN, NaN];
    }
    if (type === 'DM') {
        const x = c < p.o ? h + 2 * l + c : c > p.o ? 2 * h + l + c : h + l + 2 * c;
        return [x / 4, x / 2 - l, x / 2 - h, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
    }
    // Camarilla
    return [pp, c + (range * 1.1) / 12, c - (range * 1.1) / 12, c + (range * 1.1) / 6, c - (range * 1.1) / 6, c + (range * 1.1) / 4, c - (range * 1.1) / 4, c + (range * 1.1) / 2, c - (range * 1.1) / 2, (h / l) * c, c - ((h / l) * c - c)];
}

describe('ta.pivot_point_levels', () => {
    const types = ['Traditional', 'Woodie', 'DM', 'Camarilla'];

    it('computes the levels of the previous day at each anchor and keeps them, or develops them within the day', async () => {
        const plotsSrc = types
            .map((t, k) => `l${k} = ta.pivot_point_levels("${t}", timeframe.change("D"), false)\n` + [...Array(11).keys()].map((i) => `plot(l${k}.get(${i}), "${t}${i}")`).join('\n'))
            .join('\n');
        const { plots } = await newPineTS().run(`//@version=6
indicator("t")
${plotsSrc}
dv = ta.pivot_point_levels("Traditional", timeframe.change("D"), true)
plot(dv.get(0), "dev0")
plot(dv.get(3), "dev3")
plot(dv.get(10), "dev10")
plot(dv.size(), "size")
plot(time, "time")
plot(open, "o")
plot(high, "h")
plot(low, "l")
plot(close, "c")
`);
        const col = (t: string) => plots[t].data.map((d: any) => d.value);
        const bars: Bar[] = col('time').map((t: number, i: number) => ({ t, o: col('o')[i], h: col('h')[i], l: col('l')[i], c: col('c')[i] }));
        const day = (t: number) => Math.floor(t / 86_400_000);

        let prev: any = null;
        let cur: any = null;
        let fixed: Record<string, number[] | null> = Object.fromEntries(types.map((t) => [t, null]));
        let checked = 0;
        bars.forEach((b, i) => {
            if (i === 0 || day(b.t) !== day(bars[i - 1].t)) {
                prev = cur;
                if (prev) for (const t of types) fixed[t] = expectedLevels(t, prev, t === 'Woodie' ? b.o : prev.o);
                cur = { o: b.o, h: b.h, l: b.l, c: b.c };
            } else {
                cur = { o: cur.o, h: Math.max(cur.h, b.h), l: Math.min(cur.l, b.l), c: b.c };
            }
            for (const t of types) {
                for (let k = 0; k < 11; k++) {
                    const got = col(`${t}${k}`)[i];
                    const want = fixed[t] ? fixed[t]![k] : NaN;
                    if (isNaN(want)) expect(got).toBeNaN();
                    else expect(got).toBeCloseTo(want, 6);
                    checked++;
                }
            }
            const dev = expectedLevels('Traditional', cur, cur.o);
            expect(col('dev0')[i]).toBeCloseTo(dev[0], 6);
            expect(col('dev3')[i]).toBeCloseTo(dev[3], 6);
            expect(col('dev10')[i]).toBeCloseTo(dev[10], 6);
            expect(col('size')[i]).toBe(11);
        });
        // Levels before the first completed day are na; the later days are checked above.
        expect(bars.length).toBeGreaterThan(48);
        expect(checked).toBe(bars.length * types.length * 11);
    });

    it('keeps separate state per call site when `developing` is omitted', async () => {
        const { plots } = await newPineTS().run(`//@version=6
indicator("t")
a = ta.pivot_point_levels("Traditional", timeframe.change("D"))
b = ta.pivot_point_levels("Traditional", close < 0)
c = ta.pivot_point_levels("Traditional", timeframe.change("D"), false)
plot(a.get(7), "a")
plot(na(b.get(0)) ? 1 : 0, "bNa")
plot(c.get(7), "c")
`);
        const a = plots['a'].data.map((d: any) => d.value);
        const c = plots['c'].data.map((d: any) => d.value);
        expect(a.filter((v: number) => !isNaN(v)).length).toBeGreaterThan(24);
        expect(a).toEqual(c);
        // An anchor that never fires gives na levels, whatever the other call does.
        expect(plots['bNa'].data.every((d: any) => d.value === 1)).toBe(true);
    });

    it('raises TradingView\'s errors for Woodie with developing and for an unknown type', async () => {
        await expect(
            newPineTS().run(`//@version=6\nindicator("t")\nw = ta.pivot_point_levels("Woodie", timeframe.change("D"), true)\nplot(w.get(0))\n`)
        ).rejects.toThrow('The `developing` parameter of the `ta.pivot_point_levels()` cannot be `true` when `type` is "Woodie".');
        await expect(
            newPineTS().run(`//@version=6\nindicator("t")\nstring t = close > 0 ? "Bogus" : "Traditional"\nw = ta.pivot_point_levels(t, timeframe.change("D"), false)\nplot(w.get(0))\n`)
        ).rejects.toThrow("Invalid argument 'Bogus' for 'type' in the 'ta.pivot_point_levels' function.");
    });
});
