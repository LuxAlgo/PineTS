// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { ExtremeCall } from '../utils/barRing';

export function highest(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        // if the _length is of type string, this is probably the _callId
        // ==> this is a weak approach to determine syntaxes : ta.highest(length) vs ta.highest(source, length)
        if (typeof _length === 'string' && _callId === undefined) {
            _callId = _length;
            _length = source;
            source = context.data.high;
        }

        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // TradingView resets the window at na: only the bars since the most recent na
        // take part, and an na on the current bar yields na
        // (tests/namespaces/ta/na-window-semantics.test.ts). In a local block, TradingView's own
        // algorithm (ExtremeCall): with a constant length, bars the block skipped are read from slots
        // written earlier; with a varying length, they repeat the last call's value.
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `highest_${length}`;
        if (!context.taState[stateKey]) context.taState[stateKey] = new ExtremeCall(true);
        const win: ExtremeCall = context.taState[stateKey];
        const bar = win.step(context.idx, series.get(0), length, series);

        if (context.idx < length - 1 || bar < 0) {
            return NaN;
        }
        return context.precision(win.value);
    };
}
