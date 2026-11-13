// SPDX-License-Identifier: AGPL-3.0-only

import { assertCollectionSize, assertMatrixDimensions, chargeCollectionAllocation, preflightCollectionGrowth } from '../collectionCapacity';
import { PineRuntimeError } from '../../errors/PineRuntimeError';

function indexOf(prop: string | symbol): number {
    if (typeof prop !== 'string' || !/^(0|[1-9]\d*)$/.test(prop)) return -1;
    const index = Number(prop);
    return Number.isSafeInteger(index) ? index : -1;
}

/**
 * Key of the rows a Pine matrix object stores, for the built-ins of this namespace (`matrixStore`).
 *
 * A symbol rather than a named field on purpose: a script can only reach a property it can name,
 * and the closed-world verifier rejects computed member access, so no Pine source can read it.
 */
export const MATRIX_STORE: unique symbol = Symbol('pine.matrix.store');

/**
 * The plain rows of a Pine matrix object, for the built-ins of this namespace.
 *
 * The guard handed out by the object's public `matrix` property is a Proxy over the grid with a
 * `get` trap that returns a second Proxy per row, so a cell read in an inner loop costs two traps.
 * Reading cells, and writing a cell at a row and column the built-in has already validated, changes
 * no dimension: the guard has nothing to check or charge, and the plain rows give the same result.
 *
 * NEVER use the result to add, remove, replace or resize rows, or to write past a row's length.
 * The guard counts the matrix's cells and charges their growth; every structural change must go
 * through the guarded grid (`id.matrix`).
 *
 * Never hand the result to code outside the namespace, and never store it on a Pine object under a
 * named property.
 */
export function matrixStore(id: any): any[][] {
    return id[MATRIX_STORE];
}

/**
 * Take the rows a Pine matrix object is about to hold: validate them, charge them when they come
 * from outside (`chargeInitial`), and return the plain rows the object stores. The guard for
 * outside access is built on demand by `guardGrid`: matrix arithmetic creates a result object per
 * operation, and two Proxies with their weak-map entries per object dominated its cost.
 */
export function adoptMatrix(matrix: any[][], context: any, chargeInitial: boolean): any[][] {
    if (!Array.isArray(matrix)) throw new PineRuntimeError('Matrix data must be an array of rows.', 'matrix.new');
    const rows = matrix.length;
    const cols = rows > 0 && Array.isArray(matrix[0]) ? matrix[0].length : 0;
    const initialCells = assertMatrixDimensions(rows, cols, 'matrix.new');
    for (const row of matrix) {
        if (!Array.isArray(row) || row.length !== cols) {
            throw new PineRuntimeError('Matrix rows must have matching dimensions.', 'matrix.new');
        }
    }
    if (chargeInitial) chargeCollectionAllocation(context, initialCells, 'matrix.new');
    // Never retain caller-owned row references: aliases could otherwise grow one
    // backing row while accounting it as only one of several logical rows.
    return chargeInitial ? matrix.map((row) => [...row]) : matrix;
}

/** Keep direct matrix/row property access under the same size and run budget as namespace methods. */
export function guardMatrix(matrix: any[][], context: any, chargeInitial: boolean): any[][] {
    return guardGrid(adoptMatrix(matrix, context, chargeInitial), context);
}

/**
 * The guard over rows taken by `adoptMatrix`. Built-ins only read cells or write them in place
 * until a guard exists (see `matrixStore`), so the rows still hold exactly the cells that were
 * validated and charged at adoption: counting them now gives the same total.
 */
export function guardGrid(data: any[][], context: any): any[][] {
    let cells = 0;
    for (const row of data) cells += row.length;
    const rowProxies = new WeakMap<any[], any[]>();
    const activeRows = new WeakSet<any[]>(data);

    const reserveCells = (added: number, method: string) => {
        if (added <= 0) return;
        preflightCollectionGrowth(context, cells, cells + added, method);
        chargeCollectionAllocation(context, added, method);
        cells += added;
    };

    const wrapRow = (row: any[]): any[] => {
        let proxy = rowProxies.get(row);
        if (proxy) return proxy;
        const grow = (prop: string | symbol, value: any) => {
            const next = prop === 'length' ? Number(value) : Math.max(row.length, indexOf(prop) + 1);
            if (next <= row.length) return;
            assertCollectionSize(next, 'matrix.row');
            if (activeRows.has(row)) reserveCells(next - row.length, 'matrix.row');
            else {
                preflightCollectionGrowth(context, row.length, next, 'matrix.row');
                chargeCollectionAllocation(context, next - row.length, 'matrix.row');
            }
        };
        proxy = new Proxy(row, {
            set(target, prop, value) {
                const oldLength = target.length;
                grow(prop, value);
                const result = Reflect.set(target, prop, value, target);
                if (prop === 'length' && target.length < oldLength && activeRows.has(row)) cells -= oldLength - target.length;
                return result;
            },
            defineProperty(target, prop, descriptor) {
                if ('value' in descriptor) grow(prop, descriptor.value);
                return Reflect.defineProperty(target, prop, descriptor);
            },
        });
        rowProxies.set(row, proxy);
        return proxy;
    };

    return new Proxy(data, {
        get(target, prop, receiver) {
            const index = indexOf(prop);
            if (index >= 0 && index < target.length && Array.isArray(target[index])) return wrapRow(target[index]);
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value) {
            if (prop === 'length') {
                const next = Number(value);
                assertCollectionSize(next, 'matrix.row');
                if (next > target.length) throw new PineRuntimeError('Sparse matrix rows are not allowed.', 'matrix.row');
                for (let i = next; i < target.length; i++) {
                    cells -= target[i]?.length ?? 0;
                    if (Array.isArray(target[i])) activeRows.delete(target[i]);
                }
                return Reflect.set(target, prop, value, target);
            }
            const index = indexOf(prop);
            if (index >= 0) {
                if (!Array.isArray(value)) throw new PineRuntimeError('Matrix row must be an array.', 'matrix.row');
                if (index > target.length) throw new PineRuntimeError('Sparse matrix rows are not allowed.', 'matrix.row');
                const oldRow = index < target.length ? target[index] : undefined;
                const oldSize = oldRow?.length ?? 0;
                const newSize = value.length;
                assertCollectionSize(newSize, 'matrix.row');
                if (index === target.length) assertCollectionSize(target.length + 1, 'matrix.row');
                reserveCells(Math.max(0, newSize - oldSize), 'matrix.row');
                if (newSize < oldSize) cells -= oldSize - newSize;
                const copiedRow = [...value];
                const result = Reflect.set(target, prop, copiedRow, target);
                if (Array.isArray(oldRow)) activeRows.delete(oldRow);
                activeRows.add(copiedRow);
                return result;
            }
            return Reflect.set(target, prop, value, target);
        },
        deleteProperty(target, prop) {
            const index = indexOf(prop);
            if (index >= 0 && index < target.length) {
                cells -= target[index]?.length ?? 0;
                if (Array.isArray(target[index])) activeRows.delete(target[index]);
            }
            return Reflect.deleteProperty(target, prop);
        },
    });
}
