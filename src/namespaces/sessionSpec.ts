// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Pine Script session-string parsing and matching.
 *
 * Session string syntax (see TradingView docs, "Sessions"):
 *
 *     <time_period>[,<time_period>...][:<days>]
 *
 * - <time_period> is "HHmm-HHmm" in 24-hour exchange time. Multiple
 *   comma-separated periods describe a session with breaks.
 * - <days> is a set of digits 1-7 (1 = Sunday ... 7 = Saturday). When
 *   omitted, the session applies to all days ("1234567").
 * - "24x7" is a special string equivalent to "0000-0000:1234567".
 * - An end time of "0000" means end-of-day midnight, so "0000-0000" is a
 *   full 24-hour session on each applicable day.
 * - When the start time is at or after the end time the session spans
 *   midnight; per TradingView, such an overnight session belongs to the
 *   day it ENDS on (e.g. "1700-1700:2" starts Sunday 17:00 and ends
 *   Monday 17:00 — the Monday trading day).
 */

interface SessionWindow {
    /** Minutes from midnight, inclusive. */
    start: number;
    /** Minutes from midnight, exclusive. End-of-day midnight is 1440. */
    end: number;
}

export interface SessionSpec {
    windows: SessionWindow[];
    /** Pine day numbers the session applies to: 1 = Sunday ... 7 = Saturday. */
    days: Set<number>;
}

const WINDOW_RE = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/;

/**
 * Parse a Pine session string. Returns null when the string is malformed
 * (callers decide whether that is a runtime error).
 */
export function parseSessionSpec(spec: string): SessionSpec | null {
    if (typeof spec !== 'string') return null;
    const trimmed = spec.trim();
    if (!trimmed) return null;

    if (trimmed === '24x7') {
        return { windows: [{ start: 0, end: 1440 }], days: new Set([1, 2, 3, 4, 5, 6, 7]) };
    }

    const colonParts = trimmed.split(':');
    if (colonParts.length > 2) return null;

    const days = new Set<number>();
    if (colonParts.length === 2) {
        if (!/^[1-7]+$/.test(colonParts[1])) return null;
        for (const digit of colonParts[1]) days.add(parseInt(digit, 10));
    } else {
        for (let d = 1; d <= 7; d++) days.add(d);
    }

    const windows: SessionWindow[] = [];
    for (const period of colonParts[0].split(',')) {
        const match = period.match(WINDOW_RE);
        if (!match) return null;

        const startHour = parseInt(match[1], 10);
        const startMin = parseInt(match[2], 10);
        const endHour = parseInt(match[3], 10);
        const endMin = parseInt(match[4], 10);
        if (startHour > 23 || startMin > 59 || endHour > 23 || endMin > 59) return null;

        const start = startHour * 60 + startMin;
        // "0000" as an end time means end-of-day midnight (24:00).
        const end = endHour === 0 && endMin === 0 ? 1440 : endHour * 60 + endMin;
        windows.push({ start, end });
    }

    return { windows, days };
}

/**
 * Test whether a bar time (already decomposed in the session's timezone)
 * falls inside the session.
 *
 * @param minutesOfDay minutes since midnight in the session timezone
 * @param jsDayOfWeek  JS day-of-week convention (0 = Sunday ... 6 = Saturday)
 */
export function isInSessionSpec(spec: SessionSpec, minutesOfDay: number, jsDayOfWeek: number): boolean {
    const pineDayToday = jsDayOfWeek + 1; // 1 = Sunday ... 7 = Saturday
    const pineDayTomorrow = (pineDayToday % 7) + 1;

    for (const { start, end } of spec.windows) {
        if (start < end) {
            // Same-day window; the trading day is the current day.
            if (minutesOfDay >= start && minutesOfDay < end && spec.days.has(pineDayToday)) return true;
        } else {
            // Overnight window (start >= end): the trading day is the day the
            // session ends. The pre-midnight part belongs to tomorrow's
            // trading day, the post-midnight part to today's.
            if (minutesOfDay >= start && spec.days.has(pineDayTomorrow)) return true;
            if (minutesOfDay < end && spec.days.has(pineDayToday)) return true;
        }
    }
    return false;
}
