// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Transpiler Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        await expect(pineTS.run('let x = ;')).rejects.toThrow();
    });

    it('should handle empty code', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const { result } = await pineTS.run('');
        expect(result).toBeDefined();
    });

    it('should handle long variable names', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        // Use a reasonable but still long variable name
        const longVarName = 'variable_with_a_very_long_descriptive_name';
        const code = `
            const { close } = context.data;
            const { ta, plot, plotchar } = context.pine;
            let ${longVarName} = ta.sma(close, 20);
            plotchar(${longVarName}, 'test');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['test']).toBeDefined();
        expect(plots['test'].data).toBeDefined();
        expect(plots['test'].data.length).toBeGreaterThan(0);
    });

    it('should handle malformed function calls', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        await expect(pineTS.run('ta.sma(')).rejects.toThrow();
    });

    it('should handle invalid destructuring', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        await expect(pineTS.run('const { = close;')).rejects.toThrow();
    });

    it('should handle code with only comments', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            // This is just a comment
            /* Another comment */
        `;

        const { result } = await pineTS.run(code);
        expect(result).toBeDefined();
    });

    it('should handle code with only whitespace', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = '   \n\n\t\t   \n  ';

        const { result } = await pineTS.run(code);
        expect(result).toBeDefined();
    });

    it('should handle object returns with user variables', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta } = context.pine;
            let sma = ta.sma(close, 20);
            let ema = ta.ema(close, 20);
            return { sma: sma, ema: ema };
        `;

        const { result } = await pineTS.run(code);
        expect(result).toBeDefined();
        expect(result.sma).toBeDefined();
        expect(result.ema).toBeDefined();
        expect(Array.isArray(result.sma)).toBe(true);
        expect(Array.isArray(result.ema)).toBe(true);
        expect(result.sma.length).toBeGreaterThan(0);
        expect(result.ema.length).toBeGreaterThan(0);
    });

    it('should handle object returns with shorthand properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta } = context.pine;
            let sma = ta.sma(close, 20);
            let ema = ta.ema(close, 20);
            return { sma, ema };
        `;

        const { result } = await pineTS.run(code);
        expect(result).toBeDefined();
        expect(result.sma).toBeDefined();
        expect(result.ema).toBeDefined();
        expect(Array.isArray(result.sma)).toBe(true);
        expect(Array.isArray(result.ema)).toBe(true);
    });
});
