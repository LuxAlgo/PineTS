// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function columns(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        if (idRows.length === 0) return 0;
        return idRows[0].length;
    };
}

