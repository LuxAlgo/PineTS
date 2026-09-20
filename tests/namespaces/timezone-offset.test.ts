// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect, beforeEach } from 'vitest';
import { getDatePartsInTimezone } from '../../src/namespaces/Time';
import { timezoneOffsetMs, rawTimezoneOffsetMs, clearTimezoneOffsetCache } from '../../src/namespaces/tzOffset';

/**
 * The offset cache (tzOffset.ts) lets calendar parts be read arithmetically
 * instead of through a per-call Intl.formatToParts. That is only sound if
 * the cached offset is EXACT — including on the two days a year where it
 * changes mid-day, which is precisely where a day-bucketed cache would be
 * wrong if it approximated.
 *
 * Oracle: Intl.DateTimeFormat itself, asked independently per instant. A
 * cache that silently smeared a transition across its day would disagree
 * with it on the transition hour and nowhere else — so these sweep EVERY
 * hour of the transition days rather than sampling.
 */

/** Calendar parts read straight from Intl — the reference implementation. */
function oracleParts(timestamp: number, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
        hour12: false,
    }).formatToParts(new Date(timestamp));
    const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || '0', 10);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    let hour = get('hour');
    if (hour === 24) hour = 0;
    return {
        year: get('year'),
        month: get('month'),
        day: get('day'),
        hour,
        minute: get('minute'),
        second: get('second'),
        dayOfWeek: dayMap[parts.find((p) => p.type === 'weekday')?.value || 'Sun'] ?? 0,
    };
}

const HOUR = 3_600_000;

describe('timezone offset cache', () => {
    beforeEach(() => clearTimezoneOffsetCache());

    // Zones chosen to break a naive cache: whole-hour DST (New York),
    // southern-hemisphere DST in the opposite season (Sydney), a half-hour
    // offset (Kolkata), a 45-minute offset (Kathmandu), and a zone whose DST
    // shift is only 30 minutes AND lands mid-UTC-hour (Lord Howe).
    const zones = ['America/New_York', 'Europe/London', 'Australia/Sydney', 'Asia/Kolkata', 'Asia/Kathmandu', 'Australia/Lord_Howe'];

    // Days containing real transitions in these zones, plus ordinary days.
    const days = [
        '2024-03-10', // US spring forward
        '2024-11-03', // US fall back
        '2024-03-31', // EU spring forward
        '2024-10-27', // EU fall back
        '2024-04-07', // AU (incl. Lord Howe) fall back
        '2024-10-06', // AU (incl. Lord Howe) spring forward
        '2024-06-15', // ordinary
        '2024-01-01', // ordinary
    ];

    it('matches Intl for every hour of every transition day, in every zone', () => {
        for (const zone of zones) {
            for (const day of days) {
                const dayStart = Date.parse(`${day}T00:00:00Z`);
                for (let h = 0; h < 24; h++) {
                    const ts = dayStart + h * HOUR;
                    expect(getDatePartsInTimezone(ts, zone), `${zone} ${day} ${h}:00Z`).toEqual(oracleParts(ts, zone));
                }
            }
        }
    });

    it('matches Intl at MINUTE resolution across the US spring-forward instant', () => {
        // 2024-03-10 07:00Z is the exact EST->EDT switch. A day-bucketed
        // cache must fall through to the exact path for this whole day.
        const zone = 'America/New_York';
        const from = Date.parse('2024-03-10T06:30:00Z');
        for (let m = 0; m <= 60; m++) {
            const ts = from + m * 60_000;
            expect(getDatePartsInTimezone(ts, zone), `+${m}min`).toEqual(oracleParts(ts, zone));
        }
    });

    it('the cached offset equals the uncached offset on a transition day', () => {
        const zone = 'America/New_York';
        const dayStart = Date.parse('2024-11-03T00:00:00Z');
        for (let h = 0; h < 24; h++) {
            const ts = dayStart + h * HOUR;
            expect(timezoneOffsetMs(zone, ts), `hour ${h}`).toBe(rawTimezoneOffsetMs(zone, ts));
        }
        // and the day genuinely straddles a change (otherwise this is vacuous)
        expect(rawTimezoneOffsetMs(zone, dayStart)).not.toBe(rawTimezoneOffsetMs(zone, dayStart + 23 * HOUR));
    });

    it('a warm cache returns what a cold cache returns', () => {
        const zone = 'Europe/London';
        const ts = Date.parse('2024-10-27T01:30:00Z');
        const cold = timezoneOffsetMs(zone, ts);
        const warm = timezoneOffsetMs(zone, ts);
        clearTimezoneOffsetCache();
        expect(warm).toBe(cold);
        expect(timezoneOffsetMs(zone, ts)).toBe(cold);
    });

    it('resolves fixed-offset and UTC spellings without touching Intl', () => {
        const ts = Date.parse('2024-06-15T12:34:56Z');
        expect(getDatePartsInTimezone(ts, 'UTC')).toEqual({ year: 2024, month: 6, day: 15, hour: 12, minute: 34, second: 56, dayOfWeek: 6 });
        expect(getDatePartsInTimezone(ts, 'GMT+5:30')).toEqual({ year: 2024, month: 6, day: 15, hour: 18, minute: 4, second: 56, dayOfWeek: 6 });
        expect(getDatePartsInTimezone(ts, 'UTC-3')).toEqual({ year: 2024, month: 6, day: 15, hour: 9, minute: 34, second: 56, dayOfWeek: 6 });
    });

    it('falls back to UTC for an unknown timezone instead of throwing', () => {
        const ts = Date.parse('2024-06-15T12:34:56Z');
        expect(getDatePartsInTimezone(ts, 'Not/AZone')).toEqual(oracleParts(ts, 'UTC'));
    });
});
