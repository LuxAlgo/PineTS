// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Array.get Bounds Checking Tests
 *
 * Tests that out-of-bounds array access emits a warning and returns na (NaN),
 * allowing the script to continue execution (non-blocking).
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';

describe('Array.get Bounds Checking', () => {
    const sDate = new Date('2024-01-01').getTime();
    const eDate = new Date('2024-01-02').getTime();

    it('should resolve negative index from end (Pine v6 semantics)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(3, 100);
            const val = array.get(arr, -1);    // last element
            const val2 = array.get(arr, -3);   // first element

            return { val, val2 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.val)).toBe(100);   // -1 -> last element
        expect(last(result.val2)).toBe(100);  // -3 -> first element
    });

    it('should return NaN and emit warning for negative index beyond bounds', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_float(3, 100);
            const oob = array.get(arr, -4);    // out of bounds (beyond first)
            const isNa = na(oob);

            return { oob, isNa };
        };

        const ctx = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(ctx.result.oob)).toBeNaN();
        expect(last(ctx.result.isNa)).toBe(true);
        expect(ctx.warnings.length).toBeGreaterThan(0);
        expect(ctx.warnings[0].method).toBe('array.get');
    });

    it('should return NaN and emit warning for index >= array length', async () => {
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

        const ctx = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(ctx.result.val_at_length)).toBeNaN();
        expect(last(ctx.result.val_beyond)).toBeNaN();
        expect(last(ctx.result.isNa1)).toBe(true);
        expect(last(ctx.result.isNa2)).toBe(true);
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

    it('should return NaN and emit warning for empty array access', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array, na } = context.pine;

            const arr = array.new_float(0);
            const val = array.get(arr, 0);
            const isNa = na(val);

            return { val, isNa };
        };

        const ctx = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(ctx.result.val)).toBeNaN();
        expect(last(ctx.result.isNa)).toBe(true);
        expect(ctx.warnings.length).toBeGreaterThan(0);
    });

    it('should include method name in warning', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.get(arr, 5);
        };

        const ctx = await pineTS.run(sourceCode);
        expect(ctx.warnings.length).toBeGreaterThan(0);
        expect(ctx.warnings[0].method).toBe('array.get');
        expect(ctx.warnings[0].message).toContain('out of bounds');
    });
});
