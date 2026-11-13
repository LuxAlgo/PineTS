// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function mode(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        const rows = idRows.length;
        if (rows === 0) return NaN;
        const cols = idRows[0].length;
        
        const counts = new Map<number, number>();
        let maxCount = 0;
        let modeVal = NaN;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const val = idRows[i][j];
                if (!isNaN(val)) {
                    const count = (counts.get(val) || 0) + 1;
                    counts.set(val, count);
                    
                    if (count > maxCount) {
                        maxCount = count;
                        modeVal = val;
                    } else if (count === maxCount) {
                        if (val < modeVal) modeVal = val;
                    }
                }
            }
        }
        
        return modeVal;
    };
}

