// SPDX-License-Identifier: AGPL-3.0-only
// Text of array elements, as TradingView prints them in str.tostring, array.join and str.format.

import { formatFloat, javaDoubleToString } from '../numberFormat';
import { assertStringLength, MAX_STRING_CODE_UNITS } from '../limits';
import { PineRuntimeError } from '../../errors/PineRuntimeError';
import { PineArrayObject } from './PineArrayObject';

const MAX_NESTED_ARRAY_DEPTH = 256;

const isNa = (v: any) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

function elementText(arr: { array: any[]; type: string }, v: any, number: (x: number) => string): string {
    // An na string is the empty string (str.tostring(string(na)) is "").
    if (arr.type === 'string') return isNa(v) ? '' : String(v);
    if (typeof v === 'number') return number(v);
    if (isNa(v)) return 'NaN';
    return String(v);
}

/**
 * Render a Pine array without creating an unbounded intermediate element list or joined string.
 * `join` uses Java-style float text; `tostring` uses Pine's ordinary array text. Nested arrays
 * retain the latter style, just as their existing `toString()` implementation does.
 */
export function boundedArrayText(
    arr: PineArrayObject,
    style: 'join' | 'tostring',
    maxLength: number,
    method: string,
    charge?: (work: number, bytes: number) => void,
    ancestors: Set<PineArrayObject> = new Set(),
): string {
    return renderArrayText(arr, style, ', ', true, maxLength, method, charge, ancestors);
}

/** The same bounded conversion for `array.join`, with its caller-supplied separator. */
export function boundedArrayJoin(
    arr: PineArrayObject,
    separator: string,
    maxLength: number,
    method: string,
    charge?: (work: number, bytes: number) => void,
): string {
    const delimiter = String(separator);
    assertStringLength(delimiter.length, method);
    return renderArrayText(arr, 'join', delimiter, false, maxLength, method, charge, new Set());
}

function renderArrayText(
    arr: PineArrayObject,
    style: 'join' | 'tostring',
    separator: string,
    wrap: boolean,
    maxLength: number,
    method: string,
    charge: ((work: number, bytes: number) => void) | undefined,
    ancestors: Set<PineArrayObject>,
): string {
    if (ancestors.has(arr)) throw new PineRuntimeError('Cannot format a cyclic array.', method);
    if (ancestors.size >= MAX_NESTED_ARRAY_DEPTH) {
        throw new PineRuntimeError('Array formatting nesting limit exceeded.', method, 'RESOURCE_LIMIT');
    }
    ancestors.add(arr);
    try {
        const values = arr.array;
        // The refs and separators are charged before any element list is populated.
        let length = (wrap ? 2 : 0) + Math.max(0, values.length - 1) * separator.length;
        assertBoundedLength(length, maxLength, method);
        charge?.(values.length, values.length * 8 + length * 2);

        const float = style === 'join' &&
            (arr.type === 'float' || (arr.type !== 'int' && values.some((v) => typeof v === 'number' && !Number.isInteger(v) && !Number.isNaN(v))));
        const elements: string[] = [];
        for (const value of values) {
            const element = value instanceof PineArrayObject
                ? renderArrayText(value, 'tostring', ', ', true, maxLength - length, method, charge, ancestors)
                : elementText(arr, value, style === 'tostring'
                    ? formatFloat
                    : (x) => (Number.isNaN(x) ? 'NaN' : float ? javaDoubleToString(x) : String(x)));
            length += element.length;
            assertBoundedLength(length, maxLength, method);
            charge?.(element.length + 1, element.length * 2);
            elements.push(element);
        }
        const body = elements.join(separator);
        return wrap ? '[' + body + ']' : body;
    } finally {
        ancestors.delete(arr);
    }
}

function assertBoundedLength(length: number, maxLength: number, method: string): void {
    assertStringLength(length, method);
    if (length > maxLength) {
        throw new PineRuntimeError(`The requested string exceeds the ${MAX_STRING_CODE_UNITS} character limit.`, method);
    }
}
