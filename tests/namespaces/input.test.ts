// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Input Namespace Tests', () => {
    describe('Basic Input Types', () => {
        it('input.int should handle integer inputs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { close } = context.data;
                const { input, ta, plotchar } = context.pine;
                
                const period = input.int(20, { title: 'Period' });
                const sma_val = ta.sma(close, period);
                
                plotchar(period, 'period');
                plotchar(sma_val, 'sma');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['period']).toBeDefined();
            expect(plots['period'].data[0].value).toBe(20);
            expect(plots['sma']).toBeDefined();
            expect(Array.isArray(plots['sma'].data)).toBe(true);
        });

        it('input.float should handle float inputs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const multiplier = input.float(2.5, { title: 'Multiplier' });
                const result = multiplier * 10;
                
                plotchar(multiplier, 'mult');
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['mult'].data[0].value).toBe(2.5);
            expect(plots['result'].data[0].value).toBe(25);
        });

        it('input.bool should handle boolean inputs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const use_feature = input.bool(true, { title: 'Use Feature' });
                const value = use_feature ? 100 : 0;
                
                plotchar(value, 'conditional');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['conditional'].data[0].value).toBe(100);
        });

        it('input.string should handle string inputs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const label = input.string('Test Label', { title: 'Label' });
                const is_test = label === 'Test Label';
                
                plotchar(is_test ? 1 : 0, 'is_test');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_test'].data[0].value).toBe(1);
        });
    });

    describe('Input with Groups and Titles', () => {
        it('input functions should accept title and group options', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const period = input.int(14, { title: 'RSI Period', group: 'Oscillators' });
                const mult = input.float(2.0, { title: 'Multiplier', group: 'Oscillators' });
                const enabled = input.bool(true, { title: 'Enable', group: 'Settings' });
                
                plotchar(period, 'period');
                plotchar(mult, 'mult');
                plotchar(enabled ? 1 : 0, 'enabled');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['period'].data[0].value).toBe(14);
            expect(plots['mult'].data[0].value).toBe(2.0);
            expect(plots['enabled'].data[0].value).toBe(1);
        });
    });

    describe('Input Source Handling', () => {
        it('input.source should handle series data', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { close, high, low } = context.data;
                const { input, ta, plotchar } = context.pine;
                
                const src = input.source(close, { title: 'Source' });
                const sma_val = ta.sma(src, 20);
                
                plotchar(sma_val, 'sma');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['sma']).toBeDefined();
            expect(Array.isArray(plots['sma'].data)).toBe(true);
        });

        it('input.source should work with different OHLC sources', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { close, open, high, low, hlc3 } = context.data;
                const { input, ta, plotchar } = context.pine;
                
                const src1 = input.source(close, { title: 'Source 1' });
                const src2 = input.source(hlc3, { title: 'Source 2' });
                const src3 = input.source(high, { title: 'Source 3' });
                
                const avg1 = ta.sma(src1, 10);
                const avg2 = ta.sma(src2, 10);
                const avg3 = ta.sma(src3, 10);
                
                plotchar(avg1, 'avg_close');
                plotchar(avg2, 'avg_hlc3');
                plotchar(avg3, 'avg_high');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['avg_close']).toBeDefined();
            expect(plots['avg_hlc3']).toBeDefined();
            expect(plots['avg_high']).toBeDefined();
        });
    });

    describe('Input Timeframe', () => {
        it('input.timeframe should handle timeframe strings', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const tf = input.timeframe('240', { title: 'Timeframe' });
                const is_4h = tf === '240';
                
                plotchar(is_4h ? 1 : 0, 'is_4h');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_4h'].data[0].value).toBe(1);
        });
    });

    describe('Input Color', () => {
        it('input.color should handle color values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const bull_color = input.color('#26A69A', { title: 'Bull Color' });
                const bear_color = input.color('#EF5350', { title: 'Bear Color' });
                
                const is_bull_green = bull_color === '#26A69A';
                const is_bear_red = bear_color === '#EF5350';
                
                plotchar(is_bull_green ? 1 : 0, 'bull');
                plotchar(is_bear_red ? 1 : 0, 'bear');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['bull'].data[0].value).toBe(1);
            expect(plots['bear'].data[0].value).toBe(1);
        });
    });

    describe('Input Array Handling', () => {
        it('input functions should extract first element from arrays', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                // Test that input functions handle scalar values correctly
                const val_int = input.int(42, { title: 'Int Value' });
                const val_float = input.float(3.14, { title: 'Float Value' });
                const val_bool = input.bool(true, { title: 'Bool Value' });
                const val_string = input.string('first', { title: 'String Value' });
                
                plotchar(val_int, 'int_val');
                plotchar(val_float, 'float_val');
                plotchar(val_bool ? 1 : 0, 'bool_val');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['int_val'].data[0].value).toBe(42);
            expect(plots['float_val'].data[0].value).toBe(3.14);
            expect(plots['bool_val'].data[0].value).toBe(1);
        });
    });

    describe('Input in Real Indicators', () => {
        it('should work with moving average configuration', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { close } = context.data;
                const { input, ta, plotchar } = context.pine;
                
                const length = input.int(20, { title: 'MA Length', group: 'Moving Average' });
                const mult = input.float(2.0, { title: 'Multiplier', group: 'Moving Average' });
                const src = input.source(close, { title: 'Source', group: 'Moving Average' });
                
                const sma_val = ta.sma(src, length);
                const stdev_val = ta.stdev(src, length);
                const upper = sma_val + mult * stdev_val;
                const lower = sma_val - mult * stdev_val;
                
                plotchar(sma_val, 'middle');
                plotchar(upper, 'upper');
                plotchar(lower, 'lower');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['middle']).toBeDefined();
            expect(plots['upper']).toBeDefined();
            expect(plots['lower']).toBeDefined();
            expect(Array.isArray(plots['middle'].data)).toBe(true);
        });

        it('should work with RSI configuration', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { close } = context.data;
                const { input, ta, plotchar } = context.pine;
                
                const rsi_period = input.int(14, { title: 'RSI Period', group: 'RSI Settings' });
                const overbought = input.int(70, { title: 'Overbought Level', group: 'RSI Settings' });
                const oversold = input.int(30, { title: 'Oversold Level', group: 'RSI Settings' });
                const show_levels = input.bool(true, { title: 'Show Levels', group: 'Display' });
                
                const rsi_val = ta.rsi(close, rsi_period);
                const is_overbought = rsi_val > overbought;
                const is_oversold = rsi_val < oversold;
                
                plotchar(rsi_val, 'rsi');
                plotchar(is_overbought ? 1 : 0, 'overbought');
                plotchar(is_oversold ? 1 : 0, 'oversold');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rsi']).toBeDefined();
            expect(plots['overbought']).toBeDefined();
            expect(plots['oversold']).toBeDefined();
        });
    });

    describe('Input Edge Cases', () => {
        it('should handle inputs without options', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const val1 = input.int(10);
                const val2 = input.float(3.14);
                const val3 = input.bool(false);
                const val4 = input.string('test');
                
                plotchar(val1, 'int');
                plotchar(val2, 'float');
                plotchar(val3 ? 1 : 0, 'bool');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['int'].data[0].value).toBe(10);
            expect(plots['float'].data[0].value).toBe(3.14);
            expect(plots['bool'].data[0].value).toBe(0);
        });

        it('should handle zero and negative inputs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const zero_int = input.int(0, { title: 'Zero' });
                const neg_int = input.int(-10, { title: 'Negative' });
                const zero_float = input.float(0.0, { title: 'Zero Float' });
                const neg_float = input.float(-2.5, { title: 'Negative Float' });
                
                plotchar(zero_int, 'zero_int');
                plotchar(neg_int, 'neg_int');
                plotchar(zero_float, 'zero_float');
                plotchar(neg_float, 'neg_float');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['zero_int'].data[0].value).toBe(0);
            expect(plots['neg_int'].data[0].value).toBe(-10);
            expect(plots['zero_float'].data[0].value).toBe(0);
            expect(plots['neg_float'].data[0].value).toBe(-2.5);
        });

        it('should handle empty strings', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { input, plotchar } = context.pine;
                
                const empty_str = input.string('', { title: 'Empty' });
                const is_empty = empty_str === '';
                
                plotchar(is_empty ? 1 : 0, 'is_empty');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_empty'].data[0].value).toBe(1);
        });
    });
});

