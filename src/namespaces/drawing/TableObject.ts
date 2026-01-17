// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';

/**
 * Represents a table cell in PineTS.
 */
interface TableCell {
    text: string;
    width: number;
    height: number;
    text_color: string;
    text_halign: string;
    text_valign: string;
    text_size: string;
    text_font_family: string;
    bgcolor: string;
    tooltip: string;
}

/**
 * Represents a table drawing object in PineTS.
 * Tables display data in a grid format on the chart.
 */
export class TableObject {
    private _id: number;
    private _position: string;
    private _columns: number;
    private _rows: number;
    private _bgcolor: string;
    private _frame_color: string;
    private _frame_width: number;
    private _border_color: string;
    private _border_width: number;
    private _cells: Map<string, TableCell>;

    private static _nextId = 1;

    constructor(
        private context: any,
        options: {
            position?: string;
            columns?: number;
            rows?: number;
            bgcolor?: string;
            frame_color?: string;
            frame_width?: number;
            border_color?: string;
            border_width?: number;
        } = {}
    ) {
        this._id = TableObject._nextId++;
        this._position = options.position ?? 'top_right';
        this._columns = options.columns ?? 1;
        this._rows = options.rows ?? 1;
        this._bgcolor = options.bgcolor ?? '#000000';
        this._frame_color = options.frame_color ?? '#000000';
        this._frame_width = options.frame_width ?? 0;
        this._border_color = options.border_color ?? '#000000';
        this._border_width = options.border_width ?? 0;
        this._cells = new Map();
    }

    private _getCellKey(column: number, row: number): string {
        return `${column},${row}`;
    }

    /**
     * Sets the content of a cell.
     */
    cell(
        column: number,
        row: number,
        text: string = '',
        width: number = 0,
        height: number = 0,
        text_color: string = '#FFFFFF',
        text_halign: string = 'center',
        text_valign: string = 'center',
        text_size: string = 'normal',
        bgcolor: string = '',
        tooltip: string = '',
        text_font_family: string = 'default'
    ): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );

        this._cells.set(key, {
            text: Series.from(text).get(0),
            width: Series.from(width).get(0),
            height: Series.from(height).get(0),
            text_color: Series.from(text_color).get(0),
            text_halign: Series.from(text_halign).get(0),
            text_valign: Series.from(text_valign).get(0),
            text_size: Series.from(text_size).get(0),
            text_font_family: Series.from(text_font_family).get(0),
            bgcolor: Series.from(bgcolor).get(0),
            tooltip: Series.from(tooltip).get(0),
        });
    }

    cell_set_text(column: number, row: number, text: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.text = Series.from(text).get(0);
        }
    }

    cell_set_text_color(column: number, row: number, color: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.text_color = Series.from(color).get(0);
        }
    }

    cell_set_text_halign(column: number, row: number, halign: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.text_halign = Series.from(halign).get(0);
        }
    }

    cell_set_text_valign(column: number, row: number, valign: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.text_valign = Series.from(valign).get(0);
        }
    }

    cell_set_text_size(column: number, row: number, size: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.text_size = Series.from(size).get(0);
        }
    }

    cell_set_text_font_family(column: number, row: number, family: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.text_font_family = Series.from(family).get(0);
        }
    }

    cell_set_bgcolor(column: number, row: number, color: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.bgcolor = Series.from(color).get(0);
        }
    }

    cell_set_width(column: number, row: number, width: number): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.width = Series.from(width).get(0);
        }
    }

    cell_set_height(column: number, row: number, height: number): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.height = Series.from(height).get(0);
        }
    }

    cell_set_tooltip(column: number, row: number, tooltip: string): void {
        const key = this._getCellKey(
            Series.from(column).get(0),
            Series.from(row).get(0)
        );
        const cell = this._cells.get(key);
        if (cell) {
            cell.tooltip = Series.from(tooltip).get(0);
        }
    }

    /**
     * Merges cells in a range.
     */
    merge_cells(
        start_column: number,
        start_row: number,
        end_column: number,
        end_row: number
    ): void {
        // In PineTS, this is primarily for tracking merged cells
        // The actual rendering would handle the merge
    }

    /**
     * Clears the table.
     */
    clear(
        start_column: number = 0,
        start_row: number = 0,
        end_column?: number,
        end_row?: number
    ): void {
        const endCol = end_column ?? this._columns - 1;
        const endRow = end_row ?? this._rows - 1;

        for (let c = start_column; c <= endCol; c++) {
            for (let r = start_row; r <= endRow; r++) {
                const key = this._getCellKey(c, r);
                this._cells.delete(key);
            }
        }
    }

    // Setters
    set_position(position: string): void {
        this._position = Series.from(position).get(0);
    }

    set_bgcolor(color: string): void {
        this._bgcolor = Series.from(color).get(0);
    }

    set_frame_color(color: string): void {
        this._frame_color = Series.from(color).get(0);
    }

    set_frame_width(width: number): void {
        this._frame_width = Series.from(width).get(0);
    }

    set_border_color(color: string): void {
        this._border_color = Series.from(color).get(0);
    }

    set_border_width(width: number): void {
        this._border_width = Series.from(width).get(0);
    }

    /**
     * Deletes the table (removes from rendering)
     */
    delete(): void {
        (this as any)._deleted = true;
    }

    /**
     * Gets the table's properties for rendering
     */
    toJSON(): object {
        const cells: any[] = [];
        this._cells.forEach((cell, key) => {
            const [col, row] = key.split(',').map(Number);
            cells.push({ column: col, row: row, ...cell });
        });

        return {
            id: this._id,
            position: this._position,
            columns: this._columns,
            rows: this._rows,
            bgcolor: this._bgcolor,
            frame_color: this._frame_color,
            frame_width: this._frame_width,
            border_color: this._border_color,
            border_width: this._border_width,
            cells: cells,
        };
    }
}
