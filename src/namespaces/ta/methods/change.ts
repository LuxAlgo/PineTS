// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory } from '../utils/history';

export function change(context: any) {
    return (source: any, _length: any = 1, _callId?: string) => {
        //handle the case where ta.change is called with the source only,
        // in that case the transpiler will inject the callId as a second parameter
        // so we need to extract the callId and set the length to 1
        if (typeof _length === 'string') {
            _callId = _length;
            _length = 1;
        }
        const length = Series.from(_length).get(0);

        // The value `length` bars back (in a local block, a skipped bar repeating the last call's value)
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `change_${length}`;
        const carry: CarryHistory = (context.taState[stateKey] ??= new CarryHistory());
        const series = Series.from(source);
        const currentValue = series.get(0);
        carry.push(context.idx, currentValue, length, series);

        if (!(length >= 0) || carry.h.size <= length) {
            return NaN;
        }

        const change = currentValue - carry.h.at(length);
        return context.precision(change);
    };
}
