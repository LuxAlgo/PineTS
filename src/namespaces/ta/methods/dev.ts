// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CarryHistory } from '../utils/history';

export function dev(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // Mean Absolute Deviation, as TradingView computes it: the mean is ta.sma (the last `length`
        // non-na values; in a local block, of the calls) and the deviations are over the last `length`
        // bars, a bar skipped by a local block repeating the last call's value. An na among those bars
        // gives na.
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `dev_${length}`;
        const bars: CarryHistory = (context.taState[stateKey] ??= new CarryHistory());
        bars.push(context.idx, series.get(0), length, series);
        const sma = nonNaWindow(context, `${stateKey}_mean`, series, length);

        if (!sma || bars.h.size < length) {
            return NaN;
        }

        // The mean moves every bar, so every |x - mean| changes: no running form
        const mean = sma.sum / length;
        const values = bars.h.view(length);
        let sumDeviation = 0;
        for (let i = 0; i < length; i++) {
            sumDeviation += Math.abs(values[length - 1 - i] - mean);
        }

        const dev = sumDeviation / length;
        return context.precision(dev);
    };
}
