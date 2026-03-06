// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Str Namespace: Format Pattern Tests
 *
 * Regression tests for str.tostring() format pattern support and
 * str.format() extended patterns ({0,number,#.##}).
 *
 * Previously, str.tostring() only returned String(value) for all formats.
 * The fix adds support for:
 * - Pattern-based formats: "#", "#.#", "#.##", "#.####", "0.000"
 * - Named formats: "integer", "percent", "price", "volume", "mintick"
 *
 * str.format() was also fixed to handle {0,number,#.##} extended patterns
 * in addition to simple {0} placeholders.
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('Str.tostring Format Patterns', () => {
    const sDate = new Date('2019-01-01').getTime();
    const eDate = new Date('2019-01-02').getTime();

    it('should format with "#" pattern (integer, no decimals)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(123.456, '#');
            const r2 = str.tostring(0.9, '#');
            const r3 = str.tostring(-5.7, '#');
            return { r1, r2, r3 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('123');
        expect(last(result.r2)).toBe('1');
        expect(last(result.r3)).toBe('-6');
    });

    it('should format with "#.#" pattern (1 decimal)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(123.456, '#.#');
            const r2 = str.tostring(5.0, '#.#');
            const r3 = str.tostring(-0.14, '#.#');
            return { r1, r2, r3 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('123.5');
        expect(last(result.r2)).toBe('5.0');
        expect(last(result.r3)).toBe('-0.1');
    });

    it('should format with "#.##" pattern (2 decimals)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(123.456, '#.##');
            const r2 = str.tostring(42195.1, '#.##');
            const r3 = str.tostring(0.005, '#.##');
            return { r1, r2, r3 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('123.46');
        expect(last(result.r2)).toBe('42195.10');
        expect(last(result.r3)).toBe('0.01');  // 0.005 rounds to 0.01
    });

    it('should format with "#.####" pattern (4 decimals)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(3.14159, '#.####');
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('3.1416');
    });

    it('should format with "integer" named format', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(123.7, 'integer');
            const r2 = str.tostring(-0.4, 'integer');
            return { r1, r2 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('124');
        expect(last(result.r2)).toBe('0');
    });

    it('should format with "percent" named format', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(0.4567, 'percent');
            const r2 = str.tostring(1.0, 'percent');
            return { r1, r2 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('45.67%');
        expect(last(result.r2)).toBe('100.00%');
    });

    it('should format with "volume" named format (integer)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(1234567.89, 'volume');
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('1234568');
    });

    it('should return String(value) for NaN', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str, na } = context.pine;
            const r1 = str.tostring(NaN, '#.##');
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('NaN');
    });

    it('should return String(value) when no format is provided', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.tostring(42.5);
            const r2 = str.tostring('hello');
            return { r1, r2 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('42.5');
        expect(last(result.r2)).toBe('hello');
    });
});

describe('Str.format Extended Patterns', () => {
    const sDate = new Date('2019-01-01').getTime();
    const eDate = new Date('2019-01-02').getTime();

    it('should handle {0,number,#.##} pattern', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.format('{0,number,#.##}', 123.456);
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('123.46');
    });

    it('should handle mixed simple and extended patterns', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.format('Price: {0,number,#.##}, Volume: {1}', 42195.123, 1000);
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('Price: 42195.12, Volume: 1000');
    });

    it('should handle {0,number,#} integer pattern', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.format('Count: {0,number,#}', 99.7);
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('Count: 100');
    });

    it('should handle multiple extended patterns in one format string', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.format('{0,number,#.#} / {1,number,#.###}', 3.14159, 2.71828);
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('3.1 / 2.718');
    });

    it('should fall back to String() for non-numeric values with number pattern', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { str } = context.pine;
            const r1 = str.format('{0,number,#.##}', 'not_a_number');
            return { r1 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.r1)).toBe('not_a_number');
    });
});
