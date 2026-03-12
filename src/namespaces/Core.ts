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
        const val = Series.from(series).get(0);
        // null/undefined are always na
        if (val === null || val === undefined) return true;
        // For numbers, check NaN (Pine Script na for numeric types)
        if (typeof val === 'number') return val !== val;
        // Objects (arrays, UDTs, etc.) and strings are never na
        return false;
    }
}

export class Core {
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
    alert(...args: any[]) {
        console.warn('alert called but is currently not implemented', args);
    }
    error(...args: any[]) {
        console.error('error called but is currently not implemented', args);
    }
    max_bars_back(series?: any, length?: any) {
        // No-op in PineTS — Pine Script uses this to hint the runtime about
        // how many historical bars a series needs. PineTS keeps full history.
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
        // Parse in exchange timezone (not system local time) to match TradingView behaviour.
        if (parsed.dateString !== undefined) {
            const ds = parsed.dateString.trim();
            // If the string already carries explicit timezone info, honour it
            if (/[Zz]$/.test(ds) || /[+-]\d{2}:?\d{2}$/.test(ds)) {
                return new Date(ds).getTime();
            }
            // Force UTC parse (normalize "YYYY-MM-DD HH:MM" → "YYYY-MM-DDTHH:MMZ")
            // then extract UTC components and reinterpret in exchange timezone.
            const isoStr = ds.includes('T') ? ds + 'Z' : ds.replace(/\s+/, 'T') + 'Z';
            const utcDate = new Date(isoStr);
            if (!isNaN(utcDate.getTime())) {
                const timezone = this.context.pine?.syminfo?.timezone || 'UTC';
                return this._timestampFromComponents(
                    timezone,
                    utcDate.getUTCFullYear(),
                    utcDate.getUTCMonth() + 1,
                    utcDate.getUTCDate(),
                    utcDate.getUTCHours(),
                    utcDate.getUTCMinutes(),
                    utcDate.getUTCSeconds(),
                );
            }
            // Fallback for other formats (RFC 2822, etc.)
            // RFC 2822 strings always include a timezone offset (e.g. "+0000"),
            // so they are normally caught by the explicit-TZ check above.
            // Any remaining string that reaches here is non-standard; parse as-is.
            return new Date(ds).getTime();
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
        if (tzNorm === 'UTC' || tzNorm === 'GMT' || tzNorm === 'Etc/UTC') {
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

    Type(definition: Record<string, string | [string, any]>) {
        // Extract field names, types, and defaults from definition.
        // Fields can be either 'type' (no default) or ['type', defaultValue].
        const definitionKeys = Object.keys(definition);
        const fieldTypes: Record<string, string> = {};
        const fieldDefaults: Record<string, any> = {};
        for (const key of definitionKeys) {
            let val: any = definition[key];
            // $.param() wraps ['type', default] arrays in Series — unwrap them
            // so we can detect the [type, default] structure.
            if (val instanceof Series) {
                val = val.data;
            }
            if (Array.isArray(val)) {
                fieldTypes[key] = val[0];
                fieldDefaults[key] = val[1];
            } else {
                fieldTypes[key] = val;
                // No default — field is na (undefined) when not provided
            }
        }

        const UDT = {
            new: function (...args: any[]) {
                // Map positional args to field names, applying defaults for missing args
                const mappedArgs: Record<string, any> = {};

                // Detect named args object: if the first (and only) argument is a plain
                // object whose keys match field names, treat it as named arguments.
                // This handles the Pine pattern: MyType.new(field1 = val1, field2 = val2)
                // which the transpiler converts to: MyType.new({ field1: val1, field2: val2 })
                let namedArgs: Record<string, any> | null = null;
                if (
                    args.length === 1 &&
                    args[0] &&
                    typeof args[0] === 'object' &&
                    !(args[0] instanceof Series) &&
                    !Array.isArray(args[0]) &&
                    !(args[0] instanceof PineTypeObject)
                ) {
                    const keys = Object.keys(args[0]);
                    if (keys.length > 0 && keys.some((k) => definitionKeys.includes(k))) {
                        namedArgs = args[0];
                        args = []; // Clear positional args
                    }
                }

                for (let i = 0; i < definitionKeys.length; i++) {
                    const key = definitionKeys[i];
                    if (namedArgs && key in namedArgs) {
                        mappedArgs[key] = namedArgs[key];
                    } else if (i < args.length) {
                        mappedArgs[key] = args[i];
                    } else if (key in fieldDefaults) {
                        // Evaluate default at construction time — handles series references
                        // (e.g. hl2) that need to resolve to the current bar's value.
                        mappedArgs[key] = Series.from(fieldDefaults[key]).get(0);
                    }
                    // else: field remains absent (na/undefined)
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
