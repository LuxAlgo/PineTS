// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { LineObject } from '../line/LineObject';
import { LinefillObject } from './LinefillObject';
import { NAHelper } from '../Core';

export class LinefillHelper {
    private _linefills: LinefillObject[] = [];

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _ensurePlotsEntry() {
        if (!this.context.plots['__linefills__']) {
            this.context.plots['__linefills__'] = {
                title: '__linefills__',
                data: [],
                options: { style: 'linefill', overlay: this.context.indicator?.overlay || false },
            };
        }
    }

    public syncToPlot() {
        this._ensurePlotsEntry();
        const time = this.context.marketData[0]?.openTime || 0;
        const allPlotData = this._linefills.map(lf => lf.toPlotData());

        // Split force_overlay linefills into a separate overlay plot
        const regular = allPlotData.filter((lf: any) => !lf.force_overlay);
        const overlay = allPlotData.filter((lf: any) => lf.force_overlay);

        this.context.plots['__linefills__'].data = [{
            time,
            value: regular,
            options: { style: 'linefill' },
        }];

        if (overlay.length > 0) {
            this.context.plots['__linefills_overlay__'] = {
                title: '__linefills_overlay__',
                data: [{ time, value: overlay, options: { style: 'linefill' } }],
                options: { style: 'linefill', overlay: true },
            };
        } else {
            delete this.context.plots['__linefills_overlay__'];
        }
    }

    /**
     * Resolve a value that may be a Series, a bound function, or a plain scalar.
     */
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

    // linefill.new(line1, line2, color) → series linefill
    // The transpiler may bundle named args into an object:
    //   linefill.new(line1, line2, {color: '#2196F3'})
    //
    // TradingView behavior: if a linefill already exists between the same two
    // lines (in either order), the existing one is replaced rather than creating
    // a duplicate. This prevents accumulation when linefill.new() is called
    // every bar without explicitly deleting the old fill.
    new(line1: LineObject, line2: LineObject, color: any): LinefillObject {
        // Resolve thunks: in `var` UDT declarations, line.new() calls are hoisted
        // as thunks (functions). Resolve them here so LinefillObject stores actual
        // LineObjects, not unresolved functions.
        const resolvedLine1 = this._resolve(line1) as LineObject;
        const resolvedLine2 = this._resolve(line2) as LineObject;
        // Extract color from named-args object if the transpiler bundled it
        const rawColor = color && typeof color === 'object' && !Array.isArray(color) && 'color' in color
            ? color.color : color;
        const resolvedColor = this._resolve(rawColor) || '';

        // Deduplicate: replace existing linefill between the same line pair
        if (resolvedLine1 && resolvedLine2) {
            const id1 = resolvedLine1.id;
            const id2 = resolvedLine2.id;
            for (const existing of this._linefills) {
                if (existing._deleted) continue;
                const eid1 = existing.line1?.id;
                const eid2 = existing.line2?.id;
                if ((eid1 === id1 && eid2 === id2) || (eid1 === id2 && eid2 === id1)) {
                    // Update existing linefill in-place
                    existing.color = resolvedColor;
                    existing._createdAtBar = this.context.idx;
                    this.syncToPlot();
                    return existing;
                }
            }
        }

        const lf = new LinefillObject(resolvedLine1, resolvedLine2, resolvedColor);
        lf._createdAtBar = this.context.idx;
        this._linefills.push(lf);
        this.syncToPlot();
        return lf;
    }

    // linefill() direct call — mapped via NAMESPACES_LIKE → linefill.any()
    any(...args: any[]): LinefillObject {
        return this.new(args[0], args[1], args[2]);
    }

    // linefill.set_color(id, color) → void
    set_color(id: LinefillObject, color: any): void {
        if (id && !id._deleted) {
            id.color = this._resolve(color) || '';
        }
    }

    // linefill.get_line1(id) → series line
    get_line1(id: LinefillObject): LineObject | undefined {
        return id ? id.line1 : undefined;
    }

    // linefill.get_line2(id) → series line
    get_line2(id: LinefillObject): LineObject | undefined {
        return id ? id.line2 : undefined;
    }

    // linefill.delete(id) → void
    delete(id: LinefillObject): void {
        if (id) id._deleted = true;
    }

    // linefill.all — all active linefill objects
    get all(): LinefillObject[] {
        return this._linefills.filter((lf) => !lf._deleted);
    }

    /**
     * Remove all drawing objects created at or after the given bar index.
     * Called during streaming rollback to prevent accumulation.
     */
    rollbackFromBar(barIdx: number): void {
        this._linefills = this._linefills.filter((lf) => lf._createdAtBar < barIdx);
        this.syncToPlot();
    }
}
