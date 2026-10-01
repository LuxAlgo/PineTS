import { PineArrayType } from './PineArrayObject';
import { PineTypeObject } from '../PineTypeObject';
import { resolveColorToRgba, rgbaToHex8 } from '../color/PineColor';
import { order } from '../Types';
import { PineRuntimeError } from '../../errors/PineRuntimeError';

export function isNa(value: any): boolean {
    return value === undefined || value === null || (typeof value === 'number' && isNaN(value));
}

const COLOR_LITERAL = /^(#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?|rgba?\(.*\))$/;

/** A color literal (`#RRGGBB`, `#RRGGBBAA`, `rgb()`, `rgba()`) in its canonical `#RRGGBBAA` form, or null. */
export function colorKey(value: any): string | null {
    if (typeof value !== 'string' || !COLOR_LITERAL.test(value)) return null;
    const rgba = resolveColorToRgba(value);
    return rgba ? rgbaToHex8(rgba[0], rgba[1], rgba[2], rgba[3]) : null;
}

/**
 * Equality of two non-na elements: numbers are equal within an absolute 1e-10, and the same color written in
 * two forms (`color.red`, `color.new(color.red, 0)`, `color.rgb(242, 54, 69)`) is one value.
 */
export function pineValuesEqual(a: any, b: any): boolean {
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-10;
    if (a === b) return true;
    if (typeof a === 'string' && typeof b === 'string') {
        const ka = colorKey(a);
        return ka !== null && ka === colorKey(b);
    }
    return false;
}

/**
 * Element test of `array.includes` / `indexof` / `lastindexof` for `value`. How na compares depends on the
 * element type on TradingView: a numeric na matches nothing, an na string is the empty string, and an na
 * color matches an na color up to Pine v5 only.
 */
export function elementMatcher(id: { type: PineArrayType; context: any }, value: any): (v: any) => boolean {
    if (id.type === PineArrayType.string) {
        const needle = isNa(value) ? '' : value;
        return (v) => pineValuesEqual(isNa(v) ? '' : v, needle);
    }
    if (isNa(value)) {
        const naMatchesNa = id.type === PineArrayType.color && !(id.context?.pineVersion >= 6);
        return naMatchesNa ? isNa : () => false;
    }
    return (v) => !isNa(v) && pineValuesEqual(v, value);
}

/**
 * Reader for the value an element is sorted / searched by. Elements of a user-defined type are read through
 * `sortField`: a field name, or a field index in declaration order; the default is the first field.
 */
export function sortValueReader(values: ArrayLike<any>, sortField?: string | number): ((v: any) => any) | null {
    let sample: any;
    for (let i = 0; i < values.length; i++) {
        if (values[i] instanceof PineTypeObject) {
            sample = values[i];
            break;
        }
    }
    if (!sample) return null;
    let field: string;
    if (typeof sortField === 'string') {
        field = sortField;
    } else {
        const keys: string[] = sample._udt?._definitionKeys ?? Object.keys(sample.__def__);
        field = keys[sortField ?? 0];
    }
    return (v) => (v instanceof PineTypeObject ? v[field] : NaN);
}

/** Ascending comparison of sort keys: numbers with na last, strings in ordinal order with na first. */
export function compareAscending(a: any, b: any, strings: boolean): number {
    const naA = isNa(a);
    const naB = isNa(b);
    if (naA || naB) {
        if (naA && naB) return 0;
        return (naA ? 1 : -1) * (strings ? -1 : 1);
    }
    if (strings) return a < b ? -1 : a > b ? 1 : 0;
    return a - b;
}

/**
 * Indices of `keys` in sort order. TradingView sorts ascending (stable) and reverses the result for
 * `order.descending`, so equal keys also come out reversed.
 */
export function sortedIndices(keys: any[], _order: any = order.ascending): number[] {
    const strings = keys.some((k) => typeof k === 'string');
    const indices = keys.map((_, i) => i);
    indices.sort((i, j) => compareAscending(keys[i], keys[j], strings) || i - j);
    if (_order !== order.ascending) indices.reverse();
    return indices;
}

/** `values` sorted in place like {@link sortedIndices}, for plain values where equal elements are interchangeable. */
export function sortPlainValues(values: any[], _order: any = order.ascending): any[] {
    const strings = values.some((v) => typeof v === 'string');
    values.sort((a, b) => compareAscending(a, b, strings));
    if (_order !== order.ascending) values.reverse();
    return values;
}

/** Throws TradingView's out-of-bounds runtime error. */
export function outOfBounds(index: number, size: number, method: string): never {
    throw new PineRuntimeError(`Index ${index} is out of bounds, array size is ${size}.`, method);
}

/** Throws TradingView's runtime error for `first()` / `last()` / `pop()` / `shift()` on an empty array. */
export function emptyArray(fn: string): never {
    throw new PineRuntimeError(`Cannot call \`${fn}()\` if array is empty.`, `array.${fn}`);
}

/** Throws TradingView's runtime error for a percentile outside [0..100]. */
export function checkPercentage(percentage: number, method: string) {
    if (percentage < 0 || percentage > 100) {
        throw new PineRuntimeError(
            `Invalid value of the 'percentage' argument (${percentage}) in the '${method}' function. It must be in the range [0..100].`,
            method
        );
    }
}

// export function precision(value: any, epsilon: number = 1e10): number {
//     return typeof value === 'number' ? Math.round(value * epsilon) / epsilon : value;
// }

export function inferArrayType(values: any[]): PineArrayType {
    if (values.every((value) => typeof value === 'number')) {
        if (values.every((value) => Number.isInteger(value))) {
            return PineArrayType.int;
        } else {
            return PineArrayType.float;
        }
    } else if (values.every((value) => typeof value === 'string')) {
        return PineArrayType.string;
    } else if (values.every((value) => typeof value === 'boolean')) {
        return PineArrayType.bool;
    } else {
        //throw new Error('Cannot infer type from values');
        return PineArrayType.any;
    }
}

export function inferValueType(value: any): PineArrayType {
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return PineArrayType.int;
        } else {
            return PineArrayType.float;
        }
    } else if (typeof value === 'string') {
        return PineArrayType.string;
    } else if (typeof value === 'boolean') {
        return PineArrayType.bool;
    } else {
        // Objects (LineObject, LabelObject, BoxObject, etc.) get 'any' type
        return PineArrayType.any;
    }
}

