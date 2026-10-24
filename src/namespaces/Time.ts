// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';
import { parseArgsForPineParams } from './utils';
import { parseSessionSpec, isInSessionSpec } from './sessionSpec';
import { PineRuntimeError } from '../errors/PineRuntimeError';
import { ParsedTimeframe, canonicalTimeframe, parseTimeframe, timeframeBarEnd, timeframeBarStart } from '../timeframe';

// Current values of the arguments; named arguments arrive as a trailing plain object
// whose values may be series too (`time(tf, session = sessionInput)`).
function unwrapTimeArgs(args: any[]): any[] {
    const unwrap = (a: any) => (a instanceof Series ? a.get(0) : a);
    const isNamedArgs = (a: any) => a !== null && typeof a === 'object' && Object.getPrototypeOf(a) === Object.prototype;
    return args.map((a) => (isNamedArgs(a) ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, unwrap(v)])) : unwrap(a)));
}

// ── Shared timezone utility ──────────────────────────────────────────

interface DateParts {
    year: number;
    month: number; // 1-12
    day: number; // 1-31
    hour: number; // 0-23
    minute: number; // 0-59
    second: number; // 0-59
    dayOfWeek: number; // JS convention: 0=Sun, 1=Mon, ..., 6=Sat
}

/**
 * Decompose a UTC-millisecond timestamp into calendar parts
 * interpreted in the given timezone.
 */
export function getDatePartsInTimezone(timestamp: number, timezone: string): DateParts {
    const tzNorm = timezone.trim();

    // Fast path: plain UTC / GMT / Etc/UTC
    if (tzNorm === 'UTC' || tzNorm === 'GMT' || tzNorm === 'Etc/UTC') {
        const d = new Date(timestamp);
        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            hour: d.getUTCHours(),
            minute: d.getUTCMinutes(),
            second: d.getUTCSeconds(),
            dayOfWeek: d.getUTCDay(),
        };
    }

    // UTC/GMT offset notation: "UTC+5", "GMT-03:30", etc.
    const offsetMatch = tzNorm.match(/^(?:UTC|GMT)([+-])(\d{1,2})(?::(\d{2}))?$/i);
    if (offsetMatch) {
        const sign = offsetMatch[1] === '+' ? 1 : -1;
        const offsetHours = parseInt(offsetMatch[2], 10);
        const offsetMinutes = parseInt(offsetMatch[3] || '0', 10);
        const totalOffsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;
        const d = new Date(timestamp + totalOffsetMs);
        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            hour: d.getUTCHours(),
            minute: d.getUTCMinutes(),
            second: d.getUTCSeconds(),
            dayOfWeek: d.getUTCDay(),
        };
    }

    // IANA timezone name — use Intl.DateTimeFormat
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            weekday: 'short',
            hour12: false,
        });
        const parts = formatter.formatToParts(new Date(timestamp));
        const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

        let hour = get('hour');
        if (hour === 24) hour = 0;

        const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Sun';
        const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

        return {
            year: get('year'),
            month: get('month'),
            day: get('day'),
            hour,
            minute: get('minute'),
            second: get('second'),
            dayOfWeek: dayMap[weekdayStr] ?? 0,
        };
    } catch {
        // Fallback to UTC on error
        const d = new Date(timestamp);
        return {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            day: d.getUTCDate(),
            hour: d.getUTCHours(),
            minute: d.getUTCMinutes(),
            second: d.getUTCSeconds(),
            dayOfWeek: d.getUTCDay(),
        };
    }
}

// ── ISO week number helper ───────────────────────────────────────────

/**
 * ISO 8601 week number (1-53). Monday-start, week containing Jan 4th is week 1.
 */
