// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function median(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return NaN;
        const cols = idRows[0].length;
        
        const values: number[] = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const val = idRows[i][j];
                if (!isNaN(val)) {
                    values.push(val);
                }
            }
        }
        
        if (values.length === 0) return NaN;
        
        values.sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        
        if (values.length % 2 !== 0) {
            return values[mid];
        } else {
            return (values[mid - 1] + values[mid]) / 2;
        }
    };
}

