import { PineTypeObject } from './PineTypeObject';
export declare function parseIndicatorOptions(args: any[]): Partial<IndicatorOptions>;
export declare class Core {
    private context;
    color: {
        param: (source: any, index?: number) => any;
        rgb: (r: number, g: number, b: number, a?: number) => string;
        new: (color: string, a?: number) => string;
        /**
         * Extracts the red component from a color (0-255)
         */
        r: (color: string) => number;
        /**
         * Extracts the green component from a color (0-255)
         */
        g: (color: string) => number;
        /**
         * Extracts the blue component from a color (0-255)
         */
        b: (color: string) => number;
        /**
         * Extracts the transparency component from a color (0-100, where 0 is opaque)
         */
        t: (color: string) => number;
        /**
         * Creates a color from a gradient between two colors based on a value's position in a range
         * @param value - The value to map to the gradient
         * @param bottom_value - The bottom of the range
         * @param top_value - The top of the range
         * @param bottom_color - The color at the bottom of the range
         * @param top_color - The color at the top of the range
         * @returns The interpolated color
         */
        from_gradient: (value: number, bottom_value: number, top_value: number, bottom_color: string, top_color: string) => string;
        white: string;
        lime: string;
        green: string;
        red: string;
        maroon: string;
        black: string;
        gray: string;
        blue: string;
        yellow: string;
        orange: string;
        purple: string;
        pink: string;
        brown: string;
        teal: string;
        cyan: string;
        navy: string;
        indigo: string;
        violet: string;
        magenta: string;
        rose: string;
        gold: string;
        silver: string;
        bronze: string;
        aqua: string;
        fuchsia: string;
        olive: string;
    };
    /**
     * Converts a color string to RGB components
     */
    private _colorToRGB;
    /**
     * Parses a color component from a color string
     */
    private _parseColorComponent;
    constructor(context: any);
    private extractPlotOptions;
    indicator(...args: any[]): any;
    get bar_index(): any;
    na(series: any): boolean;
    nz(series: any, replacement?: number): any;
    fixnan(series: any): any;
    alertcondition(condition: any, title: any, message: any): void;
    alert(message: string, freq?: string): void;
    /**
     * Runtime error namespace
     */
    runtime: {
        /**
         * Throws a runtime error with the specified message.
         * In Pine Script, this stops script execution.
         * @param message - The error message
         */
        error: (message: string) => never;
    };
    /**
     * Declares the script as a library.
     * In PineTS, this is a no-op as library functionality is not needed.
     * @param title - The library title
     * @param overlay - Whether the library uses overlay mode
     */
    library(title: string, overlay?: boolean): void;
    /**
     * Sets the maximum number of bars back that the script can reference.
     * In Pine Script, this is used to ensure historical data availability.
     * In PineTS, this is primarily informational.
     * @param target - The series to set max bars back for
     * @param length - The number of bars back to reference
     */
    max_bars_back(target: any, length: number): void;
    /**
     * Returns the day of month (1-31) from a UNIX timestamp
     */
    dayofmonth(time?: any): number;
    /**
     * Returns the day of week (1=Sunday, 7=Saturday) from a UNIX timestamp
     */
    dayofweek(time?: any): number;
    /**
     * Returns the hour (0-23) from a UNIX timestamp
     */
    hour(time?: any): number;
    /**
     * Returns the minute (0-59) from a UNIX timestamp
     */
    minute(time?: any): number;
    /**
     * Returns the second (0-59) from a UNIX timestamp
     */
    second(time?: any): number;
    /**
     * Returns the month (1-12) from a UNIX timestamp
     */
    month(time?: any): number;
    /**
     * Returns the year from a UNIX timestamp
     */
    year(time?: any): number;
    /**
     * Returns the week of year (1-53) from a UNIX timestamp
     */
    weekofyear(time?: any): number;
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
    timestamp(year: any, month: any, day: any, hour?: any, minute?: any, second?: any): number;
    bool(series: any): boolean;
    int(series: any): number;
    float(series: any): number;
    string(series: any): any;
    Type(definition: Record<string, string>): {
        new: (...args: any[]) => PineTypeObject;
        copy: (object: PineTypeObject) => PineTypeObject;
    };
}
