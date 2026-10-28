// SPDX-License-Identifier: AGPL-3.0-only

import { ChartPointObject } from './ChartPointObject';

const isSet = (v: any) => v !== undefined && v !== null && !(typeof v === 'number' && isNaN(v));

/**
 * The x coordinate a chart.point gives a drawing. The drawing's xloc picks the field:
 * `xloc.bar_time` reads the point's time and `xloc.bar_index` its index, so
 * `chart.point.now()` (both set) lands at its time on a bar_time line. Without an xloc
 * the drawing is on xloc.bar_index: a point without an index has no x (TV: line.new,
 * box.new and label.new from chart.point.from_time points all read na x coordinates).
 */
export function resolvePoint(point: ChartPointObject, xloc?: string): { x: number; xloc: string } {
    if (xloc === 'bt') return { x: isSet(point.time) ? point.time! : NaN, xloc };
    return { x: isSet(point.index) ? point.index! : NaN, xloc: 'bi' };
}
