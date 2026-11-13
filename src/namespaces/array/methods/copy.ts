// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { arrayStore } from '../capacity';

export function copy(context: any) {
    return (id: PineArrayObject): PineArrayObject => {
        const plain = arrayStore(id);
        return new PineArrayObject([...plain], id.type, context);
    };
}
