// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';
import { parseArgsForPineParams } from './utils';

// ── Timeframe alignment utilities ───────────────────────────────────

/**
 * Normalize a Pine Script timeframe string to a canonical form.
 * e.g. "1D" → "D", "60" → "60", "1W" → "W", "" → ""
 */
export function normalizeTimeframe(tf: string): string {
    if (!tf) return '';
    const s = tf.trim().toUpperCase();
    if (s === '1D' || s === 'D') return 'D';
    if (s === '1W' || s === 'W') return 'W';
    if (s === '1M' || s === 'M') return 'M';
    // Strip leading "1" from minute timeframes only if it's just "1" (1 minute)
    return s;
}

/**
 * Compute the opening timestamp of the higher-timeframe bar that contains the given timestamp.
 *
 * For intraday TFs (minutes): floor to the nearest multiple of the TF duration within the day.
 * For daily: floor to UTC day start (00:00 UTC).
 * For weekly: floor to Monday 00:00 UTC.
 * For monthly: floor to 1st of month 00:00 UTC.
 */
export function alignToTimeframe(timestamp: number, tf: string): number {
    const MS_MIN = 60_000;
    const MS_DAY = 86_400_000;

    // Parse timeframe to minutes
    const tfMinutes = parseTimeframeMinutes(tf);

    if (tf === 'M') {
        // Monthly: floor to 1st of month 00:00 UTC
        const d = new Date(timestamp);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    }

    if (tf === 'W') {
        // Weekly: floor to Monday 00:00 UTC
        const d = new Date(timestamp);
        const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
        const daysToMonday = day === 0 ? 6 : day - 1;
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysToMonday);
    }

    if (tf === 'D' || tfMinutes >= 1440) {
        // Daily: floor to 00:00 UTC
        return Math.floor(timestamp / MS_DAY) * MS_DAY;
    }

    // Intraday: floor to the nearest multiple of the TF duration
    // Align relative to the start of the UTC day
    const tfMs = tfMinutes * MS_MIN;
    const dayStart = Math.floor(timestamp / MS_DAY) * MS_DAY;
    const elapsed = timestamp - dayStart;
    const alignedElapsed = Math.floor(elapsed / tfMs) * tfMs;
    return dayStart + alignedElapsed;
}

/**
 * Parse a Pine Script timeframe string to minutes.
 * "5" → 5, "60" → 60, "240" → 240, "D" → 1440, "W" → 10080, "M" → 43200
 */
function parseTimeframeMinutes(tf: string): number {
    if (tf === 'D') return 1440;
    if (tf === 'W') return 10080;
    if (tf === 'M') return 43200;
    const n = parseInt(tf, 10);
    return isNaN(n) ? 1440 : n;
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
        const unwrapped = args.map((a) => (a instanceof Series ? a.get(0) : a));
        const parsed = parseArgsForPineParams<any>(unwrapped, TIME_SIGNATURES, TIME_ARGS_TYPES);

        const barsBack = parsed.bars_back ?? 0;
        const timeframe = parsed.timeframe || '';

        // Get the current bar's timestamp (with bars_back offset on the chart TF)
        const timeSeries = this.context.data[this.dataField];
        const currentTime = Series.from(timeSeries).get(barsBack);
        if (isNaN(currentTime) || currentTime == null) return NaN;

        // If timeframe is empty or matches the chart timeframe, return the bar's own time
        const chartTF = this.context.timeframe || '';
        const normalizedTF = normalizeTimeframe(timeframe);
        const normalizedChartTF = normalizeTimeframe(chartTF);

        let htfBarTime: number;
        if (!normalizedTF || normalizedTF === normalizedChartTF) {
            htfBarTime = currentTime;
        } else {
            // Compute the opening timestamp of the higher-timeframe bar that contains this bar
            htfBarTime = alignToTimeframe(currentTime, normalizedTF);
        }

        // Session filtering
        if (parsed.session !== undefined && parsed.session !== '') {
            const timezone = parsed.timezone || this.context.pine?.syminfo?.timezone || 'UTC';
            return this._isInSession(htfBarTime, parsed.session, timezone) ? htfBarTime : NaN;
        }

        return htfBarTime;
    }

    /**
     * Basic session check: parses "HHMM-HHMM" format and tests if
     * the timestamp falls within the session window.
     */
    private _isInSession(timestamp: number, session: string, timezone: string): boolean {
        // Parse session format "HHMM-HHMM" (e.g. "0930-1600")
        const match = session.match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
        if (!match) return true; // If session format is unrecognized, pass through

        const startHour = parseInt(match[1], 10);
        const startMin = parseInt(match[2], 10);
        const endHour = parseInt(match[3], 10);
        const endMin = parseInt(match[4], 10);

        // Get hour/minute in the target timezone using the shared utility
        const parts = getDatePartsInTimezone(timestamp, timezone);
        const hour = parts.hour;
        const minute = parts.minute;

        const barTime = hour * 60 + minute;
        const sessionStart = startHour * 60 + startMin;
        const sessionEnd = endHour * 60 + endMin;

        if (sessionStart <= sessionEnd) {
            return barTime >= sessionStart && barTime < sessionEnd;
        }
        // Overnight session (e.g. "1800-0930")
        return barTime >= sessionStart || barTime < sessionEnd;
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
 * - Bare `dayofmonth` → `dayofmonth.__value` → extract from current bar openTime
 * - `dayofmonth(time)` → extract from given timestamp
 * - `dayofmonth(time, timezone)` → extract from timestamp in given timezone
 */
export class TimeComponentHelper {
    private context: any;
    private extractor: (parts: DateParts) => number;

    constructor(context: any, extractor: (parts: DateParts) => number) {
        this.context = context;
        this.extractor = extractor;
    }

    get __value() {
        const currentTime = Series.from(this.context.data.openTime).get(0);
        if (isNaN(currentTime)) return NaN;
        const timezone = this.context.pine?.syminfo?.timezone || 'UTC';
        const parts = getDatePartsInTimezone(currentTime, timezone);
        return this.extractor(parts);
    }

    param(source: any, index: number = 0) {
        return Series.from(source).get(index);
    }

    any(...args: any[]) {
        const unwrapped = args.map((a) => (a instanceof Series ? a.get(0) : a));

        // No args → same as bare identifier
        if (unwrapped.length === 0) {
            return this.__value;
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
