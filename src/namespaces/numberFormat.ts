// SPDX-License-Identifier: AGPL-3.0-only
// Number to text conversions as TradingView prints them (str.tostring, str.format, array.join).

export type RoundingMode = 'halfUp' | 'halfEven';

/**
 * Integer and fraction digits of a non-negative number, from its shortest round-trip
 * representation, with the decimal point moved right by `shift` places (exact % scaling).
 */
export function plainDecimal(abs: number, shift: number = 0): [string, string] {
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

/** -1, 0 or 1: the exact binary value of `abs` compared with the decimal `int.frac`. */
function compareExact(abs: number, int: string, frac: string): number {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, abs);
    const bits = view.getBigUint64(0);
    const biased = Number((bits >> 52n) & 0x7ffn);
    let mantissa = bits & ((1n << 52n) - 1n);
    let exp: number;
    if (biased === 0) exp = -1074;
    else {
        mantissa |= 1n << 52n;
        exp = biased - 1075;
    }
    // abs = mantissa * 2^exp, decimal = D / 10^frac.length
    let left = mantissa * 10n ** BigInt(frac.length);
    let right = BigInt(int + frac || '0');
    if (exp >= 0) left <<= BigInt(exp);
    else right <<= BigInt(-exp);
    return left > right ? 1 : left < right ? -1 : 0;
}

/**
 * Rounds the decimal digits `int.frac` of `abs` to `maxFrac` fraction digits.
 * - halfUp: on the shortest decimal digits, ties away from zero (str.tostring with a pattern).
 * - halfEven: on the exact binary value, as Java's DecimalFormat does (str.format, default
 *   str.tostring): a decimal tie rounds by the value the double really holds (2.345 is
 *   2.34500000000000019... -> 2.35, 1.005 is 1.00499999999999989... -> 1), and an exact tie
 *   rounds to even. A tie whose kept digits are all zero (0.0005 to 3 places) rounds down.
 */
