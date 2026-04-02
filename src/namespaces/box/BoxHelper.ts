// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { parseArgsForPineParams } from '../utils';
import { BoxObject } from './BoxObject';
import { ChartPointObject } from '../chart/ChartPointObject';
import { NAHelper } from '../Core';

//prettier-ignore
const BOX_NEW_SIGNATURES = [
    ['left', 'top', 'right', 'bottom', 'border_color', 'border_width', 'border_style', 'extend', 'xloc', 'bgcolor', 'text', 'text_size', 'text_color', 'text_halign', 'text_valign', 'text_wrap', 'text_font_family', 'force_overlay'],
    ['top_left', 'bottom_right', 'border_color', 'border_width', 'border_style', 'extend', 'xloc', 'bgcolor', 'text', 'text_size', 'text_color', 'text_halign', 'text_valign', 'text_wrap', 'text_font_family', 'force_overlay'],
];

//prettier-ignore
const BOX_NEW_ARGS_TYPES: Record<string, string> = {
    left: 'number', top: 'number', right: 'number', bottom: 'number',
    top_left: 'point', bottom_right: 'point',
    border_color: 'color', border_width: 'number', border_style: 'string',
    extend: 'string', xloc: 'string', bgcolor: 'color',
    text: 'string', text_size: 'string', text_color: 'color',
    text_halign: 'string', text_valign: 'string', text_wrap: 'string',
    text_font_family: 'string', force_overlay: 'boolean',
};

export class BoxHelper {
    private _boxes: BoxObject[] = [];

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _ensurePlotsEntry() {
        if (!this.context.plots['__boxes__']) {
            this.context.plots['__boxes__'] = {
                title: '__boxes__',
                data: [],
                options: { style: 'drawing_box', overlay: this.context.indicator?.overlay || false },
            };
        }
    }

    public syncToPlot() {
        this._ensurePlotsEntry();
        const time = this.context.marketData[0]?.openTime || 0;
        const allPlotData = this._boxes.map(bx => bx.toPlotData());

        // Split force_overlay objects into a separate overlay plot (renders on main chart pane)
        const regular = allPlotData.filter((b: any) => !b.force_overlay);
        const overlay = allPlotData.filter((b: any) => b.force_overlay);

        this.context.plots['__boxes__'].data = [{
            time,
            value: regular,
            options: { style: 'drawing_box' },
        }];

        if (overlay.length > 0) {
            this.context.plots['__boxes_overlay__'] = {
                title: '__boxes_overlay__',
                data: [{ time, value: overlay, options: { style: 'drawing_box' } }],
                options: { style: 'drawing_box', overlay: true },
            };
        } else {
            delete this.context.plots['__boxes_overlay__'];
        }
    }

    private _resolvePoint(point: ChartPointObject): { x: number; xloc: string } {
        if (point.index !== undefined) {
            return { x: point.index, xloc: 'bi' };
        } else if (point.time !== undefined) {
            return { x: point.time, xloc: 'bt' };
        }
        return { x: 0, xloc: 'bi' };
    }

    private _resolve(val: any): any {
        if (val === null || val === undefined) return val;
        // NAHelper (na) → resolve to NaN
        if (val instanceof NAHelper) return NaN;
        if (typeof val === 'object' && Array.isArray(val.data) && typeof val.get === 'function') {
            return val.get(0);
        }
        if (typeof val === 'function') {
            return val();
        }
        return val;
    }

    /**
     * Resolve a color value, preserving NaN (na) so renderers can detect "no color".
     * The regular `_resolve(val) || fallback` pattern treats NaN as falsy and replaces
     * it with the default, losing the explicit `border_color = na` intent.
     */
    private _resolveColor(val: any, fallback: string): any {
        const resolved = this._resolve(val);
        // NaN means `na` in Pine Script — preserve it so renderers can detect it
        if (typeof resolved === 'number' && isNaN(resolved)) return NaN;
        return resolved || fallback;
    }

