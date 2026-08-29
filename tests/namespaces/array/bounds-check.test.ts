// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Array.get Bounds Checking Tests
 *
 * Tests that out-of-bounds array access halts the script with a
 * PineRuntimeError (TradingView parity), while valid indices —
 * including v6 negative indices — return the correct values.
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';

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

    it('should throw PineRuntimeError for negative index beyond bounds', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(3, 100);
            const oob = array.get(arr, -4);    // out of bounds (beyond first)

            return { oob };
        };

        await expect(pineTS.run(sourceCode)).rejects.toThrow(PineRuntimeError);
    });

    it('should throw PineRuntimeError for index >= array length', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(3, 100);
            const val_at_length = array.get(arr, 3);    // index == length

            return { val_at_length };
        };

        await expect(pineTS.run(sourceCode)).rejects.toThrow(/out of bounds/);
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

    it('should throw PineRuntimeError for empty array access', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(0);
            const val = array.get(arr, 0);

            return { val };
        };

        await expect(pineTS.run(sourceCode)).rejects.toThrow(/out of bounds/);
    });

    it('should include method name and index in the runtime error', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.get(arr, 5);
        };

        let caught: unknown;
        try {
            await pineTS.run(sourceCode);
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(PineRuntimeError);
        expect((caught as PineRuntimeError).method).toBe('array.get');
        expect((caught as PineRuntimeError).message).toContain('Index 5 is out of bounds');
        expect((caught as PineRuntimeError).message).toContain('array size is 3');
    });
});
