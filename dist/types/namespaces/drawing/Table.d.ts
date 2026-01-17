import { TableObject } from './TableObject';
/**
 * Pine Script table namespace implementation.
 * Provides functions for creating and managing table drawing objects.
 */
export declare class Table {
    private context;
    private _tables;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index?: number): any;
    /**
     * Returns an array of all table objects on the chart.
     */
    get all(): TableObject[];
    /**
     * Creates a new table object.
     */
    new(position: string, columns: number, rows: number, bgcolor?: string, frame_color?: string, frame_width?: number, border_color?: string, border_width?: number): TableObject;
    /**
     * Deletes a table object.
     */
    delete(id: TableObject): void;
    /**
     * Sets the content of a cell.
     */
    cell(id: TableObject, column: number, row: number, text?: string, width?: number, height?: number, text_color?: string, text_halign?: string, text_valign?: string, text_size?: string, bgcolor?: string, tooltip?: string, text_font_family?: string): void;
    cell_set_text(id: TableObject, column: number, row: number, text: string): void;
    cell_set_text_color(id: TableObject, column: number, row: number, color: string): void;
    cell_set_text_halign(id: TableObject, column: number, row: number, halign: string): void;
    cell_set_text_valign(id: TableObject, column: number, row: number, valign: string): void;
    cell_set_text_size(id: TableObject, column: number, row: number, size: string): void;
    cell_set_text_font_family(id: TableObject, column: number, row: number, family: string): void;
    cell_set_bgcolor(id: TableObject, column: number, row: number, color: string): void;
    cell_set_width(id: TableObject, column: number, row: number, width: number): void;
    cell_set_height(id: TableObject, column: number, row: number, height: number): void;
    cell_set_tooltip(id: TableObject, column: number, row: number, tooltip: string): void;
    merge_cells(id: TableObject, start_column: number, start_row: number, end_column: number, end_row: number): void;
    clear(id: TableObject, start_column?: number, start_row?: number, end_column?: number, end_row?: number): void;
    set_position(id: TableObject, position: string): void;
    set_bgcolor(id: TableObject, color: string): void;
    set_frame_color(id: TableObject, color: string): void;
    set_frame_width(id: TableObject, width: number): void;
    set_border_color(id: TableObject, color: string): void;
    set_border_width(id: TableObject, width: number): void;
    cell_set_text_formatting(id: TableObject, column: number, row: number, formatting: string): void;
}
