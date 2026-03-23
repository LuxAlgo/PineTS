// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Alert and AlertCondition Tests
 *
 * Verifies:
 * - alert() fires on realtime bar only (default mode)
 * - alert() fires on all bars in 'all' mode (backtest)
 * - alert.freq_* frequency gating
 * - alertcondition() fires when condition is true
 * - alerts are accessible via context.alerts after run()
 * - alerts are emitted via 'alert' event in stream()
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Alert System', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-10').getTime();

    // -- alert() basic behavior --

    describe('alert() - realtime mode (default)', () => {
        it('should only fire alert on the last (realtime) bar', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { alert } = context.pine;
                alert.any('Price crossed!', alert.freq_all);
            };

            const ctx = await pineTS.run(code);
            // In realtime mode, only the last bar fires
            expect(ctx.alerts.length).toBe(1);
            expect(ctx.alerts[0].type).toBe('alert');
            expect(ctx.alerts[0].message).toBe('Price crossed!');
            expect(ctx.alerts[0].bar_index).toBe(ctx.marketData.length - 1);
        });

        it('should not fire alerts on historical bars', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { alert, barstate } = context.pine;
                if (barstate.ishistory) {
                    alert.any('historical alert');
                }
            };

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBe(0);
        });
    });

    describe('alert() - all mode (backtest)', () => {
        it('should fire alert on every bar with freq_all', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alert } = context.pine;
                alert.any('tick', alert.freq_all);
            };

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBe(ctx.marketData.length);
            expect(ctx.alerts[0].message).toBe('tick');
        });

        it('should fire alert once per bar with freq_once_per_bar', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alert } = context.pine;
                // Call alert twice per bar — only the first should fire
                alert.any('first', alert.freq_once_per_bar);
                alert.any('second', alert.freq_once_per_bar);
            };

            const ctx = await pineTS.run(code);
            // One alert per bar, not two
            expect(ctx.alerts.length).toBe(ctx.marketData.length);
            expect(ctx.alerts.every((a: any) => a.message === 'first')).toBe(true);
        });

        it('should use freq_once_per_bar as default', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alert } = context.pine;
                alert.any('msg1');
                alert.any('msg2'); // should be suppressed (same bar, once_per_bar default)
            };

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBe(ctx.marketData.length);
            expect(ctx.alerts.every((a: any) => a.message === 'msg1')).toBe(true);
        });
    });

    describe('alert() - frequency constants', () => {
        it('should expose alert.freq_* constants', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { alert, plotchar } = context.pine;
                plotchar(alert.freq_all === 'alert.freq_all' ? 1 : 0, 'all');
                plotchar(alert.freq_once_per_bar === 'alert.freq_once_per_bar' ? 1 : 0, 'opb');
                plotchar(alert.freq_once_per_bar_close === 'alert.freq_once_per_bar_close' ? 1 : 0, 'opbc');
            };

            const { plots } = await pineTS.run(code);
            expect(plots['all'].data[0].value).toBe(1);
            expect(plots['opb'].data[0].value).toBe(1);
            expect(plots['opbc'].data[0].value).toBe(1);
        });
    });

    describe('alert() - Pine Script syntax', () => {
        it('should work with transpiled Pine Script alert() call', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');

            const code = `
//@version=6
indicator("Alert Test")
if close > open
    alert("Bullish bar!", alert.freq_once_per_bar)
plot(close)
            `;

            const ctx = await pineTS.run(code);
            // Should have some alerts (on bullish bars)
            expect(ctx.alerts.length).toBeGreaterThan(0);
            expect(ctx.alerts[0].type).toBe('alert');
            expect(ctx.alerts[0].message).toBe('Bullish bar!');
            expect(ctx.alerts[0].freq).toBe('alert.freq_once_per_bar');
        });
    });

    // -- alertcondition() --

    describe('alertcondition()', () => {
        it('should fire on realtime bar when condition is true', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { alertcondition } = context.pine;
                alertcondition(true, 'Test Alert', 'Condition met!');
            };

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBe(1);
            expect(ctx.alerts[0].type).toBe('alertcondition');
            expect(ctx.alerts[0].title).toBe('Test Alert');
            expect(ctx.alerts[0].message).toBe('Condition met!');
        });

        it('should not fire when condition is false', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { alertcondition } = context.pine;
                alertcondition(false, 'Test Alert', 'Should not fire');
            };

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBe(0);
        });

        it('should fire on every true bar in all mode', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alertcondition } = context.pine;
                alertcondition(true, 'Always', 'Every bar');
            };

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBe(ctx.marketData.length);
        });

        it('should work with transpiled Pine Script alertcondition()', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');

            const code = `
//@version=6
indicator("AlertCondition Test")
alertcondition(close > open, "Bullish", "Green bar!")
plot(close)
            `;

            const ctx = await pineTS.run(code);
            expect(ctx.alerts.length).toBeGreaterThan(0);
            expect(ctx.alerts[0].type).toBe('alertcondition');
            expect(ctx.alerts[0].title).toBe('Bullish');
        });
    });

    // -- stream() API --

    describe('stream() API - alert events', () => {
        it('should emit alert events via stream', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready();
            const code = (context: any) => {
                const { alert } = context.pine;
                alert.any('stream alert', alert.freq_all);
            };

            const alerts: any[] = [];
            await new Promise<void>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                stream.on('data', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                stream.on('alert', (a: any) => {
                    alerts.push(a);
                });

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });

            // Default is realtime mode, so only last bar alert
            expect(alerts.length).toBe(1);
            expect(alerts[0].type).toBe('alert');
            expect(alerts[0].message).toBe('stream alert');
        });
    });
});
