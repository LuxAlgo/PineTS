// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

// Round half away from zero (TV semantics), unlike JS Math.round which rounds toward +∞.
function roundHalfAwayFromZero(x: number): number {
    if (x !== x) return NaN; // NaN check
    return Math.sign(x) * Math.round(Math.abs(x));
}

export function round(context: any) {
    return (source: any, precision?: any) => {
        const value = Series.from(source).get(0);

        if (precision === undefined || precision === null) {
            // No precision specified - round to nearest integer
            return roundHalfAwayFromZero(value);
        }

        const precisionValue = Series.from(precision).get(0);

        if (precisionValue === 0) {
            return roundHalfAwayFromZero(value);
        }

        // Round to specified decimal places
        const multiplier = Math.pow(10, precisionValue);
        return roundHalfAwayFromZero(value * multiplier) / multiplier;
    };
}

