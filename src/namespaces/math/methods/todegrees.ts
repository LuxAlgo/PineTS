// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Converts an angle in radians to degrees.
 * @param radians - The angle in radians to convert
 * @returns The angle converted to degrees
 *
 * @example
 * math.todegrees(math.pi()) // Returns 180
 * math.todegrees(math.pi() / 2) // Returns 90
 */
export function todegrees(context: any) {
    return (radians: any) => {
        const value = Series.from(radians).get(0);
        if (value === null || value === undefined || Number.isNaN(value)) {
            return NaN;
        }
        return value * (180 / Math.PI);
    };
}
