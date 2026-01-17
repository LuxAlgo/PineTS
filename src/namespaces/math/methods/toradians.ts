// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Converts an angle in degrees to radians.
 * @param degrees - The angle in degrees to convert
 * @returns The angle converted to radians
 *
 * @example
 * math.toradians(180) // Returns math.pi()
 * math.toradians(90) // Returns math.pi() / 2
 */
export function toradians(context: any) {
    return (degrees: any) => {
        const value = Series.from(degrees).get(0);
        if (value === null || value === undefined || Number.isNaN(value)) {
            return NaN;
        }
        return value * (Math.PI / 180);
    };
}
