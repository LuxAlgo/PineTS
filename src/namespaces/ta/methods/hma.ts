// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function hma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Hull Moving Average: HMA = WMA(2*WMA(n/2) - WMA(n), sqrt(n))
        const halfPeriod = Math.floor(period / 2);
        const sqrtPeriod = Math.floor(Math.sqrt(period));

        // Get wma function from context.ta
        const wmaFn = context.pine.ta.wma;

        // Pass derived call IDs to internal WMA calls to avoid state collision
        const wma1 = wmaFn(source, halfPeriod, _callId ? `${_callId}_wma1` : undefined);
        const wma2 = wmaFn(source, period, _callId ? `${_callId}_wma2` : undefined);

        if (isNaN(wma1) || isNaN(wma2)) {
            return NaN;
        }

        // Create synthetic source for final WMA: 2*wma1 - wma2
        // We need to feed this into WMA calculation
        // Store the raw value in a temporary series
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `hma_raw_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevValues: [],
                // Tentative state
                currentValues: [],
            };
        }

        const rawState = context.taState[stateKey];

        // Commit logic for raw values
        if (context.idx > rawState.lastIdx) {
            if (rawState.lastIdx >= 0) {
                rawState.prevValues = [...rawState.currentValues];
            }
            rawState.lastIdx = context.idx;
        }

        const rawHma = 2 * wma1 - wma2;
        
        // Use committed values as base
        const values = [...rawState.prevValues];
        values.unshift(rawHma);
        
        // Keep history manageable (though not strictly necessary for simple series, but helps debugging/memory)
        if (values.length > sqrtPeriod + 1) values.pop();
        
        rawState.currentValues = values;

        // Apply WMA to the raw HMA values
        const hmaStateKey = _callId ? `${_callId}_hma_final` : `hma_final_${period}`;
        
        if (!context.taState[hmaStateKey]) {
            context.taState[hmaStateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                // Tentative state
                currentWindow: [],
            };
        }

        const state = context.taState[hmaStateKey];

        // Commit logic for final WMA
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
            }
            state.lastIdx = context.idx;
        }

        // Use committed window
        const window = [...state.prevWindow];
        window.unshift(rawHma);

        if (window.length < sqrtPeriod) {
            state.currentWindow = window;
            return NaN;
        }

        while (window.length > sqrtPeriod) {
            window.pop();
        }

        state.currentWindow = window;

        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < sqrtPeriod; i++) {
            const weight = sqrtPeriod - i;
            numerator += window[i] * weight;
            denominator += weight;
        }

        const hma = numerator / denominator;
        return context.precision(hma);
    };
}
