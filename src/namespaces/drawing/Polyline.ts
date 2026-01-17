// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { ChartPoint } from '../Chart';
import { PolylineObject } from './PolylineObject';

/**
 * Pine Script polyline namespace implementation.
 * Provides functions for creating and managing polyline drawing objects.
 */
export class Polyline {
    private _polylines: PolylineObject[] = [];

    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Returns an array of all polyline objects on the chart.
     */
    get all(): PolylineObject[] {
        return this._polylines.filter((p: any) => !p._deleted);
    }

    /**
     * Creates a new polyline object.
     */
    new(
        points: ChartPoint[],
        curved?: boolean,
        closed?: boolean,
        xloc?: string,
        line_color?: string,
        fill_color?: string,
        line_style?: string,
        line_width?: number
    ): PolylineObject {
        const polyline = new PolylineObject(this.context, {
            points: points,
            curved: curved !== undefined ? Series.from(curved).get(0) : undefined,
            closed: closed !== undefined ? Series.from(closed).get(0) : undefined,
            xloc: xloc ? Series.from(xloc).get(0) : undefined,
            line_color: line_color ? Series.from(line_color).get(0) : undefined,
            fill_color: fill_color ? Series.from(fill_color).get(0) : undefined,
            line_style: line_style ? Series.from(line_style).get(0) : undefined,
            line_width: line_width ? Series.from(line_width).get(0) : undefined,
        });

        this._polylines.push(polyline);
        return polyline;
    }

    /**
     * Deletes a polyline object.
     */
    delete(id: PolylineObject): void {
        if (id) {
            id.delete();
        }
    }
}
