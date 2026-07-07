// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { parseArgsForPineParams } from '../utils';
import { LabelObject } from './LabelObject';
import { ChartPointObject } from '../chart/ChartPointObject';
import { NAHelper } from '../Core';
import { silentInSecondary } from '../silentInSecondary';

//prettier-ignore
const LABEL_NEW_SIGNATURES = [
    ['x', 'y', 'text', 'xloc', 'yloc', 'color', 'style', 'textcolor',
     'size', 'textalign', 'tooltip', 'text_font_family', 'force_overlay'],
    ['point', 'text', 'xloc', 'yloc', 'color', 'style', 'textcolor',
     'size', 'textalign', 'tooltip', 'text_font_family', 'force_overlay'],
];

//prettier-ignore
const LABEL_NEW_ARGS_TYPES = {
    x: 'number', y: 'number', text: 'string', xloc: 'string', yloc: 'string',
    color: 'color', style: 'string', textcolor: 'color', size: 'string',
    textalign: 'string', tooltip: 'string', text_font_family: 'string',
    force_overlay: 'boolean', point: 'point',
};

export class LabelHelper {
    private _labels: LabelObject[] = [];

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _ensurePlotsEntry() {
        if (!this.context.plots['__labels__']) {
            this.context.plots['__labels__'] = {
                title: '__labels__',
                data: [],
                options: { style: 'label', overlay: this.context.indicator?.overlay || false },
            };
        }
    }

    public syncToPlot() {
        this._ensurePlotsEntry();
        const time = this.context.marketData[0]?.openTime || 0;
        // Compact out deleted labels — keeps the backing array bounded to the
        // active set (RC3). Transparent to output; rollbackFromBar filters by
        // _createdAtBar, orthogonal to _deleted.
        this._labels = this._labels.filter(lbl => !lbl._deleted);
        const allPlotData = this._labels.map(lbl => lbl.toPlotData());

        // Split force_overlay objects into a separate overlay plot (renders on main chart pane)
        const regular = allPlotData.filter((l: any) => !l.force_overlay);
        const overlay = allPlotData.filter((l: any) => l.force_overlay);

        this.context.plots['__labels__'].data = [{
            time,
            value: regular,
            options: { style: 'label' },
        }];

        if (overlay.length > 0) {
            this.context.plots['__labels_overlay__'] = {
                title: '__labels_overlay__',
                data: [{ time, value: overlay, options: { style: 'label' } }],
                options: { style: 'label', overlay: true },
            };
        } else {
            delete this.context.plots['__labels_overlay__'];
        }
    }

    /**
     * Resolve a value that may be a Series, a bound function, or a plain scalar.
     * Pine Script variables (inputs, chart properties) can be stored as Series
     * objects or bound methods in the PineTS runtime. This ensures the resolved
     * scalar value is used for label properties.
     */
    private _resolve(val: any): any {
        if (val === null || val === undefined) return val;
        // NAHelper (na) → resolve to null (Pine Script na)
        if (val instanceof NAHelper) return null;
        // Resolve Series-like objects (has data array and get method)
        if (typeof val === 'object' && Array.isArray(val.data) && typeof val.get === 'function') {
            const resolved = val.get(0);
            // NaN from Series (e.g. color(na) → Series.from(NaN).get(0)) means na
            if (typeof resolved === 'number' && isNaN(resolved)) return null;
            return resolved;
        }
        // Resolve bound functions (like chart.bg_color, chart.fg_color)
        if (typeof val === 'function') {
            return val();
        }
        // NaN scalar (e.g. color(na) resolved to NaN) means na
        if (typeof val === 'number' && isNaN(val)) return null;
        return val;
    }

    private _createLabel(
        x: number,
        y: number,
        text: string = '',
        xloc: string = 'bi',
        yloc: string = 'pr',
        color: string = '',
        style: string = 'style_label_down',
        textcolor: string = '',
        size: string = 'normal',
        textalign: string = 'center',
        tooltip: string = '',
        text_font_family: string = 'default',
        force_overlay: boolean = false,
    ): LabelObject {
        // Resolve any Series/function values to scalars for label properties
        const lbl = new LabelObject(
            x, y,
            this._resolve(text),
            this._resolve(xloc),
            this._resolve(yloc),
            this._resolve(color),
            this._resolve(style),
            this._resolve(textcolor),
            this._resolve(size),
            this._resolve(textalign),
            this._resolve(tooltip),
            this._resolve(text_font_family),
            force_overlay,
        );
        lbl._helper = this;
        lbl._createdAtBar = this.context.idx;
        this._labels.push(lbl);
        this._enforceMaxCount();
        return lbl;
    }

