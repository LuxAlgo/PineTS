//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';
import { PineArrayObject, PineArrayType } from './array/PineArrayObject';
import { joinElements } from './array/format';
import { getDatePartsInTimezone } from './Time';
import { formatFloat, formatNumberPattern, formatVolume } from './numberFormat';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number, len: number) => String(n).padStart(len, '0');

// Named number formats of str.format placeholders ({0,number,integer}, …), as DecimalFormat patterns.
const MESSAGE_NUMBER_FORMATS: Record<string, string> = { '': '#,##0.###', integer: '#,##0', percent: '#,##0%', currency: '$#,##0.00' };

const isNa = (v: any) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

// An na string is the empty string: `str.length(string(na))` is 0, `"a" + string(na)` is "a".
const text = (v: any): string => (isNa(v) ? '' : String(v));

// A plain decimal number, after trimming whitespace (no exponent, hex, binary or Infinity).
const DECIMAL_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

/** Text of a str.format argument without a format type, as Java's MessageFormat prints it. */
function messageArgument(val: any): string {
    if (typeof val === 'number') return Number.isNaN(val) ? 'NaN' : formatNumberPattern(val, MESSAGE_NUMBER_FORMATS[''], 'halfEven');
    if (val instanceof PineArrayObject) return '[' + joinElements(val).join(', ') + ']';
    return String(val);
}

export class Str {
    constructor(private context: Context) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }
    tostring(value: any, formatStr?: string) {
        if (typeof value !== 'number') {
            return typeof value === 'string' ? value : String(value);
        }
        // Without a format, floats print at most 10 decimals and no exponent below 1e21.
        if (!formatStr) return formatFloat(value);

        // format.mintick: the symbol's tick decimals, rounded half up.
        if (formatStr === 'mintick') {
            const mintick = this.context.pine?.syminfo?.mintick || 0.01;
            const decimals = Math.max(0, -Math.floor(Math.log10(mintick)));
            return formatNumberPattern(value, decimals ? '0.' + '0'.repeat(decimals) : '0', 'halfUp');
        }

        // format.percent appends "%" to the value with 2 decimals (no ×100).
        if (formatStr === 'percent') {
            return formatNumberPattern(value, '0.00', 'halfUp') + '%';
        }

        // format.volume: 1.235M, 2.5B, 12K, 999.
        if (formatStr === 'volume') {
            return formatVolume(value);
        }

        // Any other string is a DecimalFormat pattern: "#", "#.##", "0.000", "#,##0.0", "0 bars", …
        // (format.price / format.inherit and other text without digits are a literal prefix.)
        return formatNumberPattern(value, formatStr, 'halfUp');
    }
    tonumber(value: any) {
        const s = text(value).replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
        return DECIMAL_NUMBER.test(s) ? Number(s) : NaN;
    }
    lower(value: string) {
        return text(value).toLowerCase();
    }
    upper(value: string) {
        return text(value).toUpperCase();
    }
    trim(value: string) {
        return text(value).trim();
    }
    repeat(source: string, repeat: number, separator: string = '') {
        return Array(repeat)
            .fill(text(source))
            .join(text(separator));
    }
    replace_all(source: string, target: string, replacement: string) {
        return text(source).replaceAll(text(target), text(replacement));
    }

    //occurense is the nth occurrence to replace
    replace(source: string, target: string, replacement: string, occurrence: number = 0) {
        const str = text(source);
        const tgt = text(target);
        const repl = text(replacement);
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
        return text(source).includes(text(target));
    }
    endswith(source: string, target: string) {
        return text(source).endsWith(text(target));
    }
    startswith(source: string, target: string) {
        return text(source).startsWith(text(target));
    }
    pos(source: string, target: string) {
        const idx = text(source).indexOf(text(target));
        return idx === -1 ? NaN : idx;
    }
    length(source: string) {
        return text(source).length;
    }
    match(source: string, pattern: string) {
        return text(source).match(new RegExp(pattern));
    }

    split(source: string, separator: string) {
        return new PineArrayObject(text(source).split(text(separator)), PineArrayType.string, this.context);
    }
    substring(source: string, begin_pos: number, end_pos: number) {
        return text(source).substring(begin_pos, end_pos);
    }

    /**
     * Format a UNIX millisecond timestamp using Java SimpleDateFormat-style tokens
     * (yyyy, MM, dd, HH, mm, ss, EEE, EEEE, MMM, MMMM, a, h, S, Z, etc.).
     * Text inside single quotes is treated as a literal; '' produces a literal '.
     */
    format_time(time: any, format: string = "yyyy-MM-dd'T'HH:mm:ssZ", timezone?: string) {
        // TradingView formats an na time as the epoch (1970-01-01).
        const ts = isNa(time) ? 0 : Number(time);
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

    /**
     * Java MessageFormat, as TradingView runs it: `{0}`, `{0,number}`,
     * `{0,number,integer|percent|currency|<pattern>}`, `''` for a quote and `'...'` for literal
     * text. A placeholder without an argument stays `{n}`; a malformed placeholder is a runtime
     * error with Java's message. Date, time and choice placeholders are left as written.
     */
    format(message: string, ...args: any[]) {
        const pattern = text(message);
        let out = '';
        let inQuote = false;
        let i = 0;
        while (i < pattern.length) {
            const ch = pattern[i];
            if (ch === "'") {
                if (pattern[i + 1] === "'") {
                    out += "'";
                    i += 2;
                } else {
                    inQuote = !inQuote;
                    i++;
                }
                continue;
            }
            if (ch !== '{' || inQuote) {
                out += ch;
                i++;
                continue;
            }
            // Argument: index[,type[,style]] up to the matching '}'
            const segments = ['', '', ''];
            let part = 0;
            let depth = 0;
            let quoted = false;
            let j = i + 1;
            for (; j < pattern.length; j++) {
                const c = pattern[j];
                if (quoted) {
                    segments[part] += c;
                    if (c === "'") quoted = false;
                } else if (c === ',' && part < 2) part++;
                else if (c === '{') {
                    depth++;
                    segments[part] += c;
                } else if (c === '}') {
                    if (depth === 0) break;
                    depth--;
                    segments[part] += c;
                } else if (c === ' ') {
                    if (part !== 1 || segments[1].length > 0) segments[part] += c;
                } else {
                    if (c === "'") quoted = true;
                    segments[part] += c;
                }
            }
            if (j >= pattern.length) throw new Error('Unmatched braces in the pattern.');
            out += this._formatArgument(segments, pattern.slice(i, j + 1), args);
            i = j + 1;
        }
        return out;
    }

    private _formatArgument([index, type, style]: string[], raw: string, args: any[]): string {
        if (!/^[+-]?\d+$/.test(index)) throw new Error(`can't parse argument number: ${index}`);
        const n = Number(index);
        if (n < 0) throw new Error(`negative argument number: ${index}`);
        const kind = type.trim().toLowerCase();
        if (kind !== '' && kind !== 'number') {
            if (kind === 'date' || kind === 'time' || kind === 'choice') return raw;
            throw new Error(`unknown format type: ${type}`);
        }
        if (n >= args.length || args[n] === undefined) return `{${n}}`;
        const val = args[n];
        if (kind === '' || typeof val !== 'number') return messageArgument(val);
        if (Number.isNaN(val)) return 'NaN';
        return formatNumberPattern(val, MESSAGE_NUMBER_FORMATS[style.trim().toLowerCase()] ?? style, 'halfEven');
    }
}
