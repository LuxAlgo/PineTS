// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { BoxObject } from './BoxObject';

/**
 * Pine Script box namespace implementation.
 * Provides functions for creating and managing box drawing objects.
 */
export class Box {
    private _boxes: BoxObject[] = [];

    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Returns an array of all box objects on the chart.
     */
    get all(): BoxObject[] {
        return this._boxes.filter((b: any) => !b._deleted);
    }

    /**
     * Creates a new box object.
     */
    new(
        left: number,
        top: number,
        right: number,
        bottom: number,
        border_color?: string,
        border_width?: number,
        border_style?: string,
        extend?: string,
        xloc?: string,
        bgcolor?: string,
        text?: string,
        text_size?: string,
        text_color?: string,
        text_halign?: string,
        text_valign?: string,
        text_wrap?: string,
        text_font_family?: string
    ): BoxObject {
        const box = new BoxObject(this.context, {
            left: Series.from(left).get(0),
            top: Series.from(top).get(0),
            right: Series.from(right).get(0),
            bottom: Series.from(bottom).get(0),
            border_color: border_color ? Series.from(border_color).get(0) : undefined,
            border_width: border_width ? Series.from(border_width).get(0) : undefined,
            border_style: border_style ? Series.from(border_style).get(0) : undefined,
            bgcolor: bgcolor ? Series.from(bgcolor).get(0) : undefined,
            extend: extend ? Series.from(extend).get(0) : undefined,
            xloc: xloc ? Series.from(xloc).get(0) : undefined,
            text: text ? Series.from(text).get(0) : undefined,
            text_size: text_size ? Series.from(text_size).get(0) : undefined,
            text_color: text_color ? Series.from(text_color).get(0) : undefined,
            text_halign: text_halign ? Series.from(text_halign).get(0) : undefined,
            text_valign: text_valign ? Series.from(text_valign).get(0) : undefined,
            text_wrap: text_wrap ? Series.from(text_wrap).get(0) : undefined,
            text_font_family: text_font_family ? Series.from(text_font_family).get(0) : undefined,
        });

        this._boxes.push(box);
        return box;
    }

    /**
     * Creates a copy of a box object.
     */
    copy(id: BoxObject): BoxObject {
        const copy = id.copy();
        this._boxes.push(copy);
        return copy;
    }

    /**
     * Deletes a box object.
     */
    delete(id: BoxObject): void {
        if (id) {
            id.delete();
        }
    }

    // Getter wrappers
    get_left(id: BoxObject): number {
        return id?.get_left() ?? NaN;
    }

    get_top(id: BoxObject): number {
        return id?.get_top() ?? NaN;
    }

    get_right(id: BoxObject): number {
        return id?.get_right() ?? NaN;
    }

    get_bottom(id: BoxObject): number {
        return id?.get_bottom() ?? NaN;
    }

    // Setter wrappers
    set_left(id: BoxObject, left: number): void {
        id?.set_left(left);
    }

    set_top(id: BoxObject, top: number): void {
        id?.set_top(top);
    }

    set_right(id: BoxObject, right: number): void {
        id?.set_right(right);
    }

    set_bottom(id: BoxObject, bottom: number): void {
        id?.set_bottom(bottom);
    }

    set_lefttop(id: BoxObject, left: number, top: number): void {
        id?.set_lefttop(left, top);
    }

    set_rightbottom(id: BoxObject, right: number, bottom: number): void {
        id?.set_rightbottom(right, bottom);
    }

    set_border_color(id: BoxObject, color: string): void {
        id?.set_border_color(color);
    }

    set_border_width(id: BoxObject, width: number): void {
        id?.set_border_width(width);
    }

    set_border_style(id: BoxObject, style: string): void {
        id?.set_border_style(style);
    }

    set_bgcolor(id: BoxObject, color: string): void {
        id?.set_bgcolor(color);
    }

    set_extend(id: BoxObject, extend: string): void {
        id?.set_extend(extend);
    }

    set_text(id: BoxObject, text: string): void {
        id?.set_text(text);
    }

    set_text_size(id: BoxObject, size: string): void {
        id?.set_text_size(size);
    }

    set_text_color(id: BoxObject, color: string): void {
        id?.set_text_color(color);
    }

    set_text_halign(id: BoxObject, halign: string): void {
        id?.set_text_halign(halign);
    }

    set_text_valign(id: BoxObject, valign: string): void {
        id?.set_text_valign(valign);
    }

    set_text_wrap(id: BoxObject, wrap: string): void {
        id?.set_text_wrap(wrap);
    }

    set_text_font_family(id: BoxObject, family: string): void {
        id?.set_text_font_family(family);
    }

    set_text_formatting(id: BoxObject, formatting: string): void {
        id?.set_text_formatting(formatting);
    }

    set_xloc(id: BoxObject, xloc: string): void {
        id?.set_xloc(xloc);
    }

    set_top_left_point(id: BoxObject, point: any): void {
        if (id && point) {
            id.set_lefttop(point.index ?? point.time, point.price);
        }
    }

    set_bottom_right_point(id: BoxObject, point: any): void {
        if (id && point) {
            id.set_rightbottom(point.index ?? point.time, point.price);
        }
    }
}
