// SPDX-License-Identifier: AGPL-3.0-only
// Array and matrix built-ins work on the plain storage of their object instead of the guard Proxy
// behind `.array` / `.matrix` (see array/capacity.ts and matrix/capacity.ts). These tests pin what
// that must not change:
//   - a built-in charges the run exactly what the guard charges for the same growth;
//   - the public `.array` / `.matrix` properties stay guarded, also after built-ins have run;
//   - a matrix guard built late still counts every cell the matrix holds.
// The reference in each comparison is the guarded path, whose behaviour collection-hardening.test.ts pins.

import { describe, expect, it } from 'vitest';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { PineArrayObject, PineArrayType } from '../../src/namespaces/array/PineArrayObject';
import { PineMatrixObject } from '../../src/namespaces/matrix/PineMatrixObject';

const context = (maxMemoryBytes?: number) => ({
    precision: (value: number) => value,
    executionBudget: new ExecutionBudget(100, maxMemoryBytes === undefined ? {} : { maxMemoryBytes }),
});
const charged = (ctx: { executionBudget: ExecutionBudget }) => ctx.executionBudget.chargedMemoryBytes;

describe('array built-ins charge growth like the guard', () => {
    const growers: Array<[string, (id: PineArrayObject, i: number) => void, (raw: any[], i: number) => void]> = [
        ['push', (id, i) => id.push(i), (raw, i) => raw.push(i)],
        ['unshift', (id, i) => id.unshift(i), (raw, i) => raw.unshift(i)],
        ['insert', (id, i) => id.insert(0, i), (raw, i) => raw.splice(0, 0, i)],
    ];

    for (const [name, viaBuiltin, viaGuard] of growers) {
        it(`${name}: same charge and same content as growing through .array`, () => {
            const a = context(), b = context();
            const builtin = new PineArrayObject([1, 2, 3], PineArrayType.int, a);
            const guarded = new PineArrayObject([1, 2, 3], PineArrayType.int, b);
            for (let i = 0; i < 50; i++) {
                viaBuiltin(builtin, i);
                viaGuard(guarded.array, i);
            }
            expect(charged(a)).toBe(charged(b));
            expect(charged(a)).toBe((3 + 50) * 8);
            expect([...builtin.array]).toEqual([...guarded.array]);
        });
    }

    it('concat: charges the appended elements once', () => {
        const a = context(), b = context();
        const builtin = new PineArrayObject([1], PineArrayType.int, a);
        builtin.concat(new PineArrayObject([2, 3, 4], PineArrayType.int, a));
        const guarded = new PineArrayObject([1], PineArrayType.int, b);
        const other = new PineArrayObject([2, 3, 4], PineArrayType.int, b);
        for (const value of other.array) guarded.array.push(value);
        expect(charged(a)).toBe(charged(b));
        expect([...builtin.array]).toEqual([1, 2, 3, 4]);
    });

    it('removing and reordering built-ins charge nothing', () => {
        const ctx = context();
        const id = new PineArrayObject([5, 3, 9, 1, 7], PineArrayType.int, ctx);
        const before = charged(ctx);
        id.shift();
        id.pop();
        id.remove(0);
        id.reverse();
        id.sort();
        id.set(0, 4);
        id.fill(2);
        id.clear();
        expect(charged(ctx)).toBe(before);
        expect(id.size()).toBe(0);
    });

    it('a slice grown by a built-in is charged once, to its backing array', () => {
        const a = context(), b = context();
        const builtinRoot = new PineArrayObject([1, 2, 3, 4], PineArrayType.int, a);
        const guardedRoot = new PineArrayObject([1, 2, 3, 4], PineArrayType.int, b);
        builtinRoot.slice(1, 3).push(9);
        guardedRoot.slice(1, 3).array.push(9);
        expect(charged(a)).toBe(charged(b));
        expect([...builtinRoot.array]).toEqual([1, 2, 3, 9, 4]);
        expect([...builtinRoot.array]).toEqual([...guardedRoot.array]);
    });

    it('stops a built-in at the memory budget without changing the array', () => {
        const ctx = context(8 * 4);
        const id = new PineArrayObject([1, 2, 3], PineArrayType.int, ctx);
        id.push(4);
        for (const grow of [() => id.push(5), () => id.unshift(5), () => id.insert(1, 5), () => id.concat(id)]) {
            expect(grow).toThrow(PineRuntimeError);
        }
        expect([...id.array]).toEqual([1, 2, 3, 4]);
        expect(charged(ctx)).toBe(8 * 4);
    });
});

