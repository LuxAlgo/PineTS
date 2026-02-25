// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function vwma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Volume-Weighted Moving Average
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `vwma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevVolumeWindow: [],
                // Tentative state
                currentWindow: [],
                currentVolumeWindow: [],
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevVolumeWindow = [...state.currentVolumeWindow];
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);
        const currentVolume = context.get(context.data.volume, 0);

        const window = [...state.prevWindow];
        const volumeWindow = [...state.prevVolumeWindow];

        window.unshift(currentValue);
        volumeWindow.unshift(currentVolume);

        while (window.length > period) {
            window.pop();
            volumeWindow.pop();
        }

        // Backfill from source if window is undersized (dynamic length recovery)
        if (window.length < period && context.idx >= period - 1) {
            const series = Series.from(source);
            const volSeries = Series.from(context.data.volume);
            while (window.length < period) {
                window.push(series.get(window.length));
                volumeWindow.push(volSeries.get(volumeWindow.length));
            }
        }

        state.currentWindow = window;
        state.currentVolumeWindow = volumeWindow;

        if (window.length < period) {
            return NaN;
        }

        let sumVolPrice = 0;
        let sumVol = 0;
        for (let i = 0; i < period; i++) {
            sumVolPrice += window[i] * volumeWindow[i];
            sumVol += volumeWindow[i];
        }

        const vwma = sumVolPrice / sumVol;
        return context.precision(vwma);
    };
}
