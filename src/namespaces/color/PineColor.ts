// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';

/**
 * Parse any color string (#hex, #hexAA, rgb(), rgba()) into [r, g, b, a] with a in 0..1.
 * Returns null if unparsable.
 */
function parseColorToRGBA(color: string): [number, number, number, number] | null {
    if (!color || typeof color !== 'string') return null;

    // #RRGGBB or #RRGGBBAA
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 6) {
            return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), 1];
        }
        if (hex.length === 8) {
            return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), parseInt(hex.slice(6, 8), 16) / 255];
        }
        return null;
    }

    // rgba(r, g, b, a) or rgb(r, g, b)
    const rgbaMatch = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/);
    if (rgbaMatch) {
        return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3]), rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1];
    }

    return null;
}

/**
 * Convert [r, g, b, a] back to a hex string.  If a < 1, include the alpha byte.
 */
function rgbaToHex(r: number, g: number, b: number, a: number): string {
    const rr = Math.round(Math.max(0, Math.min(255, r)))
        .toString(16)
        .padStart(2, '0');
    const gg = Math.round(Math.max(0, Math.min(255, g)))
        .toString(16)
        .padStart(2, '0');
    const bb = Math.round(Math.max(0, Math.min(255, b)))
        .toString(16)
        .padStart(2, '0');
    if (a >= 1) return `#${rr}${gg}${bb}`.toUpperCase();
    const aa = Math.round(Math.max(0, Math.min(255, a * 255)))
        .toString(16)
        .padStart(2, '0');
    return `#${rr}${gg}${bb}${aa}`.toUpperCase();
}

//prettier-ignore
const COLOR_CONSTANTS = {
    aqua:    '#00BCD4',
    black:   '#363A45',
    blue:    '#2962FF',
    fuchsia: '#E040FB',
    gray:    '#787B86',
    green:   '#4CAF50',
    lime:    '#00E676',
    maroon:  '#880E4F',
    navy:    '#311B92',
    olive:   '#808000',
    orange:  '#FF9800',
    purple:  '#9C27B0',
    red:     '#F23645',
    silver:  '#B2B5BE',
    teal:    '#089981',
    white:   '#FFFFFF',
    yellow:  '#FDD835',
} as const;

/**
 * Resolve any static color value to its `[r, g, b, a]` components (a in
 * 0..1). Accepts:
 *   - `#RRGGBB` / `#RRGGBBAA` hex
 *   - `rgb(r,g,b)` / `rgba(r,g,b,a)` strings
 *   - a named constant, with or without the namespace: `color.red` / `red`
 * Returns null for anything it can't parse as a color.
 */
export function resolveColorToRgba(value: unknown): [number, number, number, number] | null {
    if (typeof value !== 'string') return null;
    let s = value.trim();
    // Resolve a named constant first: "color.red" → "#F23645", or a bare "red".
    const name = s.startsWith('color.') ? s.slice(6) : s;
    if (Object.prototype.hasOwnProperty.call(COLOR_CONSTANTS, name)) {
        s = (COLOR_CONSTANTS as Record<string, string>)[name];
    }
    return parseColorToRGBA(s);
}

/**
 * Format `[r, g, b, a]` (a in 0..1) as a canonical 8-digit RGBA hex string
 * `#RRGGBBAA` (uppercase, alpha byte ALWAYS present — `FF` = fully opaque).
 */
export function rgbaToHex8(r: number, g: number, b: number, a: number): string {
    const byte = (n: number) =>
        Math.round(Math.max(0, Math.min(255, n)))
            .toString(16)
            .padStart(2, '0');
    return `#${byte(r)}${byte(g)}${byte(b)}${byte(a * 255)}`.toUpperCase();
}

/**
 * Normalize any color value to a canonical 8-digit RGBA hex string
 * `#RRGGBBAA` (see {@link rgbaToHex8}). Accepts every shape a color input
 * can carry (hex, rgb()/rgba(), named constant). Values it can't parse as
 * a color are returned unchanged, so non-color data passes through
 * untouched. Used by `Indicator.getInputsMeta()` to present color-input
 * defaults in a single canonical form.
 */
export function normalizeColorToRgbaHex(value: unknown): unknown {
    const rgba = resolveColorToRgba(value);
    if (!rgba) return value;
    return rgbaToHex8(rgba[0], rgba[1], rgba[2], rgba[3]);
}

