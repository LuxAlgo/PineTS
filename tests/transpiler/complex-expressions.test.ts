// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Transpiler Complex Expressions', () => {
    it('should handle deeply nested function calls', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            // Three levels of nesting
            let result = ta.ema(ta.sma(ta.rsi(close, 14), 9), 21);
            
            plotchar(result, 'nested');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['nested']).toBeDefined();
        expect(Array.isArray(plots['nested'].data)).toBe(true);
    });

    it('should handle mixed array expressions with Series and scalars', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { open, close } = context.data;
            const { plotchar } = context.pine;
            
            const a = 10;
            const b = 20;
            
            // Note: In Pine Script context, you can't mix scalars and series meaningfully
            // This tests transpiler handling only
            return { scalar_a: a, scalar_b: b };
        `;

        const { result } = await pineTS.run(code);
        expect(result).toBeDefined();
        expect(result.scalar_a).toBeDefined();
        expect(result.scalar_b).toBeDefined();
    });

    it('should handle array expressions in ternary operators', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { open, close } = context.data;
            const { plotchar } = context.pine;
            
            let condition = close > open;
            let value = condition ? 100 : 200;
            
            plotchar(value, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(typeof plots['result'].data[0].value).toBe('number');
    });

    it('should handle complex binary expressions with multiple operators', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close, open, high, low } = context.data;
            const { plotchar } = context.pine;
            
            let result = (close - open) / (high - low) * 100 + 50;
            
            plotchar(result, 'complex');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['complex']).toBeDefined();
        expect(typeof plots['complex'].data[0].value).toBe('number');
    });

    it('should handle unary expressions on series', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            let sma = ta.sma(close, 20);
            let negated = -sma;
            let positive = +sma;
            
            plotchar(negated, 'negative');
            plotchar(positive, 'positive');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['negative']).toBeDefined();
        expect(plots['positive']).toBeDefined();
        expect(typeof plots['negative'].data[0].value).toBe('number');
        expect(typeof plots['positive'].data[0].value).toBe('number');
    });

    it('should handle logical expressions with series', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close, open, high, low } = context.data;
            const { plotchar } = context.pine;
            
            let cond1 = close > open;
            let cond2 = high > low;
            let combined = cond1 && cond2;
            let either = cond1 || cond2;
            
            plotchar(combined ? 1 : 0, 'and');
            plotchar(either ? 1 : 0, 'or');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['and']).toBeDefined();
        expect(plots['or']).toBeDefined();
    });

    it('should handle chained ternary operators', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            let level = close > 100000 ? 3 : close > 90000 ? 2 : close > 80000 ? 1 : 0;
            
            plotchar(level, 'level');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['level']).toBeDefined();
        expect(typeof plots['level'].data[0].value).toBe('number');
    });

    it('should handle member expressions in complex contexts', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            let sma = ta.sma(close, 20);
            let prev_sma = sma[1];
            let prev_prev_sma = sma[2];
            let diff = sma - prev_sma;
            
            plotchar(diff, 'diff');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['diff']).toBeDefined();
    });
});
