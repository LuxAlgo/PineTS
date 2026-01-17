import { LabelObject } from './LabelObject';
/**
 * Pine Script label namespace implementation.
 * Provides functions for creating and managing label drawing objects.
 */
export declare class Label {
    private context;
    private _labels;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index?: number): any;
    /**
     * Returns an array of all label objects on the chart.
     */
    get all(): LabelObject[];
    static style_arrowdown: string;
    static style_arrowup: string;
    static style_circle: string;
    static style_cross: string;
    static style_diamond: string;
    static style_flag: string;
    static style_label_center: string;
    static style_label_down: string;
    static style_label_left: string;
    static style_label_lower_left: string;
    static style_label_lower_right: string;
    static style_label_right: string;
    static style_label_up: string;
    static style_label_upper_left: string;
    static style_label_upper_right: string;
    static style_none: string;
    static style_square: string;
    static style_text_outline: string;
    static style_triangledown: string;
    static style_triangleup: string;
    static style_xcross: string;
    /**
     * Creates a new label object.
     */
    new(x: number, y: number, text: string, xloc?: string, yloc?: string, color?: string, style?: string, textcolor?: string, size?: string, textalign?: string, tooltip?: string, text_font_family?: string): LabelObject;
    /**
     * Creates a copy of a label object.
     */
    copy(id: LabelObject): LabelObject;
    /**
     * Deletes a label object.
     */
    delete(id: LabelObject): void;
    get_x(id: LabelObject): number;
    get_y(id: LabelObject): number;
    get_text(id: LabelObject): string;
    set_x(id: LabelObject, x: number): void;
    set_y(id: LabelObject, y: number): void;
    set_xy(id: LabelObject, x: number, y: number): void;
    set_text(id: LabelObject, text: string): void;
    set_xloc(id: LabelObject, xloc: string): void;
    set_yloc(id: LabelObject, yloc: string): void;
    set_color(id: LabelObject, color: string): void;
    set_style(id: LabelObject, style: string): void;
    set_textcolor(id: LabelObject, color: string): void;
    set_size(id: LabelObject, size: string): void;
    set_textalign(id: LabelObject, align: string): void;
    set_tooltip(id: LabelObject, tooltip: string): void;
    set_text_font_family(id: LabelObject, family: string): void;
    set_text_formatting(id: LabelObject, formatting: string): void;
    set_point(id: LabelObject, point: any): void;
}
