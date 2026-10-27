//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';
import { PineArrayObject, PineArrayType } from './array/PineArrayObject';
import { boundedArrayText } from './array/format';
import { formatFloat, formatNumberPattern, formatVolume } from './numberFormat';
import { assertElementCount, assertStringLength, MAX_COLLECTION_ELEMENTS, MAX_STRING_CODE_UNITS } from './limits';
import { PineRuntimeError } from '../errors/PineRuntimeError';
import { javaRegexFind } from './javaRegex';
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
const MAX_FORMAT_PATTERN_LENGTH = 4096;

/** Text of a str.format argument without a format type, as Java's MessageFormat prints it. */
function messageArgument(val: any, maxLength: number, charge: (work: number, bytes: number) => void): string {
    if (typeof val === 'number') return Number.isNaN(val) ? 'NaN' : formatNumberPattern(val, MESSAGE_NUMBER_FORMATS[''], 'halfEven');
    if (val instanceof PineArrayObject) return boundedArrayText(val, 'join', maxLength, 'str.format', charge);
    return String(val);
}

export class Str {
    constructor(private context: Context) {}

    private bounded(value: any, method: string): string {
        const result = value instanceof PineArrayObject
            ? boundedArrayText(value, 'tostring', MAX_STRING_CODE_UNITS, method, (work, bytes) => this.charge(work, bytes, method))
            : text(value);
        assertStringLength(result.length, method);
        return result;
    }

    private charge(work: number, bytes: number, method: string): void {
        this.context.executionBudget?.chargeWork(work, method);
        this.context.executionBudget?.chargeMemory(bytes, method);
    }

    private finished(value: any, method: string): string {
        const result = this.bounded(value, method);
        this.charge(result.length, result.length * 2, method);
        return result;
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }
    tostring(value: any, formatStr?: string) {
        if (typeof value !== 'number') {
            return this.finished(value, 'str.tostring');
        }
        if (formatStr !== undefined && formatStr.length > MAX_FORMAT_PATTERN_LENGTH) {
            throw new PineRuntimeError('str.tostring format is too long.', 'str.tostring');
        }
        // Without a format, floats print at most 10 decimals and no exponent below 1e21.
        if (!formatStr) return this.finished(formatFloat(value), 'str.tostring');

        // format.mintick: the symbol's tick decimals, rounded half up.
        if (formatStr === 'mintick') {
            const mintick = this.context.pine?.syminfo?.mintick || 0.01;
            const decimals = Math.max(0, -Math.floor(Math.log10(mintick)));
            return this.finished(formatNumberPattern(value, decimals ? '0.' + '0'.repeat(decimals) : '0', 'halfUp'), 'str.tostring');
        }

        // format.percent appends "%" to the value with 2 decimals (no ×100).
        if (formatStr === 'percent') {
            return this.finished(formatNumberPattern(value, '0.00', 'halfUp') + '%', 'str.tostring');
        }

        // format.volume: 1.235M, 2.5B, 12K, 999.
        if (formatStr === 'volume') {
            return this.finished(formatVolume(value), 'str.tostring');
        }

        // Any other string is a DecimalFormat pattern: "#", "#.##", "0.000", "#,##0.0", "0 bars", …
        // (format.price / format.inherit and other text without digits are a literal prefix.)
        return this.finished(formatNumberPattern(value, formatStr, 'halfUp'), 'str.tostring');
    }
    tonumber(value: any) {
        const input = this.bounded(value, 'str.tonumber');
        this.context.executionBudget?.chargeWork(input.length, 'str.tonumber');
        const s = input.replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
        // A run of digits and dots is read up to its second dot: "1.2.3" is 1.2 and "1..2" is 1.
        if (/^[+-]?[\d.]+$/.test(s)) {
            const second = s.indexOf('.', s.indexOf('.') + 1);
            const head = second < 0 ? s : s.slice(0, second);
            return DECIMAL_NUMBER.test(head) ? Number(head) : NaN;
        }
        return DECIMAL_NUMBER.test(s) ? Number(s) : NaN;
    }
    lower(value: string) {
        const input = this.bounded(value, 'str.lower');
        this.charge(input.length, input.length * 6, 'str.lower');
        return this.bounded(input.toLowerCase(), 'str.lower');
    }
    upper(value: string) {
        const input = this.bounded(value, 'str.upper');
        this.charge(input.length, input.length * 6, 'str.upper');
        return this.bounded(input.toUpperCase(), 'str.upper');
    }
    trim(value: string) {
        const input = this.bounded(value, 'str.trim');
        this.charge(input.length, input.length * 2, 'str.trim');
        return input.trim();
    }
    repeat(source: string, repeat: number, separator: string = '') {
        if (!Number.isSafeInteger(repeat) || repeat < 0 || repeat > MAX_COLLECTION_ELEMENTS) {
            throw new PineRuntimeError(`The repetition count must be an integer from 0 to ${MAX_COLLECTION_ELEMENTS}.`, 'str.repeat');
        }
        const src = this.bounded(source, 'str.repeat');
        const sep = this.bounded(separator, 'str.repeat');
        const size = repeat === 0 ? 0 : repeat * src.length + (repeat - 1) * sep.length;
        assertStringLength(size, 'str.repeat');
        this.charge(size + repeat, size * 2 + repeat * 8, 'str.repeat');
        if (repeat === 0) return '';
        // The element count is checked even when both strings are empty.
        return Array(repeat).fill(src).join(sep);
    }
    replace_all(source: string, target: string, replacement: string) {
        const src = this.bounded(source, 'str.replace_all');
        const tgt = this.bounded(target, 'str.replace_all');
        const repl = this.bounded(replacement, 'str.replace_all');
        let count = 0;
        if (tgt === '') {
            count = src.length + 1;
        } else {
            for (let index = 0; (index = src.indexOf(tgt, index)) !== -1; index += tgt.length) count++;
        }
        const size = src.length + count * (repl.length - tgt.length);
        assertStringLength(size, 'str.replace_all');
        this.charge(src.length + size, size * 2, 'str.replace_all');
        return src.replaceAll(tgt, repl);
    }

