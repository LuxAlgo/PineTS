// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

// java.util.Random: TradingView's seeded sequence is Java's nextDouble() for the same seed.
const MULTIPLIER = 0x5deece66dn;
const INCREMENT = 0xbn;
const MASK = (1n << 48n) - 1n;

const scramble = (seed: number): bigint => (BigInt(Math.trunc(seed)) ^ MULTIPLIER) & MASK;
const step = (state: bigint): bigint => (state * MULTIPLIER + INCREMENT) & MASK;

function nextDouble(state: bigint): [number, bigint] {
    const s1 = step(state);
    const s2 = step(s1);
    const high = Number(s1 >> 22n); // next(26)
    const low = Number(s2 >> 21n); // next(27)
    return [(high * 2 ** 27 + low) / 2 ** 53, s2];
}

/**
 * math.random(min = 0, max = 1, seed): a value in [min, max). With a seed (non-zero), each
 * call site draws the next value of its own seeded sequence on every call.
 */
export function random(context: any) {
    return (...args: any[]) => {
        const _callId: string | undefined = typeof args[args.length - 1] === 'string' ? args.pop() : undefined;
        const min = args.length > 0 ? Series.from(args[0]).get(0) : 0;
        const max = args.length > 1 ? Series.from(args[1]).get(0) : 1;
        const seed = args.length > 2 ? Series.from(args[2]).get(0) : NaN;

        let u: number;
        if (!seed || Number.isNaN(seed)) {
            u = Math.random();
        } else {
            if (!context.taState) context.taState = {};
            const stateKey = _callId || `random_${seed}`;
            if (!context.taState[stateKey]) {
                context.taState[stateKey] = { bar: context.idx, committed: scramble(seed), tentative: scramble(seed) };
            }
            const state = context.taState[stateKey];
            if (context.idx !== state.bar) {
                // New bar: the draws of the previous bar are final
                state.committed = state.tentative;
                state.bar = context.idx;
            }
            [u, state.tentative] = nextDouble(state.tentative);
        }

        return min + (max - min) * u;
    };
}
