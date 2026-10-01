// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function sum(context: any) {
    return (source: any, length: any) => {
        const len = Series.from(length).get(0);
        const series = Series.from(source);

        // Sum of the last `len` non-na values (na values are skipped, as on TradingView); na while
        // fewer than `len` have been seen.
        let total = 0;
        let count = 0;
        for (let k = 0; count < len && k <= context.idx; k++) {
            const val = series.get(k);
            if (val === null || val === undefined || Number.isNaN(val)) continue;
            total += val;
            count++;
        }
        return count < len ? NaN : total;
    };
}
