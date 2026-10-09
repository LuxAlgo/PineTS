// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

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

        // As on TradingView (since 2026-10-09): the last `length` non-na values, the calls' values in a
        // local block (an na value is skipped, as by ta.sma); `length` may change from call to call.
        const win = nonNaWindow(context, _callId || `highest_${length}`, series, length, 'extremes');
        return win ? context.precision(win.max()) : NaN;
    };
}
