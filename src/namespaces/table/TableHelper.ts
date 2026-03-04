// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { TableObject } from './TableObject';

export class TableHelper {
    private _tables: TableObject[] = [];

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _ensurePlotsEntry() {
        if (!this.context.plots['__tables__']) {
            this.context.plots['__tables__'] = {
                title: '__tables__',
                data: [],
                options: { style: 'table', overlay: true },
            };
        }
    }

    private _syncToPlot() {
        this._ensurePlotsEntry();
        const time = this.context.marketData[0]?.openTime || 0;
        this.context.plots['__tables__'].data = [{
            time,
            value: this._tables,
            options: { style: 'table' },
        }];
    }

    private _resolve(val: any): any {
        if (val === null || val === undefined) return val;
        if (typeof val === 'object' && Array.isArray(val.data) && typeof val.get === 'function') {
            return val.get(0);
        }
        if (typeof val === 'function') {
            return val();
        }
        return val;
    }

    // ── table.new ──────────────────────────────────────────────

    new(...args: any[]): TableObject {
        let position: any = 'top_right';
        let columns: any = 1;
        let rows: any = 1;
        let bgcolor: any = '';
        let frame_color: any = '';
        let frame_width: any = 0;
        let border_color: any = '';
        let border_width: any = 0;
        let force_overlay: any = false;

        // Detect trailing options object from transpiler's named-args pattern
        // e.g. table.new("top_right", 3, 3, {bgcolor: "#1e293b", frame_color: "#475569", ...})
        // or   table.new({position: "top_right", columns: 3, rows: 3, bgcolor: "#1e293b", ...})
        const lastArg = args[args.length - 1];
        const hasOpts = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)
            && ('bgcolor' in lastArg || 'frame_color' in lastArg || 'border_color' in lastArg
                || 'position' in lastArg || 'columns' in lastArg || 'rows' in lastArg);

        if (hasOpts) {
            const opts = lastArg;
            // Positional args before the opts object
            const posArgs = args.slice(0, -1);
            position = posArgs[0] ?? opts.position ?? position;
            columns = posArgs[1] ?? opts.columns ?? columns;
            rows = posArgs[2] ?? opts.rows ?? rows;
            bgcolor = opts.bgcolor ?? bgcolor;
            frame_color = opts.frame_color ?? frame_color;
            frame_width = opts.frame_width ?? frame_width;
            border_color = opts.border_color ?? border_color;
            border_width = opts.border_width ?? border_width;
            force_overlay = opts.force_overlay ?? force_overlay;
        } else {
            // Positional arguments
            position = args[0] ?? position;
            columns = args[1] ?? columns;
            rows = args[2] ?? rows;
            bgcolor = args[3] ?? bgcolor;
            frame_color = args[4] ?? frame_color;
            frame_width = args[5] ?? frame_width;
            border_color = args[6] ?? border_color;
            border_width = args[7] ?? border_width;
            force_overlay = args[8] ?? force_overlay;
        }