/**
 * Resolve a color argument: unwrap Series/functions to a raw value.
 */
function resolveColor(color: any): any {
    if (typeof color === 'function') color = color();
    if (color && typeof color === 'object' && Array.isArray(color.data) && typeof color.get === 'function') {
        color = color.get(0);
    }
    return color;
}

const isNa = (v: any) => v == null || (typeof v === 'number' && isNaN(v));

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** TradingView's result for a gradient it cannot compute (na or flat range). */
const TRANSPARENT_BLACK = '#00000000';

/**
 * `[r, g, b, a]` of a color argument as TradingView holds it: alpha is a byte (a = A / 255) and an na
 * color is transparent black. Returns null for a value that is not a color.
 */
function colorComponents(color: any): [number, number, number, number] | null {
    color = resolveColor(color);
    if (isNa(color)) return [0, 0, 0, 0];
    const rgba = resolveColorToRgba(color);
    if (!rgba) return null;
    return [rgba[0], rgba[1], rgba[2], Math.round(rgba[3] * 255) / 255];
}

/**
 * PineColor implements the Pine Script `color` namespace.
 *
 * Supports:
 * - color(na)                          → type-cast (via any())
 * - color.new(color, alpha)            → apply transparency
 * - color.rgb(r, g, b, a?)            → create from components
 * - color.from_gradient(...)           → interpolate between two colors
 * - color.r/g/b/t(color)              → extract individual components
 * - color.red, color.blue, ...        → named constants
 */
export class PineColor {
    constructor(private context: any) {}

    // ── Type-cast: color(na) → color.any(na) ──────────────────────────
    any(value: any) {
        const resolved = Series.from(value).get(0);
        // NaN means na (Pine Script's "no value") → return null for transparent
        if (typeof resolved === 'number' && isNaN(resolved)) return null;
        return resolved;
    }

    // ── Series unwrapping for param() ─────────────────────────────────
    param(source: any, index: number = 0) {
        return Series.from(source).get(index);
    }

    // ── color.new(color, alpha?) ──────────────────────────────────────
    new(color: any, a?: number) {
        color = resolveColor(color);
        a = resolveColor(a);
        if (a === undefined) return color;

        // TradingView truncates the transparency to an integer in 0..100; na is fully transparent.
        a = isNa(a) ? 100 : clamp(Math.trunc(a), 0, 100);
        // An na color is transparent black, so color.new(na, 50) is half-transparent black.
        if (isNa(color)) color = '#000000';
        if (typeof color !== 'string') return color;

        // TradingView stores the transparency as an alpha byte, rounded half up.
        const alpha = Math.round((255 * (100 - a)) / 100).toString(16).padStart(2, '0').toUpperCase();

        // Handle hexadecimal colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            // Strip existing alpha if present (#RRGGBBAA → #RRGGBB) before appending new alpha
            const hexRgb = hex.length === 8 ? hex.slice(0, 6) : hex;
            return `#${hexRgb}${alpha}`;
        }
        const named = COLOR_CONSTANTS[color];
        if (named) return `#${named.slice(1)}${alpha}`;

        // Handle rgb(r,g,b) and rgba(r,g,b,a) strings — extract components
        // to avoid invalid nested formats like "rgba(rgb(207,23,23), 0.3)"
        const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
        if (rgbMatch) {
            const [rh, gh, bh] = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map((c) => parseInt(c).toString(16).padStart(2, '0'));
            return `#${rh}${gh}${bh}${alpha}`;
        }

