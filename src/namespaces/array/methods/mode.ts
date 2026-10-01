// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isNa } from '../utils';

export function mode(context: any) {
    return (id: PineArrayObject) => {
        const counts = new Map();
        let maxFreq = 0;

        for (const val of id.array) {
            if (isNa(val)) continue;
            // We might need to handle precision/epsilon for floats?
            // Pine Script might use exact match for mode.
            const count = (counts.get(val) || 0) + 1;
            counts.set(val, count);
            if (count > maxFreq) {
                maxFreq = count;
            }
        }

        const modes: any[] = [];
        for (const [val, count] of counts) {
            if (count === maxFreq) {
                modes.push(val);
            }
        }

        // Return the smallest value
        // Handle numeric sort vs string sort
        modes.sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            }
            if (typeof a === 'string' && typeof b === 'string') {
                return a < b ? -1 : a > b ? 1 : 0;
            }
            return 0;
        });

        return modes.length ? modes[0] : NaN;
    };
}
