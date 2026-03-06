// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { parseArgsForPineParams } from '../utils';
import { LineObject } from './LineObject';
import { ChartPointObject } from '../chart/ChartPointObject';
import { NAHelper } from '../Core';

//prettier-ignore
const LINE_NEW_SIGNATURES = [
    ['x1', 'y1', 'x2', 'y2', 'xloc', 'extend', 'color', 'style', 'width', 'force_overlay'],
    ['first_point', 'second_point', 'xloc', 'extend', 'color', 'style', 'width', 'force_overlay'],
];

//prettier-ignore
const LINE_NEW_ARGS_TYPES = {
    x1: 'number', y1: 'number', x2: 'number', y2: 'number',
    xloc: 'string', extend: 'string', color: 'string', style: 'string',
    width: 'number', force_overlay: 'boolean',
    first_point: 'point', second_point: 'point',
};

export class LineHelper {
    private _lines: LineObject[] = [];

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _ensurePlotsEntry() {
        if (!this.context.plots['__lines__']) {
            this.context.plots['__lines__'] = {
                title: '__lines__',
                data: [],
                options: { style: 'drawing_line', overlay: true },
            };
        }
    }

    private _syncToPlot() {
        this._ensurePlotsEntry();
        // Store ALL lines as a single array value at the first bar's time.
        // Using a live reference so setter mutations are reflected automatically.
        // Multiple drawing objects at the same bar would overwrite each other
        // in QFChart's sparse data array, so we aggregate them into one entry.
        const time = this.context.marketData[0]?.openTime || 0;
        this.context.plots['__lines__'].data = [{
            time,
            value: this._lines,
            options: { style: 'drawing_line' },
        }];
    }

    private _resolvePoint(point: ChartPointObject): { x: number; xloc: string } {
        if (point.index !== undefined) {
            return { x: point.index, xloc: 'bi' };
        } else if (point.time !== undefined) {
            return { x: point.time, xloc: 'bt' };
        }
        return { x: 0, xloc: 'bi' };
    }

    /**
     * Resolve a value that may be a Series, a bound function, or a plain scalar.
     * Pine Script variables (inputs, chart properties) can be stored as Series
     * objects or bound methods in the PineTS runtime. This ensures the resolved
     * scalar value is used for line properties.
     */
    private _resolve(val: any): any {
        if (val === null || val === undefined) return val;
        // NAHelper (na) → resolve to NaN
        if (val instanceof NAHelper) return NaN;
        // Resolve Series-like objects (has data array and get method)
        if (typeof val === 'object' && Array.isArray(val.data) && typeof val.get === 'function') {
            return val.get(0);
        }
        // Resolve bound functions (like chart.bg_color, chart.fg_color)
        if (typeof val === 'function') {
            return val();
        }
        return val;
    }