export function isArrayOfType(array: any[], type: PineArrayType) {
    switch (type) {
        case PineArrayType.int:
            return array.every((value) => Number.isInteger(value));
        case PineArrayType.float:
            return array.every((value) => typeof value === 'number' && !isNaN(value));
        case PineArrayType.string:
            return array.every((value) => typeof value === 'string');
        case PineArrayType.bool:
            return array.every((value) => typeof value === 'boolean');
    }

    return false;
}

export function isValueOfType(value: any, type: PineArrayType) {
    // na (NaN or undefined) is compatible with all types in Pine Script.
    // Some namespace functions (e.g. color.from_gradient historically) may
    // represent an na value as undefined, so treat it exactly like NaN.
    if (value === undefined) return true;
    if (typeof value === 'number' && isNaN(value)) return true;
    // Untyped arrays (e.g. array.new<chart.point>()) accept any value
    if (type === PineArrayType.any) return true;
    switch (type) {
        case PineArrayType.int:
            return Number.isInteger(value) || isNaN(value);
        case PineArrayType.float:
            return typeof value === 'number';
        case PineArrayType.string:
            return typeof value === 'string';
        case PineArrayType.bool:
            return typeof value === 'boolean';
        // Drawing object types accept any object (or null for na)
        case PineArrayType.box:
        case PineArrayType.label:
        case PineArrayType.line:
        case PineArrayType.linefill:
        case PineArrayType.table:
        case PineArrayType.color:
            return value === null || typeof value === 'object' || typeof value === 'string';
    }
    return false;
}