export function getISOWeekNumber(year: number, month: number, day: number): number {
    const date = new Date(Date.UTC(year, month - 1, day));
    // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
    const dayNum = date.getUTCDay() || 7; // Convert Sun=0 to Sun=7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    // Get first day of year
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Session-anchored higher-timeframe bars ──────────────────────────

/** A declared trading window in minutes of the exchange day; start >= end wraps midnight. */
export interface SessionSpan {
    start: number;
    end: number;
}

/** `HHMM-HHMM` → {@link SessionSpan} (`1800-1700` is the futures trading day); null for
 *  anything else — `24x7`, `regular`, absent — meaning "no session vocabulary". */
export function parseSessionSpan(s: unknown): SessionSpan | null {
    if (typeof s !== 'string') return null;
    const m = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(s);
    if (!m) return null;
    return { start: Number(m[1]) * 60 + Number(m[2]), end: Number(m[3]) * 60 + Number(m[4]) };
}

export function inSessionSpan(minuteOfDay: number, s: SessionSpan): boolean {
    return s.start < s.end ? minuteOfDay >= s.start && minuteOfDay < s.end : minuteOfDay >= s.start || minuteOfDay < s.end;
}

function wallMinuteOfDay(utcMs: number, timezone: string): number {
    const parts = getDatePartsInTimezone(utcMs, timezone);
    return parts.hour * 60 + parts.minute;
}

/**
 * The bar of `tf` holding a chart bar that opens at `openMs`, on a session market (TV
 * convention): intraday bars run every N minutes FROM THE SESSION OPEN and the last one is
 * cut at the session end; a 1D bar is the whole session — for futures 18:00 ET → 17:00 ET
 * the next day, not the UTC calendar day. null when the open lies outside the session or
 * `tf` is neither minutes nor 1D (the caller falls back to the UTC calendar grid).
 * Holidays and early closes are not modelled, and the offset is read at the open, so a
 * DST jump inside one session shifts its end by the jump.
 */
export function sessionTimeframeBar(openMs: number, tf: ParsedTimeframe, session: SessionSpan, timezone: string): { start: number; end: number } | null {
    const minute = wallMinuteOfDay(openMs, timezone);
    const length = (session.end - session.start + 1440) % 1440 || 1440;
    const sinceOpen = (minute - session.start + 1440) % 1440;
    if (sinceOpen >= length) return null;
    const sessionOpen = Math.floor(openMs / 60_000) * 60_000 - sinceOpen * 60_000;
    if (tf.unit === 'D' && tf.multiplier === 1) return { start: sessionOpen, end: sessionOpen + length * 60_000 };
    if (tf.unit !== '' || tf.multiplier >= 1440) return null;
    const bucket = Math.floor(sinceOpen / tf.multiplier) * tf.multiplier;
    return { start: sessionOpen + bucket * 60_000, end: sessionOpen + Math.min(bucket + tf.multiplier, length) * 60_000 };
}

// ── TimeHelper (moved from Core.ts) ─────────────────────────────────

//prettier-ignore
const TIME_SIGNATURES = [
    // time(timeframe)
    ['timeframe'],
    // time(timeframe, bars_back)
    ['timeframe', 'bars_back'],
    // time(timeframe, session, bars_back)
    ['timeframe', 'session', 'bars_back'],
    // time(timeframe, session, bars_back, timeframe_bars_back)
    ['timeframe', 'session', 'bars_back', 'timeframe_bars_back'],
    // time(timeframe, session, timezone, bars_back, timeframe_bars_back)
    ['timeframe', 'session', 'timezone', 'bars_back', 'timeframe_bars_back'],
];

//prettier-ignore
const TIME_ARGS_TYPES = {
    timeframe: 'string',
    session: 'string',
    timezone: 'string',
    bars_back: 'number',
    timeframe_bars_back: 'number',
};

/**
 * TimeHelper implements the dual-use `time` / `time_close` identifiers.
 * - Bare `time` → `time.__value` → openTime Series
 * - `time[1]` → `$.get(time.__value, 1)` → previous bar's time
 * - `time(timeframe)` → `time.any(timeframe)` → time function
 */
export class TimeHelper {
    private context: any;
    private dataField: string;

    constructor(context: any, dataField: string = 'openTime') {
        this.context = context;
        this.dataField = dataField;
    }

    get __value() {
        return this.context.data[this.dataField];
    }

    param(source: any, index: number = 0) {
        return Series.from(source).get(index);
    }

    any(...args: any[]) {
        const unwrapped = unwrapTimeArgs(args);
        const parsed = parseArgsForPineParams<any>(unwrapped, TIME_SIGNATURES, TIME_ARGS_TYPES);

        const barsBack = parsed.bars_back ?? 0;
        const timeframe = parsed.timeframe || '';

        // Get the current bar's timestamp (with bars_back offset on the chart TF)
        const timeSeries = this.context.data[this.dataField];
        const currentTime = Series.from(timeSeries).get(barsBack);
        if (isNaN(currentTime) || currentTime == null) return NaN;

        // If timeframe is empty or matches the chart timeframe, return the bar's own time
        let htfBarTime: number;
        let sessionCheckTime: number;
        if (!timeframe || canonicalTimeframe(timeframe) === canonicalTimeframe(this.context.timeframe)) {
            htfBarTime = currentTime;
            sessionCheckTime = currentTime;
        } else {
            const tf = parseTimeframe(timeframe);
            if (!tf) throw new PineRuntimeError(`Cannot parse resolution '${timeframe}'. - Invalid format`, 'time');
            // The bar of `timeframe` that contains this bar, located by this bar's OPEN —
            // a chart bar's close sits ON the next higher-timeframe boundary. `time` is its
            // open, `time_close` its close (it used to be the open too, so a countdown
            // `time_close("60") - timenow` was always negative).
            const openTime = Series.from(this.context.data.openTime).get(barsBack);
            const bar = this._sessionBar(openTime, tf);
            const start = bar ? bar.start : timeframeBarStart(openTime, tf);
            htfBarTime = this.dataField === 'closeTime' ? (bar ? bar.end : timeframeBarEnd(start, tf)) : start;
            sessionCheckTime = start;
        }

        // Session filtering
        if (parsed.session !== undefined && parsed.session !== '') {
            const timezone = parsed.timezone || this.context.pine?.syminfo?.timezone || 'UTC';
            return this._isInSession(sessionCheckTime, parsed.session, timezone) ? htfBarTime : NaN;
        }

        return htfBarTime;
    }

    /** undefined = not resolved yet; null = no session vocabulary (use the UTC grid). */
    private _activeSession: SessionSpan | null | undefined;

    /**
     * The higher-timeframe bar holding `openTime` on the symbol's declared trading session,
     * or null to fall back to the UTC calendar grid (see {@link sessionTimeframeBar}).
     */
    private _sessionBar(openTime: number, tf: ParsedTimeframe): { start: number; end: number } | null {
        if (this._activeSession === undefined) this._activeSession = this._resolveActiveSession();
        const timezone = this.context.pine?.syminfo?.timezone;
        if (!this._activeSession || typeof timezone !== 'string') return null;
        return sessionTimeframeBar(openTime, tf, this._activeSession, timezone);
    }

    /**
     * Which declared window the chart trades: `session_extended` when any chart bar opens
     * outside the regular window but inside the extended one (the ETH tape — a futures
     * trading day is 18:00 → 17:00 ET), else the regular `session`. Same rule as the
     * vela-pinets kline closer, so a bar's `time_close(tf)` agrees with the closeTime the
     * host stamped on the higher-timeframe series.
     */
    private _resolveActiveSession(): SessionSpan | null {
        const syminfo = this.context.pine?.syminfo;
        const regular = parseSessionSpan(syminfo?.session);
        const timezone = syminfo?.timezone;
        if (!regular || typeof timezone !== 'string') return null;
        const extended = parseSessionSpan(syminfo?.session_extended);
        if (!extended) return regular;
        const md = this.context.marketData;
        const opens: number[] = Array.isArray(md) && md.length > 0 ? md.map((k: any) => k.openTime) : Series.from(this.context.data.openTime).toArray();
        for (const t of opens) {
            const m = wallMinuteOfDay(t, timezone);
            if (m != null && !inSessionSpan(m, regular) && inSessionSpan(m, extended)) return extended;
        }
        return regular;
    }

    /**
     * Session check: parses a full Pine session string — comma-separated
     * "HHMM-HHMM" windows with an optional ":days" suffix (1=Sunday..7=Saturday)
     * — and tests whether the timestamp falls within the session.
     * Malformed session strings halt the script, mirroring TradingView.
     */
    private _isInSession(timestamp: number, session: string, timezone: string): boolean {
        const spec = parseSessionSpec(session);
        if (!spec) {
            throw new PineRuntimeError(`Invalid session specification: "${session}"`, 'time');
        }

        const parts = getDatePartsInTimezone(timestamp, timezone);
        const minutesOfDay = parts.hour * 60 + parts.minute;
        return isInSessionSpec(spec, minutesOfDay, parts.dayOfWeek);
    }
}

// ── TimeComponentHelper ──────────────────────────────────────────────

//prettier-ignore
const TIME_COMPONENT_SIGNATURES = [
    // dayofmonth(), hour(), etc. — no args
    [],
    // dayofmonth(time)
    ['time'],
    // dayofmonth(time, timezone)
    ['time', 'timezone'],
];

//prettier-ignore
const TIME_COMPONENT_ARGS_TYPES = {
    time: 'number',
    timezone: 'string',
};

/**
 * Single parameterized class for all 8 dual-use time component identifiers:
 * dayofmonth, dayofweek, hour, minute, month, second, weekofyear, year.
 *
 * - Bare `dayofmonth` → `$.get(dayofmonth.__value, 0)` → current bar's value
 * - `dayofmonth[1]` → `$.get(dayofmonth.__value, 1)` → previous bar's value
 * - `dayofmonth(time)` → extract from given timestamp
 * - `dayofmonth(time, timezone)` → extract from timestamp in given timezone
 *
 * `__value` MUST be a Series (same shape as TimeHelper.__value): these
 * identifiers are series in Pine, so history indexing has to reach previous
 * bars. A scalar here would make `$.get(hour.__value, 1)` ignore the offset
 * and `param(...)` fall into its one-element scalar buffer — `hour[1]` would
 * be na on every bar and `hour != hour[1]` would never fire.
 */
export class TimeComponentHelper {
    private context: any;
    private extractor: (parts: DateParts) => number;

    /** Extracted component per bar, kept in lockstep with data.openTime. */
    private _cache: number[] = [];
    private _cacheTimezone: string | null = null;

    constructor(context: any, extractor: (parts: DateParts) => number) {
        this.context = context;
        this.extractor = extractor;
    }

    get __value(): Series {
        const openTime = this.context.data.openTime;
        const times: any[] = openTime instanceof Series ? openTime.data : Array.isArray(openTime) ? openTime : [];
        const timezone = this.context.pine?.syminfo?.timezone || 'UTC';

        if (timezone !== this._cacheTimezone) {
            this._cache = [];
            this._cacheTimezone = timezone;
        }
        const cache = this._cache;
        // Streaming updates pop bars off openTime before re-pushing them;
        // truncate so re-processed bars are re-extracted.
        if (cache.length > times.length) cache.length = times.length;
        for (let i = cache.length; i < times.length; i++) {
            const t = times[i];
            cache.push(t == null || isNaN(t) ? NaN : this.extractor(getDatePartsInTimezone(t, timezone)));
        }

        return new Series(cache, openTime instanceof Series ? openTime.offset : 0);
    }

    param(source: any, index: number = 0) {
        return Series.from(source).get(index);
    }

    any(...args: any[]) {
        const unwrapped = unwrapTimeArgs(args);

        // No args → same as bare identifier (current bar's value)
        if (unwrapped.length === 0) {
            return this.__value.get(0);
        }

        const parsed = parseArgsForPineParams<any>(unwrapped, TIME_COMPONENT_SIGNATURES, TIME_COMPONENT_ARGS_TYPES);

        const timestamp = parsed.time;
        if (timestamp === undefined || isNaN(timestamp)) return NaN;

        const timezone = parsed.timezone || this.context.pine?.syminfo?.timezone || 'UTC';
        const parts = getDatePartsInTimezone(timestamp, timezone);
        return this.extractor(parts);
    }
}

// ── Extractor functions ──────────────────────────────────────────────

export const EXTRACTORS = {
    dayofmonth: (parts: DateParts) => parts.day,
    dayofweek: (parts: DateParts) => (parts.dayOfWeek === 0 ? 1 : parts.dayOfWeek + 1), // Pine: Sun=1..Sat=7
    hour: (parts: DateParts) => parts.hour,
    minute: (parts: DateParts) => parts.minute,
    month: (parts: DateParts) => parts.month,
    second: (parts: DateParts) => parts.second,
    weekofyear: (parts: DateParts) => getISOWeekNumber(parts.year, parts.month, parts.day),
    year: (parts: DateParts) => parts.year,
};
