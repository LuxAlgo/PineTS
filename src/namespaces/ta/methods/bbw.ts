// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

export function bbw(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bbw_${length}_${mult}`;
        const currentValue = Series.from(source).get(0);
        // An na value leaves the window as it was
        const win = nonNaWindow(context, stateKey, Series.from(source), length);
        if (isNaN(currentValue) || !win) {
            return NaN;
        }
        const basis = win.sum / length;

        // Standard deviation summed over the window (a running sum of squares would cancel)
        const values = win.values();
        let sumSqDiff = 0;
        for (let i = 0; i < length; i++) {
            const diff = values[i] - basis;
            sumSqDiff += diff * diff;
        }
        const variance = sumSqDiff / length;
        const stdev = Math.sqrt(variance);

        const dev = mult * stdev;

        if (basis === 0) {
            return context.precision(0);
        }

        const bbw = ((2 * dev) / basis) * 100;
        return context.precision(bbw);
    };
}
