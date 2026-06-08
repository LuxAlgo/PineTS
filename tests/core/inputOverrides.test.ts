// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';
import { Provider } from '@pinets/marketData/Provider.class';

/**
 * Override resolution for `input.*()` declarations. Overrides flow in via
 * `new Indicator(source, inputs)` → `run()` → `context.inputs`, and are
 * resolved in `resolveInput` by the input's stable positional name
 * (`title ?? input_<index>`) — the SAME key `introspectInputs` reports as
 * `PineInputDeclaration.name`. This is the round-trip the host UI relies on:
 * GET the schema, edit values keyed by `name`, PASS them back here.
 *
 * Tests return the resolved value from the script body so it surfaces on
 * `context.result.<key>` (a plain array in bar order; latest is last).
 */
describe('input.* overrides', () => {
    const newPine = () => new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
    const last = (arr: any[]) => arr[arr.length - 1];

    it('uses defval when no override is supplied', async () => {
        const ctx = await newPine().run(($: any) => {
            const { input } = $.pine;
            return { len: input.int(14, 'Length') };
        });
        expect(last(ctx.result.len)).toBe(14);
    });

    it('overrides a titled input by its title (== name)', async () => {
        const ctx = await newPine().run(
            new Indicator(($: any) => {
                const { input } = $.pine;
                return { len: input.int(14, 'Length') };
            }, { Length: 21 }),
        );
        expect(last(ctx.result.len)).toBe(21);
    });

    it('overrides an UNTITLED input by its positional name input_<index>', async () => {
        const ctx = await newPine().run(
            new Indicator(($: any) => {
                const { input } = $.pine;
                return { len: input.int(14) };
            }, { input_0: 21 }),
        );
        expect(last(ctx.result.len)).toBe(21);
    });

    it('keys multiple inputs by stable position, independent of value', async () => {
        const ctx = await newPine().run(
            new Indicator(($: any) => {
                const { input } = $.pine;
                return {
                    a: input.int(14, 'Length'),
                    b: input.float(2.5, 'Mult'),
                    c: input.bool(true, 'Show'),
                };
            }, { Length: 30, Mult: 4.5, Show: false }),
        );
        expect(last(ctx.result.a)).toBe(30);
        expect(last(ctx.result.b)).toBe(4.5);
        expect(last(ctx.result.c)).toBe(false);
    });

    it('overrides only the inputs present in the map; others fall back to defval', async () => {
        const ctx = await newPine().run(
            new Indicator(($: any) => {
                const { input } = $.pine;
                return {
                    a: input.int(14, 'Length'),
                    b: input.float(2.5, 'Mult'),
                };
            }, { Mult: 9.9 }),
        );
        expect(last(ctx.result.a)).toBe(14); // untouched → defval
        expect(last(ctx.result.b)).toBe(9.9); // overridden
    });

    it('threads overrides through stream() options.inputs (raw-source caller path)', async () => {
        // The chart host passes a code string + options bag (no Indicator
        // wrapper), so this is the path checkout's stream hook uses.
        const pineTS = newPine();
        const resolved = await new Promise<number>((resolve, reject) => {
            const handle = pineTS.stream(
                ($: any) => {
                    const { input } = $.pine;
                    return { len: input.int(14, 'Length') };
                },
                { pageSize: 5, live: false, inputs: { Length: 21 } },
            );
            handle.on('data', (ctx: any) => {
                const len = ctx.result?.len;
                if (len === undefined) return; // ignore pages before result populates
                handle.stop();
                resolve(last(len));
            });
            handle.on('error', reject);
        });
        expect(resolved).toBe(21);
    });

    it('resets the positional counter each bar so overrides hold across all bars', async () => {
        const ctx = await newPine().run(
            new Indicator(($: any) => {
                const { input } = $.pine;
                return { len: input.int(14, 'Length') };
            }, { Length: 21 }),
        );
        // Every bar's resolved value should be the override, not just the last.
        expect(ctx.result.len.every((v: number) => v === 21)).toBe(true);
    });
});
