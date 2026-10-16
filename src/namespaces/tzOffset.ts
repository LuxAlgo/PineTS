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
 * Offset at each UTC-midnight boundary: one INTEGER-keyed map per timezone.
 *
 * It used to be a single map keyed `${timezone}|${dayIndex}`, and that key
 * was the cost. The cache hit essentially every time, yet a profiled 10k-bar
 * HTF_EMA execute still spent 8.9% of self time here and none of it in
 * `formatToParts` — it was allocating a string and hashing it, twice per
 * {@link timezoneOffsetMs} call, at ~5k calls per bar. Splitting by timezone
 * makes the inner key a plain integer: no allocation, cheap hash.
 *
 * The bound is now PER TIMEZONE rather than global. A script uses one or two
 * zones, so the ceiling is unchanged in practice, and a clear still costs one
 * re-probe per day touched afterwards.
 */
const boundaryCaches = new Map<string, Map<number, number>>();
const BOUNDARY_CACHE_MAX = 8192;

/** The day map for a timezone, with the last one resolved held in a scalar —
 *  consecutive calls are the same zone in every real script. */
let daysTz = '';
let daysMap: Map<number, number> | null = null;

function daysFor(timezone: string): Map<number, number> {
    if (daysMap !== null && timezone === daysTz) return daysMap;
    let m = boundaryCaches.get(timezone);
    if (m === undefined) {
        m = new Map<number, number>();
        boundaryCaches.set(timezone, m);
    }
    daysTz = timezone;
    daysMap = m;
    return m;
}

function boundaryOffsetIn(days: Map<number, number>, timezone: string, dayIndex: number): number {
    const hit = days.get(dayIndex);
    if (hit !== undefined) return hit;
    const off = rawTimezoneOffsetMs(timezone, dayIndex * DAY_MS);
    if (days.size >= BOUNDARY_CACHE_MAX) days.clear();
    days.set(dayIndex, off);
    return off;
}

/**
 * The answer for the LAST UTC day resolved, held in scalars.
 *
 * WHY, on top of {@link boundaryCache}. The Map cache already HITS on
 * essentially every call — a profile of a 10k-bar HTF_EMA execute still put
 * 8.9% of self time in {@link boundaryOffset}, and none of it was
 * `formatToParts`. The cost was reaching the hit: building a
 * `${timezone}|${dayIndex}` key allocates a string and hashes it, and
 * {@link timezoneOffsetMs} does that TWICE per call (start and end
 * boundary) at ~5k calls per bar. A scalar compare skips both probes.
 *
 * Bars march forward in time, so a chart's own per-bar time calls repeat the
 * same (timezone, dayIndex) and this answers them outright. It is NOT enough
 * on its own: `timestamp(tz, y, m, d, ...)` resolves an ARBITRARY calendar
 * date, so a script computing month/week predicates per bar (first Friday,
 * third Friday) makes the day index jump and thrashes a one-entry memo. That
 * traffic is what {@link boundaryOffsetIn}'s integer key is for; the two
 * layers cover the two access patterns.
 *
 * ONLY a constant day is memoized. On a transition day the offset varies
 * WITHIN the day, so `memoConstant` stays false and every instant in it
 * keeps taking the exact slow path — the memo cannot smear an offset across
 * a transition, which is the invariant this file exists to hold.
 */
let memoTz = '';
let memoDayIndex = NaN;
let memoOffset = 0;
let memoConstant = false;

/**
 * UTC offset in milliseconds for `utcMs` in `timezone` (positive = east of
 * UTC). Exact: falls through to {@link rawTimezoneOffsetMs} on any UTC day
 * that contains a transition.
 *
 * @throws for an unknown timezone (see {@link rawTimezoneOffsetMs}).
 */
export function timezoneOffsetMs(timezone: string, utcMs: number): number {
    const dayIndex = Math.floor(utcMs / DAY_MS);
    if (memoConstant && dayIndex === memoDayIndex && timezone === memoTz) return memoOffset;
    const days = daysFor(timezone);
    const startOff = boundaryOffsetIn(days, timezone, dayIndex);
    const endOff = boundaryOffsetIn(days, timezone, dayIndex + 1);
    // Boundaries agree => no transition inside this UTC day => constant.
    if (startOff === endOff) {
        memoTz = timezone;
        memoDayIndex = dayIndex;
        memoOffset = startOff;
        memoConstant = true;
        return startOff;
    }
    // Transition day: do NOT memoize — the offset is not a function of the
    // day here, and a later call for a different instant in the same day
    // must re-resolve.
    memoConstant = false;
    return rawTimezoneOffsetMs(timezone, utcMs);
}

/** Drop every cached offset. Exposed for tests and long-lived hosts. */
export function clearTimezoneOffsetCache(): void {
    boundaryCaches.clear();
    daysTz = '';
    daysMap = null;
    formatterCache.clear();
    memoConstant = false;
    memoTz = '';
    memoDayIndex = NaN;
}
