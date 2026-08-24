import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

/**
 * Pine truncates fractional "int" values at the point of use.
 *
 * Since Pine v6, `int / int` never truncates (see TradingView's v6 migration
 * guide, "Fractional division of constants") but the static TYPE of the result
 * stays `int`, so expressions like `(i / 6) + 1` remain valid arguments for
 * int-typed parameters such as table.cell()'s column/row. TradingView truncates
 * the fractional value toward zero when it is consumed (same rule as the
 * history-referencing offset and the int() cast).
 *
 * Regression: the "Ultimate Opening Range Breakout" variant with an hourly
 * activity dashboard computes `row = (i / 6) + 1` and crashed PineTS with
 * "Cannot read properties of undefined (reading '1')" because the fractional
 * row slipped past TableObject.setCell's bounds check.
 */
describe('table: fractional int coordinates (point-of-use truncation)', () => {
    function newPineTS() {
        return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    }

    it('v6 int-division row index: 24 hourly cells land on rows 1..4 (reported bug shape)', async () => {
        const pineTS = newPineTS();
        const { plots } = await pineTS.run(`
//@version=6
indicator("t")
if barstate.islast
    var table t = table.new(position.bottom_right, 6, 6)
    for i = 0 to 23
        t.cell(i % 6, (i / 6) + 1, str.tostring(i))
plot(close)
`);

        const tables = plots['__tables__'].data[0].value;
        expect(tables.length).toBe(1);
        const cells = tables[0].cells;

        // On TradingView, i = 0..5 -> row 1, 6..11 -> row 2, 12..17 -> row 3, 18..23 -> row 4.
        for (let i = 0; i <= 23; i++) {
            const row = Math.trunc(i / 6) + 1;
            const col = i % 6;
            expect(cells[row][col]?.text, `cell for i=${i}`).toBe(String(i));
        }
        // Row 0 and row 5 stay untouched.
        expect(cells[0].every((c: any) => c === null)).toBe(true);
        expect(cells[5].every((c: any) => c === null)).toBe(true);
    });

    it('truncates fractional coordinates toward zero in table.cell()', async () => {
        const pineTS = newPineTS();
        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 3);
            table.cell(t, 1.9, 2.9, 'X');
            var cell = t.getCell(1, 2);
            var cellText = cell ? cell.text : 'missing';
            return { cellText };
        });
        expect(result.cellText[0]).toBe('X');
    });

    it('na/NaN coordinates are a silent no-op, not a crash', async () => {
        const pineTS = newPineTS();
        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 2, 2);
            table.cell(t, NaN, NaN, 'X');
            table.cell(t, 0, NaN, 'Y');
            var cell = t.getCell(0, 0);
            var untouched = cell === null;
            return { untouched };
        });
        expect(result.untouched[0]).toBe(true);
    });

    it('truncates fractional coordinates in merge_cells and cell setters', async () => {
        const pineTS = newPineTS();
        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 4, 4);
            table.cell(t, 0, 0, 'A');
            table.merge_cells(t, 0.4, 0.4, 2.6, 0.9); // -> merge (0,0)..(2,0)
            table.cell_set_text(t, 0.7, 0.2, 'B'); // -> (0,0)
            var cell = t.getCell(0, 0);
            var cellText = cell ? cell.text : 'missing';
            var merge = t.merges[0];
            var mergeEndCol = merge.endCol;
            var mergeEndRow = merge.endRow;
            return { cellText, mergeEndCol, mergeEndRow };
        });
        expect(result.cellText[0]).toBe('B');
        expect(result.mergeEndCol[0]).toBe(2);
        expect(result.mergeEndRow[0]).toBe(0);
    });

    it('truncates fractional dimensions in table.new()', async () => {
        const pineTS = newPineTS();
        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3.7, 2.9);
            var t_columns = t.columns;
            var t_rows = t.rows;
            return { t_columns, t_rows };
        });
        expect(result.t_columns[0]).toBe(3);
        expect(result.t_rows[0]).toBe(2);
    });
});
