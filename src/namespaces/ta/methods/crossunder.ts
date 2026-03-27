// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function crossunder(context: any) {
    return (source1: any, source2: any) => {
        const s1 = Series.from(source1);
        const s2 = Series.from(source2);

        // Stateless calculation (accesses past data via Series)

        // Get current values
        const current1 = s1.get(0);
        const current2 = s2.get(0);

        // Get previous values
        const prev1 = s1.get(1);
        const prev2 = s2.get(1);

        // Check if source1 crossed below source2
        // TradingView: previous was at or above, current is strictly below
        return prev1 >= prev2 && current1 < current2;
    };
}
