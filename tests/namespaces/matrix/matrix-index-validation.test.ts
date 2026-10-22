import { describe, expect, it } from 'vitest';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';
import { PineMatrixObject } from '../../../src/namespaces/matrix/PineMatrixObject';
import { get } from '../../../src/namespaces/matrix/methods/get';
import { set } from '../../../src/namespaces/matrix/methods/set';
import { swap_rows } from '../../../src/namespaces/matrix/methods/swap_rows';
import { swap_columns } from '../../../src/namespaces/matrix/methods/swap_columns';
import { row } from '../../../src/namespaces/matrix/methods/row';
import { col } from '../../../src/namespaces/matrix/methods/col';
import { add_row } from '../../../src/namespaces/matrix/methods/add_row';
import { add_col } from '../../../src/namespaces/matrix/methods/add_col';
import { remove_row } from '../../../src/namespaces/matrix/methods/remove_row';
import { remove_col } from '../../../src/namespaces/matrix/methods/remove_col';
import { fill } from '../../../src/namespaces/matrix/methods/fill';
import { sort } from '../../../src/namespaces/matrix/methods/sort';
import { submatrix } from '../../../src/namespaces/matrix/methods/submatrix';

describe('matrix index validation', () => {
    const makeMatrix = () => new PineMatrixObject(2, 2, 0, {});

    it('rejects prototype keys and malformed numeric indices before reading', () => {
        const matrix = makeMatrix();
        const read = get({} as any);
        for (const index of ['constructor', '__proto__', '0', NaN, Infinity, 0.5, -1, 2, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => read(matrix, 0, index as number)).toThrow(PineRuntimeError);
            expect(() => read(matrix, index as number, 0)).toThrow(PineRuntimeError);
        }
        expect(read(matrix, 0, 0)).toBe(0);
    });

    it('rejects invalid writes atomically and keeps array prototypes intact', () => {
        const matrix = makeMatrix();
        const write = set({} as any);
        const original = matrix.matrix.map((row) => [...row]);
        const arrayPrototype = Object.getPrototypeOf(matrix.matrix);
        const rowPrototype = Object.getPrototypeOf(matrix.matrix[0]);

        for (const index of ['constructor', '__proto__', '0', NaN, Infinity, 0.5, -1, 2, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => write(matrix, 0, index as number, 7)).toThrow(PineRuntimeError);
            expect(() => write(matrix, index as number, 0, 7)).toThrow(PineRuntimeError);
        }
        expect(matrix.matrix).toEqual(original);
        expect(Object.getPrototypeOf(matrix.matrix)).toBe(arrayPrototype);
        expect(Object.getPrototypeOf(matrix.matrix[0])).toBe(rowPrototype);
        write(matrix, 1, 1, 7);
        expect(get({} as any)(matrix, 1, 1)).toBe(7);
    });

    it('validates both swap indices before mutating', () => {
        const matrix = makeMatrix();
        matrix.matrix[0][0] = 1;
        matrix.matrix[1][0] = 2;
        const before = matrix.matrix.map((row) => [...row]);

        expect(() => swap_rows({} as any)(matrix, 0, '__proto__' as any)).toThrow(PineRuntimeError);
        expect(() => swap_columns({} as any)(matrix, 0, 'constructor' as any)).toThrow(PineRuntimeError);
        expect(matrix.matrix).toEqual(before);
        expect(Object.getPrototypeOf(matrix.matrix)).toBe(Array.prototype);
        expect(Object.getPrototypeOf(matrix.matrix[0])).toBe(Array.prototype);
    });

    it('rejects invalid indices in sibling matrix methods without touching another matrix', () => {
        const matrix = makeMatrix();
        const other = makeMatrix();
        other.matrix[0][0] = 99;
        const before = matrix.matrix.map((values) => [...values]);

        for (const operation of [
            () => row({} as any)(matrix, 'constructor' as any),
            () => col({} as any)(matrix, '__proto__' as any),
            () => add_row({} as any)(matrix, '0' as any, [1, 2]),
            () => add_col({} as any)(matrix, '0' as any, [1, 2]),
            () => remove_row({} as any)(matrix, '0' as any),
            () => remove_col({} as any)(matrix, '0' as any),
            () => fill({} as any)(matrix, 7, 0, 2, '0' as any, 2),
            () => sort({} as any)(matrix, 'constructor' as any),
            () => submatrix({} as any)(matrix, '__proto__' as any, 2, 0, 2),
        ]) {
            expect(operation).toThrow(PineRuntimeError);
            expect(matrix.matrix).toEqual(before);
            expect(other.matrix[0][0]).toBe(99);
        }
    });

    it('keeps valid end-exclusive ranges and end-position insertions working', () => {
        const matrix = makeMatrix();
        add_row({} as any)(matrix, 2, [3, 4]);
        add_col({} as any)(matrix, 2, [5, 6, 7]);
        expect(matrix.matrix).toEqual([[0, 0, 5], [0, 0, 6], [3, 4, 7]]);

        fill({} as any)(matrix, 9, 2, 3, 2, 3);
        expect(matrix.matrix[2][2]).toBe(9);
        expect(submatrix({} as any)(matrix, 1, 3, 1, 3).matrix).toEqual([[0, 6], [4, 9]]);
    });
});
