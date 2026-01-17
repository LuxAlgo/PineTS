/**
 * Represents a line drawing object in PineTS.
 * Lines are drawn between two points on the chart.
 */
export declare class LineObject {
    private context;
    private _id;
    private _x1;
    private _y1;
    private _x2;
    private _y2;
    private _xloc;
    private _extend;
    private _color;
    private _style;
    private _width;
    private static _nextId;
    constructor(context: any, options?: {
        x1?: number;
        y1?: number;
        x2?: number;
        y2?: number;
        xloc?: string;
        extend?: string;
        color?: string;
        style?: string;
        width?: number;
    });
    get_x1(): number;
    get_y1(): number;
    get_x2(): number;
    get_y2(): number;
    get_price(x: number): number;
    set_x1(x1: number): void;
    set_y1(y1: number): void;
    set_x2(x2: number): void;
    set_y2(y2: number): void;
    set_xy1(x: number, y: number): void;
    set_xy2(x: number, y: number): void;
    set_first_point(point: {
        index: number;
        time: number;
        price: number;
    }): void;
    set_second_point(point: {
        index: number;
        time: number;
        price: number;
    }): void;
    set_xloc(xloc: string): void;
    set_extend(extend: string): void;
    set_color(color: string): void;
    set_style(style: string): void;
    set_width(width: number): void;
    /**
     * Returns a copy of this line object
     */
    copy(): LineObject;
    /**
     * Deletes the line (removes from rendering)
     */
    delete(): void;
    /**
     * Gets the line's properties for rendering
     */
    toJSON(): object;
}
