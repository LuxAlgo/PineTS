// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Timeframe strings — the single parser behind `request.security*`, `timeframe.*`,
 * `time()` and the market-data providers.
 *
 * Pine timeframe strings: minutes as plain integers ("1", "60", "360", "1440"), seconds
 * as "NS", and calendar units "ND", "NW", "NM" with the multiplier optional when it is 1
 * ("D" = "1D"). PineTS also accepts the provider-style aliases used for chart timeframes
 * ("1m", "15m", "1h", "4H", "1d", "1w", lowercase "d" / "w" / "m"); TradingView itself
 * rejects those in scripts.
 */

export type TimeframeUnit = 'S' | '' | 'D' | 'W' | 'M';

export interface ParsedTimeframe {
    /** '' = minutes */
    unit: TimeframeUnit;
    multiplier: number;
}

/** TradingView's month length in timeframe arithmetic: 365 / 12 days (2628003 s). */
export const MONTH_SECONDS = 2628003;

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MAX_MINUTES = 1440;

const cache = new Map<string, ParsedTimeframe | null>();

/** Parse a timeframe string. Returns `null` for anything that is not a timeframe (including ""). */
export function parseTimeframe(timeframe: unknown): ParsedTimeframe | null {
    if (typeof timeframe === 'number') timeframe = String(timeframe);
    if (typeof timeframe !== 'string') return null;
    if (cache.has(timeframe)) return cache.get(timeframe)!;
    const parsed = parseUncached(timeframe.trim());
    cache.set(timeframe, parsed);
    return parsed;
}

function parseUncached(tf: string): ParsedTimeframe | null {
    const match = /^(\d*)([a-zA-Z]?)$/.exec(tf);
    if (!match || tf === '') return null;
    const digits = match[1];
    const letter = match[2];
    const multiplier = digits === '' ? 1 : parseInt(digits, 10);
    if (!(multiplier >= 1)) return null;

    let parsed: ParsedTimeframe | null;
    switch (letter) {
        case '':
            parsed = { unit: '', multiplier };
            break;
        case 'S':
        case 's':
            parsed = { unit: 'S', multiplier };
            break;
        case 'D':
        case 'd':
            parsed = { unit: 'D', multiplier };
            break;
        case 'W':
        case 'w':
            parsed = { unit: 'W', multiplier };
            break;
        case 'M':
            parsed = { unit: 'M', multiplier };
            break;
        case 'm':
            // "15m" is 15 minutes (provider style); a bare "m" is a month.
            parsed = digits === '' ? { unit: 'M', multiplier: 1 } : { unit: '', multiplier };
            break;
        case 'H':
        case 'h':
            parsed = { unit: '', multiplier: multiplier * 60 };
            break;
        default:
            parsed = null;
    }
    if (parsed && parsed.unit === '' && parsed.multiplier > MAX_MINUTES) return null;
    return parsed;
}

/**
 * Pine string form of a timeframe. Calendar units with a multiplier of 1 are written
 * without it ("D", "W", "M") unless `withUnitMultiplier` is set, which is how Pine v6
 * reports `timeframe.period` and how `timeframe.from_seconds` always answers ("1D").
 */
export function formatTimeframe(tf: ParsedTimeframe, withUnitMultiplier = false): string {
    if (tf.unit === '') return String(tf.multiplier);
    if (tf.unit === 'S') return `${tf.multiplier}S`;
    return tf.multiplier === 1 && !withUnitMultiplier ? tf.unit : `${tf.multiplier}${tf.unit}`;
}

/** Canonical key of a timeframe string ("1h" -> "60", "1D" -> "D", "2d" -> "2D"), or `null` when invalid. */
export function canonicalTimeframe(timeframe: unknown): string | null {
    const tf = parseTimeframe(timeframe);
    return tf ? formatTimeframe(tf) : null;
}

