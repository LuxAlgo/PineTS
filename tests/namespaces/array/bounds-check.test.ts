// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Array.get Bounds Checking Tests
 *
 * Regression tests for array.get() out-of-bounds access.
 * Previously, out-of-bounds array.get() returned `undefined`, which caused
 * downstream crashes when accessing properties (e.g., `undefined.zoneLine`).
 *
 * The fix returns NaN (Pine's `na`) for out-of-bounds indices, matching
 * Pine Script's behavior where out-of-bounds access returns na.
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';

describe('Array.get Bounds Checking', () => {
    const sDate = new Date('2024-01-01').getTime();
    const eDate = new Date('2024-01-02').getTime();

    it('should return NaN for negative index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_float(3, 100);
            const val = array.get(arr, -1);
            const isNa = na(val);

            return { val, isNa };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.val)).toBeNaN();
        expect(last(result.isNa)).toBe(true);
    });

    it('should return NaN for index >= array length', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_float(3, 100);
            const val_at_length = array.get(arr, 3);    // index == length
            const val_beyond = array.get(arr, 10);       // index > length
            const isNa1 = na(val_at_length);
            const isNa2 = na(val_beyond);

            return { val_at_length, val_beyond, isNa1, isNa2 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.val_at_length)).toBeNaN();
        expect(last(result.val_beyond)).toBeNaN();
        expect(last(result.isNa1)).toBe(true);
        expect(last(result.isNa2)).toBe(true);
    });

    it('should return correct value for valid index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(0);
            array.push(arr, 10);
            array.push(arr, 20);
            array.push(arr, 30);

            const first = array.get(arr, 0);
            const mid = array.get(arr, 1);
            const last_val = array.get(arr, 2);

            return { first, mid, last_val };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.first)).toBe(10);
        expect(last(result.mid)).toBe(20);
        expect(last(result.last_val)).toBe(30);
    });

    it('should return NaN for empty array access', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_float(0);
            const val = array.get(arr, 0);
            const isNa = na(val);

            return { val, isNa };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.val)).toBeNaN();
        expect(last(result.isNa)).toBe(true);
    });

    it('should use method syntax for bounds check (arr.get())', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_int(5, 42);
            const valid = arr.get(2);
            const invalid = arr.get(10);

            return { valid, invalid };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.valid)).toBe(42);
        expect(last(result.invalid)).toBeNaN();
    });

    it('should handle bounds check in conditional logic (regression: zoneLine crash)', async () => {
        // This reproduces the pattern that caused the PZA crash:
        // array.get(zones, idx) where idx is out of bounds returned undefined,
        // then accessing .someProperty on undefined crashed.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_float(0);
            array.push(arr, 100);
            array.push(arr, 200);

            // Access out of bounds — should be NaN, not undefined
            const oob = array.get(arr, 5);
            // na() check should work on the result
            const isOobNa = na(oob);

            // Safe conditional access pattern
            let safeVal = 0;
            if (!na(array.get(arr, 0))) {
                safeVal = array.get(arr, 0);
            }

            return { oob, isOobNa, safeVal };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.isOobNa)).toBe(true);
        expect(last(result.safeVal)).toBe(100);
    });
});
