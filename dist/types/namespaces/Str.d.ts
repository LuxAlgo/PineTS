import { Context } from '..';
export declare class Str {
    private context;
    constructor(context: Context);
    param(source: any, index?: number, name?: string): any;
    tostring(value: any): string;
    tonumber(value: any): number;
    lower(value: string): string;
    upper(value: string): string;
    trim(value: string): string;
    repeat(source: string, repeat: number, separator?: string): string;
    replace_all(source: string, target: string, replacement: string): string;
    replace(source: string, target: string, replacement: string, occurrence?: number): string;
    contains(source: string, target: string): boolean;
    endswith(source: string, target: string): boolean;
    startswith(source: string, target: string): boolean;
    pos(source: string, target: string): number;
    length(source: string): number;
    match(source: string, pattern: string): RegExpMatchArray;
    split(source: string, separator: string): string[][];
    substring(source: string, begin_pos: number, end_pos: number): string;
    format(message: string, ...args: any[]): string;
    /**
     * Converts a UNIX timestamp to a formatted string using the specified format and timezone.
     * @param time - UNIX timestamp in milliseconds
     * @param format - Format pattern string (e.g., "yyyy.MM.dd HH:mm:ss")
     * @param timezone - Optional timezone (e.g., "America/New_York", "UTC")
     * @returns Formatted date/time string
     *
     * Supported format patterns:
     * - yyyy/YYYY: 4-digit year
     * - yy/YY: 2-digit year
     * - MM: Month (01-12)
     * - MMM: Month short name (Jan, Feb...)
     * - MMMM: Month full name (January, February...)
     * - dd: Day of month (01-31)
     * - d: Day of month (1-31)
     * - HH: Hour 24h (00-23)
     * - H: Hour 24h (0-23)
     * - hh: Hour 12h (01-12)
     * - h: Hour 12h (1-12)
     * - mm: Minutes (00-59)
     * - m: Minutes (0-59)
     * - ss: Seconds (00-59)
     * - s: Seconds (0-59)
     * - SSS: Milliseconds (000-999)
     * - a: AM/PM
     * - z: Timezone abbreviation
     * - EEEE: Day of week full (Monday...)
     * - EEE/E: Day of week short (Mon...)
     */
    format_time(time: number, format?: string, timezone?: string): string;
}
