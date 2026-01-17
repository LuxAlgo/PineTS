import { describe, expect, it } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('Str Namespace', () => {
    it('should handle all string operations correctly', async () => {
        // Use a small date range for fast execution
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-05').getTime();

        // Using Mock provider or any provider that works
        // Assuming Provider.Mock works based on other tests
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;

            // Testing string operations

            // Formatting
            const fmt = str.format('Hello {0}!', 'World');
            const fmt_nums = str.format('Val: {0}, {1}', 10, 20);

            // Case conversion
            const low = str.lower('HELLO');
            const up = str.upper('hello');

            // Trimming
            const trimmed = str.trim('  hello  ');

            // Replacement
            const rep = str.replace('hello world', 'world', 'pine', 0);
            const rep_all = str.replace_all('foo bar foo', 'foo', 'baz');
            const rep_occ = str.replace('a b a b a', 'a', 'c', 1); // Replace 2nd occurrence (index 1)

            // Substring/Split
            const sub = str.substring('hello', 1, 4); // "ell"
            const spl = str.split('a,b,c', ',');

            // Querying
            const has = str.contains('hello world', 'world');
            const starts = str.startswith('hello world', 'hello');
            const ends = str.endswith('hello world', 'world');
            const len = str.length('hello');
            const idx = str.pos('hello world', 'world');

            // Matching
            const mat = str.match('hello 123', '\\d+');

            // Repeating
            const rept = str.repeat('ab', 3);

            // Type conversion
            const num = str.tonumber('123.45');
            const s = str.tostring(123.45);

            // Param (Series) - testing it handles values correctly
            const p = str.param('test', 0);

            return {
                fmt,
                fmt_nums,
                low,
                up,
                trimmed,
                rep,
                rep_all,
                rep_occ,
                sub,
                spl,
                has,
                starts,
                ends,
                len,
                idx,
                mat,
                rept,
                num,
                s,
                p,
            };
        };

        const { result } = await pineTS.run(sourceCode);

        // Check results from the last bar
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.fmt)).toBe('Hello World!');
        expect(last(result.fmt_nums)).toBe('Val: 10, 20');

        expect(last(result.low)).toBe('hello');
        expect(last(result.up)).toBe('HELLO');

        expect(last(result.trimmed)).toBe('hello');

        expect(last(result.rep)).toBe('hello pine');
        expect(last(result.rep_all)).toBe('baz bar baz');
        expect(last(result.rep_occ)).toBe('a b c b a');

        expect(last(result.sub)).toBe('ell');
        // Split returns an array, but wrapped in Series/array structure?
        // In PineTS, arrays are usually returned as is if they are not series of arrays?
        // Let's check what split returns. In Str.ts: String(source).split(separator) -> string[]
        // The runtime might wrap this or treat it as a value.
        // If it's a value in the context.result, it might be stored as an array of arrays if it's per bar.
        const splitRes = last(result.spl);
        expect(splitRes).toEqual(['a', 'b', 'c']);

        expect(last(result.has)).toBe(true);
        expect(last(result.starts)).toBe(true);
        expect(last(result.ends)).toBe(true);
        expect(last(result.len)).toBe(5);
        expect(last(result.idx)).toBe(6);

        const matchRes = last(result.mat);
        // match returns RegExpMatchArray or null.
        // String("hello 123").match("\\d+") -> ["123", index: 6, input: "hello 123", groups: undefined]
        // Jest/Vitest equality might handle this.
        expect(matchRes).toBe('123');

        expect(last(result.rept)).toBe('ababab');

        expect(last(result.num)).toBe(123.45);
        expect(last(result.s)).toBe('123.45');

        expect(last(result.p)).toBe('test');
    });

    it('should handle edge cases', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;

            // Empty strings
            const empty_len = str.length('');
            const empty_rep = str.replace('', 'a', 'b', 0);

            // Not found
            const not_found = str.pos('hello', 'z');

            // Out of bounds substring
            const sub_oob = str.substring('hello', 0, 100);

            // Format without args
            const fmt_no_args = str.format('hello');

            // Conversion failures -> implementation uses Number() which returns NaN for invalid
            const nan_num = str.tonumber('abc');

            return {
                empty_len,
                empty_rep,
                not_found,
                sub_oob,
                fmt_no_args,
                nan_num,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.empty_len)).toBe(0);
        expect(last(result.empty_rep)).toBe('');
        expect(last(result.not_found)).toBeNaN();
        expect(last(result.sub_oob)).toBe('hello'); // substring handles oob by capping
        expect(last(result.fmt_no_args)).toBe('hello'); // replace won't find placeholders
        expect(last(result.nan_num)).toBeNaN();
    });

    it('should format time correctly', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;

            // Test timestamp: 2024-06-15 13:30:45.123 UTC
            const testTime = 1718458245123;

            // Basic date format
            const date_only = str.format_time(testTime, 'yyyy-MM-dd', 'UTC');

            // Basic time format
            const time_only = str.format_time(testTime, 'HH:mm:ss', 'UTC');

            // Full datetime
            const full = str.format_time(testTime, 'yyyy.MM.dd HH:mm:ss', 'UTC');

            // 12-hour format with AM/PM
            const hour12 = str.format_time(testTime, 'hh:mm a', 'UTC');

            // With milliseconds
            const with_ms = str.format_time(testTime, 'HH:mm:ss.SSS', 'UTC');

            // Month names
            const month_short = str.format_time(testTime, 'dd MMM yyyy', 'UTC');
            const month_full = str.format_time(testTime, 'dd MMMM yyyy', 'UTC');

            // Day of week
            const weekday_short = str.format_time(testTime, 'EEE, dd MMM', 'UTC');
            const weekday_full = str.format_time(testTime, 'EEEE, dd MMMM', 'UTC');

            // With timezone
            const with_tz = str.format_time(testTime, 'HH:mm z', 'UTC');

            // Different timezone
            const ny_time = str.format_time(testTime, 'yyyy-MM-dd HH:mm', 'America/New_York');

            // 2-digit year
            const short_year = str.format_time(testTime, 'dd/MM/yy', 'UTC');

            return {
                date_only,
                time_only,
                full,
                hour12,
                with_ms,
                month_short,
                month_full,
                weekday_short,
                weekday_full,
                with_tz,
                ny_time,
                short_year,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.date_only)).toBe('2024-06-15');
        expect(last(result.time_only)).toBe('13:30:45');
        expect(last(result.full)).toBe('2024.06.15 13:30:45');
        expect(last(result.hour12)).toBe('01:30 PM');
        expect(last(result.with_ms)).toBe('13:30:45.123');
        expect(last(result.month_short)).toBe('15 Jun 2024');
        expect(last(result.month_full)).toBe('15 June 2024');
        expect(last(result.weekday_short)).toBe('Sat, 15 Jun');
        expect(last(result.weekday_full)).toBe('Saturday, 15 June');
        expect(last(result.with_tz)).toBe('13:30 UTC');
        expect(last(result.ny_time)).toBe('2024-06-15 09:30'); // UTC-4 in June (EDT)
        expect(last(result.short_year)).toBe('15/06/24');
    });

    it('should handle format_time edge cases', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;

            // Midnight test (00:00:00)
            const midnight = 1718409600000; // 2024-06-15 00:00:00 UTC
            const midnight_12h = str.format_time(midnight, 'hh:mm a', 'UTC');
            const midnight_24h = str.format_time(midnight, 'HH:mm', 'UTC');

            // Noon test (12:00:00)
            const noon = 1718452800000; // 2024-06-15 12:00:00 UTC
            const noon_12h = str.format_time(noon, 'hh:mm a', 'UTC');
            const noon_24h = str.format_time(noon, 'HH:mm', 'UTC');

            // Default format (no format provided)
            const default_fmt = str.format_time(1718458245123);

            // NaN handling
            const nan_time = str.format_time(NaN, 'yyyy-MM-dd', 'UTC');

            return {
                midnight_12h,
                midnight_24h,
                noon_12h,
                noon_24h,
                default_fmt,
                nan_time,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.midnight_12h)).toBe('12:00 AM');
        expect(last(result.midnight_24h)).toBe('00:00');
        expect(last(result.noon_12h)).toBe('12:00 PM');
        expect(last(result.noon_24h)).toBe('12:00');
        expect(last(result.default_fmt)).toBe('2024.06.15 13:30:45');
        expect(last(result.nan_time)).toBe('');
    });
});
