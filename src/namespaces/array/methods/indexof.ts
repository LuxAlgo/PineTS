// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function indexof(context: any) {
    return (id: PineArrayObject, value: any): number => {
        // Handle NaN: JavaScript's indexOf uses === which never matches NaN.
        // Pine Script's na values should still be findable in arrays.
        if (typeof value === 'number' && value !== value) {
            return id.array.findIndex((v: any) => typeof v === 'number' && v !== v);
        }
        return id.array.indexOf(value);
    };
}

