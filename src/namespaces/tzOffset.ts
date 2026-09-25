// SPDX-License-Identifier: AGPL-3.0-only

/**
 * UTC-offset resolution for IANA timezones — the single primitive both
 * `timestamp(TZ, …)` (Core) and `year()/month()/dayofmonth()/hour()/
 * dayofweek()` (Time) reduce to.
 *
 * WHY THIS EXISTS. Pine time functions run ONCE PER BAR, and a script with
 * per-bar day-key logic makes several calls per bar. Resolving each one
 * through `Intl.DateTimeFormat.formatToParts` costs ~3.9us (Node ICU;
 * browsers are slower), which made timezone math 40% of a profiled 10k-bar
 * HTF_EMA execute even AFTER the formatter instances themselves were
 * memoized. Reading calendar parts off a CACHED offset is ~120ns — 32x
 * cheaper (measured, see the perf regression test).
 *
 * HOW THE CACHE STAYS EXACT. An IANA offset is piecewise constant in UTC,
 * and the pieces are months long. We cache the offset at UTC midnight
 * boundaries; a UTC day whose two boundaries agree carries that offset
 * throughout, so parts can be read arithmetically. A day whose boundaries
 * DISAGREE contains a transition and is resolved the slow, exact way for
 * every instant in it — the cache never approximates across one.
 *
 * Because adjacent days SHARE a boundary probe, a forward-marching chart
 * costs one `formatToParts` per calendar day no matter the bar interval:
 * strictly cheaper than uncached even on a daily chart (one probe per bar
 * versus one per call).
 *
 * The one assumption: no zone transitions twice within a single UTC day and
 * returns to the same offset. No entry in the IANA database does this —
 * transitions are hours to months apart — and a zone that did would be
 * misread only on that day.
 */

const DAY_MS = 86_400_000;

/**
 * Memoized parts formatter, keyed by timezone. `Intl.DateTimeFormat`
 * instances are PURE functions of (locale, options) — ECMA-402 makes them
 * stateless — so one per timezone serves every call. Construction is ~41us,
 * an order of magnitude MORE than the formatting it enables, so this cache
 * matters even on the transition-day path.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timezone: string): Intl.DateTimeFormat {
    let f = formatterCache.get(timezone);
    if (!f) {
        f = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false,
        });
        formatterCache.set(timezone, f);
    }
    return f;
}

/**
 * The offset at a UTC instant, computed the slow exact way: format the
 * instant in the zone and difference the wall-clock reading against UTC.
 *
 * Kept byte-for-byte equivalent to what `_timestampFromIANA` computed
 * inline before the cache existed, so a transition-day result is unchanged.
 *
 * @throws whatever `Intl.DateTimeFormat` throws for an unknown zone — the
 *         callers own the fallback policy (both fall back to UTC).
 */
export function rawTimezoneOffsetMs(timezone: string, utcMs: number): number {
    const formatter = getPartsFormatter(timezone);
    const parts = formatter.formatToParts(new Date(utcMs));
    const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

    const tzYear = get('year');
    const tzMonth = get('month');
    const tzDay = get('day');
    let tzHour = get('hour');
    if (tzHour === 24) tzHour = 0; // Intl may report midnight as hour 24
    const tzMinute = get('minute');
    const tzSecond = get('second');

    const tzDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond));
    if (tzYear >= 0 && tzYear < 100) tzDate.setUTCFullYear(tzYear);

    // Sub-second precision cannot affect a whole-minute offset, and dropping
    // it is what keeps a boundary probe reusable for every instant in a day.
    return tzDate.getTime() - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Offset at each UTC-midnight boundary, keyed `${timezone}|${dayIndex}`.
 * Bounded so a long backtest sweeping many symbols cannot grow it without
 * limit; a clear costs one re-probe per day touched afterwards.
 */
const boundaryCache = new Map<string, number>();
const BOUNDARY_CACHE_MAX = 8192;

function boundaryOffset(timezone: string, dayIndex: number): number {
    const key = `${timezone}|${dayIndex}`;
    const hit = boundaryCache.get(key);
    if (hit !== undefined) return hit;
    const off = rawTimezoneOffsetMs(timezone, dayIndex * DAY_MS);
    if (boundaryCache.size >= BOUNDARY_CACHE_MAX) boundaryCache.clear();
    boundaryCache.set(key, off);
    return off;
}

/**
 * UTC offset in milliseconds for `utcMs` in `timezone` (positive = east of
 * UTC). Exact: falls through to {@link rawTimezoneOffsetMs} on any UTC day
 * that contains a transition.
 *
 * @throws for an unknown timezone (see {@link rawTimezoneOffsetMs}).
 */
export function timezoneOffsetMs(timezone: string, utcMs: number): number {
    const dayIndex = Math.floor(utcMs / DAY_MS);
    const startOff = boundaryOffset(timezone, dayIndex);
    const endOff = boundaryOffset(timezone, dayIndex + 1);
    // Boundaries agree => no transition inside this UTC day => constant.
    if (startOff === endOff) return startOff;
    return rawTimezoneOffsetMs(timezone, utcMs);
}

/** Drop every cached offset. Exposed for tests and long-lived hosts. */
export function clearTimezoneOffsetCache(): void {
    boundaryCache.clear();
    formatterCache.clear();
}
