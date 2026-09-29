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
 * reached a request.security expression.
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

describe('request.security secondary script', () => {
    it('runPretranspiled with a function that carries no slices runs the whole function in the secondary', async () => {
        const expected = values(await makePineTS().run(code), 'w');
        expect(expected.some((v: number) => Number.isFinite(v))).toBe(true);

        // A host wrapping the prepared function (to instrument the context)
        // hands PineTS a function without `_ltfSlices`.
        const prepared = new Indicator(code).prepare();
        const wrapped = async ($: any) => prepared.fn($);
        const ctx = await makePineTS().runPretranspiled(wrapped, prepared.inputs);
        expect(values(ctx, 'w')).toEqual(expected);
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
        const prepared = new Indicator(code, { Len: 5 }).prepare();
        const wrapped = async ($: any) => prepared.fn($);
        const ctx = await makePineTS().runPretranspiled(wrapped, prepared.inputs);
        expect(values(ctx, 'w')).toEqual(expected);
    });
});
