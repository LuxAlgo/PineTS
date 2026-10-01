// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

export function stdev(context: any) {
    return (source: any, _length: any, ...rest: any[]) => {
        // The transpiler appends the call id after the optional `biased` argument.
        const _callId: string | undefined = typeof rest[rest.length - 1] === 'string' ? rest.pop() : undefined;
        const length = Series.from(_length).get(0);
        const bias = rest.length === 0 || !!Series.from(rest[0]).get(0);
        const series = Series.from(source);

        // Over the last `length` non-na values (na values are skipped, as on TradingView).
        const window = nonNaWindow(context, _callId || `stdev_${length}_${bias}`, (k) => series.get(k), length);
        if (!window) return NaN;

        const mean = window.sum / length;
        let sumSquaredDiff = 0;
        for (const v of window.values) sumSquaredDiff += Math.pow(v - mean, 2);

        const divisor = bias ? length : length - 1;
        const stdev = Math.sqrt(sumSquaredDiff / divisor);

        return context.precision(stdev);
    };
}
