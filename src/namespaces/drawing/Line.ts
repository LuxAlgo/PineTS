// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { LineObject } from './LineObject';

/**
 * Pine Script line namespace implementation.
 * Provides functions for creating and managing line drawing objects.
 */
export class Line {
    private _lines: LineObject[] = [];

    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Returns an array of all line objects on the chart.
     */
    get all(): LineObject[] {
        return this._lines.filter((l: any) => !l._deleted);
    }

    // Line styles
    static style_arrow_both = 'arrow_both';
    static style_arrow_left = 'arrow_left';
    static style_arrow_right = 'arrow_right';
    static style_dashed = 'dashed';
    static style_dotted = 'dotted';
    static style_solid = 'solid';

    /**
     * Creates a new line object.
     */
    new(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        xloc?: string,
        extend?: string,
        color?: string,
        style?: string,
        width?: number
    ): LineObject {
        const line = new LineObject(this.context, {
            x1: Series.from(x1).get(0),
            y1: Series.from(y1).get(0),
            x2: Series.from(x2).get(0),
            y2: Series.from(y2).get(0),
            xloc: xloc ? Series.from(xloc).get(0) : undefined,
            extend: extend ? Series.from(extend).get(0) : undefined,
            color: color ? Series.from(color).get(0) : undefined,
            style: style ? Series.from(style).get(0) : undefined,
            width: width ? Series.from(width).get(0) : undefined,
        });

        this._lines.push(line);
        return line;
    }

    /**
     * Creates a copy of a line object.
     */
    copy(id: LineObject): LineObject {
        const copy = id.copy();
        this._lines.push(copy);
        return copy;
    }

    /**
     * Deletes a line object.
     */
    delete(id: LineObject): void {
        if (id) {
            id.delete();
        }
    }

    // Getter wrappers
    get_x1(id: LineObject): number {
        return id?.get_x1() ?? NaN;
    }

    get_y1(id: LineObject): number {
        return id?.get_y1() ?? NaN;
    }

    get_x2(id: LineObject): number {
        return id?.get_x2() ?? NaN;
    }

    get_y2(id: LineObject): number {
        return id?.get_y2() ?? NaN;
    }

    get_price(id: LineObject, x: number): number {
        return id?.get_price(Series.from(x).get(0)) ?? NaN;
    }

    // Setter wrappers
    set_x1(id: LineObject, x1: number): void {
        id?.set_x1(x1);
    }

    set_y1(id: LineObject, y1: number): void {
        id?.set_y1(y1);
    }

    set_x2(id: LineObject, x2: number): void {
        id?.set_x2(x2);
    }

    set_y2(id: LineObject, y2: number): void {
        id?.set_y2(y2);
    }

    set_xy1(id: LineObject, x: number, y: number): void {
        id?.set_xy1(x, y);
    }

    set_xy2(id: LineObject, x: number, y: number): void {
        id?.set_xy2(x, y);
    }

    set_first_point(id: LineObject, point: { index: number; time: number; price: number }): void {
        id?.set_first_point(point);
    }

    set_second_point(id: LineObject, point: { index: number; time: number; price: number }): void {
        id?.set_second_point(point);
    }

    set_xloc(id: LineObject, xloc: string): void {
        id?.set_xloc(xloc);
    }

    set_extend(id: LineObject, extend: string): void {
        id?.set_extend(extend);
    }

    set_color(id: LineObject, color: string): void {
        id?.set_color(color);
    }

    set_style(id: LineObject, style: string): void {
        id?.set_style(style);
    }

    set_width(id: LineObject, width: number): void {
        id?.set_width(width);
    }
}
