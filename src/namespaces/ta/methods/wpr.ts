// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CarryHistory, ExtremeTail } from '../utils/history';

class WprState {
    highs = new CarryHistory(0, undefined, false);
    lows = new CarryHistory(0, undefined, false);
    hi = new ExtremeTail(true);
    lo = new ExtremeTail(false);
}

export function wpr(context: any) {
    return (_length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wpr_${length}`;
        const state: WprState = (context.taState[stateKey] ??= new WprState());

        // Get current values from context.data
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // An na bar leaves the windows as they were
        const na = isNaN(high) || isNaN(low) || isNaN(close);
        if (na) {
            state.highs.visit(context.idx, length);
            state.lows.visit(context.idx, length);
        } else {
            state.highs.push(context.idx, high, length);
            state.lows.push(context.idx, low, length);
        }
        const hh = state.highs.h;
        const lh = state.lows.h;
        if (state.highs.newBar) {
            state.hi.commit(hh);
            state.lo.commit(lh);
        } else {
            state.hi.rollback();
            state.lo.rollback();
        }
        state.hi.sync(hh);
        state.lo.sync(lh);

        // Not enough data yet
        if (na || !(length >= 1) || hh.size < length) {
            return NaN;
        }

        // Highest high and lowest low of the last `length` values (the windows hold no na)
        const highestHigh = hh.get(state.hi.find(hh, length));
        const lowestLow = lh.get(state.lo.find(lh, length));

        // Calculate Williams %R
        const range = highestHigh - lowestLow;

        if (range === 0) {
            return context.precision(0); // Avoid division by zero
        }

        // Williams %R formula: (Highest High - Close) / (Highest High - Lowest Low) * -100
        const wpr = ((highestHigh - close) / range) * -100;

        return context.precision(wpr);
    };
}
