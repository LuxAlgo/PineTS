// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixStore } from '../capacity';

export function rows(context: Context) {
    return (id: PineMatrixObject) => {
        const idRows = matrixStore(id);
        return idRows.length;
    };
}

