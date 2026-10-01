// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Alert and AlertCondition Tests
 *
 * Verifies:
 * - alert() fires on realtime bar only (default mode)
 * - alert() fires on all bars in 'all' mode (backtest)
 * - alert.freq_* frequency gating with per-callsite isolation
 * - alertcondition() fires when condition is true
 * - alerts are accessible via context.alerts after run()
 * - alerts are emitted via 'alert' event in stream()
 * - stream mode: no duplicate alerts on live bar re-execution
 * - transpiler-injected __callsiteId for stable callsite IDs
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

        it('should fire each callsite once per bar with freq_once_per_bar', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alert } = context.pine;
                // Two different callsites — each fires once per bar
                alert.any('first', alert.freq_once_per_bar);
                alert.any('second', alert.freq_once_per_bar);
            };

            const ctx = await pineTS.run(code);
            // Two alerts per bar (one per callsite)
            expect(ctx.alerts.length).toBe(ctx.marketData.length * 2);
            // Verify callsite IDs are distinct
            const bar0Alerts = ctx.alerts.filter((a: any) => a.bar_index === 0);
            expect(bar0Alerts.length).toBe(2);
            expect(bar0Alerts[0].id).toBe('alert_0');
            expect(bar0Alerts[1].id).toBe('alert_1');
            expect(bar0Alerts[0].message).toBe('first');
            expect(bar0Alerts[1].message).toBe('second');
        });

        it('should use freq_once_per_bar as default', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alert } = context.pine;
                // Two different callsites with default freq
                alert.any('msg1');
                alert.any('msg2');
            };

            const ctx = await pineTS.run(code);
            // Both fire (different callsites), each once per bar
            expect(ctx.alerts.length).toBe(ctx.marketData.length * 2);
        });
    });

    describe('alert() - frequency constants', () => {
        it('should expose alert.freq_* constants with TradingView values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { alert, plotchar } = context.pine;
                plotchar(alert.freq_all === 'all' ? 1 : 0, 'all');
                plotchar(alert.freq_once_per_bar === 'once_per_bar' ? 1 : 0, 'opb');
                plotchar(alert.freq_once_per_bar_close === 'once_per_bar_close' ? 1 : 0, 'opbc');
            };

            const { plots } = await pineTS.run(code);
            expect(plots['all'].data[0].value).toBe(1);
            expect(plots['opb'].data[0].value).toBe(1);
            expect(plots['opbc'].data[0].value).toBe(1);
        });
    });

    describe('alert() - transpiler callsite IDs', () => {
        it('should assign stable __callsiteId via transpiler', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');

            const code = `
//@version=6
indicator("Callsite ID Test")
if close > open
    alert("A", alert.freq_once_per_bar)
if close < open
    alert("B", alert.freq_once_per_bar)
plot(close)
            `;

            const ctx = await pineTS.run(code);
            // Alerts from conditional branches get stable IDs
            const idsA = ctx.alerts.filter((a: any) => a.message === 'A').map((a: any) => a.id);
            const idsB = ctx.alerts.filter((a: any) => a.message === 'B').map((a: any) => a.id);

            // All "A" alerts share the same callsite ID
            expect(new Set(idsA).size).toBe(1);
            expect(idsA[0]).toBe('alert_0');

            // All "B" alerts share a different callsite ID
            expect(new Set(idsB).size).toBe(1);
            expect(idsB[0]).toBe('alert_1');
        });

        it('should not let conditional branches shift callsite IDs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');

            // alert("B") is inside a branch that may not execute on every bar,
            // but its callsite ID should always be alert_1 (set at compile time)
            const code = `
//@version=6
indicator("Branch Stability Test")
alert("Always", alert.freq_once_per_bar)
if close > open
    alert("Conditional", alert.freq_once_per_bar)
plot(close)
            `;

            const ctx = await pineTS.run(code);
            const alwaysAlerts = ctx.alerts.filter((a: any) => a.message === 'Always');
            const condAlerts = ctx.alerts.filter((a: any) => a.message === 'Conditional');

            // "Always" fires every bar with stable ID alert_0
            expect(alwaysAlerts.length).toBe(ctx.marketData.length);
            expect(new Set(alwaysAlerts.map((a: any) => a.id)).size).toBe(1);
            expect(alwaysAlerts[0].id).toBe('alert_0');

            // "Conditional" fires only on some bars but always with ID alert_1
            expect(condAlerts.length).toBeGreaterThan(0);
            expect(condAlerts.length).toBeLessThan(ctx.marketData.length);
            expect(new Set(condAlerts.map((a: any) => a.id)).size).toBe(1);
            expect(condAlerts[0].id).toBe('alert_1');
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
            expect(ctx.alerts[0].freq).toBe('once_per_bar');
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

        it('should dedup per callsite per bar (multiple alertconditions)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            const code = (context: any) => {
                const { alertcondition } = context.pine;
                alertcondition(true, 'Cond A', 'First');
                alertcondition(true, 'Cond B', 'Second');
            };

            const ctx = await pineTS.run(code);
            // Two alertconditions, each fires once per bar
            expect(ctx.alerts.length).toBe(ctx.marketData.length * 2);

            const bar0 = ctx.alerts.filter((a: any) => a.bar_index === 0);
            expect(bar0.length).toBe(2);
            expect(bar0[0].id).toBe('alertcondition_0');
            expect(bar0[0].title).toBe('Cond A');
            expect(bar0[1].id).toBe('alertcondition_1');
            expect(bar0[1].title).toBe('Cond B');
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

        it('should not emit duplicate alerts on stream re-execution (alert)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            await pineTS.ready();

            const code = (context: any) => {
                const { alert } = context.pine;
                alert.any('once per bar', alert.freq_once_per_bar);
            };

            const alerts: any[] = [];
            let dataCount = 0;

            await new Promise<void>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                stream.on('data', () => {
                    dataCount++;
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

            expect(dataCount).toBe(1);
            // All bars fire once, no duplicates from re-execution
            const uniqueKeys = new Set(alerts.map((a: any) => `${a.id}:${a.bar_index}`));
            expect(uniqueKeys.size).toBe(alerts.length);
        });

        it('should not emit duplicate alerts on stream re-execution (alertcondition)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            await pineTS.ready();

            const code = (context: any) => {
                const { alertcondition } = context.pine;
                alertcondition(true, 'Always', 'Every bar');
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

            // Each bar fires exactly once — no duplicates
            const uniqueKeys = new Set(alerts.map((a: any) => `${a.id}:${a.bar_index}`));
            expect(uniqueKeys.size).toBe(alerts.length);
            // Should be one per bar
            expect(alerts.length).toBeGreaterThan(0);
        });

        it('should clear alerts between stream ticks (no re-emission of old alerts)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setAlertMode('all');
            await pineTS.ready();

            const code = (context: any) => {
                const { alertcondition } = context.pine;
                alertcondition(true, 'Test', 'tick');
            };

            const alertsPerTick: number[] = [];
            let tickCount = 0;

            await new Promise<void>((resolve, reject) => {
                // Use pageSize smaller than data to get multiple ticks
                const stream = pineTS.stream(code, { live: false, pageSize: 3 });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
                let currentTickAlerts = 0;

                stream.on('data', () => {
                    alertsPerTick.push(currentTickAlerts);
                    currentTickAlerts = 0;
                    tickCount++;
                });

                stream.on('alert', () => {
                    currentTickAlerts++;
                });

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    reject(err);
                });

                // Wait a bit then resolve (stream with live:false will finish)
                setTimeout(() => {
                    clearTimeout(timeout);
                    resolve();
                }, 3000);
            });

            // Multiple ticks happened
            expect(tickCount).toBeGreaterThan(1);
            // No tick should re-emit all previous alerts (each tick <= pageSize alerts)
            for (const count of alertsPerTick) {
                expect(count).toBeLessThanOrEqual(3); // pageSize
            }
        });
    });
});
