import { LineObject } from './LineObject';
/**
 * Pine Script line namespace implementation.
 * Provides functions for creating and managing line drawing objects.
 */
export declare class Line {
    private context;
    private _lines;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index?: number): any;
    /**
     * Returns an array of all line objects on the chart.
     */
    get all(): LineObject[];
    static style_arrow_both: string;
    static style_arrow_left: string;
    static style_arrow_right: string;
    static style_dashed: string;
    static style_dotted: string;
    static style_solid: string;
    /**
     * Creates a new line object.
     */
    new(x1: number, y1: number, x2: number, y2: number, xloc?: string, extend?: string, color?: string, style?: string, width?: number): LineObject;
    /**
     * Creates a copy of a line object.
     */
    copy(id: LineObject): LineObject;
    /**
     * Deletes a line object.
     */
    delete(id: LineObject): void;
    get_x1(id: LineObject): number;
    get_y1(id: LineObject): number;
    get_x2(id: LineObject): number;
    get_y2(id: LineObject): number;
    get_price(id: LineObject, x: number): number;
    set_x1(id: LineObject, x1: number): void;
    set_y1(id: LineObject, y1: number): void;
    set_x2(id: LineObject, x2: number): void;
    set_y2(id: LineObject, y2: number): void;
    set_xy1(id: LineObject, x: number, y: number): void;
    set_xy2(id: LineObject, x: number, y: number): void;
    set_first_point(id: LineObject, point: {
        index: number;
        time: number;
        price: number;
    }): void;
    set_second_point(id: LineObject, point: {
        index: number;
        time: number;
        price: number;
    }): void;
    set_xloc(id: LineObject, xloc: string): void;
    set_extend(id: LineObject, extend: string): void;
    set_color(id: LineObject, color: string): void;
    set_style(id: LineObject, style: string): void;
    set_width(id: LineObject, width: number): void;
}
