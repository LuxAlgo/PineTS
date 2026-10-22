import { describe, expect, it } from 'vitest';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { PineArrayObject, PineArrayType } from '../../src/namespaces/array/PineArrayObject';
import { PineMapObject } from '../../src/namespaces/map/PineMapObject';
import { PineMatrixObject } from '../../src/namespaces/matrix/PineMatrixObject';

const context = () => ({ precision: (value: number) => value, executionBudget: new ExecutionBudget() });

describe('collection capacity boundaries', () => {
    it('preflights array push, unshift, insert, and concat without partial mutation', () => {
        const ctx = context();
        const operations = [
            (id: PineArrayObject) => id.push(2),
            (id: PineArrayObject) => id.unshift(2),
            (id: PineArrayObject) => id.insert(0, 2),
            (id: PineArrayObject) => id.concat(new PineArrayObject([2, 3], PineArrayType.int, ctx)),
        ];
        for (const mutate of operations) {
            const id = new PineArrayObject(Array(100_000).fill(1), PineArrayType.int, ctx);
            expect(() => mutate(id)).toThrow(PineRuntimeError);
            expect(id.array).toHaveLength(100_000);
            expect(id.array[0]).toBe(1);
            expect(id.array[99_999]).toBe(1);
        }
    });

    it('counts growth of a slice and nested slice against its backing array', () => {
        const ctx = context();
        const root = new PineArrayObject(Array(100_000).fill(1), PineArrayType.int, ctx);
        const slice = root.slice(0, 2);
        const nested = slice.slice(0, 1);
        expect(() => nested.push(9)).toThrow(PineRuntimeError);
        expect(() => slice.concat(new PineArrayObject([7, 8], PineArrayType.int, ctx))).toThrow(PineRuntimeError);
        expect(root.array).toHaveLength(100_000);
        expect(slice.array).toHaveLength(2);
        expect(nested.array).toHaveLength(1);
        expect(root.array[0]).toBe(1);
    });

    it('rejects direct oversized arrays and charges separate legal allocations to one budget', () => {
        const ctx = context();
        expect(() => new PineArrayObject(Array(100_001), PineArrayType.any, ctx)).toThrow(PineRuntimeError);
        const full = new PineArrayObject(Array(100_000).fill(0), PineArrayType.int, ctx);
        expect(() => full.array.push(1)).toThrow(PineRuntimeError);
        expect(full.array).toHaveLength(100_000);
        const small = { precision: (value: number) => value, executionBudget: new ExecutionBudget(100, { maxMemoryBytes: 128 }) };
        expect(new PineArrayObject(Array(10).fill(1), PineArrayType.int, small).length).toBe(10);
        expect(() => new PineArrayObject(Array(10).fill(2), PineArrayType.int, small)).toThrow(PineRuntimeError);
    });

    it('bounds map put and put_all atomically while allowing replacement', () => {
        const ctx = context();
        const target = new PineMapObject(ctx);
        for (let i = 0; i < 100_000; i++) target.map.set(i, i);
        expect(target.put(0, 99)).toBe(0);
        expect(() => target.put('overflow', 1)).toThrow(PineRuntimeError);
        expect(() => target.map.set('overflow', 1)).toThrow(PineRuntimeError);
        const source = new PineMapObject(ctx);
        source.map.set(0, 7);
        source.map.set('overflow', 1);
        expect(() => target.put_all(source)).toThrow(PineRuntimeError);
        expect(target.map.size).toBe(100_000);
        expect(target.map.get(0)).toBe(99);
        expect(target.map.has('overflow')).toBe(false);
    });

    it('rejects invalid matrix dimensions and products in the internal constructor', () => {
        const ctx = context();
        for (const dimension of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => new PineMatrixObject(dimension, 1, 0, ctx)).toThrow(PineRuntimeError);
            expect(() => new PineMatrixObject(1, dimension, 0, ctx)).toThrow(PineRuntimeError);
        }
        expect(() => new PineMatrixObject(317, 317, 0, ctx)).toThrow(PineRuntimeError);
        expect(new PineMatrixObject(250, 400, 0, ctx).matrix).toHaveLength(250);
    });

    it('rejects oversized derived mult and kron before allocation', () => {
        const ctx = context();
        const column = new PineMatrixObject(1_000, 1, 1, ctx);
        const row = new PineMatrixObject(1, 101, 1, ctx);
        expect(() => column.mult(row)).toThrow(PineRuntimeError);
        const a = new PineMatrixObject(1, 317, 1, ctx);
        const b = new PineMatrixObject(317, 1, 1, ctx);
        expect(() => a.kron(b)).toThrow(PineRuntimeError);
        expect(column.matrix).toHaveLength(1_000);
        expect(row.matrix[0]).toHaveLength(101);
    });

    it('rejects incompatible or oversized reshape without modifying the source', () => {
        const ctx = context();
        const matrix = new PineMatrixObject(2, 2, 1, ctx);
        const before = matrix.matrix.map((row) => [...row]);
        expect(() => matrix.reshape(1, 100_001)).toThrow(PineRuntimeError);
        expect(() => matrix.reshape(3, 2)).toThrow(PineRuntimeError);
        expect(matrix.matrix).toEqual(before);
        matrix.reshape(1, 4);
        expect(matrix.matrix).toEqual([[1, 1, 1, 1]]);
    });

    it('preflights matrix add_row, add_col, and concat without partial mutation', () => {
        const ctx = context();
        const matrix = new PineMatrixObject(500, 200, 1, ctx);
        const originalRows = matrix.matrix.length;
        const originalFirst = [...matrix.matrix[0]];
        expect(() => matrix.add_row(0, [9])).toThrow(PineRuntimeError);
        expect(() => matrix.add_col(0, [9])).toThrow(PineRuntimeError);
        expect(() => matrix.concat(new PineMatrixObject(1, 200, 2, ctx))).toThrow(PineRuntimeError);
        expect(matrix.matrix).toHaveLength(originalRows);
        expect(matrix.matrix[0]).toEqual(originalFirst);
    });

    it('guards direct writes through the exposed matrix rows and grid', () => {
        const ctx = context();
        const matrix = new PineMatrixObject(500, 200, 1, ctx);
        expect(() => matrix.matrix.push(Array(200).fill(2))).toThrow(PineRuntimeError);
        expect(() => matrix.matrix[0].push(2)).toThrow(PineRuntimeError);
        expect(matrix.matrix).toHaveLength(500);
        expect(matrix.matrix[0]).toHaveLength(200);
    });

    it('preflights aggregate memory for aliased arrays, bulk maps, and matrix columns', () => {
        const arrayContext = { precision: (value: number) => value, executionBudget: new ExecutionBudget(100, { maxMemoryBytes: 16 }) };
        const root = new PineArrayObject([1], PineArrayType.int, arrayContext);
        const view = root.slice(0, 1);
        view.push(2);
        expect(() => view.push(3)).toThrow(PineRuntimeError);
        expect(root.array).toEqual([1, 2]);

        const mapContext = { executionBudget: new ExecutionBudget(100, { maxMemoryBytes: 128 }) };
        const left = new PineMapObject(mapContext);
        const right = new PineMapObject(mapContext);
        left.put('a', 1);
        left.put('b', 2);
        right.put('a', 3);
        right.put('c', 4);
        expect(() => left.put_all(right)).toThrow(PineRuntimeError);
        expect([...left.map]).toEqual([['a', 1], ['b', 2]]);

        const matrixContext = { executionBudget: new ExecutionBudget(100, { maxMemoryBytes: 40 }) };
        const matrix = new PineMatrixObject(2, 2, 1, matrixContext);
        expect(() => matrix.add_col(0, [8, 9])).toThrow(PineRuntimeError);
        expect(matrix.matrix).toEqual([[1, 1], [1, 1]]);
    });

    it('allows legal growth after a matrix column is removed', () => {
        const matrix = new PineMatrixObject(2, 2, 1, context());
        matrix.remove_col(0);
        matrix.add_col(1, [3, 4]);
        expect(matrix.matrix).toEqual([[1, 3], [1, 4]]);
    });

    it('does not let aliased matrix rows undercount their logical cells', () => {
        const matrix = new PineMatrixObject(1, 49_999, 1, context());
        matrix.matrix.push(matrix.matrix[0]);
        matrix.matrix[0].push(2);
        expect(matrix.matrix[1]).toHaveLength(49_999);
        matrix.matrix[1].push(3);
        expect(() => matrix.matrix[0].push(4)).toThrow(PineRuntimeError);
        expect(matrix.matrix[0]).toHaveLength(50_000);
        expect(matrix.matrix[1]).toHaveLength(50_000);
    });
});