    private _createBox(
        left: number, top: number, right: number, bottom: number,
        xloc: string = 'bi', extend: string = 'none',
        border_color: string = '#2962ff', border_style: string = 'style_solid',
        border_width: number = 1, bgcolor: string = '#2962ff',
        text: string = '', text_color: string = '#000000',
        text_size: string = 'auto', text_halign: string = 'center',
        text_valign: string = 'center', text_wrap: string = 'wrap_none',
        text_font_family: string = 'default', text_formatting: string = 'format_none',
        force_overlay: boolean = false,
    ): BoxObject {
        const b = new BoxObject(
            left, top, right, bottom, xloc,
            this._resolve(extend),
            this._resolveColor(border_color, '#2962ff'),
            this._resolve(border_style) || 'style_solid',
            this._resolve(border_width) ?? 1,
            this._resolveColor(bgcolor, '#2962ff'),
            this._resolve(text) || '',
            this._resolveColor(text_color, '#000000'),
            this._resolve(text_size) || 'auto',
            this._resolve(text_halign) || 'center',
            this._resolve(text_valign) || 'center',
            this._resolve(text_wrap) || 'wrap_none',
            this._resolve(text_font_family) || 'default',
            this._resolve(text_formatting) || 'format_none',
            force_overlay,
        );
        b._helper = this;
        b._createdAtBar = this.context.idx;
        this._boxes.push(b);
        this.syncToPlot();
        return b;
    }

    // box.new() — supports both chart.point and legacy signatures
    new(...args: any[]): BoxObject {
        const parsed = parseArgsForPineParams<any>(args, BOX_NEW_SIGNATURES, BOX_NEW_ARGS_TYPES);

        let left: number;
        let top: number;
        let right: number;
        let bottom: number;
        let xloc: string = parsed.xloc;

        if (parsed.top_left instanceof ChartPointObject) {
            const pt1 = parsed.top_left as ChartPointObject;
            const pt2 = parsed.bottom_right as ChartPointObject;
            const r1 = this._resolvePoint(pt1);
            left = r1.x;
            top = pt1.price;
            xloc = xloc || r1.xloc;

            if (pt2 instanceof ChartPointObject) {
                const r2 = this._resolvePoint(pt2);
                right = r2.x;
                bottom = pt2.price;
            } else {
                right = 0;
                bottom = NaN;
            }
        } else {
            left = this._resolve(parsed.left);
            top = this._resolve(parsed.top);
            right = this._resolve(parsed.right);
            bottom = this._resolve(parsed.bottom);
        }

        return this._createBox(
            left, top, right, bottom, xloc,
            parsed.extend, parsed.border_color, parsed.border_style,
            parsed.border_width, parsed.bgcolor,
            parsed.text, parsed.text_color, parsed.text_size,
            parsed.text_halign, parsed.text_valign, parsed.text_wrap,
            parsed.text_font_family, undefined,
            parsed.force_overlay,
        );
    }

    any(...args: any[]): BoxObject {
        return this.new(...args);
    }

    // --- Coordinate setters ---

    set_left(id: BoxObject, left: number): void {
        if (id && !id._deleted) id.left = this._resolve(left);
    }

    set_right(id: BoxObject, right: number): void {
        if (id && !id._deleted) id.right = this._resolve(right);
    }

    set_top(id: BoxObject, top: number): void {
        if (id && !id._deleted) id.top = this._resolve(top);
    }

    set_bottom(id: BoxObject, bottom: number): void {
        if (id && !id._deleted) id.bottom = this._resolve(bottom);
    }

    set_lefttop(id: BoxObject, left: number, top: number): void {
        if (id && !id._deleted) {
            id.left = this._resolve(left);
            id.top = this._resolve(top);
        }
    }

    set_rightbottom(id: BoxObject, right: number, bottom: number): void {
        if (id && !id._deleted) {
            id.right = this._resolve(right);
            id.bottom = this._resolve(bottom);
        }
    }

