// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Custom JSON serializer/deserializer that preserves NaN, Infinity, and -Infinity values
 * These values are not supported by standard JSON, so we serialize them as special strings
 */

export const NaN_TOKEN = '__NaN__';
export const INFINITY_TOKEN = '__Infinity__';
export const NEG_INFINITY_TOKEN = '__-Infinity__';
export const UNDEFINED_TOKEN = '__undefined__';

/**
 * Serialize a value to JSON, preserving NaN, Infinity, -Infinity, and undefined
 */
export function serialize(value: any): string {
    return JSON.stringify(
        value,
        (key, val) => {
            if (typeof val === 'number') {
                if (isNaN(val)) return NaN_TOKEN;
                if (val === Infinity) return INFINITY_TOKEN;
                if (val === -Infinity) return NEG_INFINITY_TOKEN;
            }
            if (val === undefined) return UNDEFINED_TOKEN;
            return val;
        },
        2,
    );
}

/**
 * Deserialize JSON back to original values, restoring NaN, Infinity, -Infinity, and undefined
 */
export function deserialize(json: string): any {
    return JSON.parse(json, (key, val) => {
        if (val === NaN_TOKEN) return NaN;
        if (val === INFINITY_TOKEN) return Infinity;
        if (val === NEG_INFINITY_TOKEN) return -Infinity;
        if (val === UNDEFINED_TOKEN) return undefined;
        return val;
    });
}

/**
 * Check if two values are equal, handling NaN, Infinity, and -Infinity correctly
 */
export function deepEqual(a: any, b: any, epsilon: number = 1e-9): boolean {
    // Handle NaN
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
        return true;
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    // Handle objects
    if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
    }

    //handle floats
    if (typeof a === 'number' && typeof b === 'number' && (!Number.isInteger(a) || !Number.isInteger(b))) {
        return Math.abs(a - b) <= epsilon;
    }

    // Handle primitives
    return a === b;
}

export interface DeepDiff {
    path: string;
    expected: any;
    actual: any;
}

/**
 * Collect all differences between two values using the same logic as deepEqual.
 * Returns an empty array when the values are equal.
 */
export function deepDiff(a: any, b: any, epsilon: number = 1e-9, path: string = ''): DeepDiff[] {
    // Handle NaN
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
        return [];
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        const diffs: DeepDiff[] = [];
        const maxLen = Math.max(a.length, b.length);
        if (a.length !== b.length) {
            diffs.push({ path: path + '.length', expected: a.length, actual: b.length });
        }
        for (let i = 0; i < maxLen; i++) {
            const itemPath = path + '[' + i + ']';
            if (i >= a.length) {
                diffs.push({ path: itemPath, expected: undefined, actual: b[i] });
            } else if (i >= b.length) {
                diffs.push({ path: itemPath, expected: a[i], actual: undefined });
            } else {
                diffs.push(...deepDiff(a[i], b[i], epsilon, itemPath));
            }
        }
        return diffs;
    }

    // Handle objects
    if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
        const diffs: DeepDiff[] = [];
        const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const key of allKeys) {
            const keyPath = path ? path + '.' + key : key;
            if (!(key in a)) {
                diffs.push({ path: keyPath, expected: undefined, actual: b[key] });
            } else if (!(key in b)) {
                diffs.push({ path: keyPath, expected: a[key], actual: undefined });
            } else {
                diffs.push(...deepDiff(a[key], b[key], epsilon, keyPath));
            }
        }
        return diffs;
    }

    // Handle floats
    if (typeof a === 'number' && typeof b === 'number' && (!Number.isInteger(a) || !Number.isInteger(b))) {
        if (Math.abs(a - b) <= epsilon) return [];
        return [{ path, expected: a, actual: b }];
    }

    // Handle primitives
    if (a === b) return [];
    return [{ path, expected: a, actual: b }];
}
