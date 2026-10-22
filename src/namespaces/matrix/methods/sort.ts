// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { assertMatrixIndex } from '../indexValidation';

export function sort(context: Context) {
    return (id: PineMatrixObject, column: number = 0, order: string = 'asc') => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        if (cols === 0 && column === 0) return;
        assertMatrixIndex(column, cols, 'column', 'matrix.sort');
        
        id.matrix.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
    };
}

