// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Bars Since
 *
 * Counts the number of bars since the last time the condition was true. The count is of this
 * call's own executions: called only on every other bar, it counts those calls (TV, 1W:
 * `if bar_index % 2 == 0` around ta.barssince gives 11 where 22 chart bars passed).
 */
export function barssince(context: any) {
    return (condition: any, _callId?: string) => {
        if (!context.taState) context.taState = {};
        const stateKey = _callId || 'barssince';

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevCount: 0,
                prevLastTrue: null,
                // Tentative state
                count: 0,
                currentLastTrue: null,
            };
        }
        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevCount = state.count;
                state.prevLastTrue = state.currentLastTrue;
            }
            state.lastIdx = context.idx;
        }

        const cond = Series.from(condition).get(0);

        // This execution's ordinal, and the one where the condition last held
        state.count = state.prevCount + 1;
        let lastTrue = state.prevLastTrue;
        if (cond) {
            lastTrue = state.count;
        }

        // Update tentative state
        state.currentLastTrue = lastTrue;

        if (lastTrue === null) {
            return NaN;
        }

        return state.count - lastTrue;
    };
}
