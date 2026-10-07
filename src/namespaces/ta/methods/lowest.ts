// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { RecentExtreme } from '../utils/windows';

export function lowest(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        // if the _length is of type string, this is probably the _callId
        // ==> this is a weak approach to determine syntaxes : ta.lowest(length) vs ta.lowest(source, length)
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length;
            _length = source;
            source = context.data.low;
        }

        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // TradingView resets the window at na: only the bars since the most recent na
        // take part, and an na on the current bar yields na
        // (tests/namespaces/ta/na-window-semantics.test.ts). In a local block the window is the
        // calls of the last `length` bars.
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `lowest_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new RecentExtreme(false);
        const win: RecentExtreme = context.taState[stateKey];
        const bar = win.step(context.idx, series.get(0), length, series);

        if (context.idx < length - 1 || bar < 0) {
            return NaN;
        }
        return context.precision(win.value);
    };
}