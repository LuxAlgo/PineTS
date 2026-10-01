// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Intraday Intensity Index (III)
 *
 * Formula (as TradingView computes it; its reference manual shows a division by volume):
 * (2 * close - high - low) / (high - low) * volume
 */
export function iii(context: any) {
    return (_callId?: string) => {
        const close = context.get(context.data.close, 0);
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const volume = context.get(context.data.volume, 0);

        if (isNaN(close) || isNaN(high) || isNaN(low) || isNaN(volume)) {
            return NaN;
        }

        const range = high - low;

        if (range === 0) {
            return context.precision(0);
        }

        const iii = ((2 * close - high - low) / range) * volume;
        return context.precision(iii);
    };
}

