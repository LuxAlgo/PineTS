// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';
import { PineTypeObject } from './PineTypeObject';
import { parseArgsForPineParams } from './utils';
import type { IndicatorOptions, PlotCharOptions } from '../types/PineTypes';

//prettier-ignore
const TIMESTAMP_SIGNATURES = [
    // timestamp(dateString)
    ['dateString'],
    // timestamp(year, month, day, hour, minute, second)
    ['year', 'month', 'day', 'hour', 'minute', 'second'],
    // timestamp(timezone, year, month, day, hour, minute, second)
    ['timezone', 'year', 'month', 'day', 'hour', 'minute', 'second'],
];

//prettier-ignore
const TIMESTAMP_ARGS_TYPES = {
    dateString: 'string',
    timezone: 'string',
    year: 'number', month: 'number', day: 'number',
    hour: 'number', minute: 'number', second: 'number',
};

const INDICATOR_SIGNATURE = [
    'title',
    'shorttitle',
    'overlay',
    'format',
    'precision',
    'scale',
    'max_bars_back',
    'timeframe',
    'timeframe_gaps',
    'explicit_plot_zorder',
    'max_lines_count',
    'max_labels_count',
    'max_boxes_count',
    'calc_bars_count',
    'max_polylines_count',
    'dynamic_requests',
    'behind_chart',
];
const INDICATOR_ARGS_TYPES = {
    title: 'string',
    shorttitle: 'string',
    overlay: 'boolean',
    format: 'string',
    precision: 'number',
    scale: 'string', ////TODO : handle enums types
    max_bars_back: 'number',
    timeframe: 'string',
    timeframe_gaps: 'boolean',
    explicit_plot_zorder: 'boolean',
    max_lines_count: 'number',
    max_labels_count: 'number',
    max_boxes_count: 'number',
    calc_bars_count: 'number',
    max_polylines_count: 'number',
    dynamic_requests: 'boolean',
    behind_chart: 'boolean',
};

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

const COLOR_CONSTANTS = {
    aqua: '#00BCD4',
    black: '#363A45',
    blue: '#2196F3',
    fuchsia: '#E040FB',
    gray: '#787B86',
    green: '#4CAF50',
    lime: '#00E676',
    maroon: '#880E4F',
    navy: '#311B92',
    olive: '#808000',
    orange: '#FF9800',
    purple: '#9C27B0',
    red: '#F23645',
    silver: '#B2B5BE',
    teal: '#089981',
    white: '#FFFFFF',
    yellow: '#FDD835',
} as const;

export function parseIndicatorOptions(args: any[]): Partial<IndicatorOptions> {
    return parseArgsForPineParams<Partial<IndicatorOptions>>(args, INDICATOR_SIGNATURE, INDICATOR_ARGS_TYPES);
}

/**
 * NAHelper implements the dual-use `na` identifier.
 * - Bare `na` → `na.__value` → NaN
 * - `na(x)` → `na.any(x)` → checks if x is NaN
 */
export class NAHelper {
    get __value() {
        return NaN;
    }

    param(source: any, index: number = 0) {
        return Series.from(source).get(index);
    }

    any(series: any) {
        return isNaN(Series.from(series).get(0));
    }
}

