// SPDX-License-Identifier: AGPL-3.0-only

import { ChartPointObject } from './ChartPointObject';

const isSet = (v: any) => v !== undefined && v !== null && !(typeof v === 'number' && isNaN(v));

/**
 * The x coordinate a chart.point gives a drawing. The drawing's xloc picks the field:
 * `xloc.bar_time` reads the point's time and `xloc.bar_index` its index, so
 * `chart.point.now()` (both set) lands at its time on a bar_time line. Without an xloc
 * the index is used, or the time (with xloc.bar_time) when the point has no index.
 */
export function resolvePoint(point: ChartPointObject, xloc?: string): { x: number; xloc: string } {
    if (xloc === 'bt') return { x: isSet(point.time) ? point.time! : NaN, xloc };
    if (xloc === 'bi') return { x: isSet(point.index) ? point.index! : NaN, xloc };
    if (isSet(point.index)) return { x: point.index!, xloc: 'bi' };
    if (isSet(point.time)) return { x: point.time!, xloc: 'bt' };
    return { x: 0, xloc: 'bi' };
}
