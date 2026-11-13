import { PineTypeObject } from './PineTypeObject';
import { PineArrayObject } from './array/PineArrayObject';
import { PineMapObject } from './map/PineMapObject';
import { PineMatrixObject } from './matrix/PineMatrixObject';
import { LineObject } from './line/LineObject';
import { BoxObject } from './box/BoxObject';
import { LabelObject } from './label/LabelObject';
import { PolylineObject } from './polyline/PolylineObject';
import { LinefillObject } from './linefill/LinefillObject';
import { TableObject } from './table/TableObject';
import { ChartPointObject } from './chart/ChartPointObject';

/** Base of a Pine type string: `array<float>` / `float[]` -> `array`, `series float` -> `float`. */
function baseType(pineType: string): string {
    let s = pineType.trim();
    if (s.endsWith('[]')) return 'array';
    const lt = s.indexOf('<');
    if (lt >= 0) s = s.slice(0, lt);
    const parts = s.split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
}

/** Element type of an array type string: `array<int>` / `int[]` -> `int`; undefined without one. */
function arrayElementType(pineType: string): string | undefined {
    const s = pineType.trim();
    if (s.endsWith('[]')) return baseType(s.slice(0, -2));
    const m = /^(?:\S+\s+)?array\s*<\s*(.+)\s*>$/.exec(s);
    return m ? baseType(m[1]) : undefined;
}

const PRIMITIVE_ELEMENT_TYPES = new Set(['int', 'float', 'bool', 'string', 'color']);

/**
 * Whether a user `method` declared on `fn.__pineReceiverType__` applies to `recv`, judged from the
 * runtime value. `udtName` is set when the declared receiver is a user type (the transpiler passes
 * it), which is how two user types with the same method name are told apart. An array tells
 * `array<int>` from `array<float>` by the element type it was created with (when it has one).
 */
export function receiverMatchesMethod(fn: any, udtName: string | null, recv: any): boolean {
    if (udtName) return recv instanceof PineTypeObject && recv._udt?.__name__ === udtName;
    const declared = fn?.__pineReceiverType__;
    if (typeof declared !== 'string') return false;
    switch (baseType(declared)) {
        case 'line':
            return recv instanceof LineObject;
        case 'box':
            return recv instanceof BoxObject;
        case 'label':
            return recv instanceof LabelObject;
        case 'polyline':
            return recv instanceof PolylineObject;
        case 'linefill':
            return recv instanceof LinefillObject;
        case 'table':
            return recv instanceof TableObject;
        case 'array': {
            if (Array.isArray(recv)) return true;
            if (!(recv instanceof PineArrayObject)) return false;
            const want = arrayElementType(declared);
            const have = recv.type as string;
            return !want || !PRIMITIVE_ELEMENT_TYPES.has(want) || !PRIMITIVE_ELEMENT_TYPES.has(have) || want === have;
        }
        case 'map':
            return recv instanceof PineMapObject;
        case 'matrix':
            return recv instanceof PineMatrixObject;
        case 'chart.point':
            return recv instanceof ChartPointObject;
        case 'string':
            return typeof recv === 'string';
        case 'bool':
            return typeof recv === 'boolean';
        case 'int':
        case 'float':
            return typeof recv === 'number';
        default:
            return false;
    }
}