    private _enforceMaxCount(): void {
        const maxCount = this.context.indicator?.max_labels_count ?? 50;
        const active = this._labels.filter(l => !l._deleted);
        if (active.length > maxCount) {
            const toRemove = active.length - maxCount;
            let removed = 0;
            for (const l of this._labels) {
                if (removed >= toRemove) break;
                if (!l._deleted) {
                    l._deleted = true;
                    removed++;
                }
            }
        }
    }

    // label.new() — explicit Pine Script factory method
    // Supports two signatures:
    //   label.new(x, y, text, xloc, yloc, color, style, textcolor, size, textalign, tooltip, text_font_family, force_overlay)
    //   label.new(point, text, xloc, yloc, color, style, textcolor, size, textalign, tooltip, text_font_family, force_overlay)
    @silentInSecondary
    new(...args: any[]): LabelObject {
        const parsed = parseArgsForPineParams<any>(args, LABEL_NEW_SIGNATURES, LABEL_NEW_ARGS_TYPES);

        let x: number;
        let y: number;
        let xloc: string = parsed.xloc;

        if (parsed.point instanceof ChartPointObject) {
            const pt = parsed.point as ChartPointObject;
            // Treat NaN as "not provided" — see set_point() comment for context.
            const hasIndex = pt.index !== undefined &&
                !(typeof pt.index === 'number' && isNaN(pt.index));
            const hasTime = pt.time !== undefined &&
                !(typeof pt.time === 'number' && isNaN(pt.time));
            if (hasIndex) {
                x = pt.index!;
                xloc = xloc || 'bi';
            } else if (hasTime) {
                x = pt.time!;
                xloc = xloc || 'bt';
            } else {
                x = 0;
                xloc = xloc || 'bi';
            }
            y = pt.price;
        } else {
            // Resolve Series/function coordinate args to scalars at creation —
            // mirrors box.new()/line.new(). A bare-series arg (label.new(x = bar_index,
            // y = high, …)) otherwise stores the live series and loses the bar value.
            x = this._resolve(parsed.x);
            y = this._resolve(parsed.y);
        }

        return this._createLabel(
            x, y, parsed.text, xloc, parsed.yloc,
            parsed.color, parsed.style, parsed.textcolor, parsed.size,
            parsed.textalign, parsed.tooltip, parsed.text_font_family, parsed.force_overlay,
        );
    }

    // label() direct call — mapped via NAMESPACES_LIKE → label.any()
    // Pine `label(arg)` is a type cast / typed-na, NOT a constructor.
    any(...args: any[]): LabelObject | null {
        if (args.length === 1) {
            const arg = args[0];
            if (arg === null || arg === undefined) return null;
            if (arg instanceof NAHelper) return null;
            if (typeof arg === 'number' && isNaN(arg)) return null;
            if (arg instanceof LabelObject) return arg;
            if (arg instanceof Series) {
                const v = arg.get(0);
                if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return null;
                if (v instanceof LabelObject) return v;
            }
            return null;
        }
        return this.new(...args);
    }

    // --- Setter methods ---

    @silentInSecondary
    set_x(id: LabelObject, x: number): void {
        if (id && !id._deleted) id.x = x;
    }

    @silentInSecondary
    set_y(id: LabelObject, y: number): void {
        if (id && !id._deleted) id.y = y;
    }

    @silentInSecondary
    set_xy(id: LabelObject, x: number, y: number): void {
        if (id && !id._deleted) {
            id.x = x;
            id.y = y;
        }
    }

    @silentInSecondary
    set_text(id: LabelObject, text: string): void {
        if (id && !id._deleted) id.text = text;
    }

    @silentInSecondary
    set_color(id: LabelObject, color: string): void {
        if (id && !id._deleted) id.color = color;
    }

    @silentInSecondary
    set_textcolor(id: LabelObject, textcolor: string): void {
        if (id && !id._deleted) id.textcolor = textcolor;
    }

