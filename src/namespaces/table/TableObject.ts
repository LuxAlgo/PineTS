// SPDX-License-Identifier: AGPL-3.0-only

let _tableIdCounter = 0;

export function resetTableIdCounter() {
    _tableIdCounter = 0;
}

export interface TableCell {
    text: string;
    width: number;
    height: number;
    text_color: string;
    text_halign: string;
    text_valign: string;
    text_size: string | number;
    bgcolor: string;
    tooltip: string;
    text_font_family: string;
    _merged: boolean;
    _merge_parent: [number, number] | null; // [col, row] of the merge origin
}

export interface MergeRegion {
    startCol: number;
    startRow: number;
    endCol: number;
    endRow: number;
}

export class TableObject {
    public id: number;
    public position: string;
    public columns: number;
    public rows: number;
    public bgcolor: string;
    public frame_color: string;
    public frame_width: number;
    public border_color: string;
    public border_width: number;
    public force_overlay: boolean;
    public _deleted: boolean;
    public cells: (TableCell | null)[][];
    public merges: MergeRegion[];

    constructor(
        position: string = 'top_right',
        columns: number = 1,
        rows: number = 1,
        bgcolor: string = '',
        frame_color: string = '',
        frame_width: number = 0,
        border_color: string = '',
        border_width: number = 0,
        force_overlay: boolean = false,
    ) {
        this.id = _tableIdCounter++;
        this.position = position;
        this.columns = columns;
        this.rows = rows;
        this.bgcolor = bgcolor;
        this.frame_color = frame_color;
        this.frame_width = frame_width;
        this.border_color = border_color;
        this.border_width = border_width;
        this.force_overlay = force_overlay;
        this._deleted = false;
        this.merges = [];

        // Initialize cells grid (rows × columns) with nulls
        this.cells = [];
        for (let r = 0; r < rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < columns; c++) {
                this.cells[r][c] = null;
            }
        }
    }

    delete(): void {
        this._deleted = true;
    }

    setCell(column: number, row: number, props: Partial<TableCell>): void {
        if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) return;

        const existing = this.cells[row][column];
        if (existing && existing._merged && existing._merge_parent) {
            // Redirect to merge parent
            const [pc, pr] = existing._merge_parent;
            this.setCell(pc, pr, props);
            return;
        }

        const cell = existing || this._defaultCell();
        Object.assign(cell, props);
        this.cells[row][column] = cell;
    }

    getCell(column: number, row: number): TableCell | null {
        if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) return null;
        return this.cells[row][column];
    }

    clearCell(column: number, row: number): void {
        if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) return;
        this.cells[row][column] = null;
    }

    private _defaultCell(): TableCell {
        return {
            text: '',
            width: 0,
            height: 0,
            text_color: '#000000',
            text_halign: 'center',
            text_valign: 'center',
            text_size: 'normal',
            bgcolor: '',
            tooltip: '',
            text_font_family: 'default',
            _merged: false,
            _merge_parent: null,
        };
    }
}
