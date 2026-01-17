/**
 * Represents a table drawing object in PineTS.
 * Tables display data in a grid format on the chart.
 */
export declare class TableObject {
    private context;
    private _id;
    private _position;
    private _columns;
    private _rows;
    private _bgcolor;
    private _frame_color;
    private _frame_width;
    private _border_color;
    private _border_width;
    private _cells;
    private static _nextId;
    constructor(context: any, options?: {
        position?: string;
        columns?: number;
        rows?: number;
        bgcolor?: string;
        frame_color?: string;
        frame_width?: number;
        border_color?: string;
        border_width?: number;
    });
    private _getCellKey;
    /**
     * Sets the content of a cell.
     */
    cell(column: number, row: number, text?: string, width?: number, height?: number, text_color?: string, text_halign?: string, text_valign?: string, text_size?: string, bgcolor?: string, tooltip?: string, text_font_family?: string): void;
    cell_set_text(column: number, row: number, text: string): void;
    cell_set_text_color(column: number, row: number, color: string): void;
    cell_set_text_halign(column: number, row: number, halign: string): void;
    cell_set_text_valign(column: number, row: number, valign: string): void;
    cell_set_text_size(column: number, row: number, size: string): void;
    cell_set_text_font_family(column: number, row: number, family: string): void;
    cell_set_bgcolor(column: number, row: number, color: string): void;
    cell_set_width(column: number, row: number, width: number): void;
    cell_set_height(column: number, row: number, height: number): void;
    cell_set_tooltip(column: number, row: number, tooltip: string): void;
    cell_set_text_formatting(column: number, row: number, formatting: string): void;
    /**
     * Merges cells in a range.
     */
    merge_cells(start_column: number, start_row: number, end_column: number, end_row: number): void;
    /**
     * Clears the table.
     */
    clear(start_column?: number, start_row?: number, end_column?: number, end_row?: number): void;
    set_position(position: string): void;
    set_bgcolor(color: string): void;
    set_frame_color(color: string): void;
    set_frame_width(width: number): void;
    set_border_color(color: string): void;
    set_border_width(width: number): void;
    /**
     * Deletes the table (removes from rendering)
     */
    delete(): void;
    /**
     * Gets the table's properties for rendering
     */
    toJSON(): object;
}
