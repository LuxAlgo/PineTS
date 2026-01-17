// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { TableObject } from './TableObject';

/**
 * Pine Script table namespace implementation.
 * Provides functions for creating and managing table drawing objects.
 */
export class Table {
    private _tables: TableObject[] = [];

    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Returns an array of all table objects on the chart.
     */
    get all(): TableObject[] {
        return this._tables.filter((t: any) => !t._deleted);
    }

    /**
     * Creates a new table object.
     */
    new(
        position: string,
        columns: number,
        rows: number,
        bgcolor?: string,
        frame_color?: string,
        frame_width?: number,
        border_color?: string,
        border_width?: number
    ): TableObject {
        const table = new TableObject(this.context, {
            position: Series.from(position).get(0),
            columns: Series.from(columns).get(0),
            rows: Series.from(rows).get(0),
            bgcolor: bgcolor ? Series.from(bgcolor).get(0) : undefined,
            frame_color: frame_color ? Series.from(frame_color).get(0) : undefined,
            frame_width: frame_width ? Series.from(frame_width).get(0) : undefined,
            border_color: border_color ? Series.from(border_color).get(0) : undefined,
            border_width: border_width ? Series.from(border_width).get(0) : undefined,
        });

        this._tables.push(table);
        return table;
    }

    /**
     * Deletes a table object.
     */
    delete(id: TableObject): void {
        if (id) {
            id.delete();
        }
    }

    /**
     * Sets the content of a cell.
     */
    cell(
        id: TableObject,
        column: number,
        row: number,
        text?: string,
        width?: number,
        height?: number,
        text_color?: string,
        text_halign?: string,
        text_valign?: string,
        text_size?: string,
        bgcolor?: string,
        tooltip?: string,
        text_font_family?: string
    ): void {
        id?.cell(
            column,
            row,
            text,
            width,
            height,
            text_color,
            text_halign,
            text_valign,
            text_size,
            bgcolor,
            tooltip,
            text_font_family
        );
    }

    cell_set_text(id: TableObject, column: number, row: number, text: string): void {
        id?.cell_set_text(column, row, text);
    }

    cell_set_text_color(id: TableObject, column: number, row: number, color: string): void {
        id?.cell_set_text_color(column, row, color);
    }

    cell_set_text_halign(id: TableObject, column: number, row: number, halign: string): void {
        id?.cell_set_text_halign(column, row, halign);
    }

    cell_set_text_valign(id: TableObject, column: number, row: number, valign: string): void {
        id?.cell_set_text_valign(column, row, valign);
    }

    cell_set_text_size(id: TableObject, column: number, row: number, size: string): void {
        id?.cell_set_text_size(column, row, size);
    }

    cell_set_text_font_family(id: TableObject, column: number, row: number, family: string): void {
        id?.cell_set_text_font_family(column, row, family);
    }

    cell_set_bgcolor(id: TableObject, column: number, row: number, color: string): void {
        id?.cell_set_bgcolor(column, row, color);
    }

    cell_set_width(id: TableObject, column: number, row: number, width: number): void {
        id?.cell_set_width(column, row, width);
    }

    cell_set_height(id: TableObject, column: number, row: number, height: number): void {
        id?.cell_set_height(column, row, height);
    }

    cell_set_tooltip(id: TableObject, column: number, row: number, tooltip: string): void {
        id?.cell_set_tooltip(column, row, tooltip);
    }

    merge_cells(
        id: TableObject,
        start_column: number,
        start_row: number,
        end_column: number,
        end_row: number
    ): void {
        id?.merge_cells(start_column, start_row, end_column, end_row);
    }

    clear(
        id: TableObject,
        start_column?: number,
        start_row?: number,
        end_column?: number,
        end_row?: number
    ): void {
        id?.clear(start_column, start_row, end_column, end_row);
    }

    set_position(id: TableObject, position: string): void {
        id?.set_position(position);
    }

    set_bgcolor(id: TableObject, color: string): void {
        id?.set_bgcolor(color);
    }

    set_frame_color(id: TableObject, color: string): void {
        id?.set_frame_color(color);
    }

    set_frame_width(id: TableObject, width: number): void {
        id?.set_frame_width(width);
    }

    set_border_color(id: TableObject, color: string): void {
        id?.set_border_color(color);
    }

    set_border_width(id: TableObject, width: number): void {
        id?.set_border_width(width);
    }
}
