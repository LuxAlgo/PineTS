// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { assertTaLength } from './utils/assertTaLength';

// Argument positions are the Pine API lengths, not every numeric TA parameter (e.g. ALMA's sigma,
// BB's multiplier and SAR's factors are deliberately absent). Keep this table next to the wrapper
// installed by the generated namespace index.
const LENGTH_ARGS: Record<string, readonly number[]> = {
    alma: [1], atr: [0], bb: [1], bbw: [1], cci: [1], change: [1], cmo: [1], cog: [1],
    correlation: [2], dev: [1], dmi: [0, 1], ema: [1], falling: [1], highest: [1],
    highestbars: [1], hma: [1], kc: [1], kcw: [1], linreg: [1], lowest: [1],
    lowestbars: [1], macd: [1, 2, 3], median: [1], mfi: [1], mode: [1], mom: [1],
    percentile_linear_interpolation: [1], percentile_nearest_rank: [1], percentrank: [1],
    range: [1], rci: [1], rising: [1], rma: [1], roc: [1], rsi: [1], sma: [1],
    stdev: [1], stoch: [3], supertrend: [1], tsi: [1, 2], variance: [1], vwma: [1],
    wma: [1], wpr: [0],
};

const ALLOW_ZERO = new Set(['change', 'mom', 'roc', 'pivothigh', 'pivotlow']);
const OPTIONAL_SOURCE = new Set(['highest', 'highestbars', 'lowest', 'lowestbars']);

function checkLength(value: unknown, method: string, allowZero: boolean): void {
    const length = Series.from(value).get(0);
    if (allowZero && length === 0) return;
    assertTaLength(length, method);
}

/** Reject unsafe lengths before any TA method can create state or enter a native loop. */
export function wrapTaLengthPolicy<T extends (...args: any[]) => any>(name: string, method: T): T {
    const ordinary = LENGTH_ARGS[name];
    if (!ordinary && name !== 'pivothigh' && name !== 'pivotlow') return method;
    return ((...args: Parameters<T>): ReturnType<T> => {
        const label = `ta.${name}`;
        if (name === 'pivothigh' || name === 'pivotlow') {
            // The source argument is optional; the transpiler then places its call ID in slot 2.
            const indices = args.length === 2 || typeof args[2] === 'string' ? [0, 1] : [1, 2];
            // Pivot strengths are truncated by the method, so validate the same effective
            // integers here before any state or native work is started.
            const left = Math.trunc(Series.from(args[indices[0]]).get(0));
            const right = Math.trunc(Series.from(args[indices[1]]).get(0));
            if (left !== 0) assertTaLength(left, label);
            if (right !== 0) assertTaLength(right, label);
            assertTaLength(left + right + 1, label);
        } else if (OPTIONAL_SOURCE.has(name) && (args.length === 1 || typeof args[1] === 'string')) {
            checkLength(args[0], label, false);
        } else if (name === 'change' && (args[1] === undefined || typeof args[1] === 'string')) {
            // ta.change(source) defaults to one bar; a generated call ID can occupy slot 1.
        } else {
            for (const i of ordinary!) checkLength(args[i], label, ALLOW_ZERO.has(name));
        }
        return method(...args);
    }) as T;
}
