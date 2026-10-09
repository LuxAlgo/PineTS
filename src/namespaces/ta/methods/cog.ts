// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CarryHistory } from '../utils/history';

/**
 * Center of Gravity (COG)
 *
 * The cog (center of gravity) is an indicator based on statistics and the Fibonacci golden ratio.
 *
 * Pine Script Formula:
 * sum = sum(source, length)
 * num = 0.0
 * for i = 0 to length - 1
 *     price = source[i]
 *     num = num + price * (i + 1)
 * cog = -num / sum
 *
 * As in that formula on TradingView, in a local block `sum` is over the last `length` calls (math.sum)
 * and `num` over the last `length` bars, a skipped bar repeating the last call's value (`source[i]`).
 *
 * @param source - Source series (typically close)
 * @param length - Number of bars (lookback period)
 * @returns Center of Gravity value
 */
export function cog(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const sourceSeries = Series.from(source);

        let sum = 0;
        let num = 0;
        if (_callId && length >= 1) {
            if (!context.taState) context.taState = {};
            const bars: CarryHistory = (context.taState[_callId] ??= new CarryHistory(2));
            bars.push(context.idx, sourceSeries.get(0), length, sourceSeries);
            const calls = nonNaWindow(context, `${_callId}_sum`, sourceSeries, length);
            // S and N weighing the newest value `length`: Σ x_i * (i + 1) = (length + 1) * S - N
            const h = bars.h;
            if (!calls || h.size < length || h.nas(length) > 0) return NaN;
            sum = calls.sum;
            num = (length + 1) * h.sum(length) - h.wsum(length);
        } else {
            for (let i = 0; i < length; i++) {
                const value = sourceSeries.get(i);
                if (isNaN(value)) {
                    // Return NaN if we don't have enough data
                    return NaN;
                }
                sum += value;
                num += value * (i + 1);
            }
        }

        // Avoid division by zero
        if (sum === 0) {
            return NaN;
        }

        // Calculate COG
        const cog = -num / sum;

        return context.precision(cog);
    };
}
