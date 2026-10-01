// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { PineArrayObject, PineArrayType } from '../../array/PineArrayObject';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

type Period = { open: number; high: number; low: number; close: number };

const TYPES = ['Traditional', 'Fibonacci', 'Woodie', 'Classic', 'DM', 'Camarilla'];

/**
 * [P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5] of a period (TradingView's Pivot Points Standard
 * formulas). `open` is the open the type uses: Woodie takes the open of the period the levels are
 * shown in, DM the open of the period they are computed from.
 */
function levelsOf(type: string, { high: h, low: l, close: c }: Period, open: number): number[] {
    const range = h - l;
    const p = (h + l + c) / 3;
    switch (type) {
        case 'Traditional':
            return [p, p * 2 - l, p * 2 - h, p + range, p - range, p * 2 + (h - 2 * l), p * 2 - (2 * h - l), p * 3 + (h - 3 * l), p * 3 - (3 * h - l), p * 4 + (h - 4 * l), p * 4 - (4 * h - l)];
        case 'Fibonacci':
            return [p, p + 0.382 * range, p - 0.382 * range, p + 0.618 * range, p - 0.618 * range, p + range, p - range, NaN, NaN, NaN, NaN];
        case 'Woodie': {
            const wp = (h + l + 2 * open) / 4;
            const r3 = h + 2 * (wp - l);
            const s3 = l - 2 * (h - wp);
            return [wp, 2 * wp - l, 2 * wp - h, wp + range, wp - range, r3, s3, r3 + range, s3 - range, NaN, NaN];
        }
        case 'Classic':
            return [p, 2 * p - l, 2 * p - h, p + range, p - range, p + 2 * range, p - 2 * range, p + 3 * range, p - 3 * range, NaN, NaN];
        case 'DM': {
            const x = c < open ? h + 2 * l + c : c > open ? 2 * h + l + c : h + l + 2 * c;
            return [x / 4, x / 2 - l, x / 2 - h, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN];
        }
        case 'Camarilla': {
            const r5 = (h / l) * c;
            return [p, c + (range * 1.1) / 12, c - (range * 1.1) / 12, c + (range * 1.1) / 6, c - (range * 1.1) / 6, c + (range * 1.1) / 4, c - (range * 1.1) / 4, c + (range * 1.1) / 2, c - (range * 1.1) / 2, r5, c - (r5 - c)];
        }
    }
    return new Array(11).fill(NaN);
}

/**
 * ta.pivot_point_levels(type, anchor, developing) → array<float> of 11 levels [P, R1, S1, …, R5, S5].
 * When `anchor` is true a new period starts: with `developing = false` the levels are computed from
 * the period that just ended and stay until the next anchor; with `developing = true` they follow the
 * current period bar by bar. Levels a type does not define are na.
 */
export function pivot_point_levels(context: any) {
    return (_type: any, _anchor: any, ...rest: any[]) => {
        // The transpiler appends the call id after the optional `developing` argument.
        const _callId: string | undefined = typeof rest[rest.length - 1] === 'string' ? rest.pop() : undefined;
        const type = Series.from(_type).get(0);
        const anchor = Series.from(_anchor).get(0) === true;
        const developing = rest.length > 0 && Series.from(rest[0]).get(0) === true;

        if (!TYPES.includes(type)) {
            throw new PineRuntimeError(
                `Invalid argument '${type}' for 'type' in the 'ta.pivot_point_levels' function. Possible values: ['Camarilla', 'Traditional', 'DM', 'Classic', 'Fibonacci', 'Woodie']`,
                'ta.pivot_point_levels'
            );
        }
        if (developing && type === 'Woodie') {
            throw new PineRuntimeError('The `developing` parameter of the `ta.pivot_point_levels()` cannot be `true` when `type` is "Woodie".', 'ta.pivot_point_levels');
        }

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `pivot_point_levels_${type}_${developing}`;
        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prev: { period: null, levels: null },
                // Tentative state
                current: { period: null, levels: null },
            };
        }
        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) state.prev = state.current;
            state.lastIdx = context.idx;
        }

        const bar: Period = {
            open: Series.from(context.data.open).get(0),
            high: Series.from(context.data.high).get(0),
            low: Series.from(context.data.low).get(0),
            close: Series.from(context.data.close).get(0),
        };

        let period: Period | null = state.prev.period;
        let levels: number[] | null = state.prev.levels;
        if (anchor || !period) {
            // The period that just ended fixes the levels shown in the new one.
            if (anchor && period) levels = levelsOf(type, period, type === 'Woodie' ? bar.open : period.open);
            period = { ...bar };
        } else {
            period = { open: period.open, high: Math.max(period.high, bar.high), low: Math.min(period.low, bar.low), close: bar.close };
        }
        state.current = { period, levels };

        const out = developing ? levelsOf(type, period, period.open) : (levels ?? new Array(11).fill(NaN));
        return new PineArrayObject(
            out.map((v) => context.precision(v)),
            PineArrayType.float,
            context
        );
    };
}
