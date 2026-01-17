// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';

/**
 * Represents a label drawing object in PineTS.
 * Labels are text annotations drawn on the chart.
 */
export class LabelObject {
    private _id: number;
    private _x: number;
    private _y: number;
    private _text: string;
    private _xloc: string;
    private _yloc: string;
    private _color: string;
    private _style: string;
    private _textcolor: string;
    private _size: string;
    private _textalign: string;
    private _tooltip: string;
    private _text_font_family: string;

    private static _nextId = 1;

    constructor(
        private context: any,
        options: {
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
        } = {}
    ) {
        this._id = LabelObject._nextId++;
        this._x = options.x ?? 0;
        this._y = options.y ?? 0;
        this._text = options.text ?? '';
        this._xloc = options.xloc ?? 'bar_index';
        this._yloc = options.yloc ?? 'price';
        this._color = options.color ?? '#2196F3';
        this._style = options.style ?? 'label_down';
        this._textcolor = options.textcolor ?? '#FFFFFF';
        this._size = options.size ?? 'normal';
        this._textalign = options.textalign ?? 'center';
        this._tooltip = options.tooltip ?? '';
        this._text_font_family = options.text_font_family ?? 'default';
    }

    // Getters
    get_x(): number {
        return this._x;
    }

    get_y(): number {
        return this._y;
    }

    get_text(): string {
        return this._text;
    }

    // Setters
    set_x(x: number): void {
        this._x = Series.from(x).get(0);
    }

    set_y(y: number): void {
        this._y = Series.from(y).get(0);
    }

    set_xy(x: number, y: number): void {
        this._x = Series.from(x).get(0);
        this._y = Series.from(y).get(0);
    }

    set_text(text: string): void {
        this._text = Series.from(text).get(0);
    }

    set_xloc(xloc: string): void {
        this._xloc = Series.from(xloc).get(0);
    }

    set_yloc(yloc: string): void {
        this._yloc = Series.from(yloc).get(0);
    }

    set_color(color: string): void {
        this._color = Series.from(color).get(0);
    }

    set_style(style: string): void {
        this._style = Series.from(style).get(0);
    }

    set_textcolor(color: string): void {
        this._textcolor = Series.from(color).get(0);
    }

    set_size(size: string): void {
        this._size = Series.from(size).get(0);
    }

    set_textalign(align: string): void {
        this._textalign = Series.from(align).get(0);
    }

    set_tooltip(tooltip: string): void {
        this._tooltip = Series.from(tooltip).get(0);
    }

    set_text_font_family(family: string): void {
        this._text_font_family = Series.from(family).get(0);
    }

    set_text_formatting(formatting: string): void {
        // Text formatting (bold, italic, none) - stored but rendering depends on chart implementation
        (this as any)._text_formatting = Series.from(formatting).get(0);
    }

    /**
     * Returns a copy of this label object
     */
    copy(): LabelObject {
        return new LabelObject(this.context, {
            x: this._x,
            y: this._y,
            text: this._text,
            xloc: this._xloc,
            yloc: this._yloc,
            color: this._color,
            style: this._style,
            textcolor: this._textcolor,
            size: this._size,
            textalign: this._textalign,
            tooltip: this._tooltip,
            text_font_family: this._text_font_family,
        });
    }

    /**
     * Deletes the label (removes from rendering)
     */
    delete(): void {
        (this as any)._deleted = true;
    }

    /**
     * Gets the label's properties for rendering
     */
    toJSON(): object {
        return {
            id: this._id,
            x: this._x,
            y: this._y,
            text: this._text,
            xloc: this._xloc,
            yloc: this._yloc,
            color: this._color,
            style: this._style,
            textcolor: this._textcolor,
            size: this._size,
            textalign: this._textalign,
            tooltip: this._tooltip,
            text_font_family: this._text_font_family,
        };
    }
}
