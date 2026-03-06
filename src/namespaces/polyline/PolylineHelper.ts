// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { PolylineObject } from './PolylineObject';
import { ChartPointObject } from '../chart/ChartPointObject';
import { NAHelper } from '../Core';

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
                options: { style: 'drawing_polyline', overlay: true },
            };
        }
    }

    private _syncToPlot() {
        this._ensurePlotsEntry();
        // Store ALL polylines as a single array value at the first bar's time.
        // Same aggregation pattern as lines and linefills — prevents sparse array
        // collisions when multiple objects share the same timestamp.
        const time = this.context.marketData[0]?.openTime || 0;
        this.context.plots['__polylines__'].data = [{
            time,
            value: this._polylines,
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

        const isOptionsObj = (v: any) => v && typeof v === 'object' && !Array.isArray(v)
            && ('points' in v || 'curved' in v || 'closed' in v || 'line_color' in v
                || 'fill_color' in v || 'line_style' in v || 'line_width' in v);

        const applyOpts = (opts: any) => {
            curved = opts.curved ?? curved;
            closed = opts.closed ?? closed;
            xloc = opts.xloc ?? xloc;
            line_color = opts.line_color ?? line_color;
            fill_color = opts.fill_color ?? fill_color;
            line_style = opts.line_style ?? line_style;
            line_width = opts.line_width ?? line_width;
            force_overlay = opts.force_overlay ?? force_overlay;
        };

        if (args.length === 1 && isOptionsObj(args[0]) && 'points' in args[0]) {
            // Single options object with all named params including 'points'
            points = args[0].points;
            applyOpts(args[0]);
        } else if (args.length === 2 && args[1] && typeof args[1] === 'object' && !Array.isArray(args[1]) && isOptionsObj(args[1])) {
            // Points as first arg, options object as second
            points = args[0];
            applyOpts(args[1]);
        } else {
            // Positional arguments
            points = args[0];
            curved = args[1] ?? curved;
            closed = args[2] ?? closed;
            xloc = args[3] ?? xloc;
            line_color = args[4] ?? line_color;
            fill_color = args[5] ?? fill_color;
            line_style = args[6] ?? line_style;
            line_width = args[7] ?? line_width;
            force_overlay = args[8] ?? force_overlay;
        }

        const resolvedPoints = this._extractPoints(points);
        const pl = new PolylineObject(
            resolvedPoints,
            this._resolve(curved) ?? false,
            this._resolve(closed) ?? false,
            this._resolve(xloc) || 'bi',
            this._resolve(line_color) || '#2962ff',
            this._resolve(fill_color) || '',
            this._resolve(line_style) || 'style_solid',
            this._resolve(line_width) || 1,
            this._resolve(force_overlay) ?? false,
        );
        pl._createdAtBar = this.context.idx;
        this._polylines.push(pl);
        this._syncToPlot();
        return pl;
    }

    // polyline() direct call — mapped via NAMESPACES_LIKE → polyline.any()
    any(...args: any[]): PolylineObject {
        return this.new(...args);
    }

    // polyline.delete(id) → void
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
        this._syncToPlot();
    }
}
