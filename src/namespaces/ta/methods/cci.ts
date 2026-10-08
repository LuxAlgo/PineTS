// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';
import { CarryHistory } from '../utils/history';

export function cci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cci_${length}`;
        const bars: CarryHistory = (context.taState[stateKey] ??= new CarryHistory());

        const currentValue = series.get(0);
        bars.push(context.idx, currentValue, length, series);
        const mean = nonNaWindow(context, `${stateKey}_mean`, series, length);

        // Not enough data yet
        if (!mean || bars.h.size < length) {
            return NaN;
        }

        // Calculate SMA (mean)
        const sma = mean.sum / length;

        // Calculate Mean Deviation
        const values = bars.h.view(length);
        let sumAbsoluteDeviations = 0;
        for (let i = 0; i < length; i++) {
            sumAbsoluteDeviations += Math.abs(values[length - 1 - i] - sma);
        }
        const meanDeviation = sumAbsoluteDeviations / length;

        // Avoid division by zero
        if (meanDeviation === 0) {
            return 0;
        }

        // Calculate CCI
        const cci = (currentValue - sma) / (0.015 * meanDeviation);

        return context.precision(cci);
    };
}