    private _createLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        xloc: string = 'bi',
        extend: string = 'none',
        color: string = '',
        style: string = 'style_solid',
        width: number = 1,
        force_overlay: boolean = false,
    ): LineObject {
        // Resolve any Series/function values to scalars for line properties
        const ln = new LineObject(
            x1, y1, x2, y2, xloc,
            this._resolve(extend),
            this._resolve(color),
            this._resolve(style),
            this._resolve(width) || 1,
            force_overlay,
        );
        ln._helper = this;
        ln._createdAtBar = this.context.idx;
        this._lines.push(ln);
        this._syncToPlot();
        return ln;
    }

    // line.new() — explicit Pine Script factory method
    // Supports two signatures:
    //   line.new(x1, y1, x2, y2, xloc, extend, color, style, width, force_overlay)
    //   line.new(first_point, second_point, xloc, extend, color, style, width, force_overlay)
    new(...args: any[]): LineObject {
        const parsed = parseArgsForPineParams<any>(args, LINE_NEW_SIGNATURES, LINE_NEW_ARGS_TYPES);

        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;
        let xloc: string = parsed.xloc;

        if (parsed.first_point instanceof ChartPointObject) {
            const pt1 = parsed.first_point as ChartPointObject;
            const pt2 = parsed.second_point as ChartPointObject;
            const r1 = this._resolvePoint(pt1);
            x1 = r1.x;
            y1 = pt1.price;
            xloc = xloc || r1.xloc;

            if (pt2 instanceof ChartPointObject) {
                const r2 = this._resolvePoint(pt2);
                x2 = r2.x;
                y2 = pt2.price;
            } else {
                x2 = 0;
                y2 = NaN;
            }
        } else {
            x1 = parsed.x1;
            y1 = parsed.y1;
            x2 = parsed.x2;
            y2 = parsed.y2;
        }

        return this._createLine(
            x1, y1, x2, y2, xloc, parsed.extend,
            parsed.color, parsed.style, parsed.width, parsed.force_overlay,
        );
    }

    // line() direct call — mapped via NAMESPACES_LIKE → line.any()
    any(...args: any[]): LineObject {
        return this.new(...args);
    }

    // --- Setter methods ---

    set_x1(id: LineObject, x: number): void {
        if (id && !id._deleted) id.x1 = x;
    }

    set_y1(id: LineObject, y: number): void {
        if (id && !id._deleted) id.y1 = y;
    }

    set_x2(id: LineObject, x: number): void {
        if (id && !id._deleted) id.x2 = x;
    }

    set_y2(id: LineObject, y: number): void {
        if (id && !id._deleted) id.y2 = y;
    }

    set_xy1(id: LineObject, x: number, y: number): void {
        if (id && !id._deleted) {
            id.x1 = x;
            id.y1 = y;
        }
    }

    set_xy2(id: LineObject, x: number, y: number): void {
        if (id && !id._deleted) {
            id.x2 = x;
            id.y2 = y;
        }
    }

    set_color(id: LineObject, color: string): void {
        if (id && !id._deleted) id.color = this._resolve(color);
    }

    set_width(id: LineObject, width: number): void {
        if (id && !id._deleted) id.width = this._resolve(width) || 1;
    }

    set_style(id: LineObject, style: string): void {
        if (id && !id._deleted) id.style = this._resolve(style);
    }

    set_extend(id: LineObject, extend: string): void {
        if (id && !id._deleted) id.extend = this._resolve(extend);
    }

    set_xloc(id: LineObject, x1: number, x2: number, xloc: string): void {
        if (id && !id._deleted) {
            id.x1 = x1;
            id.x2 = x2;
            id.xloc = xloc;
        }
    }

    set_first_point(id: LineObject, point: ChartPointObject): void {
        if (id && !id._deleted && point) {
            const r = this._resolvePoint(point);
            id.x1 = r.x;
            id.y1 = point.price;
            id.xloc = r.xloc;
        }
    }

    set_second_point(id: LineObject, point: ChartPointObject): void {
        if (id && !id._deleted && point) {
            const r = this._resolvePoint(point);
            id.x2 = r.x;
            id.y2 = point.price;
            id.xloc = r.xloc;
        }
    }

    // --- Getter methods ---

    get_x1(id: LineObject): number {
        return id ? id.x1 : NaN;
    }

    get_y1(id: LineObject): number {
        return id ? id.y1 : NaN;
    }

    get_x2(id: LineObject): number {
        return id ? id.x2 : NaN;
    }

    get_y2(id: LineObject): number {
        return id ? id.y2 : NaN;
    }

    // line.get_price(id, x) — returns price at bar index x along the line
    get_price(id: LineObject, x: number): number {
        if (!id || id._deleted) return NaN;
        if (id.xloc !== 'bi') return NaN;
        const dx = id.x2 - id.x1;
        if (dx === 0) return id.y1;
        // Linear interpolation/extrapolation (line treated as extend.both per Pine docs)
        return id.y1 + ((x - id.x1) / dx) * (id.y2 - id.y1);
    }

    // --- Management methods ---

    copy(id: LineObject): LineObject | undefined {
        if (!id) return undefined;
        const ln = id.copy();
        ln._helper = this;
        ln._createdAtBar = this.context.idx;
        this._lines.push(ln);
        this._syncToPlot();
        return ln;
    }

    delete(id: LineObject): void {
        if (id) id._deleted = true;
    }

    // --- Property: all active lines ---

    get all(): LineObject[] {
        return this._lines.filter((l) => !l._deleted);
    }

    /**
     * Remove all drawing objects created at or after the given bar index.
     * Called during streaming rollback to prevent accumulation.
     */
    rollbackFromBar(barIdx: number): void {
        this._lines = this._lines.filter((l) => l._createdAtBar < barIdx);
        this._syncToPlot();
    }

    // --- Style constants ---

    get style_solid() {
        return 'style_solid';
    }
    get style_dotted() {
        return 'style_dotted';
    }
    get style_dashed() {
        return 'style_dashed';
    }
    get style_arrow_left() {
        return 'style_arrow_left';
    }
    get style_arrow_right() {
        return 'style_arrow_right';
    }
    get style_arrow_both() {
        return 'style_arrow_both';
    }
}