    set_top_left_point(id: BoxObject, point: ChartPointObject): void {
        if (id && !id._deleted && point) {
            const r = this._resolvePoint(point);
            id.left = r.x;
            id.top = point.price;
            id.xloc = r.xloc;
        }
    }

    set_bottom_right_point(id: BoxObject, point: ChartPointObject): void {
        if (id && !id._deleted && point) {
            const r = this._resolvePoint(point);
            id.right = r.x;
            id.bottom = point.price;
            id.xloc = r.xloc;
        }
    }

    set_xloc(id: BoxObject, left: number, right: number, xloc: string): void {
        if (id && !id._deleted) {
            id.left = this._resolve(left);
            id.right = this._resolve(right);
            id.xloc = this._resolve(xloc);
        }
    }

    // --- Style setters ---

    set_bgcolor(id: BoxObject, color: string): void {
        if (id && !id._deleted) id.bgcolor = this._resolve(color);
    }

    set_border_color(id: BoxObject, color: string): void {
        if (id && !id._deleted) id.border_color = this._resolve(color);
    }

    set_border_width(id: BoxObject, width: number): void {
        if (id && !id._deleted) id.border_width = this._resolve(width) ?? 1;
    }

    set_border_style(id: BoxObject, style: string): void {
        if (id && !id._deleted) id.border_style = this._resolve(style);
    }

    set_extend(id: BoxObject, extend: string): void {
        if (id && !id._deleted) id.extend = this._resolve(extend);
    }

    // --- Text setters ---

    set_text(id: BoxObject, text: string): void {
        if (id && !id._deleted) id.text = this._resolve(text) || '';
    }

    set_text_color(id: BoxObject, color: string): void {
        if (id && !id._deleted) id.text_color = this._resolve(color);
    }

    set_text_size(id: BoxObject, size: string): void {
        if (id && !id._deleted) id.text_size = this._resolve(size);
    }

    set_text_halign(id: BoxObject, align: string): void {
        if (id && !id._deleted) id.text_halign = this._resolve(align);
    }

    set_text_valign(id: BoxObject, align: string): void {
        if (id && !id._deleted) id.text_valign = this._resolve(align);
    }

    set_text_wrap(id: BoxObject, wrap: string): void {
        if (id && !id._deleted) id.text_wrap = this._resolve(wrap);
    }

    set_text_font_family(id: BoxObject, family: string): void {
        if (id && !id._deleted) id.text_font_family = this._resolve(family);
    }

    set_text_formatting(id: BoxObject, formatting: string): void {
        if (id && !id._deleted) id.text_formatting = this._resolve(formatting);
    }

    // --- Getters ---

    get_left(id: BoxObject): number {
        return id ? id.left : NaN;
    }

    get_right(id: BoxObject): number {
        return id ? id.right : NaN;
    }

    get_top(id: BoxObject): number {
        return id ? id.top : NaN;
    }

    get_bottom(id: BoxObject): number {
        return id ? id.bottom : NaN;
    }

    // --- Management ---

    copy(id: BoxObject): BoxObject | undefined {
        if (!id) return undefined;
        const b = id.copy();
        b._helper = this;
        b._createdAtBar = this.context.idx;
        this._boxes.push(b);
        this.syncToPlot();
        return b;
    }

    delete(id: BoxObject): void {
        if (id) id._deleted = true;
    }

    get all(): BoxObject[] {
        return this._boxes.filter((b) => !b._deleted);
    }

    /**
     * Remove all drawing objects created at or after the given bar index,
     * and un-delete objects that were deleted during rolled-back bars.
     * Called during streaming rollback to prevent accumulation.
     */
    rollbackFromBar(barIdx: number): void {
        this._boxes = this._boxes.filter((b) => b._createdAtBar < barIdx);
        this.syncToPlot();
    }
}
