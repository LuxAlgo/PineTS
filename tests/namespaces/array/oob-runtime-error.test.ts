// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Out-of-Bounds Runtime Error Tests (TradingView parity)
 *
 * TradingView halts the script with a runtime error on out-of-bounds
 * array/matrix access ("Index xx is out of bounds. Array size is yy",
 * see https://www.tradingview.com/pine-script-docs/v4/essential/arrays/).
 * PineTS must throw a catchable PineRuntimeError, not warn-and-continue.
 *
 * Regression guard for: empty array + a.get(2) silently returned na.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';

const startDate = new Date('2024-01-01').getTime();
const endDate = new Date('2024-01-03').getTime();

function newPineTS() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, startDate, endDate);
}

describe('Out-of-bounds access throws PineRuntimeError (TV parity)', () => {
    it('array.get on an empty array halts the script (original report)', async () => {
        const script = `
//@version=6
indicator("Ask Aggression Oscillator", "AAO", overlay = false, precision = 2, max_bars_back = 500)

a = array.new<float>(0)
b = a.get(2)
plot(b)
`;
        let caught: unknown;
        try {
            await newPineTS().run(script);
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(PineRuntimeError);
        expect((caught as PineRuntimeError).method).toBe('array.get');
        expect((caught as PineRuntimeError).message).toContain('Index 2 is out of bounds');
        expect((caught as PineRuntimeError).message).toContain('size is 0');
    });

    it('array.get with index >= size throws', async () => {
        const code = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            return array.get(arr, 3);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('array.get with negative index beyond -size throws', async () => {
        const code = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            return array.get(arr, -4);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('array.set out of bounds throws', async () => {
        const code = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.set(arr, 5, 42);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('array.insert beyond size throws', async () => {
        const code = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.insert(arr, 5, 42);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('array.remove out of bounds throws', async () => {
        const code = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            return array.remove(arr, 5);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('matrix.get out of bounds throws', async () => {
        const code = (context: any) => {
            const { matrix } = context.pine;
            const m = matrix.new(3, 3, 0);
            return matrix.get(m, 5, 0);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('matrix.set out of bounds throws', async () => {
        const code = (context: any) => {
            const { matrix } = context.pine;
            const m = matrix.new(3, 3, 0);
            matrix.set(m, 0, 5, 1);
        };
        await expect(newPineTS().run(code)).rejects.toThrow(PineRuntimeError);
    });

    it('matrix.row / matrix.col out of bounds throw', async () => {
        const rowCode = (context: any) => {
            const { matrix } = context.pine;
            const m = matrix.new(3, 3, 0);
            return matrix.row(m, 5);
        };
        const colCode = (context: any) => {
            const { matrix } = context.pine;
            const m = matrix.new(3, 3, 0);
            return matrix.col(m, 5);
        };
        await expect(newPineTS().run(rowCode)).rejects.toThrow(PineRuntimeError);
        await expect(newPineTS().run(colCode)).rejects.toThrow(PineRuntimeError);
    });

    it('valid access still works (no throw)', async () => {
        const code = (context: any) => {
            const { array, matrix } = context.pine;
            const arr = array.new_float(3, 100);
            const mat = matrix.new(2, 2, 7);
            const a = array.get(arr, 2);
            const neg = array.get(arr, -1);
            const m = matrix.get(mat, 1, 1);
            return { a, neg, m };
        };
        const { result } = await newPineTS().run(code);
        const last = (arr: any[]) => arr[arr.length - 1];
        expect(last(result.a)).toBe(100);
        expect(last(result.neg)).toBe(100);
        expect(last(result.m)).toBe(7);
    });
});
