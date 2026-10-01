// SPDX-License-Identifier: AGPL-3.0-only
// Text of array elements, as TradingView prints them in str.tostring, array.join and str.format.

import { formatFloat, javaDoubleToString } from '../numberFormat';

const isNa = (v: any) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

function elementText(arr: { array: any[]; type: string }, v: any, number: (x: number) => string): string {
    // An na string is the empty string (str.tostring(string(na)) is "").
    if (arr.type === 'string') return isNa(v) ? '' : String(v);
    if (typeof v === 'number') return number(v);
    if (isNa(v)) return 'NaN';
    return String(v);
}

/** Elements as `str.tostring` prints them: `[1.5, 2]`, `[0.3333333333, 100000000]`. */
export function tostringElements(arr: { array: any[]; type: string }): string[] {
    return Array.from(arr.array, (v) => elementText(arr, v, formatFloat));
}

/**
 * Elements as `array.join` and a `str.format` placeholder print them: float arrays use Java's
 * Double.toString (`5.0`, `1.0E8`, `1.0E-7`), int arrays plain integers.
 */
export function joinElements(arr: { array: any[]; type: string }): string[] {
    const float = arr.type === 'float' || (arr.type !== 'int' && arr.array.some((v) => typeof v === 'number' && !Number.isInteger(v) && !Number.isNaN(v)));
    return Array.from(arr.array, (v) =>
        elementText(arr, v, (x) => (Number.isNaN(x) ? 'NaN' : float ? javaDoubleToString(x) : String(x))),
    );
}