    @silentInSecondary
    set_size(id: LabelObject, size: string): void {
        if (id && !id._deleted) id.size = size;
    }

    @silentInSecondary
    set_style(id: LabelObject, style: string): void {
        if (id && !id._deleted) id.style = style;
    }

    @silentInSecondary
    set_textalign(id: LabelObject, textalign: string): void {
        if (id && !id._deleted) id.textalign = textalign;
    }

    @silentInSecondary
    set_tooltip(id: LabelObject, tooltip: string): void {
        if (id && !id._deleted) id.tooltip = tooltip;
    }

    @silentInSecondary
    set_xloc(id: LabelObject, xloc: string): void {
        if (id && !id._deleted) id.xloc = xloc;
    }

    @silentInSecondary
    set_yloc(id: LabelObject, yloc: string): void {
        if (id && !id._deleted) id.yloc = yloc;
    }

    @silentInSecondary
    set_point(id: LabelObject, point: ChartPointObject): void {
        if (id && !id._deleted && point) {
            // Treat NaN as "not provided" so `chart.point.new(time, na, price)`
            // and `chart.point.new(na, bar_index, price)` (idiomatic in TV-
            // published indicators, e.g. SMC's drawHighLowSwings) correctly
            // resolve to whichever coord is actually set. Without the NaN
            // check, `point.index !== undefined` is true for NaN and the
            // label silently lands at x=NaN, hiding it from the chart.
            const hasIndex = point.index !== undefined &&
                !(typeof point.index === 'number' && isNaN(point.index));
            const hasTime = point.time !== undefined &&
                !(typeof point.time === 'number' && isNaN(point.time));
            if (hasIndex) {
                id.x = point.index!;
                id.xloc = 'bi';
            } else if (hasTime) {
                id.x = point.time!;
                id.xloc = 'bt';
            }
            id.y = point.price;
        }
    }

    // --- Getter methods ---

    get_x(id: LabelObject): number {
        return id ? id.x : NaN;
    }

    get_y(id: LabelObject): number {
        return id ? id.y : NaN;
    }

    get_text(id: LabelObject): string {
        return id ? id.text : '';
    }

    // --- Management methods ---

    @silentInSecondary
    copy(id: LabelObject): LabelObject | undefined {
        if (!id) return undefined;
        const lbl = id.copy();
        lbl._helper = this;
        lbl._createdAtBar = this.context.idx;
        this._labels.push(lbl);
        this._enforceMaxCount();
        return lbl;
    }

    @silentInSecondary
    delete(id: LabelObject): void {
        if (id) id._deleted = true;
    }

    // --- Property: all active labels ---

    get all(): LabelObject[] {
        return this._labels.filter((l) => !l._deleted);
    }

    /**
     * Remove all drawing objects created at or after the given bar index.
     * Called during streaming rollback to prevent accumulation.
     */
    rollbackFromBar(barIdx: number): void {
        this._labels = this._labels.filter((l) => l._createdAtBar < barIdx);
        this.syncToPlot();
    }

    // --- Style constants ---

    get style_label_down() {
        return 'style_label_down';
    }
    get style_label_up() {
        return 'style_label_up';
    }
    get style_label_left() {
        return 'style_label_left';
    }
    get style_label_right() {
        return 'style_label_right';
    }
    get style_label_lower_left() {
        return 'style_label_lower_left';
    }
    get style_label_lower_right() {
        return 'style_label_lower_right';
    }
    get style_label_upper_left() {
        return 'style_label_upper_left';
    }
    get style_label_upper_right() {
        return 'style_label_upper_right';
    }
    get style_label_center() {
        return 'style_label_center';
    }
    get style_circle() {
        return 'style_circle';
    }
    get style_square() {
        return 'style_square';
    }
    get style_diamond() {
        return 'style_diamond';
    }
    get style_flag() {
        return 'style_flag';
    }
    get style_arrowup() {
        return 'style_arrowup';
    }
    get style_arrowdown() {
        return 'style_arrowdown';
    }
    get style_cross() {
        return 'style_cross';
    }
    get style_xcross() {
        return 'style_xcross';
    }
    get style_triangleup() {
        return 'style_triangleup';
    }
    get style_triangledown() {
        return 'style_triangledown';
    }
    get style_none() {
        return 'style_none';
    }
    get style_text_outline() {
        return 'style_text_outline';
    }
}