/** Length in seconds, as `timeframe.in_seconds` computes it (a month is {@link MONTH_SECONDS}). */
export function timeframeSeconds(tf: ParsedTimeframe): number {
    switch (tf.unit) {
        case 'S':
            return tf.multiplier;
        case '':
            return tf.multiplier * 60;
        case 'D':
            return tf.multiplier * 86400;
        case 'W':
            return tf.multiplier * 604800;
        case 'M':
            return tf.multiplier * MONTH_SECONDS;
    }
}

/** Timeframe string for a number of seconds, rounded up to the next valid timeframe (`timeframe.from_seconds`). */
export function timeframeFromSeconds(seconds: number): string {
    if (seconds >= 365 * 86400) return '12M';
    if (seconds <= 30) {
        const step = [1, 5, 10, 15, 30].find((s) => seconds <= s)!;
        return `${step}S`;
    }
    if (seconds < 86400) return String(Math.ceil(seconds / 60));
    if (seconds % 604800 === 0) return `${seconds / 604800}W`;
    if (seconds % MONTH_SECONDS === 0) return `${seconds / MONTH_SECONDS}M`;
    return `${Math.ceil(seconds / 86400)}D`;
}

function firstMondayOfYear(year: number): number {
    const jan1 = Date.UTC(year, 0, 1);
    const weekday = new Date(jan1).getUTCDay();
    return jan1 + ((8 - weekday) % 7) * DAY_MS;
}

/**
 * Open time of the bar of `tf` that contains `timestamp` (UTC calendar, as TradingView
 * builds bars for a UTC 24/7 symbol). Every grid restarts at a calendar boundary, so the
 * bar before a restart is shorter:
 * - seconds / minutes: every N from 00:00 of the day;
 * - ND: every N days from January 1;
 * - NW: every N weeks from the first Monday of the year;
 * - NM: every N months from January.
 */
export function timeframeBarStart(timestamp: number, tf: ParsedTimeframe): number {
    const n = tf.multiplier;
    const d = new Date(timestamp);
    const year = d.getUTCFullYear();
    switch (tf.unit) {
        case 'S':
        case '': {
            const stepMs = timeframeSeconds(tf) * 1000;
            const dayStart = Math.floor(timestamp / DAY_MS) * DAY_MS;
            return dayStart + Math.floor((timestamp - dayStart) / stepMs) * stepMs;
        }
        case 'D': {
            const yearStart = Date.UTC(year, 0, 1);
            const day = Math.floor((timestamp - yearStart) / DAY_MS);
            return yearStart + Math.floor(day / n) * n * DAY_MS;
        }
        case 'W': {
            const dayStart = Math.floor(timestamp / DAY_MS) * DAY_MS;
            const monday = dayStart - ((d.getUTCDay() + 6) % 7) * DAY_MS;
            const firstMonday = firstMondayOfYear(new Date(monday).getUTCFullYear());
            const week = Math.round((monday - firstMonday) / WEEK_MS);
            return firstMonday + Math.floor(week / n) * n * WEEK_MS;
        }
        case 'M':
            return Date.UTC(year, Math.floor(d.getUTCMonth() / n) * n, 1);
    }
}

/** Close time of the bar of `tf` that opens at `barStart` (see {@link timeframeBarStart}). */
export function timeframeBarEnd(barStart: number, tf: ParsedTimeframe): number {
    const n = tf.multiplier;
    const d = new Date(barStart);
    const year = d.getUTCFullYear();
    switch (tf.unit) {
        case 'S':
        case '': {
            const dayEnd = (Math.floor(barStart / DAY_MS) + 1) * DAY_MS;
            return Math.min(barStart + timeframeSeconds(tf) * 1000, dayEnd);
        }
        case 'D':
            return Math.min(barStart + n * DAY_MS, Date.UTC(year + 1, 0, 1));
        case 'W':
            return Math.min(barStart + n * WEEK_MS, firstMondayOfYear(year + 1));
        case 'M':
            return Math.min(Date.UTC(year, d.getUTCMonth() + n, 1), Date.UTC(year + 1, 0, 1));
    }
}
