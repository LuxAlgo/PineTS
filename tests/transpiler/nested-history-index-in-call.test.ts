import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// A history reference whose offset is itself a history reference (or a call),
// used as a function argument: `math.min(lPh[bs[1]], low[bs[1]])` (LuxAlgo ICT
// Concepts). The index of the `param()` wrapper was emitted untransformed, so the
// script failed with `ReferenceError: bs is not defined`.
//
// Series are built from bar_index, so every expected value is computed by hand:
// s = 10 * bar_index, k = bar_index % 3, and s[o] = 10 * (i - o) on bar i.

async function run(body: string) {
    const src = `//@version=6
indicator("nested history index")
s = bar_index * 10
k = bar_index % 3
n = 2
${body}
plot(bar_index, "bi")`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(src);
    const barOf = new Map<number, number>(plots['bi'].data.map((d: any) => [d.time, d.value]));
    return (title: string) => new Map<number, number>(plots[title].data.map((d: any) => [barOf.get(d.time)!, d.value]));
}

const mod3 = (x: number) => ((x % 3) + 3) % 3;

describe('history reference with a history-reference index, inside a call argument', () => {
    it('evaluates s[k[1]], s[k[k[1]]], s[k[n]] and s[math.max(k[1], 1)] in math.* and ta.* arguments', async () => {
        const get = await run(`
plot(math.max(s[k[1]], -1), "nested")
plot(math.max(s[k[k[1]]], -1), "deep")
plot(math.max(s[k[n]], -1), "varOffset")
plot(math.max(s[math.max(k[1], 1)], -1), "callIndex")
plot(ta.sma(s[k[1]], 1), "taArg")
plot(nz(s[k[1] + 1]), "binaryIndex")`);

        const nested = get('nested');
        const deep = get('deep');
        const varOffset = get('varOffset');
        const callIndex = get('callIndex');
        const taArg = get('taArg');
        const binaryIndex = get('binaryIndex');
        const bars = get('bi').size;
        expect(bars).toBeGreaterThan(40);

        for (let i = 3; i < bars; i++) {
            const j = mod3(i - 1);
            expect(nested.get(i)).toBe(10 * (i - j));
            expect(deep.get(i)).toBe(10 * (i - mod3(i - j)));
            expect(varOffset.get(i)).toBe(10 * (i - mod3(i - 2)));
            expect(callIndex.get(i)).toBe(10 * (i - Math.max(j, 1)));
            expect(taArg.get(i)).toBe(10 * (i - j));
            expect(binaryIndex.get(i)).toBe(10 * (i - j - 1));
        }
    });

    it('runs the ICT Concepts shape: math.min(lPh [bs[1]], low[bs[1]])', async () => {
        const src = `//@version=6
indicator("ict shape", overlay = true)
ph = ta.pivothigh(3, 1), lPh = fixnan(ph)
bs = ta.barssince(not (close > open))
lwst = math.min(lPh [bs[1]], low[bs[1]])
a = lPh[bs[1]]
b = low[bs[1]]
plot(lwst, "lwst")
plot(math.min(a, b), "ref")`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-05').getTime());
        const { plots } = await pineTS.run(src);

        const lwst = new Map(plots['lwst'].data.map((d: any) => [d.time, d.value]));
        const ref = plots['ref'].data.filter((d: any) => !Number.isNaN(d.value));
        expect(ref.length).toBeGreaterThan(50);
        for (const d of ref) expect(lwst.get(d.time)).toBe(d.value);
    });
});
