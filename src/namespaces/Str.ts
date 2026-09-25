//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';
import { PineArrayObject, PineArrayType } from './array/PineArrayObject';
import { getDatePartsInTimezone } from './Time';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number, len: number) => String(n).padStart(len, '0');

// Named number formats of str.format placeholders ({0,number,integer}, …), as DecimalFormat patterns.
const MESSAGE_NUMBER_FORMATS: Record<string, string> = { '': '#,##0.###', integer: '#,##0', percent: '#,##0%', currency: '$#,##0.00' };

// Integer and fraction digits of a non-negative number, from its shortest round-trip
// representation, with the decimal point moved right by `shift` places (exact % scaling).
function plainDecimal(abs: number, shift: number): [string, string] {
    const m = String(abs).match(/^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/);
    if (!m) return [String(abs), ''];
    let digits = m[1] + (m[2] ?? '');
    let point = m[1].length + Number(m[3] ?? 0) + shift;
    if (point <= 0) {
        digits = '0'.repeat(1 - point) + digits;
        point = 1;
    }
    if (point > digits.length) digits += '0'.repeat(point - digits.length);
    return [digits.slice(0, point), digits.slice(point)];
}

// Rounds a decimal digit string to `maxFrac` fraction digits, half up or half even.
function roundDecimal(int: string, frac: string, maxFrac: number, halfEven: boolean): [string, string] {
    if (frac.length <= maxFrac) return [int, frac];
    let digits = int + frac.slice(0, maxFrac);
    const first = Number(frac[maxFrac]);
    const tail = frac.slice(maxFrac + 1);
    const lastKeptOdd = Number(digits[digits.length - 1]) % 2 === 1;
    if (first > 5 || (first === 5 && (!halfEven || /[1-9]/.test(tail) || lastKeptOdd))) {
        const chars = digits.split('');
        let i = chars.length - 1;
        while (i >= 0 && chars[i] === '9') chars[i--] = '0';
        if (i >= 0) chars[i] = String(Number(chars[i]) + 1);
        else chars.unshift('1');
        digits = chars.join('');
    }
    const intLen = digits.length - maxFrac;
    return [digits.slice(0, intLen), digits.slice(intLen)];
}

/**
 * Formats a number with a DecimalFormat-style pattern: literal prefix and suffix, `0` / `#`
 * digits, `,` grouping, `.` fraction and `%` (×100). str.tostring rounds half up and prints
 * a value that rounds to zero without its sign; str.format rounds half even and keeps it.
 * Returns null when the pattern has no digit placeholder.
 */
