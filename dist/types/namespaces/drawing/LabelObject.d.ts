/**
 * Represents a label drawing object in PineTS.
 * Labels are text annotations drawn on the chart.
 */
export declare class LabelObject {
    private context;
    private _id;
    private _x;
    private _y;
    private _text;
    private _xloc;
    private _yloc;
    private _color;
    private _style;
    private _textcolor;
    private _size;
    private _textalign;
    private _tooltip;
    private _text_font_family;
    private static _nextId;
    constructor(context: any, options?: {
        x?: number;
        y?: number;
        text?: string;
        xloc?: string;
        yloc?: string;
        color?: string;
        style?: string;
        textcolor?: string;
        size?: string;
        textalign?: string;
        tooltip?: string;
        text_font_family?: string;
    });
    get_x(): number;
    get_y(): number;
    get_text(): string;
    set_x(x: number): void;
    set_y(y: number): void;
    set_xy(x: number, y: number): void;
    set_text(text: string): void;
    set_xloc(xloc: string): void;
    set_yloc(yloc: string): void;
    set_color(color: string): void;
    set_style(style: string): void;
    set_textcolor(color: string): void;
    set_size(size: string): void;
    set_textalign(align: string): void;
    set_tooltip(tooltip: string): void;
    set_text_font_family(family: string): void;
    set_text_formatting(formatting: string): void;
    /**
     * Returns a copy of this label object
     */
    copy(): LabelObject;
    /**
     * Deletes the label (removes from rendering)
     */
    delete(): void;
    /**
     * Gets the label's properties for rendering
     */
    toJSON(): object;
}
