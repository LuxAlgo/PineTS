// SPDX-License-Identifier: AGPL-3.0-only

import { assertCollectionSize, preflightCollectionGrowth } from '../collectionCapacity';

const MAX_INDEX = 2 ** 32 - 2;
const parents = new WeakMap<any[], any[]>();

/** A capacity guard around a view retains the same backing-array identity. */
export function registerSliceAlias(alias: any[], view: any[]): void {
    parents.set(alias, view);
}

export function isSliceView(array: any[]): boolean {
    return parents.has(array);
}

export function backingArray(array: any[]): any[] {
    let current = array;
    while (parents.has(current)) current = parents.get(current)!;
    return current;
}

function toIndex(prop: string | symbol): number {
    if (typeof prop !== 'string' || !/^(0|[1-9]\d*)$/.test(prop)) return -1;
    const i = Number(prop);
    return i <= MAX_INDEX ? i : -1;
}

/**
 * A JS array that is a window `[start, start + length)` onto `parent` (which may itself be a view), as
 * `array.slice()` returns on TradingView: reads and writes go to the parent, and growing or shrinking the
 * view inserts into / removes from the parent at the end of the window. Every Array.prototype method works on
 * it, since they only use index access and `length`.
 *
 * Structural changes made to the parent directly do not move the window: it keeps its start and length.
 */
export function createSliceView(parent: any[], start: number, length: number, context?: any): any[] {
    const target: any[] = [];
    target.length = length;

    const resize = (newLength: number) => {
        const len = target.length;
        assertCollectionSize(newLength, 'array.slice');
        if (newLength > len) {
            const backing = backingArray(parent);
            preflightCollectionGrowth(context, backing.length, backing.length + newLength - len, 'array.slice');
        }
        if (newLength < len) parent.splice(start + newLength, len - newLength);
        else if (newLength > len) {
            // Keep the argument list below engine limits even for a legal large view.
            let inserted = 0;
            while (inserted < newLength - len) {
                const count = Math.min(8192, newLength - len - inserted);
                parent.splice(start + len + inserted, 0, ...Array(count).fill(undefined));
                inserted += count;
            }
        }
        target.length = newLength;
    };

    const view = new Proxy(target, {
        get(t, prop, receiver) {
            const i = toIndex(prop);
            if (i !== -1) return i < t.length ? parent[start + i] : undefined;
            return Reflect.get(t, prop, receiver);
        },
        set(t, prop, value, receiver) {
            if (prop === 'length') {
                resize(Number(value));
                return true;
            }
            const i = toIndex(prop);
            if (i !== -1) {
                if (i >= t.length) resize(i + 1);
                parent[start + i] = value;
                return true;
            }
            return Reflect.set(t, prop, value, receiver);
        },
        has(t, prop) {
            const i = toIndex(prop);
            if (i !== -1) return i < t.length;
            return Reflect.has(t, prop);
        },
        deleteProperty(t, prop) {
            const i = toIndex(prop);
            if (i !== -1) {
                if (i < t.length) parent[start + i] = undefined;
                return true;
            }
            return Reflect.deleteProperty(t, prop);
        },
        ownKeys(t) {
            const keys: (string | symbol)[] = [];
            for (let i = 0; i < t.length; i++) keys.push(String(i));
            return keys.concat(Reflect.ownKeys(t));
        },
        getOwnPropertyDescriptor(t, prop) {
            const i = toIndex(prop);
            if (i !== -1) {
                if (i >= t.length) return undefined;
                return { value: parent[start + i], writable: true, enumerable: true, configurable: true };
            }
            return Reflect.getOwnPropertyDescriptor(t, prop);
        },
    });
    parents.set(view, parent);
    return view;
}
