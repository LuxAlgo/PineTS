// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('array.min() and array.max()', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    // ── array.min() ──────────────────────────────────────

    describe('array.min()', () => {
        it('should return minimum of a basic array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.min(arr), 'min');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBe(10);
        });

        it('should return minimum of a single-element array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(42);
                plotchar(array.min(arr), 'min');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBe(42);
        });

        it('should handle negative values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(5, -3, 10, -7, 2);
                plotchar(array.min(arr), 'min');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBe(-7);
        });

        it('should handle all identical values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.new(5, 7.5);
                plotchar(array.min(arr), 'min');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBe(7.5);
        });

        it('should handle fractional values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(1.5, 0.3, 0.7, 2.1);
                plotchar(array.min(arr), 'min');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBeCloseTo(0.3, 10);
        });

        it('should return nth smallest with nth=1 (2nd smallest)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.min(arr, 1), 'min_nth');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min_nth'].data[0].value).toBe(20);
        });

        it('should return nth smallest with nth=2 (3rd smallest)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.min(arr, 2), 'min_nth');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min_nth'].data[0].value).toBe(30);
        });

        it('should return last element when nth = size-1', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.min(arr, 4), 'min_last');
            `;
            const { plots } = await pineTS.run(code);
            // 5th smallest = maximum = 50
            expect(plots['min_last'].data[0].value).toBe(50);
        });

        it('should handle empty array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.new_float(0);
                plotchar(array.min(arr), 'min');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBeNaN();
        });

        it('should handle large array (100 elements)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.new_float(0);
                for (let i = 100; i >= 1; i--) {
                    array.push(arr, i);
                }
                plotchar(array.min(arr), 'min');
                plotchar(array.min(arr, 99), 'max_via_nth');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['min'].data[0].value).toBe(1);
            expect(plots['max_via_nth'].data[0].value).toBe(100);
        });
    });

    // ── array.max() ──────────────────────────────────────

    describe('array.max()', () => {
        it('should return maximum of a basic array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.max(arr), 'max');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max'].data[0].value).toBe(50);
        });

        it('should return maximum of a single-element array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(42);
                plotchar(array.max(arr), 'max');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max'].data[0].value).toBe(42);
        });

        it('should handle negative values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(-5, -3, -10, -7, -2);
                plotchar(array.max(arr), 'max');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max'].data[0].value).toBe(-2);
        });

        it('should handle all identical values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.new(5, 7.5);
                plotchar(array.max(arr), 'max');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max'].data[0].value).toBe(7.5);
        });

        it('should return nth largest with nth=1 (2nd largest)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.max(arr, 1), 'max_nth');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max_nth'].data[0].value).toBe(40);
        });

        it('should return nth largest with nth=2 (3rd largest)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.max(arr, 2), 'max_nth');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max_nth'].data[0].value).toBe(30);
        });

        it('should return last element when nth = size-1', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.from(30, 10, 50, 20, 40);
                plotchar(array.max(arr, 4), 'max_last');
            `;
            const { plots } = await pineTS.run(code);
            // 5th largest = minimum = 10
            expect(plots['max_last'].data[0].value).toBe(10);
        });

        it('should handle empty array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.new_float(0);
                plotchar(array.max(arr), 'max');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max'].data[0].value).toBeNaN();
        });

        it('should handle large array (100 elements)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let arr = array.new_float(0);
                for (let i = 1; i <= 100; i++) {
                    array.push(arr, i);
                }
                plotchar(array.max(arr), 'max');
                plotchar(array.max(arr, 99), 'min_via_nth');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['max'].data[0].value).toBe(100);
            expect(plots['min_via_nth'].data[0].value).toBe(1);
        });
    });

    // ── min/max combined usage (like SuperTrend AI K-means) ──

    describe('min/max in K-means pattern', () => {
        it('should find index of minimum distance (dist.indexof(dist.min()))', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, math, plotchar } = context.pine;
                let dist = array.from(5.0, 2.0, 8.0);
                let minVal = array.min(dist);
                let idx = array.indexof(dist, minVal);
                plotchar(minVal, 'minVal');
                plotchar(idx, 'idx');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['minVal'].data[0].value).toBe(2);
            expect(plots['idx'].data[0].value).toBe(1);
        });

        it('should handle distance array with duplicate minimums', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let dist = array.from(3.0, 1.0, 1.0);
                let minVal = array.min(dist);
                let idx = array.indexof(dist, minVal);
                plotchar(minVal, 'minVal');
                plotchar(idx, 'idx');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['minVal'].data[0].value).toBe(1);
            // indexof returns first occurrence
            expect(plots['idx'].data[0].value).toBe(1);
        });
    });
});
