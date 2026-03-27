// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Matrix.mult(vector) Tests
 *
 * Verifies that matrix.mult(array) returns a PineArrayObject (flat vector),
 * matching TradingView behavior. Previously returned a PineMatrixObject (n×1),
 * causing array.get(i) to return NaN.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Matrix.mult(vector)', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    it('should return an array when multiplying matrix by vector', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = (context: any) => {
            const { matrix, array, plotchar } = context.pine;

            // 2x3 matrix × 3-element vector = 2-element array
            const m = matrix.new(2, 3, 0);
            matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
            matrix.set(m, 1, 0, 4); matrix.set(m, 1, 1, 5); matrix.set(m, 1, 2, 6);

            const v = array.from(1.0, 2.0, 3.0);
            const result = matrix.mult(m, v);

            // Result should be an array, not a matrix
            const val0 = array.get(result, 0); // 1*1 + 2*2 + 3*3 = 14
            const val1 = array.get(result, 1); // 4*1 + 5*2 + 6*3 = 32
            const sz = array.size(result);

            return { val0, val1, sz };
        };

        const ctx = await pineTS.run(code);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(ctx.result.val0)).toBe(14);
        expect(last(ctx.result.val1)).toBe(32);
        expect(last(ctx.result.sz)).toBe(2);
    });

    it('should return an array when using method syntax', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = (context: any) => {
            const { matrix, array } = context.pine;

            // 3x2 matrix × 2-element vector = 3-element array
            const m = matrix.new(3, 2, 0);
            matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 0);
            matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1);
            matrix.set(m, 2, 0, 2); matrix.set(m, 2, 1, 3);

            const v = array.from(5.0, 7.0);
            const result = m.mult(v); // method syntax

            const val0 = result.get(0); // 1*5 + 0*7 = 5
            const val1 = result.get(1); // 0*5 + 1*7 = 7
            const val2 = result.get(2); // 2*5 + 3*7 = 31

            return { val0, val1, val2 };
        };

        const ctx = await pineTS.run(code);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(ctx.result.val0)).toBe(5);
        expect(last(ctx.result.val1)).toBe(7);
        expect(last(ctx.result.val2)).toBe(31);
    });

    it('should work with transpiled Pine Script', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

        const code = `
//@version=6
indicator("Matrix Mult Vector Test")
m = matrix.new<float>(2, 2, 0)
matrix.set(m, 0, 0, 3.0)
matrix.set(m, 0, 1, 1.0)
matrix.set(m, 1, 0, 2.0)
matrix.set(m, 1, 1, 4.0)

v = array.from(2.0, 5.0)
result = m.mult(v)

// result should be array: [3*2+1*5, 2*2+4*5] = [11, 24]
plot(result.get(0), "r0")
plot(result.get(1), "r1")
plot(result.size(), "sz")
        `;

        const { plots } = await pineTS.run(code);
        expect(plots['r0'].data[0].value).toBe(11);
        expect(plots['r1'].data[0].value).toBe(24);
        expect(plots['sz'].data[0].value).toBe(2);
    });

    it('should still return matrix for matrix × matrix', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = (context: any) => {
            const { matrix } = context.pine;

            // 2x2 × 2x2 = 2x2 matrix
            const m1 = matrix.new(2, 2, 0);
            matrix.set(m1, 0, 0, 1); matrix.set(m1, 0, 1, 2);
            matrix.set(m1, 1, 0, 3); matrix.set(m1, 1, 1, 4);

            const m2 = matrix.new(2, 2, 0);
            matrix.set(m2, 0, 0, 5); matrix.set(m2, 0, 1, 6);
            matrix.set(m2, 1, 0, 7); matrix.set(m2, 1, 1, 8);

            const result = matrix.mult(m1, m2);

            // Should be a matrix: [[19, 22], [43, 50]]
            const r00 = matrix.get(result, 0, 0);
            const r01 = matrix.get(result, 0, 1);
            const r10 = matrix.get(result, 1, 0);
            const r11 = matrix.get(result, 1, 1);
            const rows = matrix.rows(result);

            return { r00, r01, r10, r11, rows };
        };

        const ctx = await pineTS.run(code);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(ctx.result.r00)).toBe(19);
        expect(last(ctx.result.r01)).toBe(22);
        expect(last(ctx.result.r10)).toBe(43);
        expect(last(ctx.result.r11)).toBe(50);
        expect(last(ctx.result.rows)).toBe(2);
    });
});
