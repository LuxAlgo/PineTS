// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { LabelObject } from './LabelObject';

/**
 * Pine Script label namespace implementation.
 * Provides functions for creating and managing label drawing objects.
 */
export class Label {
    private _labels: LabelObject[] = [];

    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Returns an array of all label objects on the chart.
     */
    get all(): LabelObject[] {
        return this._labels.filter((l: any) => !l._deleted);
    }

    // Label styles
    static style_arrowdown = 'arrowdown';
    static style_arrowup = 'arrowup';
    static style_circle = 'circle';
    static style_cross = 'cross';
    static style_diamond = 'diamond';
    static style_flag = 'flag';
    static style_label_center = 'label_center';
    static style_label_down = 'label_down';
    static style_label_left = 'label_left';
    static style_label_lower_left = 'label_lower_left';
    static style_label_lower_right = 'label_lower_right';
    static style_label_right = 'label_right';
    static style_label_up = 'label_up';
    static style_label_upper_left = 'label_upper_left';
    static style_label_upper_right = 'label_upper_right';
    static style_none = 'none';
    static style_square = 'square';
    static style_text_outline = 'text_outline';
    static style_triangledown = 'triangledown';
    static style_triangleup = 'triangleup';
    static style_xcross = 'xcross';

    /**
     * Creates a new label object.
     */
    new(
        x: number,
        y: number,
        text: string,
        xloc?: string,
        yloc?: string,
        color?: string,
        style?: string,
        textcolor?: string,
        size?: string,
        textalign?: string,
        tooltip?: string,
        text_font_family?: string
    ): LabelObject {
        const label = new LabelObject(this.context, {
            x: Series.from(x).get(0),
            y: Series.from(y).get(0),
            text: Series.from(text).get(0),
            xloc: xloc ? Series.from(xloc).get(0) : undefined,
            yloc: yloc ? Series.from(yloc).get(0) : undefined,
            color: color ? Series.from(color).get(0) : undefined,
            style: style ? Series.from(style).get(0) : undefined,
            textcolor: textcolor ? Series.from(textcolor).get(0) : undefined,
            size: size ? Series.from(size).get(0) : undefined,
            textalign: textalign ? Series.from(textalign).get(0) : undefined,
            tooltip: tooltip ? Series.from(tooltip).get(0) : undefined,
            text_font_family: text_font_family ? Series.from(text_font_family).get(0) : undefined,
        });

        this._labels.push(label);
        return label;
    }

    /**
     * Creates a copy of a label object.
     */
    copy(id: LabelObject): LabelObject {
        const copy = id.copy();
        this._labels.push(copy);
        return copy;
    }

    /**
     * Deletes a label object.
     */
    delete(id: LabelObject): void {
        if (id) {
            id.delete();
        }
    }

    // Getter wrappers
    get_x(id: LabelObject): number {
        return id?.get_x() ?? NaN;
    }

    get_y(id: LabelObject): number {
        return id?.get_y() ?? NaN;
    }

    get_text(id: LabelObject): string {
        return id?.get_text() ?? '';
    }

    // Setter wrappers
    set_x(id: LabelObject, x: number): void {
        id?.set_x(x);
    }

    set_y(id: LabelObject, y: number): void {
        id?.set_y(y);
    }

    set_xy(id: LabelObject, x: number, y: number): void {
        id?.set_xy(x, y);
    }

    set_text(id: LabelObject, text: string): void {
        id?.set_text(text);
    }

    set_xloc(id: LabelObject, xloc: string): void {
        id?.set_xloc(xloc);
    }

    set_yloc(id: LabelObject, yloc: string): void {
        id?.set_yloc(yloc);
    }

    set_color(id: LabelObject, color: string): void {
        id?.set_color(color);
    }

    set_style(id: LabelObject, style: string): void {
        id?.set_style(style);
    }

    set_textcolor(id: LabelObject, color: string): void {
        id?.set_textcolor(color);
    }

    set_size(id: LabelObject, size: string): void {
        id?.set_size(size);
    }

    set_textalign(id: LabelObject, align: string): void {
        id?.set_textalign(align);
    }

    set_tooltip(id: LabelObject, tooltip: string): void {
        id?.set_tooltip(tooltip);
    }

    set_text_font_family(id: LabelObject, family: string): void {
        id?.set_text_font_family(family);
    }

    set_text_formatting(id: LabelObject, formatting: string): void {
        id?.set_text_formatting(formatting);
    }

    set_point(id: LabelObject, point: any): void {
        if (id && point) {
            id.set_xy(point.index ?? point.time, point.price);
        }
    }
}
