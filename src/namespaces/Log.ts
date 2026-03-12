//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';
import { getDatePartsInTimezone } from './Time';

/**
 * Compute the UTC offset (in minutes) for a given timestamp in a given timezone.
 * Returns 0 for UTC/GMT/Etc/UTC, and the correct offset for IANA/offset strings.
 */
function getTimezoneOffsetMinutes(timestamp: number, timezone: string): number {
    const tz = timezone.trim();
    if (tz === 'UTC' || tz === 'GMT' || tz === 'Etc/UTC') return 0;

    // UTC/GMT offset notation: "UTC+5", "GMT-03:30"
    const offsetMatch = tz.match(/^(?:UTC|GMT)([+-])(\d{1,2})(?::(\d{2}))?$/i);
    if (offsetMatch) {
        const sign = offsetMatch[1] === '+' ? 1 : -1;
        const hours = parseInt(offsetMatch[2], 10);
        const minutes = parseInt(offsetMatch[3] || '0', 10);
        return sign * (hours * 60 + minutes);
    }

    // IANA timezone — compute offset by comparing UTC parts with timezone parts
    const parts = getDatePartsInTimezone(timestamp, timezone);
    const tzDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
    return Math.round((tzDate.getTime() - timestamp) / 60000);
}

function formatWithTimezone(timestamp: number, offsetMinutes: number) {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

    const tz = sign + pad(offsetMinutes / 60) + ':' + pad(offsetMinutes % 60);

    // Build ISO-like string adjusted to the target timezone
    const adjusted = new Date(timestamp + offsetMinutes * 60000);
    return `[${adjusted.toISOString().slice(0, -1)}${tz}]`;
}

export class Log {
    constructor(private context: Context) {}

    private logFormat(message: string, ...args: any[]) {
        return message.replace(/{(\d+)}/g, (match, index) => args[index]);
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    private _formatTimestamp(): string {
        const timestamp = this.context.data['openTime'].data[this.context.idx];
        // Use chart timezone for display (like TradingView's timezone picker),
        // falling back to the exchange timezone from syminfo.
        const timezone = this.context.chartTimezone
            || this.context.pine?.syminfo?.timezone
            || 'UTC';
        const offset = getTimezoneOffsetMinutes(timestamp, timezone);
        return formatWithTimezone(timestamp, offset);
    }

    warning(message: string, ...args: any[]) {
        // Suppress log output in secondary contexts (created by request.security)
        // to match TradingView behavior — only the main chart context produces logs.
        if (this.context.isSecondaryContext) return;

        console.warn(`${this._formatTimestamp()} ${this.logFormat(message, ...args)}`);
    }
    error(message: string, ...args: any[]) {
        if (this.context.isSecondaryContext) return;

        console.error(`${this._formatTimestamp()} ${this.logFormat(message, ...args)}`);
    }
    info(message: string, ...args: any[]) {
        if (this.context.isSecondaryContext) return;

        console.log(`${this._formatTimestamp()} ${this.logFormat(message, ...args)}`);
    }
}
