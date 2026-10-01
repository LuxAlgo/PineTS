// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

export function new_bool(context: any) {
    return (size: number = 0, initial_value?: boolean): PineArrayObject => {
        const safeSize = (typeof size === 'number' && size > 0 && !isNaN(size)) ? Math.floor(size) : 0;
        // A bool can be na up to Pine v5 only, so the default element is na there and false from v6 on.
        const fill = initial_value === undefined ? (context.pineVersion >= 6 ? false : NaN) : initial_value;
        return new PineArrayObject(Array(safeSize).fill(fill), PineArrayType.bool, context);
    };
}
