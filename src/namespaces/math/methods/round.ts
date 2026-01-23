// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function round(context: any) {
    return (source: any, precision?: any) => {
        const value = Series.from(source).get(0);

        if (precision === undefined || precision === null) {
            // No precision specified - round to nearest integer
            return Math.round(value);
        }

        const precisionValue = Series.from(precision).get(0);

        if (precisionValue === 0) {
            return Math.round(value);
        }

        // Round to specified decimal places
        const multiplier = Math.pow(10, precisionValue);
        return Math.round(value * multiplier) / multiplier;
    };
}

