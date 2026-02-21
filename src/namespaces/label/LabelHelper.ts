// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { parseArgsForPineParams } from '../utils';
import { LabelObject } from './LabelObject';
import { ChartPointObject } from '../chart/ChartPointObject';

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
    color: 'string', style: 'string', textcolor: 'string', size: 'string',
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
                options: { style: 'label', overlay: true },
            };
        }
    }

    private _pushLabelData(lbl: LabelObject) {
        this._ensurePlotsEntry();
        // Store the LabelObject directly (by reference) so that
        // subsequent setter calls (set_text, set_color, etc.) are
        // reflected in the plot data without needing to re-push.
        this.context.plots['__labels__'].data.push({
            time: this.context.marketData[this.context.idx]?.openTime,
            value: lbl,
            options: { style: 'label' },
        });
    }

    private _createLabel(
        x: number,
        y: number,
        text: string = '',
        xloc: string = 'bar_index',
        yloc: string = 'price',
        color: string = '',
        style: string = 'style_label_down',
        textcolor: string = '',
        size: string = 'normal',
        textalign: string = 'align_center',
        tooltip: string = '',
        text_font_family: string = 'family_default',
        force_overlay: boolean = false,
    ): LabelObject {
        const lbl = new LabelObject(x, y, text, xloc, yloc, color, style, textcolor, size, textalign, tooltip, text_font_family, force_overlay);
        this._labels.push(lbl);
        this._pushLabelData(lbl);
        return lbl;
    }

    // label.new() — explicit Pine Script factory method
    // Supports two signatures:
    //   label.new(x, y, text, xloc, yloc, color, style, textcolor, size, textalign, tooltip, text_font_family, force_overlay)
    //   label.new(point, text, xloc, yloc, color, style, textcolor, size, textalign, tooltip, text_font_family, force_overlay)
    new(...args: any[]): LabelObject {
        const parsed = parseArgsForPineParams<any>(args, LABEL_NEW_SIGNATURES, LABEL_NEW_ARGS_TYPES);

        let x: number;
        let y: number;
        let xloc: string = parsed.xloc;

        if (parsed.point instanceof ChartPointObject) {
            const pt = parsed.point as ChartPointObject;
            if (pt.index !== undefined) {
                x = pt.index;
                xloc = xloc || 'bar_index';
            } else if (pt.time !== undefined) {
                x = pt.time;
                xloc = xloc || 'bar_time';
            } else {
                x = 0;
                xloc = xloc || 'bar_index';
            }
            y = pt.price;
        } else {
            x = parsed.x;
            y = parsed.y;
        }

        return this._createLabel(
            x, y, parsed.text, xloc, parsed.yloc,
            parsed.color, parsed.style, parsed.textcolor, parsed.size,
            parsed.textalign, parsed.tooltip, parsed.text_font_family, parsed.force_overlay,
        );
    }

    // label() direct call — mapped via NAMESPACES_LIKE → label.any()
    any(...args: any[]): LabelObject {
        return this.new(...args);
    }

    // --- Setter methods ---

    set_x(id: LabelObject, x: number): void {
        if (id && !id._deleted) id.x = x;
    }

    set_y(id: LabelObject, y: number): void {
        if (id && !id._deleted) id.y = y;
    }

    set_xy(id: LabelObject, x: number, y: number): void {
        if (id && !id._deleted) {
            id.x = x;
            id.y = y;
        }
    }

    set_text(id: LabelObject, text: string): void {
        if (id && !id._deleted) id.text = text;
    }

    set_color(id: LabelObject, color: string): void {
        if (id && !id._deleted) id.color = color;
    }

    set_textcolor(id: LabelObject, textcolor: string): void {
        if (id && !id._deleted) id.textcolor = textcolor;
    }

    set_size(id: LabelObject, size: string): void {
        if (id && !id._deleted) id.size = size;
    }

    set_style(id: LabelObject, style: string): void {
        if (id && !id._deleted) id.style = style;
    }

    set_textalign(id: LabelObject, textalign: string): void {
        if (id && !id._deleted) id.textalign = textalign;
    }

    set_tooltip(id: LabelObject, tooltip: string): void {
        if (id && !id._deleted) id.tooltip = tooltip;
    }

    set_xloc(id: LabelObject, xloc: string): void {
        if (id && !id._deleted) id.xloc = xloc;
    }

    set_yloc(id: LabelObject, yloc: string): void {
        if (id && !id._deleted) id.yloc = yloc;
    }

    set_point(id: LabelObject, point: ChartPointObject): void {
        if (id && !id._deleted && point) {
            if (point.index !== undefined) {
                id.x = point.index;
                id.xloc = 'bar_index';
            } else if (point.time !== undefined) {
                id.x = point.time;
                id.xloc = 'bar_time';
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

    copy(id: LabelObject): LabelObject | undefined {
        if (!id) return undefined;
        const lbl = id.copy();
        this._labels.push(lbl);
        this._pushLabelData(lbl);
        return lbl;
    }

    delete(id: LabelObject): void {
        if (id) id._deleted = true;
    }

    // --- Property: all active labels ---

    get all(): LabelObject[] {
        return this._labels.filter((l) => !l._deleted);
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
