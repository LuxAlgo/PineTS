// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

export function variance(context: any) {
    return (source: any, _length: any, ...rest: any[]) => {
        // The transpiler appends the call id after the optional `biased` argument.
        const _callId: string | undefined = typeof rest[rest.length - 1] === 'string' ? rest.pop() : undefined;
        const length = Series.from(_length).get(0);
        const biased = rest.length === 0 || !!Series.from(rest[0]).get(0);
        const series = Series.from(source);

        // Over the last `length` non-na values (na values are skipped, as on TradingView).
        const window = nonNaWindow(context, _callId || `variance_${length}_${biased}`, series, length);
        if (!window) return NaN;

        // Summed here rather than with the running sum: `sumSquares / length - mean^2` magnifies drift.
        let sum = 0;
        let sumSquares = 0;
        const values = window.values();
        for (let i = 0; i < length; i++) {
            const v = values[i];
            sum += v;
            sumSquares += v * v;
        }

        const mean = sum / length;
        const biasedVariance = sumSquares / length - mean * mean;
        const variance = biased ? biasedVariance : (biasedVariance * length) / (length - 1);

        return context.precision(variance);
    };
}
