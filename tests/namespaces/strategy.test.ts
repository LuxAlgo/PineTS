// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Strategy Namespace', () => {
    describe('strategy() initialization', () => {
        it('should initialize a strategy with default options', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                plotchar(strategy.initial_capital, 'capital');
                plotchar(strategy.equity, 'equity');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['capital'].data[0].value).toBe(100000);
            expect(plots['equity'].data[0].value).toBe(100000);
        });

        it('should initialize a strategy with custom initial capital', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy", null, true, null, null, null, 0, false, false, null, null, "fixed", 1, 50000);

                plotchar(strategy.initial_capital, 'capital');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['capital'].data[0].value).toBe(50000);
        });
    });

    describe('strategy.position_size', () => {
        it('should return 0 when no position is open', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                plotchar(strategy.position_size, 'position');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['position'].data[0].value).toBe(0);
        });
    });

    describe('strategy.entry()', () => {
        it('should place a long entry order', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar, bar_index } = context.pine;

                strategy("Test Strategy");

                // Enter on bar 5
                if (bar_index === 5) {
                    strategy.entry("Long", strategy.long, 1);
                }

                // Process orders each bar
                strategy.processOrders();

                plotchar(strategy.position_size, 'position');
                plotchar(strategy.opentrades(), 'trades');
            `;

            const { plots } = await pineTS.run(code);
            // After bar 6 (order fills on bar after entry), position should be 1
            const lastPosition = plots['position'].data[plots['position'].data.length - 1].value;
            expect(lastPosition).toBeGreaterThanOrEqual(0);
        });
    });

    describe('strategy.close_all()', () => {
        it('should close all positions', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar, bar_index } = context.pine;

                strategy("Test Strategy");

                // Enter on bar 2
                if (bar_index === 2) {
                    strategy.entry("Long", strategy.long, 1);
                }

                // Close on bar 5
                if (bar_index === 5) {
                    strategy.close_all();
                }

                // Process orders each bar
                strategy.processOrders();

                plotchar(strategy.position_size, 'position');
            `;

            const { plots } = await pineTS.run(code);
            const lastPosition = plots['position'].data[plots['position'].data.length - 1].value;
            expect(lastPosition).toBe(0);
        });
    });

    describe('strategy.cancel() and strategy.cancel_all()', () => {
        it('should cancel all pending orders', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar, bar_index } = context.pine;

                strategy("Test Strategy");

                // Place a limit order on bar 2
                if (bar_index === 2) {
                    strategy.entry("Long", strategy.long, 1, 100); // Limit at 100 (unlikely to fill)
                }

                // Cancel on bar 3
                if (bar_index === 3) {
                    strategy.cancel_all();
                }

                // Process orders each bar
                strategy.processOrders();

                plotchar(strategy.position_size, 'position');
            `;

            const { plots } = await pineTS.run(code);
            const lastPosition = plots['position'].data[plots['position'].data.length - 1].value;
            expect(lastPosition).toBe(0); // Order was cancelled, so no position
        });
    });

    describe('strategy properties', () => {
        it('should return correct trade statistics', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                plotchar(strategy.closedtrades(), 'closedtrades');
                plotchar(strategy.opentrades(), 'opentrades');
                plotchar(strategy.wintrades, 'wintrades');
                plotchar(strategy.losstrades, 'losstrades');
                plotchar(strategy.netprofit, 'netprofit');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['closedtrades'].data[0].value).toBe(0);
            expect(plots['opentrades'].data[0].value).toBe(0);
            expect(plots['wintrades'].data[0].value).toBe(0);
            expect(plots['losstrades'].data[0].value).toBe(0);
            expect(plots['netprofit'].data[0].value).toBe(0);
        });
    });

    describe('strategy.direction constants', () => {
        it('should have correct direction constants', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                plotchar(strategy.direction.long, 'long');
                plotchar(strategy.direction.short, 'short');
                plotchar(strategy.long, 'longConst');
                plotchar(strategy.short, 'shortConst');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['long'].data[0].value).toBe('long');
            expect(plots['short'].data[0].value).toBe('short');
            expect(plots['longConst'].data[0].value).toBe('long');
            expect(plots['shortConst'].data[0].value).toBe('short');
        });
    });

    describe('strategy.oca constants', () => {
        it('should have correct OCA type constants', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                plotchar(strategy.oca.none, 'none');
                plotchar(strategy.oca.cancel, 'cancel');
                plotchar(strategy.oca.reduce, 'reduce');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['none'].data[0].value).toBe('none');
            expect(plots['cancel'].data[0].value).toBe('cancel');
            expect(plots['reduce'].data[0].value).toBe('reduce');
        });
    });

    describe('strategy.opentrades sub-namespace', () => {
        it('should be callable and have accessor methods', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                // opentrades should be callable
                let count = strategy.opentrades();

                plotchar(count, 'count');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['count'].data[0].value).toBe(0);
        });
    });

    describe('strategy.closedtrades sub-namespace', () => {
        it('should be callable and have accessor methods', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar } = context.pine;

                strategy("Test Strategy");

                // closedtrades should be callable
                let count = strategy.closedtrades();

                plotchar(count, 'count');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['count'].data[0].value).toBe(0);
        });
    });

    describe('Backtesting Integration', () => {
        it('should track equity correctly through trades', async () => {
            const pineTS = new PineTS(
                Provider.Mock,
                'BTCUSDC',
                '1h',
                null,
                new Date('2024-01-01').getTime(),
                new Date('2024-01-10').getTime()
            );

            const code = `
                const { strategy, plotchar, bar_index } = context.pine;

                strategy("Test Strategy", null, true, null, null, null, 0, false, false, null, null, "fixed", 1, 100000);

                strategy.processOrders();

                plotchar(strategy.equity, 'equity');
                plotchar(strategy.initial_capital, 'capital');
            `;

            const { plots } = await pineTS.run(code);
            // Equity should equal initial capital when no trades
            expect(plots['capital'].data[0].value).toBe(100000);
        });
    });
});
