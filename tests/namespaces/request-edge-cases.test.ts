// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('request.security Edge Cases', () => {
    describe('Same Timeframe Behavior', () => {
        it('should handle same timeframe as current', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar } = $.pine;

                // Requesting same timeframe
                const result = await request.security('BTCUSDC', '60', close, false, false);

                // Should return close values
                const matches = result == close;
                plotchar(matches ? 1 : 0, 'matches');
                plotchar(result, 'result');
            });

            expect(plots['matches']).toBeDefined();
            expect(plots['result']).toBeDefined();
        });
    });

    describe('Multiple Security Calls', () => {
        it('should handle multiple different timeframes', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar } = $.pine;

                const tf_4h = await request.security('BTCUSDC', '240', close, false, false);
                const tf_1d = await request.security('BTCUSDC', 'D', close, false, false);
                const tf_1w = await request.security('BTCUSDC', 'W', close, false, false);

                plotchar(tf_4h, '4h');
                plotchar(tf_1d, '1d');
                plotchar(tf_1w, '1w');
            });

            expect(plots['4h']).toBeDefined();
            expect(plots['1d']).toBeDefined();
            expect(plots['1w']).toBeDefined();
            expect(Array.isArray(plots['4h'].data)).toBe(true);
            expect(Array.isArray(plots['1d'].data)).toBe(true);
            expect(Array.isArray(plots['1w'].data)).toBe(true);
        });

        it('should handle multiple expressions on same timeframe', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close, open, high, low } = $.data;
                const { request, plotchar, ta } = $.pine;

                const htf_close = await request.security('BTCUSDC', '240', close, false, false);
                const htf_sma = await request.security('BTCUSDC', '240', ta.sma(close, 20), false, false);
                const htf_hl2 = await request.security('BTCUSDC', '240', (high + low) / 2, false, false);

                plotchar(htf_close, 'close');
                plotchar(htf_sma, 'sma');
                plotchar(htf_hl2, 'hl2');
            });

            expect(plots['close']).toBeDefined();
            expect(plots['sma']).toBeDefined();
            expect(plots['hl2']).toBeDefined();
        });
    });

    describe('Lookahead Behavior', () => {
        it('should show difference between lookahead true and false', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar } = $.pine;

                const no_lookahead = await request.security('BTCUSDC', 'W', close, false, false);
                const with_lookahead = await request.security('BTCUSDC', 'W', close, true, false);

                plotchar(no_lookahead, 'no_lookahead');
                plotchar(with_lookahead, 'with_lookahead');
            });

            expect(plots['no_lookahead']).toBeDefined();
            expect(plots['with_lookahead']).toBeDefined();

            // With lookahead should potentially show future values
            expect(plots['no_lookahead'].data.length).toBeGreaterThan(0);
            expect(plots['with_lookahead'].data.length).toBeGreaterThan(0);
        });
    });

    describe('Gaps Handling', () => {
        it('should handle gaps parameter correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar } = $.pine;

                const no_gaps = await request.security('BTCUSDC', 'W', close, false, false);
                const with_gaps = await request.security('BTCUSDC', 'W', close, false, true);

                plotchar(no_gaps, 'no_gaps');
                plotchar(with_gaps, 'with_gaps');
            });

            expect(plots['no_gaps']).toBeDefined();
            expect(plots['with_gaps']).toBeDefined();
        });
    });

    describe('Complex Expressions', () => {
        it('should handle ternary expressions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close, open } = $.data;
                const { request, plotchar } = $.pine;

                const htf_result = await request.security('BTCUSDC', '240', close > open ? 1 : 0, false, false);

                plotchar(htf_result, 'result');
            });

            expect(plots['result']).toBeDefined();
            expect(Array.isArray(plots['result'].data)).toBe(true);
        });

        it('should handle arithmetic expressions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close, open, high, low } = $.data;
                const { request, plotchar } = $.pine;

                const htf_range = await request.security('BTCUSDC', '240', high - low, false, false);

                const htf_body = await request.security('BTCUSDC', '240', close - open, false, false);

                plotchar(htf_range, 'range');
                plotchar(htf_body, 'body');
            });

            expect(plots['range']).toBeDefined();
            expect(plots['body']).toBeDefined();
        });

        it('should handle nested TA function calls', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar, ta } = $.pine;

                // EMA of SMA
                const htf_complex = await request.security('BTCUSDC', '240', ta.ema(ta.sma(close, 20), 10), false, false);

                plotchar(htf_complex, 'complex');
            });

            expect(plots['complex']).toBeDefined();
            expect(Array.isArray(plots['complex'].data)).toBe(true);
        });
    });

    describe('Tuple Returns', () => {
        it('should handle tuple with user variables', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close, open } = $.data;
                const { request, plotchar } = $.pine;

                const o = open;
                const c = close;

                const [res, data] = await request.security('BTCUSDC', '240', [o, c], false, false);

                plotchar(res, 'first');
                plotchar(data, 'second');
            });

            expect(plots['first']).toBeDefined();
            expect(plots['second']).toBeDefined();
            expect(Array.isArray(plots['first'].data)).toBe(true);
            expect(Array.isArray(plots['second'].data)).toBe(true);
        });

        it('should handle tuple with direct Series', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close, open } = $.data;
                const { request, plotchar } = $.pine;

                const [res, data] = await request.security('BTCUSDC', '240', [open, close], false, false);

                plotchar(res, 'open');
                plotchar(data, 'close');
            });

            expect(plots['open']).toBeDefined();
            expect(plots['close']).toBeDefined();
        });

        it('should handle tuple with mixed expressions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close, open, high, low } = $.data;
                const { request, plotchar, ta } = $.pine;

                const [htf_close, htf_sma] = await request.security('BTCUSDC', '240', [close, ta.sma(close, 20)], false, false);

                plotchar(htf_close, 'close');
                plotchar(htf_sma, 'sma');
            });

            expect(plots['close']).toBeDefined();
            expect(plots['sma']).toBeDefined();
        });
    });

    describe('Edge Case Values', () => {
        it('should handle Infinity values in expressions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar } = $.pine;

                // Expression that produces Infinity
                const result = await request.security('BTCUSDC', '240', close / 0, false, false);

                plotchar(result, 'result');
            });

            expect(plots['result']).toBeDefined();
        });
    });

    describe('State and Stateful Calculations', () => {
        it('should maintain independent state for different security calls', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(async ($) => {
                const { close } = $.data;
                const { request, plotchar, ta } = $.pine;

                // Two separate EMA calculations on different timeframes
                const ema1 = await request.security('BTCUSDC', '240', ta.ema(close, 20), false, false);
                const ema2 = await request.security('BTCUSDC', 'D', ta.ema(close, 20), false, false);

                // Should be different values
                plotchar(ema1, 'ema_4h');
                plotchar(ema2, 'ema_1d');
            });

            expect(plots['ema_4h']).toBeDefined();
            expect(plots['ema_1d']).toBeDefined();
        });
    });
});
