// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

// Pine rounds halves away from zero; JS Math.round rounds halves toward +Infinity.
const roundHalfAwayFromZero = (x: number): number => (Number.isNaN(x) ? NaN : Math.sign(x) * Math.round(Math.abs(x)));

/**
 * TradingView rounds to `2 * precision` decimals first, then to `precision`
 * (math.round(1.00499, 2) = 1.01, math.round(1.0049, 2) = 1). The second step
 * divides the integer from the first so it is exact (1.005 * 100 = 100.49999999999999).
 */
export function round(context: any) {
    return (source: any, precision?: any) => {
        const value = Series.from(source).get(0);
        const digits = precision === undefined || precision === null ? 0 : Series.from(precision).get(0);
        if (!digits) return roundHalfAwayFromZero(value);
        const scale = 10 ** digits;
        const fine = Math.abs(value) * scale * scale;
        if (!Number.isFinite(fine) || fine >= Number.MAX_SAFE_INTEGER) return roundHalfAwayFromZero(value * scale) / scale;
        return (Math.sign(value) * Math.round(Math.round(fine) / scale)) / scale;
    };
}
