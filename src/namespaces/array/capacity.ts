// SPDX-License-Identifier: AGPL-3.0-only

import { assertCollectionSize, chargeCollectionAllocation, preflightCollectionGrowth } from '../collectionCapacity';
import { backingArray, isSliceView, registerSliceAlias } from './sliceView';

const guardedTargets = new WeakMap<any[], any[]>();
const chargedArrays = new WeakMap<object, WeakSet<any[]>>();

/**
 * Key of the array a Pine array object stores, for the built-ins of this namespace (`arrayStore`).
 *
 * A symbol rather than a named field on purpose: a script can only reach a property it can name,
 * and the closed-world verifier rejects computed member access, so no Pine source can read it.
 */
export const ARRAY_STORE: unique symbol = Symbol('pine.array.store');

/**
 * The array a Pine array object's built-ins operate on.
 *
 * For an ordinary array this is the plain JS array. The guard handed out by the object's public
 * `array` property is a Proxy: every element a native `shift` / `unshift` / `splice` moves goes
 * through its `set` trap, and every read misses the engine's array fast path. A built-in that
 * cannot grow the array (reads, in-bounds writes, removals, reordering), or that has run
 * `preflightArrayGrowth` and `chargeArrayGrowth` itself, loses nothing by working on the plain
 * array: there is no growth left for the guard to check or charge.
 *
 * For a slice view this is the guarded view. Its Proxy is the view: it maps reads and writes onto
 * the backing array, whose own guard charges any growth.
 *
 * Never hand the result to code outside the namespace, and never store it on a Pine object under a
 * named property.
 */
export function arrayStore(id: any): any[] {
    return id[ARRAY_STORE];
}

/**
 * Charge the growth a built-in is about to apply to its store, exactly as the guard's `set` trap
 * would have. Call after `preflightArrayGrowth`, before mutating. A slice view is not charged
 * here: the built-in mutates it through its Proxy, and the backing array's guard charges.
 */
export function chargeArrayGrowth(store: any[], added: number, context: any): void {
    if (added > 0 && !guardedTargets.has(store)) chargeCollectionAllocation(context, added, 'array.grow');
}

function rawArray(array: any[]): any[] {
    while (guardedTargets.has(array)) array = guardedTargets.get(array)!;
    return array;
}

function rootArray(array: any[]): any[] {
    let current = rawArray(array);
    while (isSliceView(current)) current = rawArray(backingArray(current));
    return current;
}

/** Check both the visible slice and its backing collection before any mutating operation. */
export function preflightArrayGrowth(array: any[], added: number, context: any, method: string): void {
    assertCollectionSize(array.length + added, method);
    const root = rootArray(array);
    preflightCollectionGrowth(context, root.length, root.length + added, method);
}

/** Size-check an array and charge its elements to the run, once per array and budget. */
function admitArray(raw: any[], context: any): void {
    assertCollectionSize(raw.length, 'array.new');
    const budget = context?.executionBudget;
    if (budget && !isSliceView(raw)) {
        let seen = chargedArrays.get(budget);
        if (!seen) chargedArrays.set(budget, (seen = new WeakSet()));
        if (!seen.has(raw)) {
            chargeCollectionAllocation(context, raw.length, 'array.new');
            seen.add(raw);
        }
    }
}

/**
 * Take the array a Pine array object is about to hold: check and charge it now, and return the
 * store its built-ins will use (see `arrayStore`). The guard Proxy for outside access is built on
 * demand by `guardArray`: a script that declares `var a = array.new_float()` builds an array object
 * on every bar, and a Proxy with its weak-map entries per object was the largest cost of this
 * namespace.
 */
export function adoptArray(array: any[], context: any): any[] {
    const raw = rawArray(array);
    admitArray(raw, context);
    // A view only exists as its Proxy, and growing it must reach its backing array's guard.
    return isSliceView(raw) ? guardArray(array, context) : raw;
}

/** Guard direct array-property writes as well as the Pine array mutator methods. */
export function guardArray(array: any[], context: any): any[] {
    const raw = rawArray(array);
    admitArray(raw, context);
    if (guardedTargets.has(array)) return array;

    const grow = (prop: string | symbol, value: any): void => {
        const current = array.length;
        let next = current;
        if (prop === 'length') next = Number(value);
        else if (typeof prop === 'string' && /^(0|[1-9]\d*)$/.test(prop)) {
            const index = Number(prop);
            if (Number.isSafeInteger(index) && index >= current) next = index + 1;
        }
        if (next <= current) return;
        assertCollectionSize(next, 'array.grow');
        const root = rootArray(array);
        if (isSliceView(raw)) {
            // The backing array's guard performs the single memory charge.
            assertCollectionSize(root.length + next - current, 'array.grow');
        } else {
            preflightCollectionGrowth(context, current, next, 'array.grow');
            chargeCollectionAllocation(context, next - current, 'array.grow');
        }
    };

    const guarded = new Proxy(array, {
        set(target, prop, value) {
            grow(prop, value);
            return Reflect.set(target, prop, value, target);
        },
        defineProperty(target, prop, descriptor) {
            if ('value' in descriptor) grow(prop, descriptor.value);
            return Reflect.defineProperty(target, prop, descriptor);
        },
    });
    guardedTargets.set(guarded, raw);
    if (isSliceView(raw)) registerSliceAlias(guarded, raw);
    return guarded;
}
