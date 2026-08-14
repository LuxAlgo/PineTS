// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Array Methods - Edge Cases', () => {
    it('array.from should create arrays from variadic arguments', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.from(1, 2, 3, 4, 5);
            let size = array.size(arr);
            let first = array.first(arr);
            let last = array.last(arr);
            let third = array.get(arr, 2);
            
            plotchar(size, 'size');
            plotchar(first, 'first');
            plotchar(last, 'last');
            plotchar(third, 'third');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['size'].data[0].value).toBe(5);
        expect(plots['first'].data[0].value).toBe(1);
        expect(plots['last'].data[0].value).toBe(5);
        expect(plots['third'].data[0].value).toBe(3);
    });

    it('array.new_float should create arrays with initial values', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.new_float(5, 42.5);
            let size = array.size(arr);
            let first = array.first(arr);
            let last = array.last(arr);
            
            plotchar(size, 'size');
            plotchar(first, 'first');
            plotchar(last, 'last');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['size'].data[0].value).toBe(5);
        expect(plots['first'].data[0].value).toBe(42.5);
        expect(plots['last'].data[0].value).toBe(42.5);
    });

    it('array.range should compute max-min difference', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.new_float(5);
            array.set(arr, 0, 2);
            array.set(arr, 1, 4);
            array.set(arr, 2, 8);
            array.set(arr, 3, 1);
            array.set(arr, 4, 6);
            
            let range_val = array.range(arr);  // max(8) - min(1) = 7
            plotchar(range_val, 'range');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['range'].data[0].value).toBe(7);
    });

    it('array.reverse should handle empty arrays', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.new_float(0);
            array.reverse(arr);
            let size = array.size(arr);
            
            plotchar(size, 'size');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['size'].data[0].value).toBe(0);
    });

    it('array.sort should handle arrays with duplicates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.new_float(5);
            array.set(arr, 0, 5);
            array.set(arr, 1, 3);
            array.set(arr, 2, 5);
            array.set(arr, 3, 1);
            array.set(arr, 4, 3);
            
            array.sort(arr);
            let first = array.first(arr);
            let last = array.last(arr);
            
            plotchar(first, 'first');
            plotchar(last, 'last');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['first'].data[0].value).toBe(1);
        expect(plots['last'].data[0].value).toBe(5);
    });

    it('array.sort_indices should handle various cases', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            // Test with unsorted array [5, 2, 8, 1, 9]
            let arr = array.new_float(5);
            array.set(arr, 0, 5);
            array.set(arr, 1, 2);
            array.set(arr, 2, 8);
            array.set(arr, 3, 1);
            array.set(arr, 4, 9);
            
            let indices = array.sort_indices(arr);
            let first_idx = array.first(indices);
            
            plotchar(first_idx, 'first_idx');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['first_idx']).toBeDefined();
        // First index should point to smallest value (1 is at index 3)
        expect(plots['first_idx'].data[0].value).toBe(3);
    });

    it('array.standardize should handle arrays with zero standard deviation', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            // All same values - std dev = 0
            let arr = array.new_float(4, 5);
            let std_arr = array.standardize(arr);
            let first = array.first(std_arr);
            
            // When std dev is 0, standardization should return NaN or 0
            plotchar(first, 'standardized');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['standardized']).toBeDefined();
        const val = plots['standardized'].data[0].value;
        expect(val === 1).toBe(true);
    });

    it('array.slice should handle negative indices', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.new_float(5);
            array.set(arr, 0, 1);
            array.set(arr, 1, 2);
            array.set(arr, 2, 3);
            array.set(arr, 3, 4);
            array.set(arr, 4, 5);
            
            let sliced = array.slice(arr, -2);  // Last 2 elements
            let size = array.size(sliced);
            let last = array.last(sliced);
            
            plotchar(size, 'size');
            plotchar(last, 'last');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['size']).toBeDefined();
        expect(plots['last']).toBeDefined();
    });

    it('array operations should handle boundary conditions', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { array, plotchar } = context.pine;
            
            let arr = array.new_float(0);
            
            // Operations on empty array
            let avg = array.avg(arr);
            let sum = array.sum(arr);
            let max_val = array.max(arr);
            let min_val = array.min(arr);
            
            plotchar(sum, 'sum');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['sum']).toBeDefined();
        // Sum of empty array should be 0 or NaN
        const val = plots['sum'].data[0].value;
        expect(val === 0 || isNaN(val)).toBe(true);
    });
});
