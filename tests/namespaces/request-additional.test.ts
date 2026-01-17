// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Request Additional Functions', () => {
    describe('request.seed()', () => {
        it('should return a numeric seed value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let seedVal = request.seed();

                plotchar(seedVal, 'seed');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['seed']).toBeDefined();
            expect(typeof plots['seed'].data[0].value).toBe('number');
            expect(plots['seed'].data[0].value).not.toBeNaN();
        });

        it('should return deterministic seed when given a string', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let seed1 = request.seed("test_seed");
                let seed2 = request.seed("test_seed");
                let seed3 = request.seed("different_seed");

                plotchar(seed1, 'seed1');
                plotchar(seed2, 'seed2');
                plotchar(seed3, 'seed3');
            `;

            const { plots } = await pineTS.run(code);
            // Same string should produce same seed
            expect(plots['seed1'].data[0].value).toBe(plots['seed2'].data[0].value);
            // Different string should produce different seed
            expect(plots['seed1'].data[0].value).not.toBe(plots['seed3'].data[0].value);
        });
    });

    describe('request.currency_rate()', () => {
        it('should return 1.0 for same currency', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let rate = request.currency_rate("USD", "USD");

                plotchar(rate, 'rate');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rate'].data[0].value).toBe(1.0);
        });

        it('should return a rate for common currency pairs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let usd_eur = request.currency_rate("USD", "EUR");
                let eur_usd = request.currency_rate("EUR", "USD");

                plotchar(usd_eur, 'usd_eur');
                plotchar(eur_usd, 'eur_usd');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['usd_eur'].data[0].value).toBeGreaterThan(0);
            expect(plots['eur_usd'].data[0].value).toBeGreaterThan(0);
            // Inverse rates should be approximately reciprocal
            const product = plots['usd_eur'].data[0].value * plots['eur_usd'].data[0].value;
            expect(product).toBeCloseTo(1.0, 1);
        });

        it('should return NaN for unknown currency pairs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let rate = request.currency_rate("XXX", "YYY");

                plotchar(rate, 'rate');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rate'].data[0].value).toBeNaN();
        });
    });

    describe('request.financial()', () => {
        it('should return NaN (data not available)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let revenue = request.financial("AAPL", "TOTAL_REVENUE");

                plotchar(revenue, 'revenue');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['revenue'].data[0].value).toBeNaN();
        });
    });

    describe('request.earnings()', () => {
        it('should return NaN (data not available)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let eps = request.earnings("AAPL", "actual");

                plotchar(eps, 'eps');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['eps'].data[0].value).toBeNaN();
        });
    });

    describe('request.dividends()', () => {
        it('should return NaN (data not available)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let div = request.dividends("AAPL", "gross");

                plotchar(div, 'div');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['div'].data[0].value).toBeNaN();
        });
    });

    describe('request.splits()', () => {
        it('should return NaN (data not available)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let split = request.splits("AAPL", "numerator");

                plotchar(split, 'split');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['split'].data[0].value).toBeNaN();
        });
    });

    describe('request.quandl()', () => {
        it('should return NaN (deprecated function)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { request, plotchar } = context.pine;

                let data = request.quandl("WIKI/AAPL");

                plotchar(data, 'data');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['data'].data[0].value).toBeNaN();
        });
    });
});
