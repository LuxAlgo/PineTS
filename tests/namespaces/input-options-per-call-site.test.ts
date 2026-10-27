// SPDX-License-Identifier: AGPL-3.0-only
// The arguments of an `input.*()` call are const by Pine's rules (all but `input.source` and
// `input()`, whose default is a series), so a call site's options are parsed on its first bar
// and reused, instead of on every bar.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';
import * as pineUtils from '../../src/namespaces/utils';

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
const BARS = 50;
const bars = Array.from({ length: BARS }, (_, i) => ({
    openTime: T0 + i * MINUTE,
    closeTime: T0 + (i + 1) * MINUTE,
    open: 100 + i,
    high: 102 + i,
    low: 98 + i,
    close: 101 + i,
    volume: 1,
}));

const code = `//@version=6
indicator("inputs")
len = input.int(3, "Length", minval = 1)
mult = input.float(2.0, "Mult", step = 0.5)
mode = input.string("A", "Mode", options = ["A", "B"])
src = input.source(close, "Source")
f() =>
    input.bool(true, "Flag")
plot(len, "len")
plot(mult, "mult")
plot(mode == "B" ? 1 : 0, "mode")
plot(src, "src")
plot(f() ? 1 : 0, "flag")
`;

// parseArgsForPineParams calls made for input options (the input argument types carry `confirm`).
function inputParseSpy() {
    const spy = vi.spyOn(pineUtils, 'parseArgsForPineParams');
    return () => spy.mock.calls.filter(([, , types]) => types && 'defval' in types && 'confirm' in types).length;
}

const last = (plots: any, name: string) => plots[name].data[plots[name].data.length - 1].value;

describe('input options', () => {
    afterEach(() => vi.restoreAllMocks());

    it('are parsed once per call site, except for series inputs', async () => {
        const inputParses = inputParseSpy();
        await new PineTS(bars, 'TEST', '1').run(code);
        // Four const call sites once each, input.source on every bar.
        expect(inputParses()).toBe(4 + BARS);
    });

    it('keep their defaults', async () => {
        const { plots } = await new PineTS(bars, 'TEST', '1').run(code);
        expect(last(plots, 'len')).toBe(3);
        expect(last(plots, 'mult')).toBe(2);
        expect(last(plots, 'mode')).toBe(0);
        expect(last(plots, 'src')).toBe(101 + BARS - 1);
        expect(last(plots, 'flag')).toBe(1);
    });

    it('keep applying overrides on every bar', async () => {
        const ind = new Indicator(code, { Length: 7, Mult: 0.5, Mode: 'B', Source: 'high', Flag: false });
        const { plots } = await new PineTS(bars, 'TEST', '1').run(ind);
        for (const p of plots['len'].data) expect(p.value).toBe(7);
        expect(last(plots, 'mult')).toBe(0.5);
        expect(last(plots, 'mode')).toBe(1);
        expect(plots['src'].data.map((p: any) => p.value)).toEqual(bars.map((b) => b.high));
        expect(last(plots, 'flag')).toBe(0);
    });

    it('preserves named and positional option lists while rejecting out-of-list overrides', async () => {
        const optionCode = `//@version=6
indicator("option lists")
named = input.string("A", "Named", options = ["A", "B"])
positional = input.int(1, "Positional", [1, 2])
plot(named == "B" ? 1 : 0, "named")
plot(positional, "positional")`;
        const run = (inputs: Record<string, unknown>) =>
            new PineTS(bars.slice(0, 3), 'TEST', '1').run(new Indicator(optionCode, inputs));

        const { plots } = await run({ Named: 'B', Positional: 2 });
        expect(last(plots, 'named')).toBe(1);
        expect(last(plots, 'positional')).toBe(2);
        await expect(run({ Named: 'C' })).rejects.toThrow(RangeError);
        await expect(run({ Positional: 3 })).rejects.toThrow(RangeError);
    });

    it('compares overrides with constant values in an option list', async () => {
        const optionCode = `//@version=6
indicator("constant options")
first = "high/low"
second = "close"
kind = input.string(first, "Kind", options = [first, second])
plot(kind == second ? 1 : 0, "kind")`;
        const { plots } = await new PineTS(bars.slice(0, 3), 'TEST', '1').run(new Indicator(optionCode, { Kind: 'close' }));
        expect(last(plots, 'kind')).toBe(1);
    });

    it('are not shared between runs with different overrides', async () => {
        const a = await new PineTS(bars, 'TEST', '1').run(new Indicator(code, { Length: 5 }));
        const b = await new PineTS(bars, 'TEST', '1').run(new Indicator(code, { Length: 9 }));
        expect(last(a.plots, 'len')).toBe(5);
        expect(last(b.plots, 'len')).toBe(9);
    });
});