        // Fallback for unknown format
        return `rgba(${color}, ${(100 - a) / 100})`;
    }

    // ── color.rgb(r, g, b, a?) ────────────────────────────────────────
    rgb(r: number, g: number, b: number, a?: number) {
        // TradingView truncates each component and clamps it to 0..255; an na component is 0.
        const channel = (v: any) => {
            v = resolveColor(v);
            return isNa(v) ? 0 : clamp(Math.trunc(v), 0, 255);
        };
        const [rr, gg, bb] = [channel(r), channel(g), channel(b)];
        a = resolveColor(a);
        if (a === undefined) return `rgb(${rr}, ${gg}, ${bb})`;
        // The transparency is kept fractional (stored as an alpha byte); na is fully transparent.
        const t = isNa(a) ? 100 : clamp(a, 0, 100);
        return `rgba(${rr}, ${gg}, ${bb}, ${(100 - t) / 100})`;
    }

    // ── color.from_gradient(value, bottom_value, top_value, bottom_color, top_color) ──
    from_gradient(value: any, bottom_value: any, top_value: any, bottom_color: any, top_color: any): any {
        value = resolveColor(value);
        bottom_value = resolveColor(bottom_value);
        top_value = resolveColor(top_value);

        // TradingView returns transparent black (not na) for an na value or bound and for a flat range.
        if (isNa(value) || isNa(bottom_value) || isNa(top_value) || top_value === bottom_value) return TRANSPARENT_BLACK;
        // Reversed bounds give the bottom color whatever the value.
        if (top_value < bottom_value) {
            bottom_color = resolveColor(bottom_color);
            return isNa(bottom_color) ? TRANSPARENT_BLACK : bottom_color;
        }

        const bc = colorComponents(bottom_color) ?? [0, 0, 0, 0];
        const tc = colorComponents(top_color) ?? [0, 0, 0, 0];

        // Premultiplied-alpha interpolation, channels and alpha truncated. The weights are computed as
        // w0 = 1 - t, w1 = 1 - w0 to reproduce TradingView's rounding at exact integer results.
        const t = clamp((value - bottom_value) / (top_value - bottom_value), 0, 1);
        const w0 = 1 - t;
        const w1 = 1 - w0;
        const a = bc[3] * w0 + tc[3] * w1;
        if (a === 0) return TRANSPARENT_BLACK;
        const channel = (i: number) => Math.trunc((bc[i] * bc[3] * w0 + tc[i] * tc[3] * w1) / a);

        return rgbaToHex(channel(0), channel(1), channel(2), Math.trunc(a * 255) / 255);
    }

    // ── Component extraction ──────────────────────────────────────────

    // An na color reads as transparent black (0, 0, 0, transparency 100), as on TradingView.

    /** Extract red component (0-255). Returns na if the value is not a color. */
    r(color: any): number {
        return colorComponents(color)?.[0] ?? NaN;
    }

    /** Extract green component (0-255). Returns na if the value is not a color. */
    g(color: any): number {
        return colorComponents(color)?.[1] ?? NaN;
    }

    /** Extract blue component (0-255). Returns na if the value is not a color. */
    b(color: any): number {
        return colorComponents(color)?.[2] ?? NaN;
    }

    /** Extract transparency (0-100, Pine scale), rounded from the alpha byte. Returns na if the value is not a color. */
    t(color: any): number {
        const rgba = colorComponents(color);
        return rgba ? Math.round((1 - rgba[3]) * 100) : NaN;
    }

    // ── Named color constants ─────────────────────────────────────────
    // These are methods (not getters) because KNOWN_NAMESPACES transforms
    // `color.white` → `color.white()` in the transpiler. They need to be
    // callable functions, not static values.
    aqua() {
        return COLOR_CONSTANTS.aqua;
    }
    black() {
        return COLOR_CONSTANTS.black;
    }
    blue() {
        return COLOR_CONSTANTS.blue;
    }
    fuchsia() {
        return COLOR_CONSTANTS.fuchsia;
    }
    gray() {
        return COLOR_CONSTANTS.gray;
    }
    green() {
        return COLOR_CONSTANTS.green;
    }
    lime() {
        return COLOR_CONSTANTS.lime;
    }
    maroon() {
        return COLOR_CONSTANTS.maroon;
    }
    navy() {
        return COLOR_CONSTANTS.navy;
    }
    olive() {
        return COLOR_CONSTANTS.olive;
    }
    orange() {
        return COLOR_CONSTANTS.orange;
    }
    purple() {
        return COLOR_CONSTANTS.purple;
    }
    red() {
        return COLOR_CONSTANTS.red;
    }
    silver() {
        return COLOR_CONSTANTS.silver;
    }
    teal() {
        return COLOR_CONSTANTS.teal;
    }
    white() {
        return COLOR_CONSTANTS.white;
    }
    yellow() {
        return COLOR_CONSTANTS.yellow;
    }
}
