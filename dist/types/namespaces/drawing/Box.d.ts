import { BoxObject } from './BoxObject';
/**
 * Pine Script box namespace implementation.
 * Provides functions for creating and managing box drawing objects.
 */
export declare class Box {
    private context;
    private _boxes;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index?: number): any;
    /**
     * Returns an array of all box objects on the chart.
     */
    get all(): BoxObject[];
    /**
     * Creates a new box object.
     */
    new(left: number, top: number, right: number, bottom: number, border_color?: string, border_width?: number, border_style?: string, extend?: string, xloc?: string, bgcolor?: string, text?: string, text_size?: string, text_color?: string, text_halign?: string, text_valign?: string, text_wrap?: string, text_font_family?: string): BoxObject;
    /**
     * Creates a copy of a box object.
     */
    copy(id: BoxObject): BoxObject;
    /**
     * Deletes a box object.
     */
    delete(id: BoxObject): void;
    get_left(id: BoxObject): number;
    get_top(id: BoxObject): number;
    get_right(id: BoxObject): number;
    get_bottom(id: BoxObject): number;
    set_left(id: BoxObject, left: number): void;
    set_top(id: BoxObject, top: number): void;
    set_right(id: BoxObject, right: number): void;
    set_bottom(id: BoxObject, bottom: number): void;
    set_lefttop(id: BoxObject, left: number, top: number): void;
    set_rightbottom(id: BoxObject, right: number, bottom: number): void;
    set_border_color(id: BoxObject, color: string): void;
    set_border_width(id: BoxObject, width: number): void;
    set_border_style(id: BoxObject, style: string): void;
    set_bgcolor(id: BoxObject, color: string): void;
    set_extend(id: BoxObject, extend: string): void;
    set_text(id: BoxObject, text: string): void;
    set_text_size(id: BoxObject, size: string): void;
    set_text_color(id: BoxObject, color: string): void;
    set_text_halign(id: BoxObject, halign: string): void;
    set_text_valign(id: BoxObject, valign: string): void;
    set_text_wrap(id: BoxObject, wrap: string): void;
    set_text_font_family(id: BoxObject, family: string): void;
    set_text_formatting(id: BoxObject, formatting: string): void;
    set_xloc(id: BoxObject, xloc: string): void;
    set_top_left_point(id: BoxObject, point: any): void;
    set_bottom_right_point(id: BoxObject, point: any): void;
}
