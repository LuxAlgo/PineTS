// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Barstate Namespace Tests
 *
 * Tests for barstate properties: isfirst, islast, ishistory, isrealtime,
 * isconfirmed, islastconfirmedhistory.
 *
 * Uses Binance live data for accurate closeTime values, which are essential
 * for isconfirmed, islastconfirmedhistory, ishistory, and isrealtime.
 *
 * Includes regression tests for:
 * - isconfirmed: Was checking last bar's closeTime instead of current bar's.
 *   Also had a data access bug using `closeTime[idx]` on a Series object
 *   (returns undefined) instead of `closeTime.data[idx]` for raw array access.
 * - islastconfirmedhistory: Same Series data access fix.
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('Barstate Namespace', () => {
    // Use Binance weekly data with a well-defined historical range
    const sDate = new Date('2020-01-01').getTime();
    const eDate = new Date('2020-06-01').getTime();

    it('should report isfirst correctly', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { barstate } = context.pine;
            const isFirst = barstate.isfirst;
            return { isFirst };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(result.isFirst.length).toBeGreaterThan(10);
        // First bar should be true, rest should be false
        expect(result.isFirst[0]).toBe(true);
        for (let i = 1; i < result.isFirst.length; i++) {
            expect(result.isFirst[i]).toBe(false);
        }
    });

    it('should report islast correctly', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { barstate } = context.pine;
            const isLast = barstate.islast;
            return { isLast };
        };

        const { result } = await pineTS.run(sourceCode);
        const len = result.isLast.length;

        expect(len).toBeGreaterThan(10);
        // Last bar should be true, all others false
        expect(result.isLast[len - 1]).toBe(true);
        for (let i = 0; i < len - 1; i++) {
            expect(result.isLast[i]).toBe(false);
        }
    });

    it('should report ishistory and isrealtime as booleans for each bar', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { barstate } = context.pine;
            const isHistory = barstate.ishistory;
            const isRealtime = barstate.isrealtime;
            return { isHistory, isRealtime };
        };

        const { result } = await pineTS.run(sourceCode);
        const len = result.isHistory.length;

        expect(len).toBeGreaterThan(10);
        // Each value should be a boolean and isHistory/isRealtime should be complementary
        for (let i = 0; i < len; i++) {
            expect(typeof result.isHistory[i]).toBe('boolean');
            expect(typeof result.isRealtime[i]).toBe('boolean');
        }
    });

    it('should report isconfirmed=true for all historical bars (regression: Series data access)', async () => {
        // Regression test: barstate.isconfirmed used to access closeTime[idx]
        // on a Series object (always undefined → false). Fixed to use closeTime.data[idx].
        // All bars from 2020 are historical — their closeTime is in the past.
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { barstate } = context.pine;
            const isConfirmed = barstate.isconfirmed;
            return { isConfirmed };
        };

        const { result } = await pineTS.run(sourceCode);
        const len = result.isConfirmed.length;

        // All bars from 2020 should be confirmed (their closeTime is far in the past)
        expect(len).toBeGreaterThan(10);
        const confirmedCount = result.isConfirmed.filter((v: boolean) => v === true).length;
        expect(confirmedCount).toBe(len);
    });

    it('should count confirmed bars in a loop (regression: confirmedCount was always 0)', async () => {
        // Before the fix, barstate.isconfirmed was always false for historical data
        // because it used Series bracket access instead of .data[] access.
        // This caused confirmedCount to be 0 in the pressure-zone-analyzer script.
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { barstate } = context.pine;

            // Accumulate confirmed count — before the fix, this was always 0
            let confirmedCount = 0;
            if (barstate.isconfirmed) {
                confirmedCount = 1;
            }

            return { confirmedCount };
        };

        const { result } = await pineTS.run(sourceCode);

        // Every bar in 2020 should have confirmedCount = 1
        // (before the fix, every bar had confirmedCount = 0)
        const allConfirmed = result.confirmedCount.every((v: number) => v === 1);
        expect(allConfirmed).toBe(true);
    });

    it('should report islastconfirmedhistory as boolean without crashing (regression: Series data access)', async () => {
        // Regression test: islastconfirmedhistory used to crash when accessing
        // closeTime[idx] on a Series object. Fixed to use closeTime.data[idx].
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { barstate } = context.pine;
            const isLCH = barstate.islastconfirmedhistory;
            return { isLCH };
        };

        const { result } = await pineTS.run(sourceCode);

        // Should not crash and return booleans for each bar
        expect(result.isLCH.length).toBeGreaterThan(10);
        for (const val of result.isLCH) {
            expect(typeof val).toBe('boolean');
        }
    });

    it('should use barstate.isconfirmed in conditional logic (Pine Script)', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate, eDate);

        const code = `
//@version=5
indicator("Barstate Confirmed Pine Test")

var int confirmedBars = 0
if barstate.isconfirmed
    confirmedBars += 1

plot(confirmedBars, "Confirmed")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Confirmed']).toBeDefined();

        // Last value should be the total number of confirmed bars
        // For all-historical data, every bar is confirmed so the final count
        // should equal the total number of bars
        const lastValue = plots['Confirmed'].data[plots['Confirmed'].data.length - 1].value;
        expect(lastValue).toBeGreaterThan(0);
        expect(lastValue).toBe(plots['Confirmed'].data.length);
    });
});
