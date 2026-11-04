// SPDX-License-Identifier: AGPL-3.0-only

import { getDatePartsInTimezone } from './Time';
import { parseSessionSpec, isInSessionSpec } from './sessionSpec';

/**
 * Whether the market of a symbol trades at `timestamp`, from its session window spec (`0930-1600`,
 * `1700-1600:23456`, `24x7`) in its exchange timezone. Null when the session gives no hours (`regular`,
 * `extended`, missing). Holidays are not known.
 */
export function isMarketOpenAt(session: string | undefined, timezone: string | undefined, timestamp: number): boolean | null {
    const spec = parseSessionSpec(session ?? '');
    if (!spec) return null;
    const p = getDatePartsInTimezone(timestamp, timezone || 'UTC');
    return isInSessionSpec(spec, p.hour * 60 + p.minute, p.dayOfWeek);
}
