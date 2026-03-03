import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('TABLE Namespace', () => {
    it('table.new() creates with default properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            var t_position = t.position;
            var t_columns = t.columns;
            var t_rows = t.rows;
            var t_bgcolor = t.bgcolor;
            var t_frame_width = t.frame_width;
            var t_border_width = t.border_width;
            return { t_position, t_columns, t_rows, t_bgcolor, t_frame_width, t_border_width };
        });

        expect(result.t_position[0]).toBe('top_right');
        expect(result.t_columns[0]).toBe(3);
        expect(result.t_rows[0]).toBe(2);
        expect(result.t_bgcolor[0]).toBe('');
        expect(result.t_frame_width[0]).toBe(0);
        expect(result.t_border_width[0]).toBe(0);
        expect(plots['__tables__']).toBeDefined();
        expect(plots['__tables__'].data.length).toBeGreaterThan(0);
    });

    it('table.new() with all parameters', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('bottom_left', 4, 3, {
                bgcolor: '#1e293b',
                frame_color: '#475569',
                frame_width: 2,
                border_color: '#334155',
                border_width: 1,
            });
            var t_position = t.position;
            var t_columns = t.columns;
            var t_rows = t.rows;
            var t_bgcolor = t.bgcolor;
            var t_frame_color = t.frame_color;
            var t_frame_width = t.frame_width;
            var t_border_color = t.border_color;
            var t_border_width = t.border_width;
            return { t_position, t_columns, t_rows, t_bgcolor, t_frame_color, t_frame_width, t_border_color, t_border_width };
        });

        expect(result.t_position[0]).toBe('bottom_left');
        expect(result.t_columns[0]).toBe(4);
        expect(result.t_rows[0]).toBe(3);
        expect(result.t_bgcolor[0]).toBe('#1e293b');
        expect(result.t_frame_color[0]).toBe('#475569');
        expect(result.t_frame_width[0]).toBe(2);
        expect(result.t_border_color[0]).toBe('#334155');
        expect(result.t_border_width[0]).toBe(1);
    });

    it('table.cell() sets cell content', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.cell(t, 0, 0, 'Hello');
            var cell = t.getCell(0, 0);
            var cellText = cell.text;
            var cellTextColor = cell.text_color;
            return { cellText, cellTextColor };
        });

        expect(result.cellText[0]).toBe('Hello');
        expect(result.cellTextColor[0]).toBe('#000000');
    });

    it('table.cell() with positional text and options', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.cell(t, 0, 0, { text: 'World', text_color: '#ffffff', bgcolor: '#ff0000' });
            var cell = t.getCell(0, 0);
            var cellText = cell.text;
            var cellTextColor = cell.text_color;
            var cellBgcolor = cell.bgcolor;
            return { cellText, cellTextColor, cellBgcolor };
        });

        expect(result.cellText[0]).toBe('World');
        expect(result.cellTextColor[0]).toBe('#ffffff');
        expect(result.cellBgcolor[0]).toBe('#ff0000');
    });

    it('table.cell_set_text() updates existing cell text', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.cell(t, 0, 0, 'Initial');
            table.cell_set_text(t, 0, 0, 'Updated');
            var cell = t.getCell(0, 0);
            var cellText = cell.text;
            return { cellText };
        });

        expect(result.cellText[0]).toBe('Updated');
    });

    it('table.cell_set_bgcolor() updates cell background', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.cell(t, 0, 0, 'Test');
            table.cell_set_bgcolor(t, 0, 0, '#00ff00');
            var cell = t.getCell(0, 0);
            var cellBgcolor = cell.bgcolor;
            return { cellBgcolor };
        });

        expect(result.cellBgcolor[0]).toBe('#00ff00');
    });

    it('table.cell_set_text_color() updates cell text color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.cell(t, 0, 0, 'Test');
            table.cell_set_text_color(t, 0, 0, '#ff00ff');
            var cell = t.getCell(0, 0);
            var cellTextColor = cell.text_color;
            return { cellTextColor };
        });

        expect(result.cellTextColor[0]).toBe('#ff00ff');
    });

    it('table.clear() clears cell range', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.cell(t, 0, 0, 'A');
            table.cell(t, 1, 0, 'B');
            table.cell(t, 2, 0, 'C');
            var beforeClear = t.getCell(0, 0) !== null;
            table.clear(t, 0, 0, 1, 0);
            var cell00After = t.getCell(0, 0);
            var cell10After = t.getCell(1, 0);
            var cell20After = t.getCell(2, 0);
            var cell00Null = cell00After === null;
            var cell10Null = cell10After === null;
            var cell20Exists = cell20After !== null;
            return { beforeClear, cell00Null, cell10Null, cell20Exists };
        });

        expect(result.beforeClear[0]).toBe(true);
        expect(result.cell00Null[0]).toBe(true);
        expect(result.cell10Null[0]).toBe(true);
        expect(result.cell20Exists[0]).toBe(true);
    });

    it('table.merge_cells() merges cell region', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            // Use let to only run on first bar — merge_cells on already-merged cells
            // would redirect setCell infinitely on subsequent bars with var
            let t = table.new('top_right', 3, 3);
            table.cell(t, 0, 0, 'Origin');
            table.merge_cells(t, 0, 0, 1, 1);
            let mergedCell = t.getCell(1, 1);
            let isMerged = mergedCell !== null && mergedCell._merged === true;
            let parentCol = mergedCell !== null ? mergedCell._merge_parent[0] : -1;
            let parentRow = mergedCell !== null ? mergedCell._merge_parent[1] : -1;
            let mergeCount = t.merges.length;
            return { isMerged, parentCol, parentRow, mergeCount };
        });

        expect(result.isMerged[0]).toBe(true);
        expect(result.parentCol[0]).toBe(0);
        expect(result.parentRow[0]).toBe(0);
        expect(result.mergeCount[0]).toBe(1);
    });

    it('table.set_position() updates table position', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            var posBefore = t.position;
            table.set_position(t, 'bottom_center');
            var posAfter = t.position;
            return { posBefore, posAfter };
        });

        expect(result.posBefore[0]).toBe('top_right');
        expect(result.posAfter[0]).toBe('bottom_center');
    });

    it('table-level setters update properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            table.set_bgcolor(t, '#111111');
            table.set_border_color(t, '#222222');
            table.set_border_width(t, 3);
            table.set_frame_color(t, '#333333');
            table.set_frame_width(t, 4);
            var t_bgcolor = t.bgcolor;
            var t_border_color = t.border_color;
            var t_border_width = t.border_width;
            var t_frame_color = t.frame_color;
            var t_frame_width = t.frame_width;
            return { t_bgcolor, t_border_color, t_border_width, t_frame_color, t_frame_width };
        });

        expect(result.t_bgcolor[0]).toBe('#111111');
        expect(result.t_border_color[0]).toBe('#222222');
        expect(result.t_border_width[0]).toBe(3);
        expect(result.t_frame_color[0]).toBe('#333333');
        expect(result.t_frame_width[0]).toBe(4);
    });

    it('table.delete() marks table as deleted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            var countBefore = table.all.length;
            table.delete(t);
            var deletedFlag = t._deleted;
            var countAfter = table.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('table.all returns non-deleted tables', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t1 = table.new('top_right', 2, 2);
            var t2 = table.new('bottom_left', 2, 2);
            var totalCount = table.all.length;
            table.delete(t2);
            var afterDeleteCount = table.all.length;
            return { totalCount, afterDeleteCount };
        });

        expect(result.totalCount[0]).toBe(2);
        expect(result.afterDeleteCount[0]).toBe(1);
    });

    it('instance t.delete() method works', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 2, 2);
            var countBefore = table.all.length;
            t.delete();
            var deletedFlag = t._deleted;
            var countAfter = table.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('data stored in __tables__ plot with correct structure', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var t = table.new('top_right', 2, 2, { bgcolor: '#1e293b' });
            table.cell(t, 0, 0, 'Test');
            return {};
        });

        expect(plots['__tables__']).toBeDefined();
        expect(plots['__tables__'].data.length).toBeGreaterThan(0);

        const tblEntry = plots['__tables__'].data[0];
        const tables = tblEntry.value;
        expect(Array.isArray(tables)).toBe(true);
        expect(tables.length).toBeGreaterThan(0);
        // Verify table properties
        const tbl = tables[0];
        expect(tbl.position).toBe('top_right');
        expect(tbl.columns).toBe(2);
        expect(tbl.rows).toBe(2);
        expect(tbl.bgcolor).toBe('#1e293b');
        expect(tblEntry.options.style).toBe('table');
    });

    it('multiple tables are aggregated into a single entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            table.new('top_right', 2, 2);
            table.new('bottom_left', 3, 3);
            return {};
        });

        // There should be exactly 1 data entry containing all tables
        expect(plots['__tables__'].data.length).toBe(1);
        const tables = plots['__tables__'].data[0].value;
        expect(Array.isArray(tables)).toBe(true);
        expect(tables.length).toBeGreaterThanOrEqual(2);
    });
});
