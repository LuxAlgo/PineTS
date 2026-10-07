// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { nonNaWindow } from '../utils/nonNaWindow';

export function vwma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        const series = Series.from(source);
        const volume = Series.from(context.data.volume);
        const stateKey = _callId || `vwma_${period}`;

        // sma(source * volume) / sma(volume), each over its own last `period` non-na values: a bar
        // where the source is na drops out of the numerator only, as on TradingView.
        const weighted = nonNaWindow(context, `${stateKey}_sv`, (k) => series.get(k) * volume.get(k), period);
        const volumes = nonNaWindow(context, `${stateKey}_v`, volume, period);
        if (!weighted || !volumes) return NaN;

        return context.precision(weighted.sum / volumes.sum);
    };
}
