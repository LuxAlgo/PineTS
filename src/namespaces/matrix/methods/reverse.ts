// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { matrixRestructured, matrixStore } from '../capacity';

export function reverse(context: Context) {
    return (id: PineMatrixObject) => {
        // Reorders rows and cells; no dimension changes.
        const store = matrixStore(id);
        store.reverse();
        for (const row of store) {
            row.reverse();
        }
        matrixRestructured(store);
    };
}
