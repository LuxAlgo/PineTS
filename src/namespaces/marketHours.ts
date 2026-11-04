// SPDX-License-Identifier: AGPL-3.0-only

import { getDatePartsInTimezone } from './Time';
import { parseSessionSpec, isInSessionSpec } from './sessionSpec';

// Pine day numbers, Monday to Friday.
const WEEKDAYS = new Set([2, 3, 4, 5, 6]);

/**
 * Whether the market of a symbol trades at `timestamp`, from its session window spec (`0930-1600`,
 * `1700-1600:23456`, `24x7`) in its exchange timezone. Null when the session gives no hours (`regular`,
 * `extended`, missing). Holidays are not known.
 *
 * Providers list exchange hours without trading days (`0930-1600`), which a Pine session string reads as
 * every day; a market trades on weekdays unless its session says otherwise (`24x7`, or a `:days` suffix).
 */
export function isMarketOpenAt(session: string | undefined, timezone: string | undefined, timestamp: number): boolean | null {
    const text = (session ?? '').trim();
    const spec = parseSessionSpec(text);
    if (!spec) return null;
    const days = text === '24x7' || text.includes(':') ? spec.days : WEEKDAYS;
    const p = getDatePartsInTimezone(timestamp, timezone || 'UTC');
    return isInSessionSpec({ ...spec, days }, p.hour * 60 + p.minute, p.dayOfWeek);
}
