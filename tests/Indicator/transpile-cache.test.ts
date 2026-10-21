// SPDX-License-Identifier: AGPL-3.0-only
// Indicators built from the same Pine source share one transpiled function. A host builds a new
// Indicator per session, per input change and per timeframe switch; each used to transpile the
// whole script again. The transpiled function keeps no run state (request.security already runs
// one function in several contexts at once), so sharing it cannot leak state between runs.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
const bars = Array.from({ length: 200 }, (_, i) => {
    const close = 100 + Math.sin(i / 7) * 5 + i * 0.1;
    return { openTime: T0 + i * MINUTE, closeTime: T0 + (i + 1) * MINUTE, open: close - 0.5, high: close + 1, low: close - 1, close, volume: 1 };
});

const source = `//@version=6
indicator("cache")
len = input.int(10, "Length")
var float acc = 0.0
acc += close
plot(ta.sma(close, len), "sma")
plot(acc, "acc")
`;

const values = (plots: any, name: string) => plots[name].data.map((d: any) => d.value);

describe('Indicator transpile cache', () => {
    it('shares the transpiled function between Indicators of the same source', () => {
        const a = new Indicator(source).prepare();
        const b = new Indicator(source, { Length: 20 }).prepare();
        expect(b.fn).toBe(a.fn);
        // Inputs stay per Indicator.
        expect(a.inputs).not.toEqual(b.inputs);
    });

    it('transpiles different sources and debug settings separately', () => {
        const plain = new Indicator(source).prepare().fn;
        expect(new Indicator(source.replace('"cache"', '"other"')).prepare().fn).not.toBe(plain);
        expect(new Indicator(source).prepare({ debug: true }).fn).not.toBe(plain);
    });

    it('runs that share the function keep their own state and inputs', async () => {
        const run = (inputs: Record<string, unknown>) => new PineTS(bars, 'TEST', '1').run(new Indicator(source, inputs));
        const [a, b] = await Promise.all([run({ Length: 5 }), run({ Length: 20 })]);
        const aAlone = await run({ Length: 5 });
        expect(values(a.plots, 'sma')).toEqual(values(aAlone.plots, 'sma'));
        expect(values(a.plots, 'acc')).toEqual(values(aAlone.plots, 'acc'));
        expect(values(b.plots, 'sma')).not.toEqual(values(a.plots, 'sma'));
        expect(values(b.plots, 'acc')).toEqual(values(a.plots, 'acc'));
    });
});
