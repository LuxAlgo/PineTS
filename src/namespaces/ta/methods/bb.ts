// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { chargeTaWork } from '../utils/assertTaLength';

export function bb(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bb_${length}_${mult}`;
        // An na value leaves the window as it was, and the bands are those of that window (as ta.sma /
        // ta.stdev on the na bar)
        const win = nonNaWindow(context, stateKey, Series.from(source), length);
        if (!win) {
            return [[NaN, NaN, NaN]];
        }
        const middle = win.sum / length;

        // Standard deviation summed over the window (a running sum of squares would cancel)
        const values = win.values();
        chargeTaWork(context, length, 'ta.bb');
        let sumSquaredDiff = 0;
        for (let i = 0; i < length; i++) {
            sumSquaredDiff += Math.pow(values[i] - middle, 2);
        }
        const stdev = Math.sqrt(sumSquaredDiff / length);

        // Calculate upper and lower bands
        const upper = middle + mult * stdev;
        const lower = middle - mult * stdev;

        // Return as tuple with double brackets
        return [[context.precision(middle), context.precision(upper), context.precision(lower)]];
    };
}
