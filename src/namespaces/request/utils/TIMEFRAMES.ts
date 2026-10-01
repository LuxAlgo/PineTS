// SPDX-License-Identifier: AGPL-3.0-only

import { canonicalTimeframe } from '../../../timeframe';

//Pine Script Timeframes (canonical format: minutes as integers, D/W/M for day/week/month)
export const TIMEFRAMES = ['1', '3', '5', '15', '30', '45', '60', '120', '180', '240', 'D', 'W', 'M'];

/**
 * Normalize a timeframe string to its canonical Pine Script form ('1h' -> '60', '1D' -> 'D',
 * '2d' -> '2D'). Strings that are not timeframes are returned as-is.
 */
export function normalizeTimeframe(tf: string): string {
    return canonicalTimeframe(tf) ?? tf;
}
