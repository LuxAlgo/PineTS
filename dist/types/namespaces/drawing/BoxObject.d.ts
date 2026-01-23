/**
 * Represents a box drawing object in PineTS.
 * Boxes are rectangles drawn on the chart.
 */
export declare class BoxObject {
    private context;
    private _id;
    private _left;
    private _top;
    private _right;
    private _bottom;
    private _border_color;
    private _border_width;
    private _border_style;
    private _bgcolor;
    private _extend;
    private _xloc;
    private _text;
    private _text_size;
    private _text_color;
    private _text_halign;
    private _text_valign;
    private _text_wrap;
    private _text_font_family;
    private static _nextId;
    constructor(context: any, options?: {
        left?: number;
        top?: number;
        right?: number;
        bottom?: number;
        border_color?: string;
        border_width?: number;
        border_style?: string;
        bgcolor?: string;
        extend?: string;
        xloc?: string;
        text?: string;
        text_size?: string;
        text_color?: string;
        text_halign?: string;
        text_valign?: string;
        text_wrap?: string;
        text_font_family?: string;
    });
    get_left(): number;
    get_top(): number;
    get_right(): number;
    get_bottom(): number;
    set_left(left: number): void;
    set_top(top: number): void;
    set_right(right: number): void;
    set_bottom(bottom: number): void;
    set_lefttop(left: number, top: number): void;
    set_rightbottom(right: number, bottom: number): void;
    set_border_color(color: string): void;
    set_border_width(width: number): void;
    set_border_style(style: string): void;
    set_bgcolor(color: string): void;
    set_extend(extend: string): void;
    set_text(text: string): void;
    set_text_size(size: string): void;
    set_text_color(color: string): void;
    set_text_halign(halign: string): void;
    set_text_valign(valign: string): void;
    set_text_wrap(wrap: string): void;
    set_text_font_family(family: string): void;
    set_text_formatting(formatting: string): void;
    set_xloc(xloc: string): void;
    /**
     * Returns a copy of this box object
     */
    copy(): BoxObject;
    /**
     * Deletes the box (removes from rendering)
     */
    delete(): void;
    /**
     * Gets the box's properties for rendering
     */
    toJSON(): object;
}
