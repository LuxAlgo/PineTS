import { describe, expect, it, vi } from 'vitest';
import { Str } from '../../src/namespaces/Str';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { PineArrayObject, PineArrayType } from '../../src/namespaces/array/PineArrayObject';

const str = new Str({} as any);

describe('bounded str operations', () => {
    it('rejects empty-string repetition whose temporary element count exceeds the cap', () => {
        expect(() => str.repeat('', 100_001, '')).toThrow(PineRuntimeError);
        expect(str.repeat('', 100_000, '')).toBe('');
    });

    it.each([Infinity, NaN, 1.5, -1, Number.MAX_SAFE_INTEGER + 1])(
        'rejects a non-integral or unsafe repeat count: %s',
        (count) => expect(() => str.repeat('x', count)).toThrow(PineRuntimeError)
    );

    it('preflights replacement growth and still supports empty targets', () => {
        expect(() => str.replace_all('a'.repeat(100_000), 'a', 'abcdefghijk')).toThrow(PineRuntimeError);
        expect(str.replace_all('ab', '', '-')).toBe('-a-b-');
        expect(str.replace_all('aaaa', 'aa', 'x')).toBe('xx');
    });

    it('caps split elements without materializing an unbounded native array', () => {
        expect(() => str.split('a'.repeat(100_001), '')).toThrow(PineRuntimeError);
        expect(str.split('a,,b', ',').array).toEqual(['a', '', 'b']);
    });

    it('rejects oversized output of single replacement and ordinary string transforms', () => {
        expect(() => str.replace('x', 'x', 'a'.repeat(1_000_001))).toThrow(PineRuntimeError);
        expect(() => str.upper('a'.repeat(1_000_001))).toThrow(PineRuntimeError);
    });

    it('charges cumulative output memory across repeated calls', () => {
        const context = { executionBudget: new ExecutionBudget(500_000, { maxMemoryBytes: 16 }) };
        const bounded = new Str(context as any);
        expect(bounded.replace_all('aa', 'a', 'bbbb')).toBe('bbbbbbbb');
        expect(() => bounded.replace_all('aa', 'a', 'bbbb')).toThrow(PineRuntimeError);
    });

    it('supports Java-flavor regex features while charging backtracking to the shared budget', () => {
        expect(str.match('a', '(?=a)a')).toBe('a');
        expect(str.match('aa', '(a)\\1')).toBe('aa');
        expect(str.match('aaaa!', '(a+)+$')).toBe('');
        expect(str.match('hello 123', '\\d+')).toBe('123');
        expect(str.match('abc{close[9]}def', '\\{\\w+\\[\\s*\\d+\\s*\\]\\}')).toBe('{close[9]}');

        const budget = new ExecutionBudget(500_000, { maxWorkUnits: 1_000, maxMemoryBytes: 1_000_000 });
        const bounded = new Str({ executionBudget: budget } as any);
        expect(() => bounded.match('a'.repeat(30) + '!', '(a+)+$')).toThrow(PineRuntimeError);
        expect(budget.workUnits).toBeGreaterThan(0);
    });

    it('bounds regex subject and pattern lengths', () => {
        expect(() => str.match('a'.repeat(4097), 'a')).toThrow(PineRuntimeError);
        expect(() => str.match('a', 'a'.repeat(257))).toThrow(PineRuntimeError);
    });

    it('bounds formatting and conversion outputs', () => {
        expect(() => str.format('{0}{0}', 'a'.repeat(600_000))).toThrow(PineRuntimeError);
        expect(() => str.format('{0}' + "''".repeat(300_000), 'a'.repeat(800_000))).toThrow(PineRuntimeError);
        expect(() => str.tostring('a'.repeat(1_000_001))).toThrow(PineRuntimeError);
        expect(str.substring('abcdef', 1, 3)).toBe('bc');
    });

    it('rejects oversized array formatting before joining the elements', () => {
        const big = 'a'.repeat(600_000);
        const array = new PineArrayObject([big, big], PineArrayType.string, {});
        const originalJoin = Array.prototype.join;
        const joinSpy = vi.spyOn(Array.prototype, 'join').mockImplementation(function (this: any[], separator?: string) {
            if (this.length === 2 && this[0] === big && this[1] === big) {
                throw new Error('array elements joined before the output limit was checked');
            }
            return originalJoin.call(this, separator);
        });
        try {
            expect(() => str.format('{0}', array)).toThrow(PineRuntimeError);
            expect(() => str.tostring(array)).toThrow(PineRuntimeError);
        } finally {
            joinSpy.mockRestore();
        }
    });

    it('reserves array formatting memory before joining while preserving ordinary output', () => {
        const small = new PineArrayObject([5, 100_000_000], PineArrayType.float, {});
        expect(str.format('{0}', small)).toBe('[5.0, 1.0E8]');
        expect(str.tostring(small)).toBe('[5, 100000000]');

        const context = { executionBudget: new ExecutionBudget(500_000, { maxMemoryBytes: 64 }) };
        const bounded = new Str(context as any);
        const large = 'a'.repeat(100);
        const array = new PineArrayObject([large, large], PineArrayType.string, {});
        const originalJoin = Array.prototype.join;
        const joinSpy = vi.spyOn(Array.prototype, 'join').mockImplementation(function (this: any[], separator?: string) {
            if (this.length === 2 && this[0] === large && this[1] === large) {
                throw new Error('array elements joined before the memory budget was checked');
            }
            return originalJoin.call(this, separator);
        });
        try {
            expect(() => bounded.format('{0}', array)).toThrow(PineRuntimeError);
        } finally {
            joinSpy.mockRestore();
        }
    });

    it('preflights direct array.join and array.toString before joining oversized elements', () => {
        const big = 'a'.repeat(600_000);
        const array = new PineArrayObject([big, big], PineArrayType.string, {});
        const originalJoin = Array.prototype.join;
        const joinSpy = vi.spyOn(Array.prototype, 'join').mockImplementation(function (this: any[], separator?: string) {
            if (this.length === 2 && this[0] === big && this[1] === big) {
                throw new Error('direct array formatter joined before checking the limit');
            }
            return originalJoin.call(this, separator);
        });
        try {
            expect(() => array.join(', ')).toThrow(PineRuntimeError);
            expect(() => String(array)).toThrow(PineRuntimeError);
        } finally {
            joinSpy.mockRestore();
        }
        expect(new PineArrayObject([5, 100_000_000], PineArrayType.float, {}).join('|')).toBe('5.0|1.0E8');
        expect(() => new PineArrayObject(['a', 'b'], PineArrayType.string, {}).join('x'.repeat(1_000_000))).toThrow(PineRuntimeError);

        const budget = new ExecutionBudget(500_000, { maxMemoryBytes: 64 });
        const budgeted = new PineArrayObject(['a'.repeat(100), 'b'], PineArrayType.string, { executionBudget: budget });
        expect(() => budgeted.join()).toThrow(PineRuntimeError);
    });

    it('bounds nested array formatting and rejects cycles without recursive materialization', () => {
        const inner = new PineArrayObject(['x'], PineArrayType.string, {});
        const outer = new PineArrayObject([inner], PineArrayType.any, {});
        expect(str.format('{0}', outer)).toBe('[[x]]');
        expect(String(outer)).toBe('[[x]]');

        inner.array[0] = 'x'.repeat(1_000_000);
        expect(() => str.format('{0}', outer)).toThrow(PineRuntimeError);
        expect(() => String(outer)).toThrow(PineRuntimeError);

        const cycle = new PineArrayObject([], PineArrayType.any, {});
        cycle.array.push(cycle);
        expect(() => str.format('{0}', cycle)).toThrow(PineRuntimeError);

        let deeplyNested = new PineArrayObject(['x'], PineArrayType.string, {});
        for (let i = 0; i < 257; i++) deeplyNested = new PineArrayObject([deeplyNested], PineArrayType.any, {});
        expect(() => str.format('{0}', deeplyNested)).toThrow(PineRuntimeError);
    });
});
