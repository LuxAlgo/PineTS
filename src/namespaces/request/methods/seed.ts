// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Returns a pseudo-random seed value for use with random number generation.
 * In Pine Script, this is used to get reproducible random sequences.
 *
 * @param context - The execution context
 * @returns A function that generates seed values
 */
/**
 * Helper to unwrap param tuple [value, name] from transpiler
 */
function unwrapParam(param: any): any {
    if (Array.isArray(param) && param.length === 2 && typeof param[1] === 'string') {
        return param[0];
    }
    return param;
}

export function seed(context: any) {
    return (simple_string?: any): number => {
        // Unwrap param tuple from transpiler
        const _simple_string = unwrapParam(simple_string);

        // If a string is provided, use it to generate a deterministic seed
        if (_simple_string) {
            let hash = 0;
            const str = String(_simple_string);
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash);
        }

        // Without a string, use the current bar index and time to create a seed
        const barIndex = context.idx || 0;
        const openTime = context.data?.openTime?.get(0) || Date.now();

        // Combine bar index and time for a unique seed per bar
        return Math.abs((barIndex * 31337) ^ (openTime % 2147483647));
    };
}
