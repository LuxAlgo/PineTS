// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('Builtin Namespace', () => {
    describe('Time Variables', () => {
        it('should provide time variables for current bar', async () => {
            // Use a specific date range for predictable testing
            const sDate = new Date('2024-06-15T00:00:00Z').getTime();
            const eDate = new Date('2024-06-16T00:00:00Z').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                // Destructure from context.pine - the pattern that works with transpiler
                const { time, time_close, time_tradingday, dayofmonth, dayofweek, hour, minute, second, month, year, weekofyear } =
                    context.pine;

                // time, time_close, time_tradingday are getters that return values directly
                // dayofmonth, dayofweek, etc. are functions that default to current bar when called without args
                return {
                    time,
                    time_close,
                    time_tradingday,
                    dayofmonth: dayofmonth(),
                    dayofweek: dayofweek(),
                    hour: hour(),
                    minute: minute(),
                    second: second(),
                    month: month(),
                    year: year(),
                    weekofyear: weekofyear(),
                };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            // Time should be a valid timestamp
            expect(last(result.time)).toBeGreaterThan(0);

            // Day of month should be valid (1-31)
            expect(last(result.dayofmonth)).toBeGreaterThanOrEqual(1);
            expect(last(result.dayofmonth)).toBeLessThanOrEqual(31);

            // Day of week should be valid (1-7 in Pine Script)
            expect(last(result.dayofweek)).toBeGreaterThanOrEqual(1);
            expect(last(result.dayofweek)).toBeLessThanOrEqual(7);

            // Hour should be valid (0-23)
            expect(last(result.hour)).toBeGreaterThanOrEqual(0);
            expect(last(result.hour)).toBeLessThanOrEqual(23);

            // Minute should be valid (0-59)
            expect(last(result.minute)).toBeGreaterThanOrEqual(0);
            expect(last(result.minute)).toBeLessThanOrEqual(59);

            // Second should be valid (0-59)
            expect(last(result.second)).toBeGreaterThanOrEqual(0);
            expect(last(result.second)).toBeLessThanOrEqual(59);

            // Month should be valid (1-12)
            expect(last(result.month)).toBeGreaterThanOrEqual(1);
            expect(last(result.month)).toBeLessThanOrEqual(12);

            // Year should be reasonable
            expect(last(result.year)).toBeGreaterThanOrEqual(2020);
            expect(last(result.year)).toBeLessThanOrEqual(2030);

            // Week of year should be valid (1-53)
            expect(last(result.weekofyear)).toBeGreaterThanOrEqual(1);
            expect(last(result.weekofyear)).toBeLessThanOrEqual(53);
        });
    });

    describe('Time Functions', () => {
        it('should extract time components from timestamps', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { dayofmonth, dayofweek, hour, minute, second, month, year, weekofyear } = context.pine;
                // Test with a specific timestamp: 2024-06-15 13:30:45 UTC (Saturday)
                return {
                    dom: dayofmonth(1718458245000),
                    dow: dayofweek(1718458245000),
                    h: hour(1718458245000),
                    m: minute(1718458245000),
                    s: second(1718458245000),
                    mo: month(1718458245000),
                    y: year(1718458245000),
                    woy: weekofyear(1718458245000),
                };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.dom)).toBe(15); // June 15
            expect(last(result.dow)).toBe(7); // Saturday = 7 in Pine Script
            expect(last(result.h)).toBe(13); // 13:30:45 UTC
            expect(last(result.m)).toBe(30);
            expect(last(result.s)).toBe(45);
            expect(last(result.mo)).toBe(6); // June
            expect(last(result.y)).toBe(2024);
            expect(last(result.woy)).toBe(24); // Week 24 of 2024
        });

        it('should create timestamps with timestamp()', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { timestamp } = context.pine;
                // Create a timestamp for 2024-06-15 14:30:45 and return it inline
                return {
                    ts: timestamp(2024, 6, 15, 14, 30, 45),
                };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            // Verify timestamp is correct
            expect(last(result.ts)).toBe(Date.UTC(2024, 5, 15, 14, 30, 45)); // Month is 0-indexed in Date.UTC
        });

        it('should verify timestamp components', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { year, month, dayofmonth, hour, minute, second } = context.pine;
                // Use the known timestamp value to verify extraction
                // 1718461845000 = 2024-06-15 14:30:45 UTC (verified with Date.UTC(2024, 5, 15, 14, 30, 45))
                return {
                    y: year(1718461845000),
                    mo: month(1718461845000),
                    d: dayofmonth(1718461845000),
                    h: hour(1718461845000),
                    m: minute(1718461845000),
                    s: second(1718461845000),
                };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.y)).toBe(2024);
            expect(last(result.mo)).toBe(6);
            expect(last(result.d)).toBe(15);
            expect(last(result.h)).toBe(14);
            expect(last(result.m)).toBe(30);
            expect(last(result.s)).toBe(45);
        });

        it('should handle timestamp() with minimal arguments', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { timestamp, hour, minute, second } = context.pine;
                // timestamp(2024, 1, 1) should create 2024-01-01 00:00:00 UTC
                // Verify with inline call on known date: 1704067200000 = 2024-01-01 00:00:00 UTC
                return {
                    ts: timestamp(2024, 1, 1),
                    h: hour(1704067200000),
                    m: minute(1704067200000),
                    s: second(1704067200000),
                };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.ts)).toBe(Date.UTC(2024, 0, 1, 0, 0, 0));
            expect(last(result.h)).toBe(0);
            expect(last(result.m)).toBe(0);
            expect(last(result.s)).toBe(0);
        });
    });

    describe('Alert Functions', () => {
        it('should have alertcondition function', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { alertcondition } = context.pine;

                // This should not throw
                alertcondition(true, 'Test Alert', 'Price crossed threshold');

                return { success: true };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.success)).toBe(true);
        });

        it('should have alert function', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { alert } = context.pine;

                // This should not throw
                alert('Test alert message');

                return { success: true };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.success)).toBe(true);
        });
    });

    describe('Type Functions', () => {
        it('should have na() function', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { na, nz } = context.pine;

                const is_nan = na(NaN);
                const is_not_nan = na(123);
                const nz_val = nz(NaN, 42);
                const nz_keep = nz(100, 42);

                return { is_nan, is_not_nan, nz_val, nz_keep };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.is_nan)).toBe(true);
            expect(last(result.is_not_nan)).toBe(false);
            expect(last(result.nz_val)).toBe(42);
            expect(last(result.nz_keep)).toBe(100);
        });

        it('should have fixnan() function', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-05').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { fixnan } = context.pine;

                // fixnan should find the first non-NaN value looking back
                const fixed = fixnan(100);

                return { fixed };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.fixed)).toBe(100);
        });

        it('should have type conversion functions', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-02').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                const { bool, int, float, string } = context.pine;

                const b_true = bool(1);
                const b_false = bool(0);
                const i = int(3.7);
                const f = float(42);
                const s = string(123);

                return { b_true, b_false, i, f, s };
            };

            const { result } = await pineTS.run(sourceCode);
            const last = (arr: any[]) => arr[arr.length - 1];

            expect(last(result.b_true)).toBe(true);
            expect(last(result.b_false)).toBe(false);
            expect(last(result.i)).toBe(3); // Floor of 3.7
            expect(last(result.f)).toBe(42);
            expect(last(result.s)).toBe('123');
        });
    });

    describe('Bar Index', () => {
        it('should provide bar_index and last_bar_index', async () => {
            const sDate = new Date('2024-01-01').getTime();
            const eDate = new Date('2024-01-10').getTime();
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

            const sourceCode = (context: any) => {
                // Destructure from context.pine
                const { bar_index, last_bar_index } = context.pine;
                return {
                    bar_index,
                    last_bar_index,
                };
            };

            const { result } = await pineTS.run(sourceCode);

            // bar_index should be 0, 1, 2, ... for each bar
            expect(result.bar_index[0]).toBe(0);
            expect(result.bar_index[1]).toBe(1);
            expect(result.bar_index[2]).toBe(2);

            // In PineTS, last_bar_index reflects the progressive data loading
            // It equals bar_index at each iteration (data grows as we iterate)
            // The final last_bar_index equals the total number of bars - 1
            const totalBars = result.bar_index.length;
            expect(result.last_bar_index[totalBars - 1]).toBe(totalBars - 1);
        });
    });
});
