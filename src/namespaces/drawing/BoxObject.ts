// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';

/**
 * Represents a box drawing object in PineTS.
 * Boxes are rectangles drawn on the chart.
 */
export class BoxObject {
    private _id: number;
    private _left: number;
    private _top: number;
    private _right: number;
    private _bottom: number;
    private _border_color: string;
    private _border_width: number;
    private _border_style: string;
    private _bgcolor: string;
    private _extend: string;
    private _xloc: string;
    private _text: string;
    private _text_size: string;
    private _text_color: string;
    private _text_halign: string;
    private _text_valign: string;
    private _text_wrap: string;
    private _text_font_family: string;

    private static _nextId = 1;

    constructor(
        private context: any,
        options: {
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
        } = {}
    ) {
        this._id = BoxObject._nextId++;
        this._left = options.left ?? 0;
        this._top = options.top ?? 0;
        this._right = options.right ?? 0;
        this._bottom = options.bottom ?? 0;
        this._border_color = options.border_color ?? '#2196F3';
        this._border_width = options.border_width ?? 1;
        this._border_style = options.border_style ?? 'solid';
        this._bgcolor = options.bgcolor ?? '';
        this._extend = options.extend ?? 'none';
        this._xloc = options.xloc ?? 'bar_index';
        this._text = options.text ?? '';
        this._text_size = options.text_size ?? 'normal';
        this._text_color = options.text_color ?? '#000000';
        this._text_halign = options.text_halign ?? 'center';
        this._text_valign = options.text_valign ?? 'center';
        this._text_wrap = options.text_wrap ?? 'auto';
        this._text_font_family = options.text_font_family ?? 'default';
    }

    // Getters
    get_left(): number {
        return this._left;
    }

    get_top(): number {
        return this._top;
    }

    get_right(): number {
        return this._right;
    }

    get_bottom(): number {
        return this._bottom;
    }

    // Setters
    set_left(left: number): void {
        this._left = Series.from(left).get(0);
    }

    set_top(top: number): void {
        this._top = Series.from(top).get(0);
    }

    set_right(right: number): void {
        this._right = Series.from(right).get(0);
    }

    set_bottom(bottom: number): void {
        this._bottom = Series.from(bottom).get(0);
    }

    set_lefttop(left: number, top: number): void {
        this._left = Series.from(left).get(0);
        this._top = Series.from(top).get(0);
    }

    set_rightbottom(right: number, bottom: number): void {
        this._right = Series.from(right).get(0);
        this._bottom = Series.from(bottom).get(0);
    }

    set_border_color(color: string): void {
        this._border_color = Series.from(color).get(0);
    }

    set_border_width(width: number): void {
        this._border_width = Series.from(width).get(0);
    }

    set_border_style(style: string): void {
        this._border_style = Series.from(style).get(0);
    }

    set_bgcolor(color: string): void {
        this._bgcolor = Series.from(color).get(0);
    }

    set_extend(extend: string): void {
        this._extend = Series.from(extend).get(0);
    }

    set_text(text: string): void {
        this._text = Series.from(text).get(0);
    }

    set_text_size(size: string): void {
        this._text_size = Series.from(size).get(0);
    }

    set_text_color(color: string): void {
        this._text_color = Series.from(color).get(0);
    }

    set_text_halign(halign: string): void {
        this._text_halign = Series.from(halign).get(0);
    }

    set_text_valign(valign: string): void {
        this._text_valign = Series.from(valign).get(0);
    }

    set_text_wrap(wrap: string): void {
        this._text_wrap = Series.from(wrap).get(0);
    }

    set_text_font_family(family: string): void {
        this._text_font_family = Series.from(family).get(0);
    }

    /**
     * Returns a copy of this box object
     */
    copy(): BoxObject {
        return new BoxObject(this.context, {
            left: this._left,
            top: this._top,
            right: this._right,
            bottom: this._bottom,
            border_color: this._border_color,
            border_width: this._border_width,
            border_style: this._border_style,
            bgcolor: this._bgcolor,
            extend: this._extend,
            xloc: this._xloc,
            text: this._text,
            text_size: this._text_size,
            text_color: this._text_color,
            text_halign: this._text_halign,
            text_valign: this._text_valign,
            text_wrap: this._text_wrap,
            text_font_family: this._text_font_family,
        });
    }

    /**
     * Deletes the box (removes from rendering)
     */
    delete(): void {
        // In PineTS, deletion is handled by the renderer
        // Mark as deleted
        (this as any)._deleted = true;
    }

    /**
     * Gets the box's properties for rendering
     */
    toJSON(): object {
        return {
            id: this._id,
            left: this._left,
            top: this._top,
            right: this._right,
            bottom: this._bottom,
            border_color: this._border_color,
            border_width: this._border_width,
            border_style: this._border_style,
            bgcolor: this._bgcolor,
            extend: this._extend,
            xloc: this._xloc,
            text: this._text,
            text_size: this._text_size,
            text_color: this._text_color,
            text_halign: this._text_halign,
            text_valign: this._text_valign,
            text_wrap: this._text_wrap,
            text_font_family: this._text_font_family,
        };
    }
}
