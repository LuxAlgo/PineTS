// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';

/**
 * Represents a line drawing object in PineTS.
 * Lines are drawn between two points on the chart.
 */
export class LineObject {
    private _id: number;
    private _x1: number;
    private _y1: number;
    private _x2: number;
    private _y2: number;
    private _xloc: string;
    private _extend: string;
    private _color: string;
    private _style: string;
    private _width: number;

    private static _nextId = 1;

    constructor(
        private context: any,
        options: {
            x1?: number;
            y1?: number;
            x2?: number;
            y2?: number;
            xloc?: string;
            extend?: string;
            color?: string;
            style?: string;
            width?: number;
        } = {}
    ) {
        this._id = LineObject._nextId++;
        this._x1 = options.x1 ?? 0;
        this._y1 = options.y1 ?? 0;
        this._x2 = options.x2 ?? 0;
        this._y2 = options.y2 ?? 0;
        this._xloc = options.xloc ?? 'bar_index';
        this._extend = options.extend ?? 'none';
        this._color = options.color ?? '#2196F3';
        this._style = options.style ?? 'solid';
        this._width = options.width ?? 1;
    }

    // Getters
    get_x1(): number {
        return this._x1;
    }

    get_y1(): number {
        return this._y1;
    }

    get_x2(): number {
        return this._x2;
    }

    get_y2(): number {
        return this._y2;
    }

    get_price(x: number): number {
        // Linear interpolation between points
        const x1 = this._x1;
        const y1 = this._y1;
        const x2 = this._x2;
        const y2 = this._y2;

        if (x2 === x1) return y1;

        const slope = (y2 - y1) / (x2 - x1);
        return y1 + slope * (x - x1);
    }

    // Setters
    set_x1(x1: number): void {
        this._x1 = Series.from(x1).get(0);
    }

    set_y1(y1: number): void {
        this._y1 = Series.from(y1).get(0);
    }

    set_x2(x2: number): void {
        this._x2 = Series.from(x2).get(0);
    }

    set_y2(y2: number): void {
        this._y2 = Series.from(y2).get(0);
    }

    set_xy1(x: number, y: number): void {
        this._x1 = Series.from(x).get(0);
        this._y1 = Series.from(y).get(0);
    }

    set_xy2(x: number, y: number): void {
        this._x2 = Series.from(x).get(0);
        this._y2 = Series.from(y).get(0);
    }

    set_first_point(point: { index: number; time: number; price: number }): void {
        if (this._xloc === 'bar_time') {
            this._x1 = point.time;
        } else {
            this._x1 = point.index;
        }
        this._y1 = point.price;
    }

    set_second_point(point: { index: number; time: number; price: number }): void {
        if (this._xloc === 'bar_time') {
            this._x2 = point.time;
        } else {
            this._x2 = point.index;
        }
        this._y2 = point.price;
    }

    set_xloc(xloc: string): void {
        this._xloc = Series.from(xloc).get(0);
    }

    set_extend(extend: string): void {
        this._extend = Series.from(extend).get(0);
    }

    set_color(color: string): void {
        this._color = Series.from(color).get(0);
    }

    set_style(style: string): void {
        this._style = Series.from(style).get(0);
    }

    set_width(width: number): void {
        this._width = Series.from(width).get(0);
    }

    /**
     * Returns a copy of this line object
     */
    copy(): LineObject {
        return new LineObject(this.context, {
            x1: this._x1,
            y1: this._y1,
            x2: this._x2,
            y2: this._y2,
            xloc: this._xloc,
            extend: this._extend,
            color: this._color,
            style: this._style,
            width: this._width,
        });
    }

    /**
     * Deletes the line (removes from rendering)
     */
    delete(): void {
        (this as any)._deleted = true;
    }

    /**
     * Gets the line's properties for rendering
     */
    toJSON(): object {
        return {
            id: this._id,
            x1: this._x1,
            y1: this._y1,
            x2: this._x2,
            y2: this._y2,
            xloc: this._xloc,
            extend: this._extend,
            color: this._color,
            style: this._style,
            width: this._width,
        };
    }
}
