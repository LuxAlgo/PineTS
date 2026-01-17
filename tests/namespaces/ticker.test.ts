// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Ticker Namespace', () => {
    describe('ticker.new()', () => {
        it('should create a ticker identifier from prefix and symbol', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.new("BINANCE", "ETHUSDT");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:ETHUSDT');
        });

        it('should handle session and adjustment parameters', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.new("NYSE", "AAPL", "regular", "splits");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('NYSE:AAPL');
        });
    });

    describe('ticker.standard()', () => {
        it('should return symbol with prefix when already in PREFIX:SYMBOL format', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.standard("NASDAQ:AAPL");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('NASDAQ:AAPL');
        });

        it('should add prefix from syminfo when symbol has no prefix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.standard("AAPL");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            // With syminfo.prefix available (BINANCE from Mock), it adds the prefix
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:AAPL');
        });
    });

    describe('ticker.modify()', () => {
        it('should return the ticker identifier', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.modify("BINANCE:BTCUSDT", "extended", "dividends");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT');
        });
    });

    describe('ticker.heikinashi()', () => {
        it('should create a Heikin-Ashi ticker identifier', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.heikinashi("BINANCE:BTCUSDT");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT#HA');
        });

        it('should use current symbol when no argument provided', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar, syminfo } = context.pine;

                let tickerId = ticker.heikinashi();

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            // Should include #HA suffix
            expect(plots['tickerId'].data[0].value).toContain('#HA');
        });
    });

    describe('ticker.renko()', () => {
        it('should create a Renko ticker identifier', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.renko("BINANCE:BTCUSDT", 100, "Traditional");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT#RENKO_100_Traditional');
        });
    });

    describe('ticker.linebreak()', () => {
        it('should create a Line Break ticker identifier', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.linebreak("BINANCE:BTCUSDT", 3);

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT#LB_3');
        });
    });

    describe('ticker.kagi()', () => {
        it('should create a Kagi ticker identifier', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.kagi("BINANCE:BTCUSDT", 5);

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT#KAGI_5');
        });
    });

    describe('ticker.pointfigure()', () => {
        it('should create a Point & Figure ticker identifier', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.pointfigure("BINANCE:BTCUSDT", "hl", 100, 3);

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT#PF_hl_100_3');
        });
    });

    describe('ticker.inherit()', () => {
        it('should create a ticker inheriting prefix from another ticker', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.inherit("BINANCE:BTCUSDT", "ETHUSDT");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:ETHUSDT');
        });

        it('should return from_tickerid when no symbol provided', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { ticker, plotchar } = context.pine;

                let tickerId = ticker.inherit("BINANCE:BTCUSDT");

                plotchar(tickerId, 'tickerId');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['tickerId'].data[0].value).toBe('BINANCE:BTCUSDT');
        });
    });
});