export class Core {
    public color = {
        param: (source, index = 0) => {
            return Series.from(source).get(index);
        },
        rgb: (r: number, g: number, b: number, a?: number) => (a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`),
        new: (color: any, a?: number) => {
            // Resolve bound functions (e.g. chart.fg_color, chart.bg_color)
            if (typeof color === 'function') color = color();
            // Resolve Series objects
            if (color && typeof color === 'object' && Array.isArray(color.data) && typeof color.get === 'function') {
                color = color.get(0);
            }
            // Ensure color is a string
            if (!color || typeof color !== 'string') return color;

            // Handle hexadecimal colors
            if (color.startsWith('#')) {
                // Remove # and convert to RGB
                const hex = color.slice(1);
                return a
                    ? `#${hex}${Math.round((255 / 100) * (100 - a))
                          .toString(16)
                          .padStart(2, '0')
                          .toUpperCase()}`
                    : `#${hex}`;
            } else {
                const hex = COLOR_CONSTANTS[color];
                return hex
                    ? a
                        ? `#${hex}${Math.round((255 / 100) * (100 - a))
                              .toString(16)
                              .padStart(2, '0')
                              .toUpperCase()}`
                        : `#${hex}`
                    : a
                      ? `rgba(${color}, ${(100 - a) / 100})`
                      : color; // Handle existing RGB format
            }
        },
        from_gradient: (value: any, bottom_value: any, top_value: any, bottom_color: any, top_color: any): string => {
            // Resolve Series/functions for all args
            if (typeof value === 'function') value = value();
            if (typeof bottom_value === 'function') bottom_value = bottom_value();
            if (typeof top_value === 'function') top_value = top_value();
            if (typeof bottom_color === 'function') bottom_color = bottom_color();
            if (typeof top_color === 'function') top_color = top_color();
            if (value && typeof value === 'object' && typeof value.get === 'function') value = value.get(0);
            if (bottom_value && typeof bottom_value === 'object' && typeof bottom_value.get === 'function') bottom_value = bottom_value.get(0);
            if (top_value && typeof top_value === 'object' && typeof top_value.get === 'function') top_value = top_value.get(0);
            if (bottom_color && typeof bottom_color === 'object' && typeof bottom_color.get === 'function') bottom_color = bottom_color.get(0);
            if (top_color && typeof top_color === 'object' && typeof top_color.get === 'function') top_color = top_color.get(0);

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
        },
        aqua: COLOR_CONSTANTS['aqua'],
        black: COLOR_CONSTANTS['black'],
        blue: COLOR_CONSTANTS['blue'],
        fuchsia: COLOR_CONSTANTS['fuchsia'],
        gray: COLOR_CONSTANTS['gray'],
        green: COLOR_CONSTANTS['green'],
        lime: COLOR_CONSTANTS['lime'],
        maroon: COLOR_CONSTANTS['maroon'],
        navy: COLOR_CONSTANTS['navy'],
        olive: COLOR_CONSTANTS['olive'],
        orange: COLOR_CONSTANTS['orange'],
        purple: COLOR_CONSTANTS['purple'],
        red: COLOR_CONSTANTS['red'],
        silver: COLOR_CONSTANTS['silver'],
        teal: COLOR_CONSTANTS['teal'],
        white: COLOR_CONSTANTS['white'],
        yellow: COLOR_CONSTANTS['yellow'],
    };
    constructor(private context: any) {}
    private extractPlotOptions(options: PlotCharOptions) {
        const _options: any = {};
        for (let key in options) {
            _options[key] = Series.from(options[key]).get(0);
        }
        return _options;
    }
    indicator(...args) {
        const options = parseIndicatorOptions(args);

        const defaults = {
            title: '',
            shorttitle: '',
            overlay: false,
            format: 'inherit',
            precision: 10,
            scale: 'points',
            max_bars_back: 0,
            timeframe: '',
            timeframe_gaps: true,
            explicit_plot_zorder: false,
            max_lines_count: 50,
            max_labels_count: 50,
            max_boxes_count: 50,
            calc_bars_count: 0,
            max_polylines_count: 50,
            dynamic_requests: false,
            behind_chart: true,
        };
        //TODO : most of these values are not actually used by PineTS, future work should be done to implement them
        this.context.indicator = { ...defaults, ...options };
        return this.context.indicator;
    }

    get bar_index() {
        return this.context.idx;
    }

    na(series: any) {
        return isNaN(Series.from(series).get(0));
    }
    nz(series: any, replacement: number = 0) {
        const val = Series.from(series).get(0);
        const rep = Series.from(replacement).get(0);
        return isNaN(val) ? rep : val;
    }
    fixnan(series: any) {
        const _s = Series.from(series);
        for (let i = 0; i < _s.length; i++) {
            const val = _s.get(i);
            if (!isNaN(val)) {
                return val;
            }
        }
        return NaN;
    }

    alertcondition(condition, title, message) {
        //console.warn('alertcondition called but is currently not implemented', condition, title, message);
    }

    /**
     * Converts date/time components to a UNIX timestamp in milliseconds.
     * Supports multiple signatures:
     *   timestamp(dateString)                                     — RFC 2822 / ISO 8601 string
     *   timestamp(year, month, day, hour?, minute?, second?)      — components, exchange timezone
     *   timestamp(timezone, year, month, day, hour?, minute?, second?) — components, explicit timezone
     */
    timestamp(...args: any[]) {
        // Unwrap Series values before passing to the signature parser
        const unwrapped = args.map((a) => (a instanceof Series ? a.get(0) : a));
        const parsed = parseArgsForPineParams<any>(unwrapped, TIMESTAMP_SIGNATURES, TIMESTAMP_ARGS_TYPES);

        // Overloads 2-5: component-based (check year first — timezone overload also matches dateString)
        if (parsed.year !== undefined) {
            const year = parsed.year;
            const month = parsed.month;
            const day = parsed.day;
            const hour = parsed.hour || 0;
            const minute = parsed.minute || 0;
            const second = parsed.second || 0;
            const timezone = parsed.timezone || this.context.pine?.syminfo?.timezone || 'UTC';
            return this._timestampFromComponents(timezone, year, month, day, hour, minute, second);
        }

        // Overload 1: timestamp(dateString)
        if (parsed.dateString !== undefined) {
            return new Date(parsed.dateString).getTime();
        }

        return NaN;
    }

    /**
     * Build a UNIX timestamp (ms) from calendar components interpreted in a given timezone.
     * Supports IANA timezone names ("America/New_York") and UTC offset strings ("UTC+5", "GMT-03:30").
     */
    private _timestampFromComponents(
        timezone: string,
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number,
        second: number,
    ): number {
        // Pine Script months are 1-based, JS Date months are 0-based
        // Pine Script allows out-of-range values (they roll over), and so does JS Date
        const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        // Fix 2-digit years: new Date(Date.UTC(20, ...)) gives 1920, not 0020
        if (year >= 0 && year < 100) utcDate.setUTCFullYear(year);

        // For plain UTC, return directly
        const tzNorm = timezone.trim();
        if (tzNorm === 'UTC' || tzNorm === 'GMT') {
            return utcDate.getTime();
        }

        // Try parsing as UTC/GMT offset: "UTC+5", "UTC-03:30", "GMT+5:30"
        const offsetMatch = tzNorm.match(/^(?:UTC|GMT)([+-])(\d{1,2})(?::(\d{2}))?$/i);
        if (offsetMatch) {
            const sign = offsetMatch[1] === '+' ? 1 : -1;
            const offsetHours = parseInt(offsetMatch[2], 10);
            const offsetMinutes = parseInt(offsetMatch[3] || '0', 10);
            const totalOffsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;
            // The user's components are in the given offset, so subtract to get UTC
            return utcDate.getTime() - totalOffsetMs;
        }

        // IANA timezone name — use Intl to compute the offset
        try {
            return this._timestampFromIANA(timezone, year, month, day, hour, minute, second);
        } catch {
            // Fallback to UTC if timezone is unrecognized
            return utcDate.getTime();
        }
    }

    /**
     * Convert calendar components in an IANA timezone to a UTC timestamp.
     * Uses Intl.DateTimeFormat to determine the timezone offset.
     */
    private _timestampFromIANA(timezone: string, year: number, month: number, day: number, hour: number, minute: number, second: number): number {
        // Build a rough UTC estimate, then use Intl to find the actual offset
        const utcEstimate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        if (year >= 0 && year < 100) utcEstimate.setUTCFullYear(year);

        // Format the estimate in the target timezone to extract its parts
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false,
        });

        const parts = formatter.formatToParts(utcEstimate);
        const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

        const tzYear = get('year');
        const tzMonth = get('month');
        const tzDay = get('day');
        let tzHour = get('hour');
        if (tzHour === 24) tzHour = 0; // Intl may return 24 for midnight
        const tzMinute = get('minute');
        const tzSecond = get('second');

        // Offset = what Intl says the time is minus what UTC says
        const tzDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond));
        if (tzYear >= 0 && tzYear < 100) tzDate.setUTCFullYear(tzYear);
        const offsetMs = tzDate.getTime() - utcEstimate.getTime();

        // The user's components are local to the timezone, so subtract the offset
        return utcEstimate.getTime() - offsetMs;
    }

    //types
    bool(series: any) {
        const val = Series.from(series).get(0);
        return !isNaN(val) && val !== 0;
    }
    int(series: any) {
        const val = Series.from(series).get(0);
        if (typeof val !== 'number')
            throw new Error(
                `Cannot call "int" with argument "x"="${val}". An argument of "literal string" type was used but a "simple int" is expected.`,
            );
        return Math.trunc(val);
    }
    float(series: any) {
        const val = Series.from(series).get(0);
        if (typeof val !== 'number')
            throw new Error(
                `Cannot call "float" with argument "x"="${val}". An argument of "literal string" type was used but a "const float" is expected.`,
            );
        return val;
    }
    string(series: any) {
        //Pine Script seems to be throwing an error for any argument that is not a string
        //the following implementation might need to be updated in the future
        const val = Series.from(series).get(0);
        return val.toString();
    }

    Type(definition: Record<string, string>) {
        const definitionKeys = Object.keys(definition);
        const UDT = {
            new: function (...args: any[]) {
                //map the args to the definition
                const mappedArgs = {};
                for (let i = 0; i < args.length; i++) {
                    mappedArgs[definitionKeys[i]] = args[i];
                }
                return new PineTypeObject(mappedArgs, this.context);
            },

            copy: function (object: PineTypeObject) {
                return new PineTypeObject(object.__def__, this.context);
            },
        };
        return UDT;
    }
}
