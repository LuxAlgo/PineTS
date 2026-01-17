// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';
import { PineTypeObject } from './PineTypeObject';
import { parseArgsForPineParams } from './utils';

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
export class Core {
    public color = {
        param: (source, index = 0) => {
            return Series.from(source).get(index);
        },
        rgb: (r: number, g: number, b: number, a?: number) => (a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`),
        new: (color: string, a?: number) => {
            // Handle hexadecimal colors
            if (color && color.startsWith('#')) {
                // Remove # and convert to RGB
                const hex = color.slice(1);
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);

                return a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`;
            }
            // Handle existing RGB format
            return a ? `rgba(${color}, ${(100 - a) / 100})` : color;
        },
        /**
         * Extracts the red component from a color (0-255)
         */
        r: (color: string): number => {
            return this._parseColorComponent(color, 'r');
        },
        /**
         * Extracts the green component from a color (0-255)
         */
        g: (color: string): number => {
            return this._parseColorComponent(color, 'g');
        },
        /**
         * Extracts the blue component from a color (0-255)
         */
        b: (color: string): number => {
            return this._parseColorComponent(color, 'b');
        },
        /**
         * Extracts the transparency component from a color (0-100, where 0 is opaque)
         */
        t: (color: string): number => {
            return this._parseColorComponent(color, 't');
        },
        /**
         * Creates a color from a gradient between two colors based on a value's position in a range
         * @param value - The value to map to the gradient
         * @param bottom_value - The bottom of the range
         * @param top_value - The top of the range
         * @param bottom_color - The color at the bottom of the range
         * @param top_color - The color at the top of the range
         * @returns The interpolated color
         */
        from_gradient: (value: number, bottom_value: number, top_value: number, bottom_color: string, top_color: string): string => {
            if (value === null || value === undefined || Number.isNaN(value)) {
                return '';
            }

            // Clamp value to range
            const clampedValue = Math.max(bottom_value, Math.min(top_value, value));

            // Calculate position in range (0-1)
            const range = top_value - bottom_value;
            const position = range === 0 ? 0.5 : (clampedValue - bottom_value) / range;

            // Parse both colors
            const bottomRGB = this._colorToRGB(bottom_color);
            const topRGB = this._colorToRGB(top_color);

            // Interpolate each component
            const r = Math.round(bottomRGB.r + (topRGB.r - bottomRGB.r) * position);
            const g = Math.round(bottomRGB.g + (topRGB.g - bottomRGB.g) * position);
            const b = Math.round(bottomRGB.b + (topRGB.b - bottomRGB.b) * position);
            const a = bottomRGB.a + (topRGB.a - bottomRGB.a) * position;

            if (a < 1) {
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
            return `rgb(${r}, ${g}, ${b})`;
        },
        // Standard web colors
        white: '#FFFFFF',
        lime: '#00FF00',
        green: '#008000',
        red: '#FF0000',
        maroon: '#800000',
        black: '#000000',
        gray: '#808080',
        blue: '#0000FF',
        yellow: '#FFFF00',
        orange: '#FFA500',
        purple: '#800080',
        pink: '#FFC0CB',
        brown: '#A52A2A',
        teal: '#008080',
        cyan: '#00FFFF',
        navy: '#000080',
        indigo: '#4B0082',
        violet: '#EE82EE',
        magenta: '#FF00FF',
        rose: '#FF007F',
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        // Additional missing colors from Pine Script
        aqua: '#00FFFF', // Same as cyan
        fuchsia: '#FF00FF', // Same as magenta
        olive: '#808000',
    };

