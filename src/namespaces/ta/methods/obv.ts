// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * On-Balance Volume (OBV)
 * Cumulative indicator that adds volume on up days and subtracts on down days
 *
 * Logic:
 * - If close > close[1]: OBV = OBV[1] + volume
 * - If close < close[1]: OBV = OBV[1] - volume
 * - If close == close[1]: OBV = OBV[1]
 *
 * Note: OBV starts at 0 on the first bar (when there's no previous close to compare)
 */
export function obv(context: any) {
    return () => {
        // Initialize state for incremental calculation
        if (!context.taState) context.taState = {};
        const stateKey = 'obv';

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed OBV (value at end of lastIdx)
                committedOBV: 0,
                // Tentative OBV (current value)
                tentativeOBV: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.committedOBV = state.tentativeOBV;
            }
            state.lastIdx = context.idx;
        }

        // Get current close and volume using context.get() for Pine Script semantics
        const close0 = context.get(context.data.close, 0);
        const volume0 = context.get(context.data.volume, 0);

        // Get previous close
        const close1 = context.get(context.data.close, 1);

        // First bar (no previous close): the change is na, so OBV is na; the sum starts at 0
        if (isNaN(close1)) {
            state.tentativeOBV = 0;
            return NaN;
        }

        // Use committed OBV as previous OBV
        let currentOBV = state.committedOBV;

        // Calculate OBV based on price direction
        if (close0 > close1) {
            // Price up: add volume
            currentOBV += volume0;
        } else if (close0 < close1) {
            // Price down: subtract volume
            currentOBV -= volume0;
        } else {
            // Price unchanged: keep previous OBV
        }

        // Update tentative state
        state.tentativeOBV = currentOBV;

        return context.precision(currentOBV);
    };
}