    //occurense is the nth occurrence to replace
    replace(source: string, target: string, replacement: string, occurrence: number = 0) {
        const str = this.bounded(source, 'str.replace');
        const tgt = this.bounded(target, 'str.replace');
        const repl = this.bounded(replacement, 'str.replace');
        const occ = Math.floor(Number(occurrence)) || 0;

        // The empty target occurs before every character: ("abc", "", "X", 0) is "Xabc".
        if (tgt === '') {
            if (occ < 0 || occ > str.length) return str;
            const size = str.length + repl.length;
            assertStringLength(size, 'str.replace');
            this.charge(size, size * 2, 'str.replace');
            return str.slice(0, occ) + repl + str.slice(occ);
        }

        let pos = 0;
        let found = 0;

        while (true) {
            const idx = str.indexOf(tgt, pos);
            if (idx === -1) return str;

            if (found === occ) {
                const size = str.length - tgt.length + repl.length;
                assertStringLength(size, 'str.replace');
                this.charge(str.length + size, size * 2, 'str.replace');
                return str.substring(0, idx) + repl + str.substring(idx + tgt.length);
            }

            found++;
            // Occurrences may overlap: the second "aa" of "aaaa" starts at index 1.
            pos = idx + 1;
        }
    }

    contains(source: string, target: string) {
        return this.bounded(source, 'str.contains').includes(this.bounded(target, 'str.contains'));
    }
    endswith(source: string, target: string) {
        return this.bounded(source, 'str.endswith').endsWith(this.bounded(target, 'str.endswith'));
    }
    startswith(source: string, target: string) {
        return this.bounded(source, 'str.startswith').startsWith(this.bounded(target, 'str.startswith'));
    }
    pos(source: string, target: string) {
        const idx = this.bounded(source, 'str.pos').indexOf(this.bounded(target, 'str.pos'));
        return idx === -1 ? NaN : idx;
    }
    length(source: string) {
        return this.bounded(source, 'str.length').length;
    }
    match(source: string, pattern: string) {
        // Pine returns the matched substring, or "" when nothing matches.
        const src = this.bounded(source, 'str.match');
        const expression = this.bounded(pattern, 'str.match');
        const budget = this.context?.executionBudget;
        const found = javaRegexFind(expression, src, budget ? (steps) => budget.chargeWork(steps, 'str.match') : undefined);
        if (found === null) return '';
        this.charge(found.length, found.length * 2, 'str.match');
        return found;
    }

