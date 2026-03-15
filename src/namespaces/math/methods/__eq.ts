// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function __eq(context: any) {
    return (a: any, b: any) => {
        // Unwrap Series
        const valA = Series.from(a).get(0);
        const valB = Series.from(b).get(0);

        if (typeof valA === 'number' && typeof valB === 'number') {
            // Pine Script follows IEEE 754: NaN is never equal to anything, including itself
            if (isNaN(valA) || isNaN(valB)) return false;

            return Math.abs(valA - valB) < 1e-9;
        }

        return valA === valB;
    };
}
