// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { ChartPoint } from '../Chart';

/**
 * Represents a polyline drawing object in PineTS.
 * Polylines are multi-point lines drawn on the chart.
 */
export class PolylineObject {
    private _id: number;
    private _points: ChartPoint[];
    private _curved: boolean;
    private _closed: boolean;
    private _xloc: string;
    private _line_color: string;
    private _fill_color: string;
    private _line_style: string;
    private _line_width: number;

    private static _nextId = 1;

    constructor(
        private context: any,
        options: {
            points?: ChartPoint[];
            curved?: boolean;
            closed?: boolean;
            xloc?: string;
            line_color?: string;
            fill_color?: string;
            line_style?: string;
            line_width?: number;
        } = {}
    ) {
        this._id = PolylineObject._nextId++;
        this._points = options.points ?? [];
        this._curved = options.curved ?? false;
        this._closed = options.closed ?? false;
        this._xloc = options.xloc ?? 'bar_index';
        this._line_color = options.line_color ?? '#2196F3';
        this._fill_color = options.fill_color ?? '';
        this._line_style = options.line_style ?? 'solid';
        this._line_width = options.line_width ?? 1;
    }

    /**
     * Deletes the polyline (removes from rendering)
     */
    delete(): void {
        (this as any)._deleted = true;
    }

    /**
     * Gets the polyline's properties for rendering
     */
    toJSON(): object {
        return {
            id: this._id,
            points: this._points,
            curved: this._curved,
            closed: this._closed,
            xloc: this._xloc,
            line_color: this._line_color,
            fill_color: this._fill_color,
            line_style: this._line_style,
            line_width: this._line_width,
        };
    }
}
