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
    blue:    '#2196F3',
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
 * Resolve a color argument: unwrap Series/functions to a raw value.
 */
function resolveColor(color: any): any {
    if (typeof color === 'function') color = color();
    if (color && typeof color === 'object' && Array.isArray(color.data) && typeof color.get === 'function') {
        color = color.get(0);
    }
    return color;
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
        // If not a string (e.g. NaN for na), return as-is
        if (!color || typeof color !== 'string') return color;

        // Treat NaN transparency as "no transparency specified" (keep original color)
        if (typeof a === 'number' && isNaN(a)) a = undefined;

        // Handle hexadecimal colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            // Strip existing alpha if present (#RRGGBBAA → #RRGGBB) before appending new alpha
            const hexRgb = hex.length === 8 ? hex.slice(0, 6) : hex;
            return a != null
                ? `#${hexRgb}${Math.round((255 / 100) * (100 - a))
                      .toString(16)
                      .padStart(2, '0')
                      .toUpperCase()}`
                : `#${hex}`;
        } else {
            const hex = COLOR_CONSTANTS[color];
            if (hex) {
                return a != null
                    ? `#${hex.slice(1)}${Math.round((255 / 100) * (100 - a))
                          .toString(16)
                          .padStart(2, '0')
                          .toUpperCase()}`
                    : hex;
            }

            // Handle rgb(r,g,b) and rgba(r,g,b,a) strings — extract components
            // to avoid invalid nested formats like "rgba(rgb(207,23,23), 0.3)"
            const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
            if (rgbMatch) {
                const r = rgbMatch[1];
                const g = rgbMatch[2];
                const b = rgbMatch[3];
                if (a != null) {
                    // Convert to #RRGGBBAA hex for consistency with hex path
                    const rh = parseInt(r).toString(16).padStart(2, '0');
                    const gh = parseInt(g).toString(16).padStart(2, '0');
                    const bh = parseInt(b).toString(16).padStart(2, '0');
                    const ah = Math.round((255 / 100) * (100 - a)).toString(16).padStart(2, '0').toUpperCase();
                    return `#${rh}${gh}${bh}${ah}`;
                }
                return color; // no alpha change, return as-is
            }

            // Fallback for unknown format
            return a != null
                ? `rgba(${color}, ${(100 - a) / 100})`
                : color;
        }
    }

    // ── color.rgb(r, g, b, a?) ────────────────────────────────────────
    rgb(r: number, g: number, b: number, a?: number) {
        // Treat NaN transparency as "no transparency" (fully opaque)
        if (typeof a === 'number' && isNaN(a)) a = undefined;
        return a != null ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`;
    }

    // ── color.from_gradient(value, bottom_value, top_value, bottom_color, top_color) ──
    from_gradient(value: any, bottom_value: any, top_value: any, bottom_color: any, top_color: any): any {
        // Resolve Series/functions for all args
        value = resolveColor(value);
        bottom_value = resolveColor(bottom_value);
        top_value = resolveColor(top_value);
        bottom_color = resolveColor(bottom_color);
        top_color = resolveColor(top_color);

        // If any numeric arg is na (NaN/null/undefined), return na
        if (value == null || (typeof value === 'number' && isNaN(value))) return undefined;
        if (bottom_value == null || (typeof bottom_value === 'number' && isNaN(bottom_value))) return undefined;
        if (top_value == null || (typeof top_value === 'number' && isNaN(top_value))) return undefined;
        // If either color is na, return na
        if (bottom_color == null || (typeof bottom_color === 'number' && isNaN(bottom_color))) return undefined;
        if (top_color == null || (typeof top_color === 'number' && isNaN(top_color))) return undefined;

        // Clamp position between 0 and 1
        let t = 0;
        if (top_value !== bottom_value) {
            t = (value - bottom_value) / (top_value - bottom_value);
        }
        t = Math.max(0, Math.min(1, t));

        // Parse both colors to RGBA
        const bc = parseColorToRGBA(typeof bottom_color === 'string' ? bottom_color : '#000000') || [0, 0, 0, 1];
        const tc = parseColorToRGBA(typeof top_color === 'string' ? top_color : '#FFFFFF') || [255, 255, 255, 1];

        // Linear interpolation
        const r = bc[0] + (tc[0] - bc[0]) * t;
        const g = bc[1] + (tc[1] - bc[1]) * t;
        const b = bc[2] + (tc[2] - bc[2]) * t;
        const a = bc[3] + (tc[3] - bc[3]) * t;

        return rgbaToHex(r, g, b, a);
    }

    // ── Component extraction ──────────────────────────────────────────

    /** Extract red component (0-255) from a color string. Returns na if unparsable. */
    r(color: any): number {
        color = resolveColor(color);
        if (!color || typeof color !== 'string') return NaN;
        const rgba = parseColorToRGBA(color);
        return rgba ? rgba[0] : NaN;
    }

    /** Extract green component (0-255) from a color string. Returns na if unparsable. */
    g(color: any): number {
        color = resolveColor(color);
        if (!color || typeof color !== 'string') return NaN;
        const rgba = parseColorToRGBA(color);
        return rgba ? rgba[1] : NaN;
    }

    /** Extract blue component (0-255) from a color string. Returns na if unparsable. */
    b(color: any): number {
        color = resolveColor(color);
        if (!color || typeof color !== 'string') return NaN;
        const rgba = parseColorToRGBA(color);
        return rgba ? rgba[2] : NaN;
    }

    /** Extract transparency (0-100, Pine scale) from a color string. Returns na if unparsable. */
    t(color: any): number {
        color = resolveColor(color);
        if (!color || typeof color !== 'string') return NaN;
        const rgba = parseColorToRGBA(color);
        return rgba ? Math.round(100 - rgba[3] * 100) : NaN;
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