    /**
     * Converts a color string to RGB components
     */
    private _colorToRGB(color: string): { r: number; g: number; b: number; a: number } {
        if (!color) return { r: 0, g: 0, b: 0, a: 1 };

        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
            };
        }

        // Handle rgb/rgba
        const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1], 10),
                g: parseInt(rgbMatch[2], 10),
                b: parseInt(rgbMatch[3], 10),
                a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
            };
        }

        // Handle named colors by looking them up
        const namedColors: Record<string, string> = {
            white: '#FFFFFF',
            lime: '#00FF00',
            green: '#008000',
            red: '#FF0000',
            maroon: '#800000',
            black: '#000000',
            gray: '#808080',
            blue: '#0000FF',
            yellow: '#FFFF00',
            orange: '#FFA500',
            purple: '#800080',
            pink: '#FFC0CB',
            brown: '#A52A2A',
            teal: '#008080',
            cyan: '#00FFFF',
            navy: '#000080',
            indigo: '#4B0082',
            violet: '#EE82EE',
            magenta: '#FF00FF',
            rose: '#FF007F',
            gold: '#FFD700',
            silver: '#C0C0C0',
            bronze: '#CD7F32',
            aqua: '#00FFFF',
            fuchsia: '#FF00FF',
            olive: '#808000',
        };

        const lowerColor = color.toLowerCase();
        if (namedColors[lowerColor]) {
            return this._colorToRGB(namedColors[lowerColor]);
        }

        return { r: 0, g: 0, b: 0, a: 1 };
    }

    /**
     * Parses a color component from a color string
     */
    private _parseColorComponent(color: string, component: 'r' | 'g' | 'b' | 't'): number {
        const rgb = this._colorToRGB(color);
        switch (component) {
            case 'r':
                return rgb.r;
            case 'g':
                return rgb.g;
            case 'b':
                return rgb.b;
            case 't':
                // Pine Script transparency is 0-100 where 0 is opaque
                return Math.round((1 - rgb.a) * 100);
            default:
                return 0;
        }
    }
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

    alert(message: string, freq?: string) {
        // In PineTS, alerts are logged but not actually sent
        // freq can be: alert.freq_once_per_bar, alert.freq_once_per_bar_close, alert.freq_all
        console.log(`[ALERT] ${message}`);
    }

    /**
     * Runtime error namespace
     */
    public runtime = {
        /**
         * Throws a runtime error with the specified message.
         * In Pine Script, this stops script execution.
         * @param message - The error message
         */
        error: (message: string): never => {
            throw new Error(`[Runtime Error] ${message}`);
        },
    };

    /**
     * Declares the script as a library.
     * In PineTS, this is a no-op as library functionality is not needed.
     * @param title - The library title
     * @param overlay - Whether the library uses overlay mode
     */
    library(title: string, overlay: boolean = false): void {
        // Library declaration - no-op in PineTS
        // In Pine Script, this marks the script as a library that can be imported
        this.context.isLibrary = true;
        this.context.libraryTitle = title;
        this.context.libraryOverlay = overlay;
    }

    /**
     * Sets the maximum number of bars back that the script can reference.
     * In Pine Script, this is used to ensure historical data availability.
     * In PineTS, this is primarily informational.
     * @param target - The series to set max bars back for
     * @param length - The number of bars back to reference
     */
    max_bars_back(target: any, length: number): void {
        // In PineTS, we don't need to pre-allocate historical data
        // This is just informational
        this.context.maxBarsBack = Math.max(this.context.maxBarsBack || 0, length);
    }

    // Time functions - extract time components from a timestamp
    /**
     * Returns the day of month (1-31) from a UNIX timestamp
     */
    dayofmonth(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCDate();
    }

    /**
     * Returns the day of week (1=Sunday, 7=Saturday) from a UNIX timestamp
     */
    dayofweek(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCDay() + 1;
    }

    /**
     * Returns the hour (0-23) from a UNIX timestamp
     */
    hour(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCHours();
    }

    /**
     * Returns the minute (0-59) from a UNIX timestamp
     */
    minute(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCMinutes();
    }

    /**
     * Returns the second (0-59) from a UNIX timestamp
     */
    second(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCSeconds();
    }

    /**
     * Returns the month (1-12) from a UNIX timestamp
     */
    month(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCMonth() + 1;
    }

    /**
     * Returns the year from a UNIX timestamp
     */
    year(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        return new Date(t).getUTCFullYear();
    }

    /**
     * Returns the week of year (1-53) from a UNIX timestamp
     */
    weekofyear(time?: any): number {
        const t = time !== undefined ? Series.from(time).get(0) : this.context.pine.time;
        if (t === null || t === undefined || Number.isNaN(t)) return NaN;
        const date = new Date(t);
        // ISO week calculation
        const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    /**
     * Creates a UNIX timestamp from date/time components
     * @param year - Year
     * @param month - Month (1-12)
     * @param day - Day of month (1-31)
     * @param hour - Hour (0-23), default 0
     * @param minute - Minute (0-59), default 0
     * @param second - Second (0-59), default 0
     * @returns UNIX timestamp in milliseconds
     */
    timestamp(year: any, month: any, day: any, hour: any = 0, minute: any = 0, second: any = 0): number {
        const y = Series.from(year).get(0);
        const mo = Series.from(month).get(0);
        const d = Series.from(day).get(0);
        const h = Series.from(hour).get(0);
        const mi = Series.from(minute).get(0);
        const s = Series.from(second).get(0);

        if ([y, mo, d].some(v => v === null || v === undefined || Number.isNaN(v))) {
            return NaN;
        }

        // Month is 1-12 in Pine Script, 0-11 in JavaScript
        return Date.UTC(y, mo - 1, d, h || 0, mi || 0, s || 0);
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
                `Cannot call "int" with argument "x"="${val}". An argument of "literal string" type was used but a "simple int" is expected.`
            );
        return Math.floor(val);
    }
    float(series: any) {
        const val = Series.from(series).get(0);
        if (typeof val !== 'number')
            throw new Error(
                `Cannot call "float" with argument "x"="${val}". An argument of "literal string" type was used but a "const float" is expected.`
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
