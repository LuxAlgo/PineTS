// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function sma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Incremental SMA calculation using rolling sum
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `sma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevSum: 0,
                prevCallCount: 0,
                // Tentative state
                currentWindow: [],
                currentSum: 0,
                currentCallCount: 0,
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevSum = state.currentSum;
                state.prevCallCount = state.currentCallCount;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Use committed state
        const window = [...state.prevWindow];
        
        // Add current value to window
        window.unshift(currentValue);

        // Manage window size
        while (window.length > period) {
            window.pop();
        }

        // Track actual call count for callsite-correct backfill
        const callCount = state.prevCallCount + 1;

        // Backfill from source series when window is undersized.
        // Use both callCount (for top-level warmup) and context.idx
        // (for conditional/barstate.islast where chart has enough history).
        let backfilled = false;
        if (window.length < period && (callCount >= period || context.idx >= period - 1)) {
            const series = Series.from(source);
            while (window.length < period) {
                window.push(series.get(window.length));
            }
            backfilled = true;
        }

        let sum;

        // Check for NaN contamination to decide on calculation strategy
        const isCurrentInvalid = currentValue === undefined || currentValue === null || Number.isNaN(currentValue);
        const isPrevSumInvalid = Number.isNaN(state.prevSum);

        // When backfill added values to the window, prevSum doesn't include
        // them so the incremental path would give wrong results.
        let useFastPath = !isPrevSumInvalid && !isCurrentInvalid && !backfilled;
        
        // If fast path seems possible, we still need to be sure we didn't just pop a NaN (which would make result NaN -> Number, requiring recalc of prevSum didn't allow recovery)
        // Actually, if prevSum was Number, then the window *should* have contained only Numbers. 
        // So popping a value should be popping a Number.
        // So fast path IS safe if prevSum is valid and current is valid.
        
        if (useFastPath) {
             // Reconstruct incremental step
             // We need the value that was popped. 
             // Logic: sum = prevSum + current - popped
             
             // But we already modified 'window'. 
             // Let's use the state logic again carefully.
             
             // Re-derive from state vars for calculation
             let tempSum = state.prevSum + currentValue;
             
             // If we shrank the window, we need to subtract the element that was in prevWindow but not in current window.
             // That element is prevWindow[prevWindow.length - 1] IF prevWindow.length == period.
             
             if (state.prevWindow.length >= period) {
                 const popped = state.prevWindow[state.prevWindow.length - 1];
                 // Double check popped validity just in case
                 if (popped === undefined || popped === null || Number.isNaN(popped)) {
                     useFastPath = false;
                 } else {
                     tempSum -= popped;
                 }
             }
             
             if (useFastPath) {
                 sum = tempSum;
             }
        }
        
        if (!useFastPath) {
            // Fallback to full recalculation
            sum = 0;
            let hasNaN = false;
            for (const v of window) {
                if (v === undefined || v === null || Number.isNaN(v)) {
                    hasNaN = true;
                    break;
                }
                sum += v;
            }
            if (hasNaN) sum = NaN;
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentSum = sum;
        state.currentCallCount = callCount;
        
        if (window.length < period) {
            return NaN;
        }

        const sma = sum / period;
        return context.precision(sma);
    };
}