function formatNumberPattern(value: number, pattern: string, halfEven: boolean): string | null {
    if (!Number.isFinite(value)) return String(value);
    const m = pattern.match(/^([^#0,.]*)([#0,]*)(?:\.([#0]*))?([\s\S]*)$/);
    if (!m || !/[#0]/.test(m[2] + (m[3] ?? ''))) return null;
    const [, prefix, intPattern, fracPattern = '', suffix] = m;
    const scale = (prefix + suffix).includes('%') ? 100 : 1;
    const minInt = (intPattern.match(/0/g) ?? []).length;
    const comma = intPattern.lastIndexOf(',');
    const groupSize = comma >= 0 ? intPattern.length - comma - 1 : 0;
    const minFrac = (fracPattern.match(/0/g) ?? []).length;
    const maxFrac = fracPattern.length;

    // Digits come from the shortest decimal representation of the double, rounded decimally
    // ("0.0005" is a tie, "3.141592653589793" padded with zeros), like TradingView.
    const [intPart, fracPart] = plainDecimal(Math.abs(value), scale === 100 ? 2 : 0);
    const [roundedInt, roundedFrac] = roundDecimal(intPart, fracPart, maxFrac, halfEven);
    const isZero = !/[1-9]/.test(roundedInt + roundedFrac);

    let intDigits = roundedInt.replace(/^0+/, '');
    let frac = roundedFrac.padEnd(maxFrac, '0');
    while (frac.length > minFrac && frac.endsWith('0')) frac = frac.slice(0, -1);
    if (intDigits.length < minInt) intDigits = intDigits.padStart(minInt, '0');
    if (!intDigits && minFrac === 0) intDigits = '0';
    if (groupSize > 0) intDigits = intDigits.replace(new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, 'g'), ',');

    const negative = value < 0 && (halfEven || !isZero);
    return (negative ? '-' : '') + prefix + intDigits + (frac ? '.' + frac : '') + suffix;
}

export class Str {
    constructor(private context: Context) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }
    tostring(value: any, formatStr?: string) {
        if (typeof value !== 'number' || isNaN(value) || !formatStr) {
            return String(value);
        }

        // Named format: mintick
        if (formatStr === 'mintick') {
            const mintick = this.context.pine?.syminfo?.mintick || 0.01;
            const decimals = Math.max(0, -Math.floor(Math.log10(mintick)));
            return value.toFixed(decimals);
        }

        // Named format: integer
        if (formatStr === 'integer') {
            return String(Math.round(value));
        }

        // Named format: percent
        if (formatStr === 'percent') {
            return (value * 100).toFixed(2) + '%';
        }

        // Named format: price — same as mintick
        if (formatStr === 'price') {
            const mintick = this.context.pine?.syminfo?.mintick || 0.01;
            const decimals = Math.max(0, -Math.floor(Math.log10(mintick)));
            return value.toFixed(decimals);
        }

        // Named format: volume
        if (formatStr === 'volume') {
            return String(Math.round(value));
        }

        // Pattern-based format: "#", "#.##", "0.000", "#,##0.0", "    #.0", "0 bars", …
        return formatNumberPattern(value, formatStr, false) ?? String(value);
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
        return new PineArrayObject(String(source).split(separator), PineArrayType.string, this.context);
    }
    substring(source: string, begin_pos: number, end_pos: number) {
        return String(source).substring(begin_pos, end_pos);
    }

    /**
     * Format a UNIX millisecond timestamp using Java SimpleDateFormat-style tokens
     * (yyyy, MM, dd, HH, mm, ss, EEE, EEEE, MMM, MMMM, a, h, S, Z, etc.).
     * Text inside single quotes is treated as a literal; '' produces a literal '.
     */
    format_time(time: any, format: string = "yyyy-MM-dd'T'HH:mm:ssZ", timezone?: string) {
        if (time === null || time === undefined || (typeof time === 'number' && isNaN(time))) {
            return 'NaN';
        }
        const ts = Number(time);
        const tz = timezone || this.context.pine?.syminfo?.timezone || 'UTC';
        const parts = getDatePartsInTimezone(ts, tz);

        // Compute timezone offset (for Z token) by comparing tz-local recomposed UTC ms to actual ts
        const tzAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
        const offsetMin = Math.round((tzAsUtc - ts) / 60000);

        // Day of year (in target tz)
        const startOfYearUtc = Date.UTC(parts.year, 0, 1);
        const dayOfYear = Math.floor((tzAsUtc - startOfYearUtc) / 86400000) + 1;

        const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;

        let result = '';
        let i = 0;
        while (i < format.length) {
            const ch = format[i];

            // Single-quoted literal
            if (ch === "'") {
                if (format[i + 1] === "'") { result += "'"; i += 2; continue; }
                const end = format.indexOf("'", i + 1);
                if (end === -1) { result += format.substring(i + 1); break; }
                result += format.substring(i + 1, end);
                i = end + 1;
                continue;
            }

            // Pattern token: count consecutive same-letter chars
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
                let count = 1;
                while (format[i + count] === ch) count++;
                i += count;

                switch (ch) {
                    case 'y':
                        result += count === 2 ? pad(parts.year % 100, 2) : count >= 4 ? pad(parts.year, 4) : String(parts.year);
                        break;
                    case 'M':
                        if (count >= 4) result += MONTH_LONG[parts.month - 1];
                        else if (count === 3) result += MONTH_SHORT[parts.month - 1];
                        else if (count === 2) result += pad(parts.month, 2);
                        else result += String(parts.month);
                        break;
                    case 'd':
                        result += count === 2 ? pad(parts.day, 2) : String(parts.day);
                        break;
                    case 'D':
                        result += count >= 3 ? pad(dayOfYear, 3) : count === 2 ? pad(dayOfYear, 2) : String(dayOfYear);
                        break;
                    case 'E':
                        result += count >= 4 ? DAY_LONG[parts.dayOfWeek] : DAY_SHORT[parts.dayOfWeek];
                        break;
                    case 'a':
                        result += parts.hour < 12 ? 'AM' : 'PM';
                        break;
                    case 'h':
                        result += count === 2 ? pad(hour12, 2) : String(hour12);
                        break;
                    case 'H':
                        result += count === 2 ? pad(parts.hour, 2) : String(parts.hour);
                        break;
                    case 'm':
                        result += count === 2 ? pad(parts.minute, 2) : String(parts.minute);
                        break;
                    case 's':
                        result += count === 2 ? pad(parts.second, 2) : String(parts.second);
                        break;
                    case 'S': {
                        const ms = ts - Math.floor(ts / 1000) * 1000;
                        result += pad(ms, 3).substring(0, count);
                        break;
                    }
                    case 'Z': {
                        const sign = offsetMin >= 0 ? '+' : '-';
                        const absMin = Math.abs(offsetMin);
                        result += `${sign}${pad(Math.floor(absMin / 60), 2)}${pad(absMin % 60, 2)}`;
                        break;
                    }
                    default:
                        // Unknown letter token — leave as-is
                        result += ch.repeat(count);
                }
                continue;
            }

            // Literal char
            result += ch;
            i++;
        }
        return result;
    }

    format(message: string, ...args: any[]) {
        // {0}, {0,number}, {0,number,integer|percent|currency} and {0,number,<pattern>}.
        // Numbers are formatted like Java's MessageFormat: {0} uses "#,##0.###", half-even rounding.
        return message.replace(/\{(\d+)(?:,number(?:,([^}]*))?)?\}/g, (match, index, fmt) => {
            const val = args[index];
            if (typeof val === 'number' && !isNaN(val)) {
                const pattern = MESSAGE_NUMBER_FORMATS[(fmt ?? '').trim()] ?? fmt;
                return formatNumberPattern(val, pattern, true) ?? String(val);
            }
            return String(val);
        });
    }
}
