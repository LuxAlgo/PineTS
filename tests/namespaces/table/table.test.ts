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

    // ══════════════════════════════════════════════════════════════
    // Method-call delegate syntax: t.cell(...) instead of table.cell(t, ...)
    // These tests verify the delegate methods added to TableObject
    // that enable Pine Script method-call syntax (e.g. tb.cell(0, 0, 'text'))
    // ══════════════════════════════════════════════════════════════

    it('t.cell() delegate sets cell content', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Delegate');
            var cell = t.getCell(0, 0);
            var cellText = cell.text;
            return { cellText };
        });

        expect(result.cellText[0]).toBe('Delegate');
    });

    it('t.cell() delegate with options object', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(1, 0, { text: 'OptCell', text_color: '#aabbcc', bgcolor: '#112233' });
            var cell = t.getCell(1, 0);
            var cellText = cell.text;
            var cellTextColor = cell.text_color;
            var cellBgcolor = cell.bgcolor;
            return { cellText, cellTextColor, cellBgcolor };
        });

        expect(result.cellText[0]).toBe('OptCell');
        expect(result.cellTextColor[0]).toBe('#aabbcc');
        expect(result.cellBgcolor[0]).toBe('#112233');
    });

    it('t.cell() delegate populates multiple cells', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'A');
            t.cell(1, 0, 'B');
            t.cell(2, 0, 'C');
            t.cell(0, 1, 'D');
            var a = t.getCell(0, 0).text;
            var b = t.getCell(1, 0).text;
            var c = t.getCell(2, 0).text;
            var d = t.getCell(0, 1).text;
            return { a, b, c, d };
        });

        expect(result.a[0]).toBe('A');
        expect(result.b[0]).toBe('B');
        expect(result.c[0]).toBe('C');
        expect(result.d[0]).toBe('D');
    });

    it('t.clear() delegate clears cell range', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'A');
            t.cell(1, 0, 'B');
            t.cell(2, 0, 'C');
            t.clear(0, 0, 1, 0);
            var cell00Null = t.getCell(0, 0) === null;
            var cell10Null = t.getCell(1, 0) === null;
            var cell20Exists = t.getCell(2, 0) !== null;
            return { cell00Null, cell10Null, cell20Exists };
        });

        expect(result.cell00Null[0]).toBe(true);
        expect(result.cell10Null[0]).toBe(true);
        expect(result.cell20Exists[0]).toBe(true);
    });

    it('t.merge_cells() delegate merges cell region', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            let t = table.new('top_right', 3, 3);
            t.cell(0, 0, 'Origin');
            t.merge_cells(0, 0, 1, 1);
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

    // ── Cell setter delegates ───────────────────────────────────

    it('t.cell_set_text() delegate updates cell text', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Before');
            t.cell_set_text(0, 0, 'After');
            var cellText = t.getCell(0, 0).text;
            return { cellText };
        });

        expect(result.cellText[0]).toBe('After');
    });

    it('t.cell_set_bgcolor() delegate updates cell background', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_bgcolor(0, 0, '#ff6600');
            var cellBgcolor = t.getCell(0, 0).bgcolor;
            return { cellBgcolor };
        });

        expect(result.cellBgcolor[0]).toBe('#ff6600');
    });

    it('t.cell_set_text_color() delegate updates cell text color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_text_color(0, 0, '#00ccff');
            var cellTextColor = t.getCell(0, 0).text_color;
            return { cellTextColor };
        });

        expect(result.cellTextColor[0]).toBe('#00ccff');
    });

    it('t.cell_set_text_size() delegate updates cell text size', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_text_size(0, 0, 'small');
            var cellTextSize = t.getCell(0, 0).text_size;
            return { cellTextSize };
        });

        expect(result.cellTextSize[0]).toBe('small');
    });

    it('t.cell_set_height() delegate updates cell height', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_height(0, 0, 50);
            var cellHeight = t.getCell(0, 0).height;
            return { cellHeight };
        });

        expect(result.cellHeight[0]).toBe(50);
    });

    it('t.cell_set_width() delegate updates cell width', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_width(0, 0, 100);
            var cellWidth = t.getCell(0, 0).width;
            return { cellWidth };
        });

        expect(result.cellWidth[0]).toBe(100);
    });

    it('t.cell_set_tooltip() delegate updates cell tooltip', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_tooltip(0, 0, 'Hover info');
            var cellTooltip = t.getCell(0, 0).tooltip;
            return { cellTooltip };
        });

        expect(result.cellTooltip[0]).toBe('Hover info');
    });

    it('t.cell_set_text_halign() delegate updates horizontal alignment', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_text_halign(0, 0, 'left');
            var cellHalign = t.getCell(0, 0).text_halign;
            return { cellHalign };
        });

        expect(result.cellHalign[0]).toBe('left');
    });

    it('t.cell_set_text_valign() delegate updates vertical alignment', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_text_valign(0, 0, 'top');
            var cellValign = t.getCell(0, 0).text_valign;
            return { cellValign };
        });

        expect(result.cellValign[0]).toBe('top');
    });

    it('t.cell_set_text_font_family() delegate updates font family', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.cell(0, 0, 'Test');
            t.cell_set_text_font_family(0, 0, 'monospace');
            var cellFont = t.getCell(0, 0).text_font_family;
            return { cellFont };
        });

        expect(result.cellFont[0]).toBe('monospace');
    });

    // ── Table-level setter delegates ────────────────────────────

    it('t.set_position() delegate updates table position', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            var posBefore = t.position;
            t.set_position('bottom_left');
            var posAfter = t.position;
            return { posBefore, posAfter };
        });

        expect(result.posBefore[0]).toBe('top_right');
        expect(result.posAfter[0]).toBe('bottom_left');
    });

    it('t.set_bgcolor() delegate updates table background', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.set_bgcolor('#aabb00');
            var bgAfter = t.bgcolor;
            return { bgAfter };
        });

        expect(result.bgAfter[0]).toBe('#aabb00');
    });

    it('t.set_border_color() delegate updates border color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.set_border_color('#99ff11');
            var borderColor = t.border_color;
            return { borderColor };
        });

        expect(result.borderColor[0]).toBe('#99ff11');
    });

    it('t.set_border_width() delegate updates border width', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.set_border_width(5);
            var borderWidth = t.border_width;
            return { borderWidth };
        });

        expect(result.borderWidth[0]).toBe(5);
    });

    it('t.set_frame_color() delegate updates frame color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.set_frame_color('#334455');
            var frameColor = t.frame_color;
            return { frameColor };
        });

        expect(result.frameColor[0]).toBe('#334455');
    });

    it('t.set_frame_width() delegate updates frame width', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.set_frame_width(3);
            var frameWidth = t.frame_width;
            return { frameWidth };
        });

        expect(result.frameWidth[0]).toBe(3);
    });

    // ── Combined delegate tests (mirrors real-world patterns) ───

    it('t.set_* delegates update all table properties at once', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 3, 2);
            t.set_bgcolor('#111111');
            t.set_border_color('#222222');
            t.set_border_width(3);
            t.set_frame_color('#333333');
            t.set_frame_width(4);
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

    it('delegate and namespace calls produce identical results', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            // Namespace-style: table.cell(t, ...)
            var t1 = table.new('top_right', 2, 2);
            table.cell(t1, 0, 0, 'Hello');
            table.cell_set_text_color(t1, 0, 0, '#ff0000');
            table.set_bgcolor(t1, '#aabbcc');
            var ns_text = t1.getCell(0, 0).text;
            var ns_textColor = t1.getCell(0, 0).text_color;
            var ns_bgcolor = t1.bgcolor;

            // Delegate-style: t.cell(...)
            var t2 = table.new('top_right', 2, 2);
            t2.cell(0, 0, 'Hello');
            t2.cell_set_text_color(0, 0, '#ff0000');
            t2.set_bgcolor('#aabbcc');
            var dl_text = t2.getCell(0, 0).text;
            var dl_textColor = t2.getCell(0, 0).text_color;
            var dl_bgcolor = t2.bgcolor;

            return { ns_text, ns_textColor, ns_bgcolor, dl_text, dl_textColor, dl_bgcolor };
        });

        // Both approaches should produce identical results
        expect(result.dl_text[0]).toBe(result.ns_text[0]);
        expect(result.dl_textColor[0]).toBe(result.ns_textColor[0]);
        expect(result.dl_bgcolor[0]).toBe(result.ns_bgcolor[0]);
    });

    it('delegate cell() with all options mirrors SuperTrend AI dashboard pattern', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            // Pattern from SuperTrend AI: tb.cell(col, row, text, {text_color, text_size, text_halign})
            var tb = table.new('top_right', 4, 4, {
                bgcolor: '#1e222d',
                border_color: '#373a46',
                border_width: 1,
                frame_color: '#373a46',
                frame_width: 1,
            });

            // Header row
            tb.cell(0, 0, { text: 'Cluster', text_color: '#ffffff', text_size: 'small' });
            tb.cell(1, 0, { text: 'Size', text_color: '#ffffff', text_size: 'small' });
            tb.cell(2, 0, { text: 'Dispersion', text_color: '#ffffff', text_size: 'small' });
            tb.cell(3, 0, { text: 'Factors', text_color: '#ffffff', text_size: 'small' });

            // Data row
            tb.cell(0, 1, { text: 'Best', text_color: '#ffffff', text_size: 'small' });
            tb.cell(1, 1, { text: '3', text_color: '#ffffff', text_size: 'small' });
            tb.cell(2, 1, { text: '0.1234', text_color: '#ffffff', text_size: 'small' });
            tb.cell(3, 1, { text: '[1, 1.5, 2]', text_color: '#ffffff', text_size: 'small', text_halign: 'left' });

            var header0 = tb.getCell(0, 0).text;
            var header1 = tb.getCell(1, 0).text;
            var data0 = tb.getCell(0, 1).text;
            var data3halign = tb.getCell(3, 1).text_halign;
            var tbBgcolor = tb.bgcolor;
            var tbBorderW = tb.border_width;
            var tbFrameW = tb.frame_width;

            return { header0, header1, data0, data3halign, tbBgcolor, tbBorderW, tbFrameW };
        });

        expect(result.header0[0]).toBe('Cluster');
        expect(result.header1[0]).toBe('Size');
        expect(result.data0[0]).toBe('Best');
        expect(result.data3halign[0]).toBe('left');
        expect(result.tbBgcolor[0]).toBe('#1e222d');
        expect(result.tbBorderW[0]).toBe(1);
        expect(result.tbFrameW[0]).toBe(1);

        // Verify plot structure
        expect(plots['__tables__']).toBeDefined();
        expect(plots['__tables__'].data[0].value.length).toBeGreaterThan(0);
    });

    it('_setHelper is wired automatically by table.new()', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var t = table.new('top_right', 2, 2);
            // If _setHelper wasn't called, t.cell() would throw
            // "Cannot read properties of undefined (reading 'cell')"
            var hasHelper = t._helper !== undefined && t._helper !== null;
            t.cell(0, 0, 'Works');
            var cellText = t.getCell(0, 0).text;
            return { hasHelper, cellText };
        });

        expect(result.hasHelper[0]).toBe(true);
        expect(result.cellText[0]).toBe('Works');
    });
});
