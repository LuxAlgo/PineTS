// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Value When
 *
 * Returns the value of the source series on the bar where the condition was true on the nth most recent occurrence.
 */
export function valuewhen(context: any) {
    return (condition: any, source: any, _occurrence: any, _callId?: string) => {
        if (!context.taState) context.taState = {};
        const stateKey = _callId || 'valuewhen';

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed values of the occurrences, oldest first (only ever appended to)
                values: [],
                // Tentative: whether the current bar is an occurrence, and its value
                pending: false,
                pendingValue: undefined,
            };
        }
        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.pending) state.values.push(state.pendingValue);
            state.pending = false;
            state.lastIdx = context.idx;
        }

        const cond = Series.from(condition).get(0);
        const val = Series.from(source).get(0);
        const occurrence = Series.from(_occurrence).get(0);

        state.pending = !!cond;
        state.pendingValue = val;

        if (isNaN(occurrence) || occurrence < 0) {
            return NaN;
        }

        // Occurrences newest first: the current bar's (when it is one), then the committed ones
        const values = state.values;
        let result;
        if (state.pending) {
            if (occurrence === 0) result = val;
            else {
                const index = values.length - occurrence;
                if (index < 0) return NaN;
                result = values[index];
            }
        } else {
            const index = values.length - 1 - occurrence;
            if (index < 0) return NaN;
            result = values[index];
        }

        // Check if result is a number to apply precision, else return as is (e.g. boolean/color)
        if (typeof result === 'number') {
            return context.precision(result);
        }
        return result;
    };
}
