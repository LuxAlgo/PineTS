// SPDX-License-Identifier: AGPL-3.0-only

import { assertCollectionSize, chargeCollectionAllocation, preflightCollectionGrowth } from '../collectionCapacity';
import { backingArray, isSliceView, registerSliceAlias } from './sliceView';

const guardedTargets = new WeakMap<any[], any[]>();
const chargedArrays = new WeakMap<object, WeakSet<any[]>>();

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

/** Guard direct array-property writes as well as the Pine array mutator methods. */
export function guardArray(array: any[], context: any): any[] {
    const raw = rawArray(array);
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
