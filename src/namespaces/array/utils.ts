import { PineArrayType } from './PineArrayObject';

// export function precision(value: any, epsilon: number = 1e10): number {
//     return typeof value === 'number' ? Math.round(value * epsilon) / epsilon : value;
// }

export function inferArrayType(values: any[]): PineArrayType {
    if (values.every((value) => typeof value === 'number')) {
        if (values.every((value) => (value | 0) === value)) {
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
        if ((value | 0) === value) {
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
            return array.every((value) => typeof value === 'number' && (value | 0) === value);
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
    // Untyped arrays (e.g. array.new<chart.point>()) accept any value
    if (type === PineArrayType.any) return true;
    switch (type) {
        case PineArrayType.int:
            return typeof value === 'number' && ((value | 0) === value || isNaN(value));
        case PineArrayType.float:
            return typeof value === 'number';
        case PineArrayType.string:
            return typeof value === 'string';
        case PineArrayType.bool:
            return typeof value === 'boolean';
    }
    return false;
}
