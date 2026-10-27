//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';
import { PineArrayObject, PineArrayType } from './array/PineArrayObject';
import { joinElements } from './array/format';
import { formatFloat, formatNumberPattern, formatVolume } from './numberFormat';
import { assertElementCount } from './limits';
import { DEFAULT_TIME_FORMAT, formatTime, resolveTimeZone } from './formatTime';

const FORMAT_TIME_PARAMS = ['time', 'format', 'timezone'];

const isNamedArgs = (a: any) => a !== null && typeof a === 'object' && Object.getPrototypeOf(a) === Object.prototype;

/** Positional arguments by parameter name, merged with the trailing named-arguments object; series are read at the current bar. */
function argsByName(args: any[], names: string[]): Record<string, any> {
    const out: Record<string, any> = {};
    args.forEach((a, i) => {
        if (isNamedArgs(a)) Object.assign(out, a);
        else if (i < names.length) out[names[i]] = a;
    });
    for (const k in out) if (out[k] instanceof Series) out[k] = out[k].get(0);
    return out;
}

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
        // A run of digits and dots is read up to its second dot: "1.2.3" is 1.2 and "1..2" is 1.
        if (/^[+-]?[\d.]+$/.test(s)) {
            const second = s.indexOf('.', s.indexOf('.') + 1);
            const head = second < 0 ? s : s.slice(0, second);
            return DECIMAL_NUMBER.test(head) ? Number(head) : NaN;
        }
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
        const n = typeof repeat === 'number' && repeat > 0 ? Math.floor(repeat) : 0;
        assertElementCount(n * (text(source).length + text(separator).length), 'str.repeat');
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

        // The empty target occurs before every character: ("abc", "", "X", 0) is "Xabc".
        if (tgt === '') {
            if (occ < 0 || occ > str.length) return str;
            return str.slice(0, occ) + repl + str.slice(occ);
        }

        let pos = 0;
        let found = 0;

        while (true) {
            const idx = str.indexOf(tgt, pos);
            if (idx === -1) return str;

            if (found === occ) {
                return str.substring(0, idx) + repl + str.substring(idx + tgt.length);
            }

            found++;
            // Occurrences may overlap: the second "aa" of "aaaa" starts at index 1.
            pos = idx + 1;
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
        // Pine returns the matched substring, or "" when nothing matches.
        const m = text(source).match(new RegExp(text(pattern)));
        return m ? m[0] : '';
    }

    split(source: string, separator: string) {
        const src = text(source);
        // An empty source always gives one empty element, even with an empty separator.
        const parts = src === '' ? [''] : src.split(text(separator));
        return new PineArrayObject(parts, PineArrayType.string, this.context);
    }
    substring(source: string, begin_pos: number, end_pos: number) {
        return text(source).substring(begin_pos, end_pos);
    }

    /**
     * Format a UNIX millisecond time with a java.text.SimpleDateFormat pattern in a time zone
     * (see formatTime.ts). `time`, `format` and `timezone` can be passed by name.
     */
    format_time(...args: any[]) {
        const { time, format, timezone } = argsByName(args, FORMAT_TIME_PARAMS);
        // TradingView formats an na time as the epoch and an na format as the empty pattern.
        const ts = isNa(time) ? 0 : Number(time);
        const pattern = format === undefined ? DEFAULT_TIME_FORMAT : text(format);
        if (timezone !== undefined) return formatTime(ts, pattern, text(timezone));
        const symbolTimezone = this.context.pine?.syminfo?.timezone;
        return formatTime(ts, pattern, symbolTimezone && resolveTimeZone(symbolTimezone) ? symbolTimezone : 'UTC');
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
