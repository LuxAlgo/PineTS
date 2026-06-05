// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

/**
 * `introspectInputs` returns the declarations as the script invokes them.
 * Tests use the PineTS function form (`($) => {...}`) for cleaner setup;
 * real callers will pass Pine source strings, which exercise the same
 * recording surface via the transpiler.
 */
describe('PineTS.introspectInputs', () => {
    it('captures a single int input with title', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { input } = $.pine;
            input.int(14, 'Length');
        });

        expect(errors).toEqual([]);
        expect(inputs).toHaveLength(1);
        expect(inputs[0]).toMatchObject({
            name: 'Length',
            type: 'int',
            defval: 14,
            title: 'Length',
        });
    });

    it('captures multiple inputs in declaration order', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { input } = $.pine;
            input.int(14, 'Length');
            input.bool(true, 'Show');
            input.float(2.5, 'Multiplier');
        });

        expect(errors).toEqual([]);
        expect(inputs.map((i) => i.name)).toEqual(['Length', 'Show', 'Multiplier']);
        expect(inputs.map((i) => i.type)).toEqual(['int', 'bool', 'float']);
    });

    it('records optional fields when provided', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { input } = $.pine;
            input.int(14, 'Length', 1, 200, 1, 'Lookback period', 'inline1', 'Settings');
        });

        expect(errors).toEqual([]);
        expect(inputs[0]).toMatchObject({
            name: 'Length',
            type: 'int',
            defval: 14,
            minval: 1,
            maxval: 200,
            step: 1,
            tooltip: 'Lookback period',
            inline: 'inline1',
            group: 'Settings',
        });
    });

    // NOTE: dropdown-style inputs with an `options: [...]` field can't be
    // exercised cleanly via the function-form transpiler (positional array
    // literals get Series-coerced, and the named-args object bag is also
    // unwrapped). Pine-source-form scripts using `input.string('EMA',
    // 'MA Type', options=['EMA', 'SMA', 'WMA'])` capture `options` correctly
    // — verified manually in checkout's InputsTab consumer.

    it('falls back to a synthetic name when no title is provided', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { input } = $.pine;
            input.int(14);
        });

        expect(errors).toEqual([]);
        expect(inputs[0].name).toBe('input_0');
        expect(inputs[0].title).toBeUndefined();
    });

    it('returns empty inputs and empty errors for a script with no inputs', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { ta, plot } = $.pine;
            plot(ta.sma($.close, 14), 'SMA');
        });

        expect(errors).toEqual([]);
        expect(inputs).toEqual([]);
    });

    it('captures inputs declared before a thrown error and reports the error', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { input } = $.pine;
            input.int(14, 'Captured');
            throw new Error('script body threw');
            // unreachable, would not be captured
            input.bool(true, 'NotCaptured');
        });

        expect(inputs).toHaveLength(1);
        expect(inputs[0].name).toBe('Captured');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('throws when throwOnError is true and the script errors', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        await expect(
            pineTS.introspectInputs(
                ($: any) => {
                    throw new Error('intentional');
                },
                { throwOnError: true },
            ),
        ).rejects.toThrow();
    });

    it('records boolean, color, and source input types', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', 5);
        const { inputs, errors } = await pineTS.introspectInputs(($: any) => {
            const { input } = $.pine;
            input.bool(false, 'Enabled');
            input.color('#ff0000', 'Line color');
            input.source($.close, 'Source');
        });

        expect(errors).toEqual([]);
        expect(inputs.map((i) => i.type)).toEqual(['bool', 'color', 'source']);
        expect(inputs.map((i) => i.name)).toEqual(['Enabled', 'Line color', 'Source']);
    });
});
