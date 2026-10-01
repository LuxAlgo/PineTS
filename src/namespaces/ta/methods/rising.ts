// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { consecutiveMoves } from '../utils/naAware';

/**
 * Rising Detection
 *
 * Tests if the source series is now rising for length bars long.
 * Returns true if the series has been consecutively rising for length bars.
 *
 * Formula:
 * For length=2: source[0] > source[1] AND source[1] > source[2]
 * For length=n: source[i] > source[i+1] for all i from 0 to n-1
 *
 * @param source - Series of values to process
 * @param length - Number of bars to check (lookback period)
 * @returns true if consecutively rising for length bars, false otherwise
 */
export function rising(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const series = Series.from(source);

        // Consecutive moves as TradingView counts them: a pair touching an na value neither
        // extends nor breaks the run.
        return consecutiveMoves(context, _callId, series, length, true);
    };
}

