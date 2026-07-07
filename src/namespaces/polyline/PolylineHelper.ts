// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { PolylineObject } from './PolylineObject';
import { ChartPointObject } from '../chart/ChartPointObject';
import { NAHelper } from '../Core';
import { silentInSecondary } from '../silentInSecondary';

export class PolylineHelper {
    private _polylines: PolylineObject[] = [];

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _ensurePlotsEntry() {
        if (!this.context.plots['__polylines__']) {
            this.context.plots['__polylines__'] = {
                title: '__polylines__',
                data: [],
                options: { style: 'drawing_polyline', overlay: this.context.indicator?.overlay || false },
            };
        }
    }

    public syncToPlot() {
        this._ensurePlotsEntry();
        // Store ALL polylines as a single array value at the first bar's time.
        // Same aggregation pattern as lines and linefills — prevents sparse array
        // collisions when multiple objects share the same timestamp.
        const time = this.context.marketData[0]?.openTime || 0;
        // Compact out deleted polylines — bounded array (RC3), transparent output;
        // rollbackFromBar filters by _createdAtBar, orthogonal to _deleted.
        this._polylines = this._polylines.filter(pl => !pl._deleted);
        this.context.plots['__polylines__'].data = [{
            time,
            value: this._polylines.map(pl => pl.toPlotData()),
            options: { style: 'drawing_polyline' },
        }];
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

    /**
     * Resolve a color value, preserving na markers (NaN from `na`, null from
     * `color(na)`) so renderers can detect "no color" instead of forcing a
     * default via the `||` operator.
     */
    private _resolveColor(val: any, fallback: string): any {
        const resolved = this._resolve(val);
        if (resolved === null || resolved === undefined) return resolved;
        if (typeof resolved === 'number' && isNaN(resolved)) return NaN;
        return resolved || fallback;
    }

    /**
     * Extract raw ChartPointObject array from a PineArrayObject, Series, or plain array.
     */
    private _extractPoints(points: any): ChartPointObject[] {
        // First resolve Series wrappers (e.g. $.var.glb1_pivotPoints)
        let resolved = this._resolve(points);
        // PineArrayObject wraps a raw .array property
        const raw = resolved && resolved.array ? resolved.array : resolved;
        if (!Array.isArray(raw)) return [];
        return raw.filter((p: any) => p instanceof ChartPointObject);
    }

    // polyline.new(points, curved?, closed?, xloc?, line_color?, fill_color?, line_style?, line_width?, force_overlay?)
    // The transpiler may pass named args as:
    //   1. A single options object: polyline.new({points: pts, curved: true, ...})
    //   2. Points + options object: polyline.new(pts, {curved: true, ...})
    //   3. Positional arguments: polyline.new(pts, true, false, ...)
    @silentInSecondary
    new(...args: any[]): PolylineObject {
        let points: any;
        let curved: any = false;
        let closed: any = false;
        let xloc: any = 'bi';
        let line_color: any = '#2962ff';
        let fill_color: any = '';
        let line_style: any = 'style_solid';
        let line_width: any = 1;
        let force_overlay: any = false;

        const hasOwn = (obj: any, key: string) =>
            Object.prototype.hasOwnProperty.call(obj, key);

        const applyOpts = (opts: any) => {
            if (hasOwn(opts, 'curved')) curved = opts.curved;
            if (hasOwn(opts, 'closed')) closed = opts.closed;
            if (hasOwn(opts, 'xloc')) xloc = opts.xloc;
            if (hasOwn(opts, 'line_color')) line_color = opts.line_color;
            if (hasOwn(opts, 'fill_color')) fill_color = opts.fill_color;
            if (hasOwn(opts, 'line_style')) line_style = opts.line_style;
            if (hasOwn(opts, 'line_width')) line_width = opts.line_width;
            if (hasOwn(opts, 'force_overlay')) force_overlay = opts.force_overlay;
        };

        // Detect trailing named-options object.
        // The transpiler places named arguments as a plain object at the end:
        //   polyline.new(pts, false, true, { line_color: '#00E676' })
        // Must distinguish from Series, ChartPointObject, PineArrayObject, etc.
        const lastArg = args.length >= 1 ? args[args.length - 1] : null;
        const isTrailingOpts = args.length >= 2
            && lastArg && typeof lastArg === 'object'
            && !Array.isArray(lastArg)
            && !(lastArg instanceof Series)
            && !(lastArg instanceof ChartPointObject);

        if (args.length === 1 && lastArg && typeof lastArg === 'object'
            && !Array.isArray(lastArg) && 'points' in lastArg) {
            // Single options object with all named params including 'points'
            points = lastArg.points;
            applyOpts(lastArg);
        } else {
            // Split into positional args + optional trailing options object
            const positional = isTrailingOpts ? args.slice(0, -1) : args;

            points = positional[0];
            if (positional.length > 1) curved = positional[1];
            if (positional.length > 2) closed = positional[2];
            if (positional.length > 3) xloc = positional[3];
            if (positional.length > 4) line_color = positional[4];
            if (positional.length > 5) fill_color = positional[5];
            if (positional.length > 6) line_style = positional[6];
            if (positional.length > 7) line_width = positional[7];
            if (positional.length > 8) force_overlay = positional[8];

            // Named opts override positional args
            if (isTrailingOpts) {
                applyOpts(lastArg);
            }
        }

        const resolvedPoints = this._extractPoints(points);
        const pl = new PolylineObject(
            resolvedPoints,
            this._resolve(curved) ?? false,
            this._resolve(closed) ?? false,
            this._resolve(xloc) || 'bi',
            this._resolveColor(line_color, '#2962ff'),
            this._resolveColor(fill_color, ''),
            this._resolve(line_style) || 'style_solid',
            this._resolve(line_width) || 1,
            this._resolve(force_overlay) ?? false,
        );
        pl._createdAtBar = this.context.idx;
        this._polylines.push(pl);
        this._enforceMaxCount();
        return pl;
    }

    private _enforceMaxCount(): void {
        const maxCount = this.context.indicator?.max_polylines_count ?? 50;
        const active = this._polylines.filter(p => !p._deleted);
        if (active.length > maxCount) {
            const toRemove = active.length - maxCount;
            let removed = 0;
            for (const p of this._polylines) {
                if (removed >= toRemove) break;
                if (!p._deleted) {
                    p._deleted = true;
                    removed++;
                }
            }
        }
    }

    // polyline() direct call — mapped via NAMESPACES_LIKE → polyline.any()
    // Pine `polyline(arg)` is a type cast / typed-na, NOT a constructor.
    any(...args: any[]): PolylineObject | null {
        if (args.length === 1) {
            const arg = args[0];
            if (arg === null || arg === undefined) return null;
            if (arg instanceof NAHelper) return null;
            if (typeof arg === 'number' && isNaN(arg)) return null;
            if (arg instanceof PolylineObject) return arg;
            if (arg instanceof Series) {
                const v = arg.get(0);
                if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return null;
                if (v instanceof PolylineObject) return v;
            }
            return null;
        }
        return this.new(...args);
    }

    // polyline.delete(id) → void
    @silentInSecondary
    delete(id: PolylineObject): void {
        if (id) id._deleted = true;
    }

    // polyline.all — all active polyline objects
    get all(): PolylineObject[] {
        return this._polylines.filter((pl) => !pl._deleted);
    }

    /**
     * Remove all drawing objects created at or after the given bar index.
     * Called during streaming rollback to prevent accumulation.
     */
    rollbackFromBar(barIdx: number): void {
        this._polylines = this._polylines.filter((pl) => pl._createdAtBar < barIdx);
        this.syncToPlot();
    }
}
