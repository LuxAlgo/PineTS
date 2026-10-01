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

/**
 * Whether a user `method` declared on `fn.__pineReceiverType__` applies to `recv`, judged from the
 * runtime value. `udtName` is set when the declared receiver is a user type (the transpiler passes
 * it), which is how two user types with the same method name are told apart.
 * `int[]` and `float[]` cannot be told apart at runtime; both are just arrays.
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
        case 'array':
            return recv instanceof PineArrayObject || Array.isArray(recv);
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
