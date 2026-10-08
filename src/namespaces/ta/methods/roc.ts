// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from '../utils/history';

export function roc(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // ROC = ((current - previous) / previous) * 100, previous `length` bars back (in a local block,
        // a skipped bar repeating the last call's value)
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `roc_${length}`;
        const carry: CarryHistory = (context.taState[stateKey] ??= new CarryHistory());
        const series = Series.from(source);
        const currentValue = series.get(0);
        carry.push(context.idx, currentValue, length, series);

        if (!(length >= 0) || carry.h.size <= length) {
            return NaN;
        }

        const prevValue = carry.h.at(length);
        const roc = ((currentValue - prevValue) / prevValue) * 100;
        return context.precision(roc);
    };
}
