// SPDX-License-Identifier: AGPL-3.0-only

export const isNa = (v: any): boolean => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

type Entry = { v: number; n: number };

/**
 * The last `length` non-na values of a source, newest first, and their sum: the window TradingView's
 * `ta.sma`, `ta.variance`, `ta.stdev`, `ta.median`, `ta.vwma` and `ta.correlation` use. An na value is
 * skipped, not counted, so a bar whose value is na leaves the window as it was. `undefined` while
 * fewer than `length` non-na values have been seen.
 *
 * `valueAt(k)` reads the source `k` bars back (0 = current). State lives in `context.taState[key]`
 * with the usual committed / tentative split. Each value keeps the number of the call it was read on,
 * so a call made after skipped bars (the function called inside an `if`) backfills from the source
 * right behind the oldest value it holds. Once a backfill has reached the first bar, calls on
 * consecutive bars do not scan the history again (a long na stretch would make that quadratic).
 */
export function nonNaWindow(
    context: any,
    key: string,
    valueAt: (k: number) => number,
    length: number
): { values: number[]; sum: number } | undefined {
    if (!context.taState) context.taState = {};
    let state = context.taState[key];
    if (!state) {
        state = context.taState[key] = {
            lastIdx: -1,
            prev: { entries: [] as Entry[], sum: 0, calls: 0, callIdx: -1, exhausted: false, length: NaN },
            current: { entries: [] as Entry[], sum: 0, calls: 0, callIdx: -1, exhausted: false, length: NaN },
        };
    }
    if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) state.prev = { ...state.current, entries: [...state.current.entries] };
        state.lastIdx = context.idx;
    }

    const prev = state.prev;
    const calls = prev.calls + 1;
    const entries: Entry[] = [...prev.entries];
    let sum = prev.sum;
    let exhausted = prev.exhausted && prev.callIdx === context.idx - 1 && prev.length === length;

    const value = valueAt(0);
    if (!isNa(value)) {
        entries.unshift({ v: value, n: calls });
        sum += value;
    }
    while (entries.length > length) sum -= entries.pop()!.v;

    let rebuilt = prev.length !== length;
    if (entries.length < length && !exhausted && (calls >= length || context.idx >= length - 1)) {
        let k = entries.length ? calls - entries[entries.length - 1].n + 1 : 1;
        for (; entries.length < length && k <= context.idx; k++) {
            const v = valueAt(k);
            if (!isNa(v)) entries.push({ v, n: calls - k });
        }
        exhausted = entries.length < length;
        rebuilt = true;
    }
    if (rebuilt) sum = entries.reduce((s, e) => s + e.v, 0);

    state.current = { entries, sum, calls, callIdx: context.idx, exhausted, length };
    return entries.length < length ? undefined : { values: entries.map((e) => e.v), sum };
}
