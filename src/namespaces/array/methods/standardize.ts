// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

export function standardize(context: any) {
    return (id: PineArrayObject): PineArrayObject => {
        const mean = context.array.avg(id);
        const stdev = context.array.stdev(id);

        if (isNaN(stdev)) {
            return new PineArrayObject(
                id.array.map(() => NaN),
                PineArrayType.float,
                context
            );
        }

        if (stdev === 0) {
            // If stdev is 0, Pine Script appears to return 1s.
            // This is an edge case behavior observed in testing.
            return new PineArrayObject(
                id.array.map(() => 1),
                PineArrayType.float,
                context
            );
        }

        return new PineArrayObject(
            id.array.map((x) => (x - mean) / stdev),
            PineArrayType.float,
            context
        );
    };
}
