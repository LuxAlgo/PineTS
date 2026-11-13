// SPDX-License-Identifier: AGPL-3.0-only

import { assertCollectionSize, assertMatrixDimensions, chargeCollectionAllocation, preflightCollectionGrowth } from '../collectionCapacity';
import { PineRuntimeError } from '../../errors/PineRuntimeError';

function indexOf(prop: string | symbol): number {
    if (typeof prop !== 'string' || !/^(0|[1-9]\d*)$/.test(prop)) return -1;
    const index = Number(prop);
    return Number.isSafeInteger(index) ? index : -1;
}

/** Keep direct matrix/row property access under the same size and run budget as namespace methods. */
export function guardMatrix(matrix: any[][], context: any, chargeInitial: boolean): any[][] {
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
    const data = chargeInitial ? matrix.map((row) => [...row]) : matrix;
    let cells = initialCells;
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
