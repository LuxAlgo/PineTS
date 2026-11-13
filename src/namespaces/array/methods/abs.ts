// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { arrayStore } from '../capacity';

export function abs(context: any) {
    return (id: PineArrayObject): PineArrayObject => {
        const plain = arrayStore(id);
        return new PineArrayObject(
            plain.map((val) => Math.abs(val)),
            id.type,
            context
        );
    };
}
