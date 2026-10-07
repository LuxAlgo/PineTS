// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { BACKFILL_FROM_SOURCE, CallWindow } from '../utils/windows';

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

        // The values of the last `length + 1` calls
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `change_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new CallWindow(true);
        const win: CallWindow = context.taState[stateKey];
        win.begin(context.idx);

        const currentValue = Series.from(source).get(0);
        win.push(context.idx, currentValue, length + 1, BACKFILL_FROM_SOURCE, source);

        if (win.size <= length) {
            return NaN;
        }

        const change = currentValue - win.at(length);
        return context.precision(change);
    };
}