        const tbl = new TableObject(
            this._resolve(position) || 'top_right',
            this._resolve(columns) || 1,
            this._resolve(rows) || 1,
            this._resolve(bgcolor) || '',
            this._resolve(frame_color) || '',
            this._resolve(frame_width) || 0,
            this._resolve(border_color) || '',
            this._resolve(border_width) || 0,
            this._resolve(force_overlay) ?? false,
        );
        this._tables.push(tbl);
        this._syncToPlot();
        return tbl;
    }

    any(...args: any[]): TableObject {
        return this.new(...args);
    }

    // ── table.cell ─────────────────────────────────────────────

    cell(...args: any[]): void {
        let table_id: any;
        let column: any;
        let row: any;
        let text: any = '';
        let width: any = 0;
        let height: any = 0;
        let text_color: any = '#000000';
        let text_halign: any = 'center';
        let text_valign: any = 'center';
        let text_size: any = 'normal';
        let bgcolor: any = '';
        let tooltip: any = '';
        let text_font_family: any = 'default';

        // Detect trailing options object from transpiler's named-args pattern
        // e.g. table.cell(t1, 0, 0, {text: "X", text_color: "#fff", ...})
        const lastArg = args[args.length - 1];
        const hasOpts = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)
            && ('text' in lastArg || 'bgcolor' in lastArg || 'text_color' in lastArg
                || 'text_size' in lastArg || 'text_halign' in lastArg || 'tooltip' in lastArg
                || 'column' in lastArg || 'row' in lastArg);

        if (hasOpts) {
            const opts = lastArg;
            // Positional args before the opts object:
            // args = [table_id, column, row, <text?>, opts]
            const posArgs = args.slice(0, -1);
            table_id = posArgs[0];
            column = posArgs.length > 1 ? posArgs[1] : (opts.column ?? 0);
            row = posArgs.length > 2 ? posArgs[2] : (opts.row ?? 0);
            text = posArgs[3] ?? opts.text ?? text;
            width = posArgs[4] ?? opts.width ?? width;
            height = posArgs[5] ?? opts.height ?? height;
            text_color = posArgs[6] ?? opts.text_color ?? text_color;
            text_halign = posArgs[7] ?? opts.text_halign ?? text_halign;
            text_valign = posArgs[8] ?? opts.text_valign ?? text_valign;
            text_size = posArgs[9] ?? opts.text_size ?? text_size;
            bgcolor = posArgs[10] ?? opts.bgcolor ?? bgcolor;
            tooltip = posArgs[11] ?? opts.tooltip ?? tooltip;
            text_font_family = posArgs[12] ?? opts.text_font_family ?? text_font_family;
        } else {
            table_id = args[0];
            column = args[1] ?? 0;
            row = args[2] ?? 0;
            text = args[3] ?? text;
            width = args[4] ?? width;
            height = args[5] ?? height;
            text_color = args[6] ?? text_color;
            text_halign = args[7] ?? text_halign;
            text_valign = args[8] ?? text_valign;
            text_size = args[9] ?? text_size;
            bgcolor = args[10] ?? bgcolor;
            tooltip = args[11] ?? tooltip;
            text_font_family = args[12] ?? text_font_family;
        }

        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;

        const col = this._resolve(column) ?? 0;
        const r = this._resolve(row) ?? 0;

        tbl.setCell(col, r, {
            text: this._resolveText(this._resolve(text)),
            width: this._resolve(width) || 0,
            height: this._resolve(height) || 0,
            text_color: this._resolve(text_color) || '#000000',
            text_halign: this._resolve(text_halign) || 'center',
            text_valign: this._resolve(text_valign) || 'center',
            text_size: this._resolve(text_size) || 'normal',
            bgcolor: this._resolve(bgcolor) || '',
            tooltip: this._resolveText(this._resolve(tooltip)),
            text_font_family: this._resolve(text_font_family) || 'default',
        });
        this._syncToPlot();
    }

    // ── table.delete ───────────────────────────────────────────

    delete(id: TableObject): void {
        if (id) id._deleted = true;
    }

    // ── table.clear ────────────────────────────────────────────

    clear(...args: any[]): void {
        let table_id: any;
        let start_column: any;
        let start_row: any;
        let end_column: any;
        let end_row: any;

        const lastArg = args[args.length - 1];
        const hasOpts = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)
            && ('start_column' in lastArg || 'start_row' in lastArg || 'end_column' in lastArg);

        if (hasOpts) {
            const opts = lastArg;
            table_id = args[0];
            start_column = args.length > 2 ? args[1] : (opts.start_column ?? 0);
            start_row = args.length > 3 ? args[2] : (opts.start_row ?? 0);
            end_column = opts.end_column ?? (args.length > 4 ? args[3] : start_column);
            end_row = opts.end_row ?? (args.length > 5 ? args[4] : start_row);
        } else {
            table_id = args[0];
            start_column = args[1] ?? 0;
            start_row = args[2] ?? 0;
            end_column = args[3] ?? start_column;
            end_row = args[4] ?? start_row;
        }

        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;

        const sc = this._resolve(start_column) ?? 0;
        const sr = this._resolve(start_row) ?? 0;
        const ec = this._resolve(end_column) ?? sc;
        const er = this._resolve(end_row) ?? sr;

        for (let r = sr; r <= er; r++) {
            for (let c = sc; c <= ec; c++) {
                tbl.clearCell(c, r);
            }
        }
        this._syncToPlot();
    }

    // ── table.merge_cells ──────────────────────────────────────

    merge_cells(...args: any[]): void {
        let table_id: any;
        let start_column: any;
        let start_row: any;
        let end_column: any;
        let end_row: any;

        const lastArg = args[args.length - 1];
        const hasOpts = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)
            && ('start_column' in lastArg || 'start_row' in lastArg || 'end_column' in lastArg);

        if (hasOpts) {
            const opts = lastArg;
            table_id = args[0];
            start_column = args.length > 2 ? args[1] : (opts.start_column ?? 0);
            start_row = args.length > 3 ? args[2] : (opts.start_row ?? 0);
            end_column = opts.end_column ?? (args.length > 4 ? args[3] : 0);
            end_row = opts.end_row ?? (args.length > 5 ? args[4] : 0);
        } else {
            table_id = args[0];
            start_column = args[1] ?? 0;
            start_row = args[2] ?? 0;
            end_column = args[3] ?? 0;
            end_row = args[4] ?? 0;
        }

        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;

        const sc = this._resolve(start_column) ?? 0;
        const sr = this._resolve(start_row) ?? 0;
        const ec = this._resolve(end_column) ?? 0;
        const er = this._resolve(end_row) ?? 0;

        // Mark all cells in the region as merged, pointing to the start cell
        for (let r = sr; r <= er; r++) {
            for (let c = sc; c <= ec; c++) {
                if (r === sr && c === sc) continue; // Skip the origin cell
                tbl.setCell(c, r, {
                    _merged: true,
                    _merge_parent: [sc, sr],
                });
            }
        }

        tbl.merges.push({ startCol: sc, startRow: sr, endCol: ec, endRow: er });
        this._syncToPlot();
    }

    // ── Cell setter methods ────────────────────────────────────

    cell_set_text(table_id: any, column: any, row: any, text: any): void {
        this._setCellProp(table_id, column, row, 'text', text, true);
    }

    cell_set_bgcolor(table_id: any, column: any, row: any, bgcolor: any): void {
        this._setCellProp(table_id, column, row, 'bgcolor', bgcolor);
    }

    cell_set_text_color(table_id: any, column: any, row: any, text_color: any): void {
        this._setCellProp(table_id, column, row, 'text_color', text_color);
    }

    cell_set_text_size(table_id: any, column: any, row: any, text_size: any): void {
        this._setCellProp(table_id, column, row, 'text_size', text_size);
    }

    cell_set_height(table_id: any, column: any, row: any, height: any): void {
        this._setCellProp(table_id, column, row, 'height', height);
    }

    cell_set_width(table_id: any, column: any, row: any, width: any): void {
        this._setCellProp(table_id, column, row, 'width', width);
    }

    cell_set_tooltip(table_id: any, column: any, row: any, tooltip: any): void {
        this._setCellProp(table_id, column, row, 'tooltip', tooltip, true);
    }

    cell_set_text_halign(table_id: any, column: any, row: any, text_halign: any): void {
        this._setCellProp(table_id, column, row, 'text_halign', text_halign);
    }

    cell_set_text_valign(table_id: any, column: any, row: any, text_valign: any): void {
        this._setCellProp(table_id, column, row, 'text_valign', text_valign);
    }

    cell_set_text_font_family(table_id: any, column: any, row: any, text_font_family: any): void {
        this._setCellProp(table_id, column, row, 'text_font_family', text_font_family);
    }

    // ── Table setter methods ───────────────────────────────────

    set_position(table_id: any, position: any): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;
        tbl.position = this._resolve(position) || tbl.position;
        this._syncToPlot();
    }

    set_bgcolor(table_id: any, bgcolor: any): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;
        tbl.bgcolor = this._resolve(bgcolor) || '';
        this._syncToPlot();
    }

    set_border_color(table_id: any, border_color: any): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;
        tbl.border_color = this._resolve(border_color) || '';
        this._syncToPlot();
    }

    set_border_width(table_id: any, border_width: any): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;
        tbl.border_width = this._resolve(border_width) || 0;
        this._syncToPlot();
    }

    set_frame_color(table_id: any, frame_color: any): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;
        tbl.frame_color = this._resolve(frame_color) || '';
        this._syncToPlot();
    }

    set_frame_width(table_id: any, frame_width: any): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;
        tbl.frame_width = this._resolve(frame_width) || 0;
        this._syncToPlot();
    }

    // ── Property getter ────────────────────────────────────────

    get all(): TableObject[] {
        return this._tables.filter((t) => !t._deleted);
    }

    // ── Private helpers ────────────────────────────────────────

    private _setCellProp(table_id: any, column: any, row: any, prop: string, value: any, isText: boolean = false): void {
        const tbl = this._resolve(table_id) as TableObject;
        if (!tbl || tbl._deleted) return;

        const col = this._resolve(column) ?? 0;
        const r = this._resolve(row) ?? 0;
        const resolved = this._resolve(value);

        tbl.setCell(col, r, {
            [prop]: isText ? this._resolveText(resolved) : resolved,
        } as any);
        this._syncToPlot();
    }

    private _resolveText(val: any): string {
        if (val === null || val === undefined || val !== val) return '';
        return String(val);
    }
}