describe('the public properties stay guarded', () => {
    it('.array is guarded after built-ins have used the store', () => {
        const ctx = context();
        const id = new PineArrayObject(Array(99_999).fill(0), PineArrayType.int, ctx);
        id.push(1);
        expect(id.get(99_999)).toBe(1);
        expect(() => id.array.push(2)).toThrow(PineRuntimeError);
        expect(() => id.push(2)).toThrow(PineRuntimeError);
        expect(id.array).toHaveLength(100_000);
        // One guard per object: outside code and slices see a stable identity.
        expect(id.array).toBe(id.array);
    });

    it('a built-in sees what was written through .array, and the reverse', () => {
        const id = new PineArrayObject([1, 2], PineArrayType.int, context());
        id.array.push(3);
        expect(id.size()).toBe(3);
        expect(id.sum()).toBe(6);
        id.push(4);
        expect([...id.array]).toEqual([1, 2, 3, 4]);
        expect([...id]).toEqual([1, 2, 3, 4]);
        expect(id.length).toBe(4);
    });

    it('replacing .array re-validates, re-charges and drops the old guard', () => {
        const ctx = context();
        const id = new PineArrayObject([1], PineArrayType.int, ctx);
        const oldGuard = id.array;
        expect(() => { id.array = Array(100_001); }).toThrow(PineRuntimeError);
        id.array = [7, 8, 9];
        expect(charged(ctx)).toBe((1 + 3) * 8);
        expect(id.array).not.toBe(oldGuard);
        expect(id.get(2)).toBe(9);
    });

    it('exposes no named property holding the plain storage', () => {
        const names = (obj: object) => Object.getOwnPropertyNames(obj);
        const id = new PineArrayObject([1, 2], PineArrayType.int, context());
        const m = new PineMatrixObject(2, 2, 1, context());
        id.push(3);
        m.set(0, 0, 5);
        for (const [obj, guard] of [[id, id.array], [m, m.matrix]] as Array<[any, any]>) {
            for (const name of names(obj)) {
                const value = obj[name];
                if (Array.isArray(value)) expect(value, `property "${name}"`).toBe(guard);
            }
        }
    });
});

