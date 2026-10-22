import { describe, expect, it, vi } from 'vitest';

import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';
import { TableHelper } from '../../../src/namespaces/table/TableHelper';
import { TableObject } from '../../../src/namespaces/table/TableObject';
import { ExecutionBudget } from '../../../src/security/ExecutionBudget';

function helperWithBudget(budget = new ExecutionBudget()) {
    const context = { plots: Object.create(null), marketData: [], executionBudget: budget };
    return { helper: new TableHelper(context), budget };
}

describe('table dimension and range guards', () => {
    it.each([
        [-1, 3],
        [3, -1],
        [NaN, 0],
        [Infinity, 0],
        [0, -Infinity],
        [Number.MAX_SAFE_INTEGER + 1, 0],
        [0, Number.MAX_SAFE_INTEGER + 1],
        [100_001, 0],
        [0, 100_001],
    ])('rejects invalid dimensions (%s, %s) before allocating', (columns, rows) => {
        expect(() => new TableObject('top_right', columns, rows)).toThrow(PineRuntimeError);
    });

    it('preserves Pine point-of-use truncation and empty-dimension tables', () => {
        const fractional = new TableObject('top_right', 3.7, 2.9);
        expect([fractional.columns, fractional.rows, fractional.cells.length]).toEqual([3, 2, 2]);
        expect(fractional.cells[0].length).toBe(3);

        const zeroColumns = new TableObject('top_right', 0, 2);
        expect(zeroColumns.cells).toEqual([[], []]);

        const zeroRows = new TableObject('top_right', 2, 0);
        expect(zeroRows.cells).toEqual([]);

        const { helper } = helperWithBudget();
        expect(helper.new('top_left', 0, 2).columns).toBe(0);
        expect(helper.new('top_center', 2, 0).rows).toBe(0);
    });

    it('rejects out-of-bounds clear spans before touching any cell', () => {
        const { helper } = helperWithBudget();
        const table = helper.new('top_right', 1, 1);
        table.setCell(0, 0, { text: 'preserve' });
        const clearCell = vi.spyOn(table, 'clearCell');

        expect(() => helper.clear(table, -1, 0, 100_001, 0)).toThrow(PineRuntimeError);
        expect(clearCell).not.toHaveBeenCalled();
        expect(table.getCell(0, 0)?.text).toBe('preserve');
    });

    it('rejects invalid merge rectangles before any partial cell or merge mutation', () => {
        const { helper } = helperWithBudget();
        const table = helper.new('top_right', 1, 1);
        const markMerged = vi.spyOn(table, 'markMerged');

        expect(() => helper.merge_cells(table, 0, 0, 100_001, 0)).toThrow(PineRuntimeError);
        expect(markMerged).not.toHaveBeenCalled();
        expect(table.merges).toEqual([]);
        expect(table.getCell(0, 0)).toBeNull();
    });

    it.each([
        [-1, 0, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, -1],
        [Number.MAX_SAFE_INTEGER + 1, 0, 0, 0],
        [Infinity, 0, 0, 0],
    ])('rejects invalid range coordinates (%s, %s, %s, %s)', (sc, sr, ec, er) => {
        const { helper } = helperWithBudget();
        const table = helper.new('top_right', 1, 1);
        expect(() => helper.clear(table, sc, sr, ec, er)).toThrow(PineRuntimeError);
        expect(() => helper.merge_cells(table, sc, sr, ec, er)).toThrow(PineRuntimeError);
        expect(table.merges).toEqual([]);
    });

    it('charges the shared budget before a range operation and preserves valid truncation', () => {
        const budget = new ExecutionBudget(100, { maxWorkUnits: 7 });
        const { helper } = helperWithBudget(budget);
        const table = helper.new('top_right', 2, 2);
        table.setCell(0, 0, { text: 'A' });
        table.setCell(1, 0, { text: 'B' });
        const clearCell = vi.spyOn(table, 'clearCell');

        expect(() => helper.clear(table, 0.8, 0.9, 1.9, 0.9)).toThrow(PineRuntimeError);
        expect(clearCell).not.toHaveBeenCalled();
        expect(table.getCell(0, 0)?.text).toBe('A');
        expect(table.getCell(1, 0)?.text).toBe('B');
    });

    it('charges table creation before it enters helper state', () => {
        const budget = new ExecutionBudget(100, { maxWorkUnits: 1 });
        const { helper } = helperWithBudget(budget);
        expect(() => helper.new('top_right', 2, 2)).toThrow(PineRuntimeError);
        expect(helper.all).toEqual([]);
    });

    it('preserves valid clear and merge ranges, including fractional coordinates', () => {
        const { helper, budget } = helperWithBudget();
        const table = helper.new('top_right', 2, 2);
        table.setCell(0, 0, { text: 'A' });
        table.setCell(1, 0, { text: 'B' });

        helper.clear(table, 0.9, 0.9, 1.9, 0.9);
        expect(table.getCell(0, 0)).toBeNull();
        expect(table.getCell(1, 0)).toBeNull();

        helper.merge_cells(table, 0.9, 0.9, 1.9, 1.9);
        expect(table.merges).toEqual([{ startCol: 0, startRow: 0, endCol: 1, endRow: 1 }]);
        expect(table.getCell(1, 1)?._merge_parent).toEqual([0, 0]);
        expect(budget.workUnits).toBe(12); // 2 rows + 4 cells + 2 clears + 4 merge visits
    });

    it('does not invoke methods on a table-shaped host object', () => {
        const { helper } = helperWithBudget();
        const fake = { columns: 1, rows: 1, clearCell: vi.fn(), markMerged: vi.fn(), merges: [] };
        expect(() => helper.clear(fake, 0, 0, 0, 0)).toThrow(PineRuntimeError);
        expect(() => helper.merge_cells(fake, 0, 0, 0, 0)).toThrow(PineRuntimeError);
        expect(fake.clearCell).not.toHaveBeenCalled();
        expect(fake.markMerged).not.toHaveBeenCalled();
    });

    it('keeps NaN range coordinates as Pine no-ops', () => {
        const { helper } = helperWithBudget();
        const table = helper.new('top_right', 1, 1);
        table.setCell(0, 0, { text: 'A' });
        helper.clear(table, NaN, 0, 0, 0);
        helper.merge_cells(table, 0, NaN, 0, 0);
        expect(table.getCell(0, 0)?.text).toBe('A');
        expect(table.merges).toEqual([]);
    });
});
