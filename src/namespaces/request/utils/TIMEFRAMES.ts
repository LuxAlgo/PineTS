// SPDX-License-Identifier: AGPL-3.0-only

//Pine Script Timeframes (canonical format: minutes as integers, D/W/M for day/week/month)
export const TIMEFRAMES = ['1', '3', '5', '15', '30', '45', '60', '120', '180', '240', 'D', 'W', 'M'];

/**
 * Normalize a timeframe string to the canonical Pine Script format used in TIMEFRAMES.
 * Handles common formats like '1h', '4h', '1d', '1w', '1D', '1W', '1M', etc.
 */
const TIMEFRAME_MAP: Record<string, string> = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', '45m': '45',
    '1h': '60', '2h': '120', '3h': '180', '4h': '240',
    '1d': 'D', '1w': 'W', '1M': 'M',
};

export function normalizeTimeframe(tf: string): string {
    // Already canonical?
    if (TIMEFRAMES.includes(tf)) return tf;

    // Try direct map (case-sensitive first for '1M')
    if (TIMEFRAME_MAP[tf]) return TIMEFRAME_MAP[tf];

    // Try lowercase (handles '1H', '4H', '1D', '1W', etc.)
    const lower = tf.toLowerCase();
    if (TIMEFRAME_MAP[lower]) return TIMEFRAME_MAP[lower];

    // Handle uppercase single letters ('d' → 'D', 'w' → 'W', 'm' → 'M')
    const upper = tf.toUpperCase();
    if (TIMEFRAMES.includes(upper)) return upper;

    // Return as-is (will fail indexOf check and throw Error)
    return tf;
}
