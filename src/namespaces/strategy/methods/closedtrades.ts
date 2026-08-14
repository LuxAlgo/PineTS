// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Trade } from '../types';

/**
 * Pine's `strategy.closedtrades` serves a dual role:
 *   - As a scalar: a series int count of closed trades.
 *   - As a namespace: `strategy.closedtrades.profit(idx)` etc.
 *
 * Our transpiler renders the bare access as a CALL (`strategy.closedtrades()`),
 * and the chained access as a CHAINED CALL (`strategy.closedtrades().profit(0)`).
 * Both must work. The trick: the call returns a hybrid object that:
 *   - has `valueOf()` returning the count (so it behaves like an int in
 *     arithmetic/comparison contexts, e.g. `_ct > 0`),
 *   - has the per-trade methods (`profit`, `size`, ...) attached.
 *
 * This pattern keeps the transpiler unchanged while supporting both shapes.
 */
export function closedtrades(context: any) {
    return () => {
        // SNAPSHOT the closed-trades list AT CALL TIME. When the returned
        // hybrid object is stored as a per-bar plot value, its valueOf /
        // method calls must reflect the state at the bar where it was
        // produced, NOT the live (final-bar) state — otherwise every
        // historical plot point collapses to the final-bar count.
        const live: Trade[] = context.strategy?.closedtrades ?? [];
        const list: Trade[] = live.slice();
        const at = (i: any): Trade | undefined => list[Number(i)];

        const result: any = {
            valueOf() { return list.length; },
            toString() { return String(list.length); },
            [Symbol.toPrimitive]() { return list.length; },
        };

        // Cost-basis denominator: entry notional + entry commission.
        // Notional = |size| × entry_price × pointValue (PV converts price-units
        // to account currency for futures; 1 for crypto/forex).
        // For closed trades, trade.commission already contains BOTH entry
        // and exit legs, so we approximate the entry leg as half. (For the
        // percent='percent' commission type both legs are roughly equal at
        // entry vs exit price — close enough; matches TV within epsilon.)
        const pointValue: number = context.pine?.syminfo?.pointvalue ?? 1;
        const costBasis = (t: Trade): number => {
            const notional = Math.abs(t.size) * t.entry_price * pointValue;
            const entryCommApprox = (t.commission ?? 0) / 2;
            return notional + entryCommApprox;
        };

        result.profit = (i: any) => at(i)?.profit ?? NaN;
        result.profit_percent = (i: any) => {
            const t = at(i);
            if (!t || t.profit === undefined) return NaN;
            const basis = costBasis(t);
            return basis > 0 ? (100 * t.profit) / basis : NaN;
        };
        result.size = (i: any) => at(i)?.size ?? NaN;
        result.commission = (i: any) => at(i)?.commission ?? NaN;
        result.entry_price = (i: any) => at(i)?.entry_price ?? NaN;
        result.entry_bar_index = (i: any) => at(i)?.entry_bar_index ?? NaN;
        result.entry_id = (i: any) => at(i)?.entry_id ?? '';
        // TV semantic: when no explicit comment was passed to strategy.entry,
        // entry_comment falls back to entry_id (and same for exit_comment ←
        // exit_id). openTrade already pre-stamps entry_id as entry_comment
        // when none is given, but keep the fallback defensive.
        result.entry_comment = (i: any) => at(i)?.entry_comment ?? at(i)?.entry_id ?? '';
        result.entry_time = (i: any) => at(i)?.entry_time ?? NaN;
        result.exit_price = (i: any) => at(i)?.exit_price ?? NaN;
        result.exit_bar_index = (i: any) => at(i)?.exit_bar_index ?? NaN;
        result.exit_id = (i: any) => at(i)?.exit_id ?? '';
        result.exit_comment = (i: any) => at(i)?.exit_comment ?? at(i)?.exit_id ?? '';
        result.exit_time = (i: any) => at(i)?.exit_time ?? NaN;
        result.max_drawdown = (i: any) => at(i)?.max_drawdown ?? 0;
        result.max_drawdown_percent = (i: any) => {
            const t = at(i);
            if (!t || !t.max_drawdown) return 0;
            const basis = costBasis(t);
            return basis > 0 ? (100 * t.max_drawdown) / basis : 0;
        };
        result.max_runup = (i: any) => at(i)?.max_runup ?? 0;
        result.max_runup_percent = (i: any) => {
            const t = at(i);
            if (!t || !t.max_runup) return 0;
            const basis = costBasis(t);
            return basis > 0 ? (100 * t.max_runup) / basis : 0;
        };
        // v6 property: index of oldest still-listed trade. Always 0 unless we
        // ever start trimming the buffer (we don't).
        result.first_index = 0;

        return result;
    };
}
