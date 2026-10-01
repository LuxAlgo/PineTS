// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { crossPair } from '../utils/naAware';

export function crossunder(context: any) {
    return (source1: any, source2: any, _callId?: string) => {
        // The previous values come from the most recent earlier bar where both were non-na
        // (TradingView: previous at or above, current strictly below).
        const [current1, current2, prev1, prev2] = crossPair(context, _callId, Series.from(source1), Series.from(source2));
        return prev1 >= prev2 && current1 < current2;
    };
}
