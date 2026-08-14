// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Input Methods - Extended Coverage', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-10').getTime();

    describe('input.enum', () => {
        it('should handle enum input with default value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let mode = input.enum('Option1', 'Mode', ['Option1', 'Option2', 'Option3']);
                let match = mode === 'Option1' ? 1 : 0;
                
                plotchar(match, 'match');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['match'].data[0].value).toBe(1);
        });

        it('should handle enum with different selection', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let type = input.enum('Fast', 'Type', ['Slow', 'Medium', 'Fast']);
                let isFast = type === 'Fast' ? 1 : 0;
                let isSlow = type === 'Slow' ? 1 : 0;
                
                plotchar(isFast, 'isFast');
                plotchar(isSlow, 'isSlow');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isFast'].data[0].value).toBe(1);
            expect(plots['isSlow'].data[0].value).toBe(0);
        });

        it('should handle enum in conditional logic', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let maType = input.enum('SMA', 'MA Type', ['SMA', 'EMA', 'WMA']);
                let result = maType === 'SMA' ? 100 : (maType === 'EMA' ? 200 : 300);
                
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['result'].data[0].value).toBe(100);
        });
    });

    describe('input.price', () => {
        it('should handle price input with default value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let priceLevel = input.price(100, 'Price Level');
                
                plotchar(priceLevel, 'priceLevel');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['priceLevel'].data[0].value).toBe(100);
        });

        it('should handle price input with decimal values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let stopLoss = input.price(99.5, 'Stop Loss');
                let takeProfit = input.price(105.25, 'Take Profit');
                let diff = takeProfit - stopLoss;
                
                plotchar(stopLoss, 'stopLoss');
                plotchar(takeProfit, 'takeProfit');
                plotchar(diff, 'diff');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['stopLoss'].data[0].value).toBe(99.5);
            expect(plots['takeProfit'].data[0].value).toBe(105.25);
            expect(plots['diff'].data[0].value).toBeCloseTo(5.75);
        });

        it('should handle price input in calculations', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let basePrice = input.price(1000, 'Base Price');
                let multiplier = 1.5;
                let adjusted = basePrice * multiplier;
                
                plotchar(adjusted, 'adjusted');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['adjusted'].data[0].value).toBe(1500);
        });
    });

    describe('input.session', () => {
        it('should handle session input string', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let session = input.session('0930-1600', 'Trading Session');
                let match = session === '0930-1600' ? 1 : 0;
                
                plotchar(match, 'match');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['match'].data[0].value).toBe(1);
        });

        it('should handle different session formats', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let sessionUS = input.session('0930-1600', 'US Session');
                let sessionEU = input.session('0800-1700', 'EU Session');
                let isUS = sessionUS === '0930-1600' ? 1 : 0;
                
                plotchar(isUS, 'isUS');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isUS'].data[0].value).toBe(1);
        });

        it('should handle 24h session', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let session24h = input.session('0000-2400', '24/7 Session');
                let is24h = session24h === '0000-2400' ? 1 : 0;
                
                plotchar(is24h, 'is24h');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is24h'].data[0].value).toBe(1);
        });
    });

    describe('input.symbol', () => {
        it('should handle symbol input', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let symbol = input.symbol('BTCUSDC', 'Symbol');
                let match = symbol === 'BTCUSDC' ? 1 : 0;
                
                plotchar(match, 'match');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['match'].data[0].value).toBe(1);
        });

        it('should handle different symbols', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let symbol1 = input.symbol('ETHUSDC', 'Symbol 1');
                let symbol2 = input.symbol('BNBUSDC', 'Symbol 2');
                let match1 = symbol1 === 'ETHUSDC' ? 1 : 0;
                let match2 = symbol2 === 'BNBUSDC' ? 1 : 0;
                
                plotchar(match1, 'match1');
                plotchar(match2, 'match2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['match1'].data[0].value).toBe(1);
            expect(plots['match2'].data[0].value).toBe(1);
        });

        it('should handle symbol with exchange prefix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let symbol = input.symbol('BINANCE:BTCUSDC', 'Symbol with Exchange');
                let hasColon = symbol.indexOf(':') >= 0 ? 1 : 0;
                
                plotchar(hasColon, 'hasColon');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['hasColon'].data[0].value).toBe(1);
        });
    });

    describe('input.text_area', () => {
        it('should handle text area input', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let notes = input.text_area('Default notes', 'Notes');
                let match = notes === 'Default notes' ? 1 : 0;
                
                plotchar(match, 'match');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['match'].data[0].value).toBe(1);
        });

        it('should handle multiline text', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let description = input.text_area('Line 1\\nLine 2', 'Description');
                let hasNewline = description.indexOf('\\n') >= 0 ? 1 : 0;
                
                plotchar(hasNewline, 'hasNewline');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['hasNewline'].data[0].value).toBe(1);
        });

        it('should handle empty text area', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let empty = input.text_area('', 'Empty Text');
                let isEmpty = empty === '' ? 1 : 0;
                
                plotchar(isEmpty, 'isEmpty');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isEmpty'].data[0].value).toBe(1);
        });
    });

    describe('input.time', () => {
        it('should handle time input as timestamp', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let timestamp = input.time(1234567890000, 'Start Time');
                let match = timestamp === 1234567890000 ? 1 : 0;
                
                plotchar(match, 'match');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['match'].data[0].value).toBe(1);
        });

        it('should handle different timestamps', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let startTime = input.time(1700000000000, 'Start Time');
                let endTime = input.time(1700086400000, 'End Time');
                let duration = endTime - startTime;
                
                plotchar(duration, 'duration');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['duration'].data[0].value).toBe(86400000); // 1 day in ms
        });

        it('should handle time in conditional logic', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let cutoffTime = input.time(1600000000000, 'Cutoff Time');
                let currentTime = 1700000000000;
                let isAfter = currentTime > cutoffTime ? 1 : 0;
                
                plotchar(isAfter, 'isAfter');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isAfter'].data[0].value).toBe(1);
        });
    });

    describe('Combined input scenarios', () => {
        it('should handle multiple input types together', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let symbol = input.symbol('BTCUSDC', 'Symbol');
                let priceLevel = input.price(50000, 'Price Level');
                let session = input.session('0930-1600', 'Session');
                let mode = input.enum('Active', 'Mode', ['Active', 'Inactive']);
                
                let allCorrect = (symbol === 'BTCUSDC' && priceLevel === 50000 && 
                                 session === '0930-1600' && mode === 'Active') ? 1 : 0;
                
                plotchar(allCorrect, 'allCorrect');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['allCorrect'].data[0].value).toBe(1);
        });

        it('should use inputs in calculations', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { input, plotchar } = context.pine;
                
                let basePrice = input.price(100, 'Base Price');
                let multiplier = input.float(1.5, 'Multiplier');
                let additive = input.int(10, 'Additive');
                
                let result = (basePrice * multiplier) + additive;
                
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['result'].data[0].value).toBe(160); // (100 * 1.5) + 10
        });
    });
});

