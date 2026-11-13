import { describe, expect, it } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';

describe('Matrix Namespace', () => {
    it('should handle basic matrix operations correctly', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-05').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { matrix, array } = context.pine;

            // Creation
            const m1 = matrix.new(2, 3, 0); // 2 rows, 3 cols, val 0
            const m2 = matrix.new(2, 2, 1.5);

            // Set/Get
            matrix.set(m1, 0, 0, 10);
            matrix.set(m1, 1, 2, 20);
            const val1 = matrix.get(m1, 0, 0);
            const val2 = matrix.get(m1, 1, 2);
            const val3 = matrix.get(m1, 0, 1);

            // Dimensions
            const rows1 = matrix.rows(m1);
            const cols1 = matrix.columns(m1);
            const count = matrix.elements_count(m1);

            // Operations
            matrix.fill(m1, 5, 0, 1, 1, 3); // row 0, cols 1-2 (exclusive 3) -> 5
            const val4 = matrix.get(m1, 0, 1);
            const val5 = matrix.get(m1, 0, 2);

            // Add/Remove

            matrix.add_row(m1, 2, array.from(1, 2, 3));
            const rows2 = matrix.rows(m1); // 3
            const val6 = matrix.get(m1, 2, 0);

            const col_vals = array.from(9, 9, 9);
            matrix.add_col(m1, 3, col_vals);
            const cols2 = matrix.columns(m1);
            const val7 = matrix.get(m1, 0, 3);

            // Math operations (basic check)
            const m_sum = matrix.sum(m2, 2.5); // 1.5 + 2.5 = 4
            const sum_val = matrix.get(m_sum, 0, 0);

            const m_mult = matrix.mult(m2, 2); // 1.5 * 2 = 3
            const mult_val = matrix.get(m_mult, 0, 0);

            // Stats
            const avg = matrix.avg(m2); // 1.5
            const max = matrix.max(m1); // 20
            const min = matrix.min(m1); // 0 (from initialization)

            return {
                val1,
                val2,
                val3,
                rows1,
                cols1,
                count,
                val4,
                val5,
                rows2,
                val6,
                cols2,
                val7,
                sum_val,
                mult_val,
                avg,
                max,
                min,
            };
        };

        const { result } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.val1)).toBe(10);
        expect(last(result.val2)).toBe(20);
        expect(last(result.val3)).toBe(0); // Before fill

        expect(last(result.rows1)).toBe(2);
        expect(last(result.cols1)).toBe(3);
        expect(last(result.count)).toBe(6);

        expect(last(result.val4)).toBe(5); // After fill
        expect(last(result.val5)).toBe(5); // After fill

        expect(last(result.rows2)).toBe(3);
        expect(last(result.val6)).toBe(1);

        expect(last(result.cols2)).toBe(4);
        expect(last(result.val7)).toBe(9);

        expect(last(result.sum_val)).toBe(4);
        expect(last(result.mult_val)).toBe(3);

        expect(last(result.avg)).toBe(1.5);
        expect(last(result.max)).toBe(20);
        expect(last(result.min)).toBe(0);
    });

    it('should handle matrix transformations', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-05').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { matrix } = context.pine;

            // Transpose
            const m1 = matrix.new(2, 3, 0);
            matrix.set(m1, 0, 0, 1);
            matrix.set(m1, 0, 1, 2);
            matrix.set(m1, 0, 2, 3);
            matrix.set(m1, 1, 0, 4);
            matrix.set(m1, 1, 1, 5);
            matrix.set(m1, 1, 2, 6);

            const m_t = matrix.transpose(m1); // 3x2
            const t_rows = matrix.rows(m_t);
            const t_cols = matrix.columns(m_t);
            const t_val = matrix.get(m_t, 0, 1); // was 1,0 -> 4

            // Reshape
            const m_r = matrix.copy(m1);
            matrix.reshape(m_r, 3, 2);
            const r_rows = matrix.rows(m_r);
            const r_val = matrix.get(m_r, 2, 1); // 6

            // Submatrix
            const m_sub = matrix.submatrix(m1, 0, 2, 1, 3); // rows 0-2, cols 1-3 -> 2x2: [[2,3], [5,6]]
            const sub_val1 = matrix.get(m_sub, 0, 0); // 2
            const sub_val2 = matrix.get(m_sub, 1, 1); // 6

            // Reverse
            const m_rev = matrix.copy(m1);
            matrix.reverse(m_rev); // Reverses rows
            const rev_val = matrix.get(m_rev, 0, 0);

            return {
                t_rows,
                t_cols,
                t_val,
                r_rows,
                r_val,
                sub_val1,
                sub_val2,
                rev_val,
            };
        };

        const { result } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.t_rows)).toBe(3);
        expect(last(result.t_cols)).toBe(2);
        expect(last(result.t_val)).toBe(4);

        expect(last(result.r_rows)).toBe(3);
        expect(last(result.r_val)).toBe(6);

        expect(last(result.sub_val1)).toBe(2);
        expect(last(result.sub_val2)).toBe(6);

        expect(last(result.rev_val)).toBe(6);
    });
});
