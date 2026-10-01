import { describe, expect, it } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { PineArrayObject } from '../../src/namespaces/array/PineArrayObject';

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
        // str.split returns a PineArrayObject (array<string>) per Pine Script spec
        const splitRes = last(result.spl);
        expect(splitRes).toBeInstanceOf(PineArrayObject);
        expect(splitRes.array).toEqual(['a', 'b', 'c']);

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

    it('should format timestamps via str.format_time', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;

            // Fixed UNIX ms timestamp: 2024-03-19 (Tuesday) 14:05:09 UTC.
            // Inlined as a literal because the source is re-transpiled and locals
            // aren't visible in the wrapper Function scope.
            return {
                date_only:  str.format_time(1710857109000, 'yyyy-MM-dd', 'UTC'),
                dow_short:  str.format_time(1710857109000, "EEE (yyyy-MM-dd)", 'UTC'),
                dow_long:   str.format_time(1710857109000, 'EEEE', 'UTC'),
                month_long: str.format_time(1710857109000, 'MMMM d, yyyy', 'UTC'),
                month_short:str.format_time(1710857109000, 'MMM d', 'UTC'),
                time_24:    str.format_time(1710857109000, 'HH:mm:ss', 'UTC'),
                time_12:    str.format_time(1710857109000, 'h:mm a', 'UTC'),
                year_2:     str.format_time(1710857109000, 'yy', 'UTC'),
                escaped:    str.format_time(1710857109000, "yyyy'T'HH:mm", 'UTC'),
                tz_offset:  str.format_time(1710857109000, 'Z', 'UTC'),
                tz_ny:      str.format_time(1710857109000, 'yyyy-MM-dd HH:mm Z', 'America/New_York'),
                nan_input:  str.format_time(NaN, 'yyyy', 'UTC'),
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.date_only)).toBe('2024-03-19');
        expect(last(result.dow_short)).toBe('Tue (2024-03-19)');
        expect(last(result.dow_long)).toBe('Tuesday');
        expect(last(result.month_long)).toBe('March 19, 2024');
        expect(last(result.month_short)).toBe('Mar 19');
        expect(last(result.time_24)).toBe('14:05:09');
        expect(last(result.time_12)).toBe('2:05 PM');
        expect(last(result.year_2)).toBe('24');
        // 'T' inside single quotes is a literal — must NOT be substituted
        expect(last(result.escaped)).toBe('2024T14:05');
        expect(last(result.tz_offset)).toBe('+0000');
        // NY in March is on DST (EDT, UTC-04:00) → 14:05 UTC = 10:05 local
        expect(last(result.tz_ny)).toBe('2024-03-19 10:05 -0400');
        // TradingView formats an na time as the epoch
        expect(last(result.nan_input)).toBe('1970');
    });
});
