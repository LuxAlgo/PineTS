// SPDX-License-Identifier: AGPL-3.0-only

import { isNa } from './nonNaWindow';

/**
 * Committed / tentative state keyed by `key`, or `undefined` without a key (stateless use).
 *
 * A key used twice on one bar is shared by several call paths (a ta call hoisted out of an `if`
 * condition inside a user function gets a literal call id, so every caller of that function lands
 * on the same key), or the bar is being recomputed. Either way the carried values could come from
 * the wrong call, so from then on the state is marked `shared` and callers read the series instead.
 */
function barState(context: any, key: string | undefined, init: () => any) {
    if (!key) return undefined;
    if (!context.taState) context.taState = {};
    let state = context.taState[key];
    if (!state) state = context.taState[key] = { lastIdx: -1, shared: false, prev: init(), current: init() };
    if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) state.prev = { ...state.current };
        state.lastIdx = context.idx;
    } else if (state.current.callIdx === context.idx) {
        state.shared = true;
    }
    return state.shared ? undefined : state;
}

/**
 * Whether `series` moved up (or down) on each of the last `length` bars, as TradingView's
 * `ta.rising` / `ta.falling` decide it: a count of consecutive moves in which a bar whose value or
 * previous value is na leaves the count unchanged, neither extending nor breaking the run.
 *
 * With a key, calls on consecutive bars update the count from the latest pair; a first call, a call
 * after skipped bars or a keyless call walks the series back instead.
 */
export function consecutiveMoves(context: any, key: string | undefined, series: any, length: number, up: boolean): boolean {
    const moved = (a: number, b: number) => (up ? a > b : a < b);
    const state = barState(context, key, () => ({ count: 0, callIdx: -1, length: NaN }));

    let count: number;
    if (state && state.prev.callIdx === context.idx - 1 && state.prev.length === length) {
        const a = series.get(0);
        const b = series.get(1);
        count = isNa(a) || isNa(b) ? state.prev.count : moved(a, b) ? state.prev.count + 1 : 0;
    } else {
        count = 0;
        for (let j = 0; j < context.idx && count < length; j++) {
            const a = series.get(j);
            const b = series.get(j + 1);
            if (isNa(a) || isNa(b)) continue;
            if (!moved(a, b)) break;
            count++;
        }
    }

    if (state) state.current = { count, callIdx: context.idx, length };
    return count >= length;
}

/**
 * The values of two series on the current bar and on the most recent earlier bar where both were
 * non-na: TradingView's `ta.cross` / `ta.crossover` / `ta.crossunder` compare against that bar, so
 * an na on the previous bar does not hide a cross.
 *
 * With a key, calls on consecutive bars carry the last valid pair forward; a first call, a call after
 * skipped bars or a keyless call walks the series back instead.
 */
export function crossPair(context: any, key: string | undefined, s1: any, s2: any): [number, number, number, number] {
    const a0 = s1.get(0);
    const b0 = s2.get(0);
    const state = barState(context, key, () => ({ a: NaN, b: NaN, callIdx: -1 }));

    let a1 = NaN;
    let b1 = NaN;
    if (state && state.prev.callIdx === context.idx - 1) {
        a1 = state.prev.a;
        b1 = state.prev.b;
    } else {
        for (let k = 1; k <= context.idx; k++) {
            const a = s1.get(k);
            const b = s2.get(k);
            if (!isNa(a) && !isNa(b)) {
                a1 = a;
                b1 = b;
                break;
            }
        }
    }

    if (state) {
        const valid = !isNa(a0) && !isNa(b0);
        state.current = { a: valid ? a0 : a1, b: valid ? b0 : b1, callIdx: context.idx };
    }
    return [a0, b0, a1, b1];
}
