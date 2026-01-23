import { describe, expect, it } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { ISymbolInfo } from '../../src/marketData/IProvider';

describe('Syminfo Namespace', () => {
    // Mock symbol info data
    const mockSymbolInfo: ISymbolInfo = {
        // Symbol Identification
        current_contract: 'BTCUSDT',
        description: 'Bitcoin / Tether',
        isin: '',
        main_tickerid: 'BINANCE:BTCUSDT',
        prefix: 'BINANCE',
        root: 'BTC',
        ticker: 'BTCUSDT',
        tickerid: 'BINANCE:BTCUSDT',
        type: 'crypto',

        // Currency & Location
        basecurrency: 'BTC',
        country: '',
        currency: 'USDT',
        timezone: 'Etc/UTC',

        // Company Data
        employees: 0,
        industry: '',
        sector: '',
        shareholders: 0,
        shares_outstanding_float: 0,
        shares_outstanding_total: 0,

        // Session & Market
        expiration_date: 0,
        session: '24x7',
        volumetype: 'base',

        // Price & Contract Info
        mincontract: 0.001,
        minmove: 1,
        mintick: 0.01,
        pointvalue: 1,
        pricescale: 100,

        // Analyst Ratings
        recommendations_buy: 10,
        recommendations_buy_strong: 5,
        recommendations_date: 1704067200000,
        recommendations_hold: 3,
        recommendations_sell: 2,
        recommendations_sell_strong: 1,
        recommendations_total: 21,

        // Price Targets
        target_price_average: 50000,
        target_price_date: 1704067200000,
        target_price_estimates: 15,
        target_price_high: 100000,
        target_price_low: 30000,
        target_price_median: 48000,
    };

    // Mock provider that returns symbol info
    const createMockProvider = () => ({
        getMarketData: async () => [
            { open: 10, high: 20, low: 5, close: 15, volume: 100, openTime: Date.now(), closeTime: Date.now() + 1000 },
            { open: 15, high: 25, low: 10, close: 20, volume: 200, openTime: Date.now() + 86400000, closeTime: Date.now() + 86400000 + 1000 },
        ],
        getSymbolInfo: async () => mockSymbolInfo,
    });

    const last = (arr: any[]) => {
        if (!arr || arr.length === 0) return undefined;
        return arr[arr.length - 1];
    };

    describe('Property Access', () => {
        it('should return correct symbol identification properties', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    ticker: syminfo.ticker.toString(),
                    prefix: syminfo.prefix.toString(),
                    tickerid: syminfo.tickerid,
                    description: syminfo.description,
                    type: syminfo.type,
                    root: syminfo.root,
                    current_contract: syminfo.current_contract,
                    main_tickerid: syminfo.main_tickerid,
                    isin: syminfo.isin,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.ticker)).toBe('BTCUSDT');
            expect(last(result.prefix)).toBe('BINANCE');
            expect(last(result.tickerid)).toBe('BINANCE:BTCUSDT');
            expect(last(result.description)).toBe('Bitcoin / Tether');
            expect(last(result.type)).toBe('crypto');
            expect(last(result.root)).toBe('BTC');
            expect(last(result.current_contract)).toBe('BTCUSDT');
            expect(last(result.main_tickerid)).toBe('BINANCE:BTCUSDT');
        });

        it('should return correct currency and location properties', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    basecurrency: syminfo.basecurrency,
                    currency: syminfo.currency,
                    country: syminfo.country,
                    timezone: syminfo.timezone,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.basecurrency)).toBe('BTC');
            expect(last(result.currency)).toBe('USDT');
            expect(last(result.timezone)).toBe('Etc/UTC');
        });

        it('should return correct price and contract info', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    mintick: syminfo.mintick,
                    minmove: syminfo.minmove,
                    mincontract: syminfo.mincontract,
                    pointvalue: syminfo.pointvalue,
                    pricescale: syminfo.pricescale,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.mintick)).toBe(0.01);
            expect(last(result.minmove)).toBe(1);
            expect(last(result.mincontract)).toBe(0.001);
            expect(last(result.pointvalue)).toBe(1);
            expect(last(result.pricescale)).toBe(100);
        });

        it('should return correct session and market properties', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    session: syminfo.session,
                    volumetype: syminfo.volumetype,
                    expiration_date: syminfo.expiration_date,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.session)).toBe('24x7');
            expect(last(result.volumetype)).toBe('base');
        });

        it('should return correct analyst ratings', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    recommendations_buy: syminfo.recommendations_buy,
                    recommendations_buy_strong: syminfo.recommendations_buy_strong,
                    recommendations_hold: syminfo.recommendations_hold,
                    recommendations_sell: syminfo.recommendations_sell,
                    recommendations_sell_strong: syminfo.recommendations_sell_strong,
                    recommendations_total: syminfo.recommendations_total,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.recommendations_buy)).toBe(10);
            expect(last(result.recommendations_buy_strong)).toBe(5);
            expect(last(result.recommendations_hold)).toBe(3);
            expect(last(result.recommendations_sell)).toBe(2);
            expect(last(result.recommendations_sell_strong)).toBe(1);
            expect(last(result.recommendations_total)).toBe(21);
        });

        it('should return correct price targets', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    target_price_average: syminfo.target_price_average,
                    target_price_high: syminfo.target_price_high,
                    target_price_low: syminfo.target_price_low,
                    target_price_median: syminfo.target_price_median,
                    target_price_estimates: syminfo.target_price_estimates,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.target_price_average)).toBe(50000);
            expect(last(result.target_price_high)).toBe(100000);
            expect(last(result.target_price_low)).toBe(30000);
            expect(last(result.target_price_median)).toBe(48000);
            expect(last(result.target_price_estimates)).toBe(15);
        });
    });

    describe('Callable Functions', () => {
        it('syminfo.prefix() should extract exchange from tickerid string', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    prefix_nasdaq: syminfo.prefix('NASDAQ:AAPL'),
                    prefix_nyse: syminfo.prefix('NYSE:IBM'),
                    prefix_binance: syminfo.prefix('BINANCE:BTCUSDT'),
                    prefix_no_colon: syminfo.prefix('AAPL'),
                    prefix_empty: syminfo.prefix(''),
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.prefix_nasdaq)).toBe('NASDAQ');
            expect(last(result.prefix_nyse)).toBe('NYSE');
            expect(last(result.prefix_binance)).toBe('BINANCE');
            expect(last(result.prefix_no_colon)).toBe('');
            expect(last(result.prefix_empty)).toBe('');
        });

        it('syminfo.ticker() should extract symbol from tickerid string', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    ticker_nasdaq: syminfo.ticker('NASDAQ:AAPL'),
                    ticker_nyse: syminfo.ticker('NYSE:IBM'),
                    ticker_binance: syminfo.ticker('BINANCE:BTCUSDT'),
                    ticker_no_colon: syminfo.ticker('AAPL'),
                    ticker_empty: syminfo.ticker(''),
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.ticker_nasdaq)).toBe('AAPL');
            expect(last(result.ticker_nyse)).toBe('IBM');
            expect(last(result.ticker_binance)).toBe('BTCUSDT');
            expect(last(result.ticker_no_colon)).toBe('AAPL');
            expect(last(result.ticker_empty)).toBe('');
        });

        it('syminfo.prefix() without argument should return current symbol prefix', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                // Call without arguments - should return current symbol's prefix
                return {
                    current_prefix: syminfo.prefix(),
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.current_prefix)).toBe('BINANCE');
        });

        it('syminfo.ticker() without argument should return current symbol ticker', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                // Call without arguments - should return current symbol's ticker
                return {
                    current_ticker: syminfo.ticker(),
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.current_ticker)).toBe('BTCUSDT');
        });
    });

    describe('String Coercion', () => {
        it('syminfo.prefix should work with string concatenation', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    concat: syminfo.prefix + ':' + syminfo.ticker,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.concat)).toBe('BINANCE:BTCUSDT');
        });

        it('syminfo.ticker should coerce to string correctly', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    ticker_str: String(syminfo.ticker),
                    ticker_template: `Symbol: ${syminfo.ticker}`,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.ticker_str)).toBe('BTCUSDT');
            expect(last(result.ticker_template)).toBe('Symbol: BTCUSDT');
        });
    });

    describe('Default Values', () => {
        it('should return default values when no symbol info is provided', async () => {
            // Using mock data directly (no provider) - no symbol info will be set
            const mockData = [
                { open: 10, high: 20, low: 5, close: 15, volume: 100, openTime: Date.now(), closeTime: Date.now() + 1000 },
            ];
            const pineTS = new PineTS(mockData, 'TEST', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    ticker: syminfo.ticker.toString(),
                    prefix: syminfo.prefix.toString(),
                    mintick: syminfo.mintick,
                    timezone: syminfo.timezone,
                    pointvalue: syminfo.pointvalue,
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.ticker)).toBe('');
            expect(last(result.prefix)).toBe('');
            expect(last(result.mintick)).toBe(0.01);
            expect(last(result.timezone)).toBe('Etc/UTC');
            expect(last(result.pointvalue)).toBe(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle multiple colons in tickerid', async () => {
            const pineTS = new PineTS(createMockProvider(), 'BTCUSDT', 'D');
            const ctx = await pineTS.run((context) => {
                const { syminfo } = context.pine;
                return {
                    // Edge case: multiple colons (takes first part as prefix, rest as ticker)
                    prefix_multi: syminfo.prefix('EXCHANGE:SYMBOL:EXTRA'),
                    ticker_multi: syminfo.ticker('EXCHANGE:SYMBOL:EXTRA'),
                };
            });
            const result = ctx.result;

            expect(result).toBeDefined();
            expect(last(result.prefix_multi)).toBe('EXCHANGE');
            // When there are multiple colons, ticker takes everything after the first colon
            expect(last(result.ticker_multi)).toBe('SYMBOL:EXTRA');
        });
    });
});
