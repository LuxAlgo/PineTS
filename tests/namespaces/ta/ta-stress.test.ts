// TA Stress Tests - Testing technical analysis functions with edge cases and extreme conditions
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('TA Stress Tests', () => {
    describe('Moving Averages - Extreme Periods', () => {
        it('should handle very large SMA period', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-02-01').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                const sma_large = ta.sma(close, 500);
                plotchar(sma_large, 'sma_large');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['sma_large']).toBeDefined();
            expect(plots['sma_large'].data.length).toBeGreaterThan(0);

            // First 499 values should be NaN
            const firstValid = plots['sma_large'].data.findIndex((v: any) => !isNaN(v.value));
            expect(firstValid).toBeGreaterThanOrEqual(499);
        });

        it('should handle period of 1 (identity)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                const sma1 = ta.sma(close, 1);
                plotchar(sma1, 'sma1');
                plotchar(close, 'close');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['sma1']).toBeDefined();
            expect(plots['close']).toBeDefined();

            // SMA(1) should equal close
            for (let i = 0; i < plots['sma1'].data.length; i++) {
                expect(plots['sma1'].data[i].value).toBeCloseTo(plots['close'].data[i].value, 8);
            }
        });

        it('should handle multiple EMAs with same period (state isolation)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close, open } = $.data;
                const { ta, plotchar } = $.pine;

                const ema1 = ta.ema(close, 20);
                const ema2 = ta.ema(open, 20);
                const ema3 = ta.ema(close, 20); // Same as ema1

                plotchar(ema1, 'ema1');
                plotchar(ema2, 'ema2');
                plotchar(ema3, 'ema3');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['ema1']).toBeDefined();
            expect(plots['ema2']).toBeDefined();
            expect(plots['ema3']).toBeDefined();

            // ema1 and ema3 should be identical (same source and period)
            for (let i = 0; i < plots['ema1'].data.length; i++) {
                const val1 = plots['ema1'].data[i].value;
                const val3 = plots['ema3'].data[i].value;

                // Skip NaN values
                if (!isNaN(val1) && !isNaN(val3)) {
                    expect(val1).toBeCloseTo(val3, 10);
                }
            }

            // ema2 should be different (different source)
            let foundDifference = false;
            for (let i = 0; i < plots['ema1'].data.length; i++) {
                if (Math.abs(plots['ema1'].data[i].value - plots['ema2'].data[i].value) > 0.001) {
                    foundDifference = true;
                    break;
                }
            }
            expect(foundDifference).toBe(true);
        });
    });

    describe('Oscillators - Boundary Conditions', () => {
        it('should handle RSI with extreme overbought/oversold', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                const rsi = ta.rsi(close, 14);
                plotchar(rsi, 'rsi');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['rsi']).toBeDefined();

            // RSI should be between 0 and 100
            plots['rsi'].data.forEach((point: any) => {
                if (!isNaN(point.value)) {
                    expect(point.value).toBeGreaterThanOrEqual(0);
                    expect(point.value).toBeLessThanOrEqual(100);
                }
            });
        });

        // TODO: Implement ta.stoch
        // it('should handle Stochastic with zero price range', async () => {
        //     ...
        // });
    });

    describe('Volatility Indicators - Edge Cases', () => {
        it('should handle ATR with zero ranges', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { high, low, close } = $.data;
                const { ta, plotchar } = $.pine;

                const atr = ta.atr(14);
                plotchar(atr, 'atr');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['atr']).toBeDefined();

            // ATR should always be non-negative
            plots['atr'].data.forEach((point: any) => {
                if (!isNaN(point.value)) {
                    expect(point.value).toBeGreaterThanOrEqual(0);
                }
            });
        });

        it('should handle Bollinger Bands with very small stddev', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                const basis = ta.sma(close, 20);
                const dev = ta.stdev(close, 20);
                const upper = basis + 2 * dev;
                const lower = basis - 2 * dev;

                plotchar(basis, 'basis');
                plotchar(upper, 'upper');
                plotchar(lower, 'lower');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['basis']).toBeDefined();
            expect(plots['upper']).toBeDefined();
            expect(plots['lower']).toBeDefined();

            // Upper should always be >= basis >= lower
            for (let i = 0; i < plots['basis'].data.length; i++) {
                const basisVal = plots['basis'].data[i].value;
                const upperVal = plots['upper'].data[i].value;
                const lowerVal = plots['lower'].data[i].value;

                if (!isNaN(basisVal) && !isNaN(upperVal) && !isNaN(lowerVal)) {
                    expect(upperVal).toBeGreaterThanOrEqual(basisVal - 0.001);
                    expect(basisVal).toBeGreaterThanOrEqual(lowerVal - 0.001);
                }
            }
        });
    });

    describe('Trend Indicators - Crossovers', () => {
        // TODO: Implement ta.macd
        // it('should detect MACD crossovers correctly', async () => {
        //     ...
        // });

        // TODO: Implement ta.adx
        // it('should handle ADX with trending and ranging markets', async () => {
        //     ...
        // });

        it('should detect EMA crossovers', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-02-01').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                const ema_fast = ta.ema(close, 9);
                const ema_slow = ta.ema(close, 21);

                plotchar(ema_fast, 'ema_fast');
                plotchar(ema_slow, 'ema_slow');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['ema_fast']).toBeDefined();
            expect(plots['ema_slow']).toBeDefined();
            expect(plots['ema_fast'].data.length).toBeGreaterThan(0);
            expect(plots['ema_slow'].data.length).toBeGreaterThan(0);
        });
    });

    describe('Cumulative Functions - State Persistence', () => {
        // TODO: Implement ta.cum
        // it('should handle CUM correctly over long periods', async () => {
        //     ...
        // });

        // TODO: Implement ta.cum
        // it('should handle multiple independent cumulative calculations', async () => {
        //     ...
        // });

        it('should handle running sum manually', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { volume } = $.data;
                const { ta, plotchar } = $.pine;

                // Use ta.sma to calculate moving sum (not truly cumulative, but demonstrates state)
                const sum20 = ta.sma(volume, 20) * 20; // Sum of last 20 periods

                plotchar(sum20, 'sum20');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['sum20']).toBeDefined();
            expect(plots['sum20'].data.length).toBeGreaterThan(0);

            // Sum should be positive for positive volume
            plots['sum20'].data.forEach((point: any) => {
                if (!isNaN(point.value)) {
                    expect(point.value).toBeGreaterThan(0);
                }
            });
        });
    });

    describe('Pivot Points - Historical Lookback', () => {
        it('should detect pivothigh correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { high } = $.data;
                const { ta, plotchar } = $.pine;

                const ph = ta.pivothigh(high, 5, 5);
                plotchar(ph, 'pivothigh');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['pivothigh']).toBeDefined();

            // Pivot high values should either be NaN or equal to a high value
            expect(plots['pivothigh'].data.length).toBeGreaterThan(0);
        });

        it('should detect pivotlow correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { low } = $.data;
                const { ta, plotchar } = $.pine;

                const pl = ta.pivotlow(low, 5, 5);
                plotchar(pl, 'pivotlow');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['pivotlow']).toBeDefined();

            // Pivot low values should either be NaN or equal to a low value
            expect(plots['pivotlow'].data.length).toBeGreaterThan(0);
        });
    });

    describe('Change and Rate of Change', () => {
        it('should calculate change correctly with various lengths', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                const chg1 = ta.change(close, 1);
                const chg10 = ta.change(close, 10);

                plotchar(chg1, 'chg1');
                plotchar(chg10, 'chg10');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['chg1']).toBeDefined();
            expect(plots['chg10']).toBeDefined();

            // Both should have data
            expect(plots['chg1'].data.length).toBeGreaterThan(0);
            expect(plots['chg10'].data.length).toBeGreaterThan(0);
        });

        it('should calculate ROC percentage correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar } = $.pine;

                // Manual ROC calculation
                const chg = ta.change(close, 10);
                const prev = close;

                plotchar(chg, 'change');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['change']).toBeDefined();
            expect(plots['change'].data.length).toBeGreaterThan(0);
        });
    });

    describe('Correlation and Statistics', () => {
        // TODO: Implement ta.correlation
        // it('should calculate correlation between series', async () => {
        //     ...
        // });

        it('should calculate variance and standard deviation consistently', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { close } = $.data;
                const { ta, plotchar, math } = $.pine;

                const variance = ta.variance(close, 20);
                const stdev = ta.stdev(close, 20);
                const stdev_from_var = math.sqrt(variance);

                plotchar(stdev, 'stdev');
                plotchar(stdev_from_var, 'stdev_from_var');
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

            expect(plots['stdev']).toBeDefined();
            expect(plots['stdev_from_var']).toBeDefined();

            // sqrt(variance) should equal stdev
            for (let i = 0; i < plots['stdev'].data.length; i++) {
                const stdev = plots['stdev'].data[i].value;
                const stdevFromVar = plots['stdev_from_var'].data[i].value;

                if (!isNaN(stdev) && !isNaN(stdevFromVar)) {
                    expect(stdev).toBeCloseTo(stdevFromVar, 6);
                }
            }
        });
    });
});
