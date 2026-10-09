// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

export function wpr(context: any) {
    return (_length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wpr_${length}`;

        // Get current values from context.data
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Highest high and lowest low of the last `length` values, as ta.highest / ta.lowest (in a local
        // block, of the calls); an na bar leaves the windows as they were
        const na = isNaN(high) || isNaN(low) || isNaN(close);
        const hw = nonNaWindow(context, `${stateKey}_h`, context.data.high, length, 'extremes', na ? NaN : high);
        const lw = nonNaWindow(context, `${stateKey}_l`, context.data.low, length, 'extremes', na ? NaN : low);

        // Not enough data yet
        if (na || !hw || !lw) {
            return NaN;
        }

        const highestHigh = hw.max();
        const lowestLow = lw.min();

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