describe('matrix built-ins and the late guard', () => {
    it('reads and in-place writes charge nothing; results are charged as allocations', () => {
        const ctx = context();
        const a = new PineMatrixObject(3, 3, 2, ctx);
        const afterA = charged(ctx);
        expect(afterA).toBe(9 * 8);
        a.set(1, 1, 5);
        a.fill(4, 0, 1, 0, 3);
        a.swap_columns(0, 2);
        expect(a.get(1, 1)).toBe(5);
        expect(a.sum(1).get(0, 0)).toBe(5);
        expect(charged(ctx)).toBe(afterA + 9 * 8);
        expect(a.transpose().get(1, 1)).toBe(5);
        expect(charged(ctx)).toBe(afterA + 2 * 9 * 8);
    });

    it('a guard built after in-place writes still counts every cell', () => {
        // 2 x 49_999 cells written in place first; the guard is only built by the direct access below.
        const matrix = new PineMatrixObject(2, 49_999, 1, context());
        matrix.set(0, 0, 9);
        matrix.fill(3, 1, 2, 0, 10);
        matrix.matrix[0].push(2);
        matrix.matrix[1].push(2);
        expect(() => matrix.matrix[0].push(4)).toThrow(PineRuntimeError);
        expect(matrix.matrix[0]).toHaveLength(50_000);
        expect(matrix.get(0, 0)).toBe(9);
        expect(matrix.get(1, 5)).toBe(3);
    });

    it('structural built-ins after store reads keep their preflight', () => {
        const ctx = context(8 * 5);
        const matrix = new PineMatrixObject(2, 2, 1, ctx);
        expect(matrix.rows()).toBe(2);
        expect(matrix.columns()).toBe(2);
        expect(matrix.max()).toBe(1);
        expect(() => matrix.add_col(0, [8, 9])).toThrow(PineRuntimeError);
        expect(matrix.matrix).toEqual([[1, 1], [1, 1]]);
        expect(matrix.rows()).toBe(2);
        expect(matrix.columns()).toBe(2);
    });

    it('add_row, add_col and concat charge the added cells like the guarded grid', () => {
        const a = context(), b = context();
        const builtin = new PineMatrixObject(2, 3, 1, a);
        const guarded = new PineMatrixObject(2, 3, 1, b);

        builtin.add_row(1, [7, 8, 9]);
        guarded.matrix.splice(1, 0, [7, 8, 9]);
        expect(charged(a)).toBe(charged(b));
        expect(charged(a)).toBe((6 + 3) * 8);

        builtin.add_col(0, [4, 5, 6]);
        [4, 5, 6].forEach((value, i) => guarded.matrix[i].splice(0, 0, value));
        expect(charged(a)).toBe(charged(b));
        expect(charged(a)).toBe((6 + 3 + 3) * 8);

        const extraA = new PineMatrixObject(2, 4, 2, a);
        const extraB = new PineMatrixObject(2, 4, 2, b);
        builtin.concat(extraA);
        for (const row of extraB.matrix) guarded.matrix.push([...row]);
        expect(charged(a)).toBe(charged(b));
        expect(builtin.matrix).toEqual(guarded.matrix);
        expect(builtin.matrix).toEqual([[4, 1, 1, 1], [5, 7, 8, 9], [6, 1, 1, 1], [2, 2, 2, 2], [2, 2, 2, 2]]);
    });

    it('removing and reordering built-ins charge nothing', () => {
        const ctx = context();
        const matrix = new PineMatrixObject(3, 3, 0, ctx);
        let n = 9;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) matrix.set(i, j, n--);
        const before = charged(ctx);
        matrix.sort(0);
        expect(matrix.matrix).toEqual([[3, 2, 1], [6, 5, 4], [9, 8, 7]]);
        matrix.reverse();
        expect(matrix.matrix).toEqual([[7, 8, 9], [4, 5, 6], [1, 2, 3]]);
        matrix.swap_rows(0, 2);
        expect(matrix.matrix).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
        expect(charged(ctx)).toBe(before);
        // The removed row and column come back as new arrays, which are allocations of their own.
        expect([...matrix.remove_row(1).array]).toEqual([4, 5, 6]);
        expect([...matrix.remove_col(0).array]).toEqual([1, 7]);
        expect(matrix.matrix).toEqual([[2, 3], [8, 9]]);
        expect(charged(ctx)).toBe(before + (3 + 2) * 8);
    });

    it('an existing guard follows what the structural built-ins do', () => {
        const matrix = new PineMatrixObject(1, 49_999, 1, context());
        const grid = matrix.matrix;
        // Through built-ins, with the guard already built: it must now count 2 x 49_999 cells.
        matrix.add_row(1, Array(49_999).fill(2));
        grid[0].push(3);
        grid[1].push(3);
        expect(() => grid[0].push(4)).toThrow(PineRuntimeError);
        expect(() => matrix.add_col(0, [5, 5])).toThrow(PineRuntimeError);
        expect(grid).toHaveLength(2);
        expect(grid[0]).toHaveLength(50_000);
        // After a removal through a built-in the guard has room again.
        matrix.remove_col(0);
        grid[0].push(6);
        grid[1].push(6);
        expect(() => grid[1].push(7)).toThrow(PineRuntimeError);
        expect(matrix.matrix).toBe(grid);
    });

    it('structural built-ins keep their preflight and leave the matrix intact on failure', () => {
        const ctx = context(8 * 8);
        const matrix = new PineMatrixObject(2, 3, 1, ctx);
        expect(() => matrix.add_row(0, [9, 9, 9])).toThrow(PineRuntimeError);
        expect(() => matrix.add_col(0, [9, 9])).not.toThrow();
        expect(() => matrix.add_col(0, [9, 9])).toThrow(PineRuntimeError);
        expect(() => matrix.concat(matrix)).toThrow(PineRuntimeError);
        expect(matrix.matrix).toEqual([[9, 1, 1, 1], [9, 1, 1, 1]]);
        expect(charged(ctx)).toBe(8 * 8);
    });

    it('mult, kron and transpose give the same cells as the guarded grid', () => {
        const ctx = context();
        const a = new PineMatrixObject(2, 3, 0, ctx);
        const b = new PineMatrixObject(3, 2, 0, ctx);
        let n = 1;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) a.set(i, j, n++);
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) b.set(i, j, n++);
        // Hand calculation: [[1,2,3],[4,5,6]] x [[7,8],[9,10],[11,12]]
        expect(a.mult(b).matrix).toEqual([[58, 64], [139, 154]]);
        expect(a.transpose().matrix).toEqual([[1, 4], [2, 5], [3, 6]]);
        expect(a.mult(2).matrix).toEqual([[2, 4, 6], [8, 10, 12]]);
        const k = new PineMatrixObject(1, 2, 1, ctx).kron(a);
        expect(k.matrix).toEqual([[1, 2, 3, 1, 2, 3], [4, 5, 6, 4, 5, 6]]);
    });
});
