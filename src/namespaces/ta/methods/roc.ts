// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, CallWindow } from '../utils/windows';

export function roc(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // ROC = ((current - previous) / previous) * 100, over the values of the last `length + 1` calls
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `roc_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new CallWindow(true);
        const win: CallWindow = context.taState[stateKey];
        win.begin(context.idx);

        const currentValue = Series.from(source).get(0);
        win.push(context.idx, currentValue, length + 1, BACKFILL_FROM_SOURCE, source);

        if (win.size <= length) {
            return NaN;
        }

        const prevValue = win.at(length);
        const roc = ((currentValue - prevValue) / prevValue) * 100;
        return context.precision(roc);
    };
}
