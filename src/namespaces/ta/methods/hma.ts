// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { CallWindow } from '../utils/windows';

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

        const rawIsNa = isNaN(wma1) || isNaN(wma2);
        const rawHma = 2 * wma1 - wma2;

        // Apply WMA to the raw HMA values
        if (!context.taState) context.taState = {};
        const hmaStateKey = _callId ? `${_callId}_hma_final` : `hma_final_${period}`;
        if (!context.taState[hmaStateKey]) context.taState[hmaStateKey] = new CallWindow(true);
        const win: CallWindow = context.taState[hmaStateKey];
        win.begin(context.idx);

        // An na bar (source na, so both inner WMAs are na) returns na and weighs the last raw value
        // in its slot, like `ta.wma` on an na source. Before the first raw value nothing is kept.
        if (rawIsNa) {
            if (!win.ring.size) return NaN;
            win.push(context.idx, win.ring.at(0), sqrtPeriod);
            return NaN;
        }
        win.push(context.idx, rawHma, sqrtPeriod);

        if (win.size < sqrtPeriod) {
            return NaN;
        }

        // A window of sqrt(period) values: summed directly
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < sqrtPeriod; i++) {
            const weight = sqrtPeriod - i;
            numerator += win.at(i) * weight;
            denominator += weight;
        }

        const hma = numerator / denominator;
        return context.precision(hma);
    };
}
