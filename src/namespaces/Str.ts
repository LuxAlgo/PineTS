//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';

export class Str {
    constructor(private context: Context) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }
    tostring(value: any) {
        return String(value);
    }
    tonumber(value: any) {
        return Number(value);
    }
    lower(value: string) {
        return String(value).toLowerCase();
    }
    upper(value: string) {
        return String(value).toUpperCase();
    }
    trim(value: string) {
        return String(value).trim();
    }
    repeat(source: string, repeat: number, separator: string = '') {
        return Array(repeat)
            .fill(source)
            .join(separator || '');
    }
    replace_all(source: string, target: string, replacement: string) {
        return String(source).replaceAll(target, replacement);
    }

    //occurense is the nth occurrence to replace
    replace(source: string, target: string, replacement: string, occurrence: number = 0) {
        const str = String(source);
        const tgt = String(target);
        const repl = String(replacement);
        const occ = Math.floor(Number(occurrence)) || 0;

        if (tgt === '') return str;

        let pos = 0;
        let found = 0;

        while (true) {
            const idx = str.indexOf(tgt, pos);
            if (idx === -1) return str;

            if (found === occ) {
                return str.substring(0, idx) + repl + str.substring(idx + tgt.length);
            }

            found++;
            pos = idx + tgt.length;
        }
    }

    contains(source: string, target: string) {
        return String(source).includes(target);
    }
    endswith(source: string, target: string) {
        return String(source).endsWith(target);
    }
    startswith(source: string, target: string) {
        return String(source).startsWith(target);
    }
    pos(source: string, target: string) {
        const idx = String(source).indexOf(target);
        return idx === -1 ? NaN : idx;
    }
    length(source: string) {
        return String(source).length;
    }
    match(source: string, pattern: string) {
        return String(source).match(new RegExp(pattern));
    }

    split(source: string, separator: string) {
        return [String(source).split(separator)]; //we need to double wrap the array in an array to match the PineTS expected output structure
    }
    substring(source: string, begin_pos: number, end_pos: number) {
        return String(source).substring(begin_pos, end_pos);
    }

    format(message: string, ...args: any[]) {
        return message.replace(/{(\d+)}/g, (match, index) => args[index]);
    }

    /**
     * Converts a UNIX timestamp to a formatted string using the specified format and timezone.
     * @param time - UNIX timestamp in milliseconds
     * @param format - Format pattern string (e.g., "yyyy.MM.dd HH:mm:ss")
     * @param timezone - Optional timezone (e.g., "America/New_York", "UTC")
     * @returns Formatted date/time string
     *
     * Supported format patterns:
     * - yyyy/YYYY: 4-digit year
     * - yy/YY: 2-digit year
     * - MM: Month (01-12)
     * - MMM: Month short name (Jan, Feb...)
     * - MMMM: Month full name (January, February...)
     * - dd: Day of month (01-31)
     * - d: Day of month (1-31)
     * - HH: Hour 24h (00-23)
     * - H: Hour 24h (0-23)
     * - hh: Hour 12h (01-12)
     * - h: Hour 12h (1-12)
     * - mm: Minutes (00-59)
     * - m: Minutes (0-59)
     * - ss: Seconds (00-59)
     * - s: Seconds (0-59)
     * - SSS: Milliseconds (000-999)
     * - a: AM/PM
     * - z: Timezone abbreviation
     * - EEEE: Day of week full (Monday...)
     * - EEE/E: Day of week short (Mon...)
     */
    format_time(time: number, format: string = 'yyyy.MM.dd HH:mm:ss', timezone?: string): string {
        if (time === null || time === undefined || Number.isNaN(time)) {
            return '';
        }

        const date = new Date(time);

        // Get date components in the specified timezone
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timezone || 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            weekday: 'long',
        };

        let parts: Record<string, string> = {};
        try {
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const formatParts = formatter.formatToParts(date);

            for (const part of formatParts) {
                parts[part.type] = part.value;
            }
        } catch (e) {
            // Fallback to UTC if timezone is invalid
            const formatter = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' });
            const formatParts = formatter.formatToParts(date);
            for (const part of formatParts) {
                parts[part.type] = part.value;
            }
        }

        const year = parts.year || '';
        const month = parts.month || '';
        const day = parts.day || '';
        const hour24 = parts.hour || '';
        const minute = parts.minute || '';
        const second = parts.second || '';
        const weekday = parts.weekday || '';
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');

        // Calculate 12-hour format
        const hour24Num = parseInt(hour24, 10);
        const hour12Num = hour24Num === 0 ? 12 : hour24Num > 12 ? hour24Num - 12 : hour24Num;
        const hour12 = String(hour12Num).padStart(2, '0');
        const ampm = hour24Num >= 12 ? 'PM' : 'AM';

        // Get short month name
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthFullNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        const monthIndex = parseInt(month, 10) - 1;
        const monthShort = monthNames[monthIndex] || '';
        const monthFull = monthFullNames[monthIndex] || '';

        // Get short weekday
        const weekdayShort = weekday.substring(0, 3);

        // Get timezone abbreviation
        let tzAbbr = '';
        try {
            const tzFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone || 'UTC',
                timeZoneName: 'short',
            });
            const tzParts = tzFormatter.formatToParts(date);
            const tzPart = tzParts.find((p) => p.type === 'timeZoneName');
            tzAbbr = tzPart ? tzPart.value : '';
        } catch (e) {
            tzAbbr = 'UTC';
        }

        // Use placeholder tokens to avoid regex conflicts
        // Replace patterns with unique tokens first, then replace tokens with values
        let result = format;

        // Define unique placeholder tokens
        const tokens: Record<string, string> = {};
        let tokenIndex = 0;
        const getToken = (value: string): string => {
            const token = `\x00${tokenIndex++}\x00`;
            tokens[token] = value;
            return token;
        };

        // Replace patterns with tokens (order matters - longer patterns first)

        // Year
        result = result.replace(/yyyy|YYYY/g, getToken(year));
        result = result.replace(/yy|YY/g, getToken(year.slice(-2)));

        // Month (must come before minutes 'mm')
        result = result.replace(/MMMM/g, getToken(monthFull));
        result = result.replace(/MMM/g, getToken(monthShort));
        result = result.replace(/MM/g, getToken(month));

        // Day of week (must come before day 'dd')
        result = result.replace(/EEEE/g, getToken(weekday));
        result = result.replace(/EEE/g, getToken(weekdayShort));
        result = result.replace(/(?<![A-Za-z])E(?![A-Za-z])/g, getToken(weekdayShort));

        // Day
        result = result.replace(/dd/g, getToken(day));
        result = result.replace(/(?<![A-Za-z])d(?![A-Za-z])/g, getToken(String(parseInt(day, 10))));

        // Hour 24h
        result = result.replace(/HH/g, getToken(hour24));
        result = result.replace(/(?<![A-Za-z])H(?![A-Za-z])/g, getToken(String(parseInt(hour24, 10))));

        // Hour 12h
        result = result.replace(/hh/g, getToken(hour12));
        result = result.replace(/(?<![A-Za-z])h(?![A-Za-z])/g, getToken(String(hour12Num)));

        // Minutes
        result = result.replace(/mm/g, getToken(minute));
        result = result.replace(/(?<![A-Za-z])m(?![A-Za-z])/g, getToken(String(parseInt(minute, 10))));

        // Seconds
        result = result.replace(/ss/g, getToken(second));
        result = result.replace(/(?<![A-Za-z])s(?![A-Za-z])/g, getToken(String(parseInt(second, 10))));

        // Milliseconds
        result = result.replace(/SSS/g, getToken(ms));

        // AM/PM (only match standalone 'a', not 'a' within words)
        result = result.replace(/(?<![A-Za-z])a(?![A-Za-z])/g, getToken(ampm));

        // Timezone
        result = result.replace(/(?<![A-Za-z])z(?![A-Za-z])/g, getToken(tzAbbr));

        // Replace all tokens with their values
        for (const [token, value] of Object.entries(tokens)) {
            result = result.split(token).join(value);
        }

        return result;
    }
}