    split(source: string, separator: string) {
        const src = this.bounded(source, 'str.split');
        const sep = this.bounded(separator, 'str.split');
        let count = 0;
        if (sep === '') {
            count = src.length;
        } else {
            count = 1;
            for (let index = 0; (index = src.indexOf(sep, index)) !== -1; index += sep.length) {
                count++;
                assertElementCount(count, 'str.split');
            }
        }
        assertElementCount(count, 'str.split');
        this.charge(src.length + count, src.length * 2 + count * 32, 'str.split');
        // An empty source always gives one empty element, even with an empty separator.
        const parts = src === '' ? [''] : src.split(sep, MAX_COLLECTION_ELEMENTS);
        return new PineArrayObject(parts, PineArrayType.string, this.context);
    }
    substring(source: string, begin_pos: number, end_pos: number) {
        const input = this.bounded(source, 'str.substring');
        this.charge(input.length, input.length * 2, 'str.substring');
        return input.substring(begin_pos, end_pos);
    }

    /**
     * Format a UNIX millisecond time with a java.text.SimpleDateFormat pattern in a time zone
     * (see formatTime.ts). `time`, `format` and `timezone` can be passed by name.
     */
    format_time(...args: any[]) {
        const { time, format, timezone } = argsByName(args, FORMAT_TIME_PARAMS);
        // TradingView formats an na time as the epoch and an na format as the empty pattern.
        const ts = isNa(time) ? 0 : Number(time);
        const pattern = format === undefined ? DEFAULT_TIME_FORMAT : this.bounded(format, 'str.format_time');
        if (pattern.length > MAX_FORMAT_PATTERN_LENGTH) throw new PineRuntimeError('str.format_time pattern is too long.', 'str.format_time');
        if (timezone !== undefined) return formatTime(ts, pattern, this.bounded(timezone, 'str.format_time'));
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
        const pattern = this.bounded(message, 'str.format');
        this.charge(pattern.length, pattern.length * 2, 'str.format');
        let out = '';
        let inQuote = false;
        let i = 0;
        while (i < pattern.length) {
            const ch = pattern[i];
            if (ch === "'") {
                if (pattern[i + 1] === "'") {
                    assertStringLength(out.length + 1, 'str.format');
                    out += "'";
                    i += 2;
                } else {
                    inQuote = !inQuote;
                    i++;
                }
                continue;
            }
            if (ch !== '{' || inQuote) {
                assertStringLength(out.length + 1, 'str.format');
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
            const argument = this._formatArgument(segments, pattern.slice(i, j + 1), args, MAX_STRING_CODE_UNITS - out.length);
            assertStringLength(out.length + argument.length, 'str.format');
            this.charge(argument.length, argument.length * 2, 'str.format');
            out += argument;
            i = j + 1;
        }
        return out;
    }

    private _formatArgument([index, type, style]: string[], raw: string, args: any[], maxLength: number): string {
        if (style.length > MAX_FORMAT_PATTERN_LENGTH) throw new PineRuntimeError('str.format pattern is too long.', 'str.format');
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
        if (kind === '' || typeof val !== 'number') return messageArgument(val, maxLength, (work, bytes) => this.charge(work, bytes, 'str.format'));
        if (Number.isNaN(val)) return 'NaN';
        return formatNumberPattern(val, MESSAGE_NUMBER_FORMATS[style.trim().toLowerCase()] ?? style, 'halfEven');
    }
}
