import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { Series } from '../../../Series';
import { PineArrayObject } from '../../array/PineArrayObject';
import { assertMatrixIndex } from '../indexValidation';
import { assertMatrixDimensions, preflightCollectionGrowth } from '../../collectionCapacity';

export function add_row(context: Context) {
    return (id: PineMatrixObject, row_index?: number, values?: any) => {
        const rows = id.matrix.length;

        let rowValues: any[] = [];
        if (values) {
            if (values instanceof PineArrayObject) {
                rowValues = values.array;
            } else if (Array.isArray(values)) {
                rowValues = values;
            } else {
                if (values instanceof Series) {
                    // If it's a Series, it might be wrapping the array
                    // e.g. $.param([1,2,3]) -> Series([1,2,3])
                    const val = values.get(0);
                    if (Array.isArray(val)) {
                        rowValues = val;
                    } else {
                        rowValues = [val];
                    }
                } else {
                    rowValues = [values];
                }
            }
        }

        const cols = rows > 0 ? id.matrix[0].length : rowValues.length;
        const index = row_index !== undefined ? row_index : rows;
        assertMatrixIndex(index, rows, 'row', 'matrix.add_row', true);
        const currentSize = assertMatrixDimensions(rows, cols, 'matrix.add_row');
        const nextSize = assertMatrixDimensions(rows + 1, cols, 'matrix.add_row');
        preflightCollectionGrowth(context, currentSize, nextSize, 'matrix.add_row');

        const newRow = [];
        for (let i = 0; i < cols; i++) {
            if (i < rowValues.length) {
                let val = rowValues[i];
                if (val instanceof Series) {
                    val = val.get(0);
                }
                newRow.push(val);
            } else {
                newRow.push(NaN);
            }
        }

        id.matrix.splice(index, 0, newRow);
    };
}