export function roundDecimal(abs: number, int: string, frac: string, maxFrac: number, mode: RoundingMode): [string, string] {
    if (frac.length <= maxFrac) return [int, frac];
    let digits = int + frac.slice(0, maxFrac);
    const first = Number(frac[maxFrac]);
    const tail = frac.slice(maxFrac + 1);
    let up: boolean;
    if (first !== 5 || /[1-9]/.test(tail)) up = first >= 5;
    else if (mode === 'halfUp') up = true;
    else if (!/[1-9]/.test(digits)) up = false;
    else {
        const cmp = compareExact(abs, int, frac);
        up = cmp > 0 || (cmp === 0 && Number(digits[digits.length - 1]) % 2 === 1);
    }
    if (up) {
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
 * Splits a DecimalFormat pattern into its literal prefix, number part (`#`, `0`, `,`, `.`) and
 * literal suffix. Text between single quotes is literal (`''` is a quote); an unquoted `%`
 * scales the value by 100.
 */
function splitPattern(pattern: string): { prefix: string; number: string; suffix: string; percent: boolean } {
    let i = 0;
    let percent = false;
    const literal = (stop: (c: string) => boolean): string => {
        let out = '';
        let quoted = false;
        while (i < pattern.length) {
            const c = pattern[i];
            if (c === "'") {
                if (pattern[i + 1] === "'") {
                    out += "'";
                    i += 2;
                    continue;
                }
                quoted = !quoted;
                i++;
                continue;
            }
            if (!quoted && stop(c)) break;
            if (!quoted && c === '%') percent = true;
            out += c;
            i++;
        }
        return out;
    };
    const prefix = literal((c) => /[#0,.]/.test(c));
    let number = '';
    while (i < pattern.length && /[#0,.]/.test(pattern[i])) number += pattern[i++];
    const suffix = literal(() => false);
    return { prefix, number, suffix, percent };
}

/**
 * Formats a number with a DecimalFormat-style pattern: literal prefix and suffix, `0` / `#`
 * digits, `,` grouping, `.` fraction and `%` (×100). A value that rounds to zero is printed
 * without its sign in halfUp mode (str.tostring) and with it in halfEven mode (str.format).
 * A pattern without any digit placeholder is a literal prefix to the rounded integer
 * (`str.tostring(2.5, "abc")` is `abc3`).
 */
export function formatNumberPattern(value: number, pattern: string, mode: RoundingMode): string {
    if (!Number.isFinite(value)) return String(value);
    const { prefix, number, suffix, percent } = splitPattern(pattern);
    const [intPattern, fracPattern = ''] = number.split('.');
    if (!/[#0]/.test(number)) {
        const [int] = roundDecimal(Math.abs(value), ...plainDecimal(Math.abs(value)), 0, mode);
        return (value < 0 ? '-' : '') + prefix + suffix + (int.replace(/^0+(?=\d)/, '') || '0');
    }
    const scale = percent ? 100 : 1;
    const minInt = (intPattern.match(/0/g) ?? []).length;
    const comma = intPattern.lastIndexOf(',');
    const groupSize = comma >= 0 ? intPattern.length - comma - 1 : 0;
    const minFrac = (fracPattern.match(/0/g) ?? []).length;
    const maxFrac = fracPattern.length;

    const abs = Math.abs(value);
    const [intPart, fracPart] = plainDecimal(abs, scale === 100 ? 2 : 0);
    const [roundedInt, roundedFrac] = roundDecimal(abs * scale, intPart, fracPart, maxFrac, mode);
    const isZero = !/[1-9]/.test(roundedInt + roundedFrac);

    let intDigits = roundedInt.replace(/^0+/, '');
    let frac = roundedFrac.padEnd(maxFrac, '0');
    while (frac.length > minFrac && frac.endsWith('0')) frac = frac.slice(0, -1);
    if (intDigits.length < minInt) intDigits = intDigits.padStart(minInt, '0');
    if (!intDigits && minFrac === 0) intDigits = '0';
    if (groupSize > 0) intDigits = intDigits.replace(new RegExp(`\\B(?=(\\d{${groupSize}})+(?!\\d))`, 'g'), ',');

    const negative = value < 0 && (mode === 'halfEven' || !isZero);
    return (negative ? '-' : '') + prefix + intDigits + (frac ? '.' + frac : '') + suffix;
}

/**
 * `str.tostring(float)` without a format: at most 10 fraction digits (rounded like
 * DecimalFormat), no exponent below 1e21, `1.2345678901E29` above, no sign on zero.
 */
export function formatFloat(value: number): string {
    if (!Number.isFinite(value)) return String(value);
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1e21) {
        const [mant, e] = abs.toExponential().split('e');
        let [int, frac] = roundDecimal(abs, mant.split('.')[0], mant.split('.')[1] ?? '', 10, 'halfUp');
        let exp = Number(e);
        if (int.length > 1) {
            frac = int.slice(1) + frac;
            int = int[0];
            exp++;
        }
        frac = frac.replace(/0+$/, '');
        return sign + int + (frac ? '.' + frac : '') + 'E' + exp;
    }
    const [int, frac] = roundDecimal(abs, ...plainDecimal(abs), 10, 'halfEven');
    const fracDigits = frac.replace(/0+$/, '');
    const intDigits = int.replace(/^0+(?=\d)/, '');
    if (!/[1-9]/.test(intDigits + fracDigits)) return '0';
    return sign + intDigits + (fracDigits ? '.' + fracDigits : '');
}

/** Java's `Double.toString`: `5.0`, `0.001`, `1.0E7`, `9.9E-4` (float array elements in joins). */
export function javaDoubleToString(value: number): string {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    if (value === 0) return '0.0';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1e-3 && abs < 1e7) {
        const [int, frac] = plainDecimal(abs);
        return sign + int + '.' + (frac || '0');
    }
    const [mant, e] = abs.toExponential().split('e');
    const [int, frac] = mant.split('.');
    return sign + int + '.' + (frac || '0') + 'E' + Number(e);
}

const VOLUME_UNITS: Array<[number, string]> = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
];

/** `format.volume`: `1.235M`, `2.5B`, `999`, `12` (3 decimals with a unit, none without). */
export function formatVolume(value: number): string {
    if (!Number.isFinite(value)) return String(value);
    const abs = Math.abs(value);
    const unit = VOLUME_UNITS.find(([size]) => abs >= size);
    const scaled = unit ? abs / unit[0] : abs;
    const text = formatNumberPattern(scaled, unit ? '#.###' : '#', 'halfUp');
    return (value < 0 && text !== '0' ? '-' : '') + text + (unit ? unit[1] : '');
}
