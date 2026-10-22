// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * What a request.security secondary context runs when the call site has no
 * transpile-time slice: the parent's own transpiled function, with the
 * parent's inputs.
 *
 * Before, the no-slice path called `run(context.pineTSCode)`: a full
 * re-transpile of the source, and after `runPretranspiled()` (where
 * pineTSCode is null) a crash in the transpiler (`run(null)`). Secondaries
 * also ran with no inputs at all, slice or not, so an input override never
 * reached a request.security expression. Only provenance-tagged compiled
 * artifacts may enter runPretranspiled; arbitrary wrappers are rejected.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider, Indicator } from 'index';

const chartStart = new Date('2019-01-01').getTime();
const chartEnd = new Date('2019-03-01').getTime();
const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, chartStart, chartEnd);

const code = `//@version=5
indicator("secondary script")
len = input.int(3, "Len")
plot(request.security(syminfo.tickerid, "W", ta.sma(close, len)), "w")
`;

const values = (ctx: any, key: string) => ctx.plots[key].data.map((d: any) => d.value);

function prepareWithoutSlices(indicator: Indicator, sourceMode: 'nativePine' | 'trustedJavaScript' = 'nativePine') {
    const previous = process.env.PINETS_DISABLE_LTF_SLICING;
    process.env.PINETS_DISABLE_LTF_SLICING = '1';
    try {
        const prepared = indicator.prepare({ sourceMode });
        expect((prepared.fn as any)._ltfSlices).toBeUndefined();
        return prepared;
    } finally {
        if (previous === undefined) delete process.env.PINETS_DISABLE_LTF_SLICING;
        else process.env.PINETS_DISABLE_LTF_SLICING = previous;
    }
}

describe('request.security secondary script', () => {
    it('runPretranspiled with a verified artifact that carries no slices runs the whole function in the secondary', async () => {
        const expected = values(await makePineTS().run(code), 'w');
        expect(expected.some((v: number) => Number.isFinite(v))).toBe(true);

        const prepared = prepareWithoutSlices(new Indicator(code));
        const ctx = await makePineTS().runPretranspiled(prepared.fn, prepared.inputs);
        expect(values(ctx, 'w')).toEqual(expected);
        const cached = ctx.cache[Object.keys(ctx.cache).find((key) => key.includes('BTCUSDC'))!];
        expect(cached.context.sourceMode).toBe('nativePine');
        expect(cached.context.executionBudget).toBe(ctx.executionBudget);
    });

    it('an input override reaches the request.security expression (slice path)', async () => {
        const withDefault5 = code.replace('input.int(3,', 'input.int(5,');
        const expected = values(await makePineTS().run(withDefault5), 'w');
        const overridden = values(await makePineTS().run(new Indicator(code, { Len: 5 })), 'w');
        expect(overridden).toEqual(expected);
        // …and differs from the default, so the check means something.
        expect(values(await makePineTS().run(code), 'w')).not.toEqual(expected);
    });

    it('an input override reaches the request.security expression (no-slice path)', async () => {
        const withDefault5 = code.replace('input.int(3,', 'input.int(5,');
        const expected = values(await makePineTS().run(withDefault5), 'w');
        const prepared = prepareWithoutSlices(new Indicator(code, { Len: 5 }));
        const ctx = await makePineTS().runPretranspiled(prepared.fn, prepared.inputs);
        expect(values(ctx, 'w')).toEqual(expected);
    });

    it('preserves explicit trusted JavaScript provenance in a no-slice secondary', async () => {
        const source = `async ($) => {
            const { close } = $.data;
            const { request, plotchar } = $.pine;
            const result = await request.security('BTCUSDC', 'W', close);
            plotchar(result, 'w');
        }`;
        const prepared = prepareWithoutSlices(new Indicator(source), 'trustedJavaScript');
        const ctx = await makePineTS().runPretranspiled(prepared.fn, prepared.inputs, undefined, { sourceMode: 'trustedJavaScript' });
        const cached = ctx.cache[Object.keys(ctx.cache).find((key) => key.includes('BTCUSDC'))!];
        expect(cached.context.sourceMode).toBe('trustedJavaScript');
        expect(cached.context.executionBudget).toBe(ctx.executionBudget);
    });
});
