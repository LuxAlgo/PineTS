// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { Trade } from '../types';

/**
 * Pine's `strategy.opentrades` mirrors strategy.closedtrades' dual-role
 * pattern — see that file's header for the rationale.
 *
 *   strategy.opentrades            → scalar count via valueOf
 *   strategy.opentrades.profit(0)  → per-trade unrealized P&L
 *   strategy.opentrades.capital_held → property (sum of held capital)
 */
export function opentrades(context: any) {
    return () => {
        // SNAPSHOT the open-trades list AT CALL TIME (see closedtrades.ts for
        // the rationale — per-bar plot values must capture per-bar state).
        const live: Trade[] = context.strategy?.opentrades ?? [];
        const list: Trade[] = live.slice();
        const at = (i: any): Trade | undefined => list[Number(i)];
        const currentPrice = (): number => {
            const md = context.marketData;
            if (Array.isArray(md) && context.idx >= 0 && context.idx < md.length) {
                return md[context.idx]?.close ?? NaN;
            }
            return NaN;
        };

        const result: any = {
            valueOf() { return list.length; },
            toString() { return String(list.length); },
            [Symbol.toPrimitive]() { return list.length; },
        };

        // Helper: hypothetical exit commission if the trade closed right now
        // at current price. TV's open-trade profit deducts BOTH the entry
        // commission (already charged on trade.commission) AND this
        // hypothetical exit commission, so profit reflects "what would I
        // realize if I closed at this price".
        const hypotheticalExitComm = (t: Trade, cp: number): number => {
            const cfg = context.strategy?.config;
            const type = cfg?.commission_type ?? 'percent';
            const value = cfg?.commission_value ?? 0;
            if (!value) return 0;
            const qty = Math.abs(t.size);
            switch (type) {
                case 'percent':           return qty * cp * (value / 100);
                case 'cash_per_contract': return qty * value;
                case 'cash_per_order':    return value;
                default: return 0;
            }
        };

        // Per-trade cost-basis denominator for the * _percent getters.
        // TV uses entry notional + entry commission (the trade's true cost
        // basis), not just notional — the formula in the Pine docs
        // ("entry_price × quantity") is imprecise.
        const costBasis = (t: Trade): number => Math.abs(t.size) * t.entry_price + (t.commission ?? 0);

        result.profit = (i: any) => {
            const t = at(i);
            if (!t) return NaN;
            const cp = currentPrice();
            if (!Number.isFinite(cp)) return NaN;
            const dir = Math.sign(t.size);
            const priceChange = dir === 1 ? cp - t.entry_price : t.entry_price - cp;
            return priceChange * Math.abs(t.size) - (t.commission ?? 0) - hypotheticalExitComm(t, cp);
        };
        result.profit_percent = (i: any) => {
            const t = at(i);
            if (!t) return NaN;
            const p = result.profit(i);
            if (!Number.isFinite(p)) return NaN;
            const basis = costBasis(t);
            return basis > 0 ? (100 * p) / basis : NaN;
        };
        result.size = (i: any) => at(i)?.size ?? NaN;
        result.commission = (i: any) => at(i)?.commission ?? NaN;
        result.entry_price = (i: any) => at(i)?.entry_price ?? NaN;
        result.entry_bar_index = (i: any) => at(i)?.entry_bar_index ?? NaN;
        result.entry_id = (i: any) => at(i)?.entry_id ?? '';
        result.entry_comment = (i: any) => at(i)?.entry_comment ?? '';
        result.entry_time = (i: any) => at(i)?.entry_time ?? NaN;
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

        // capital_held: total capital tied up by all open trades, respecting
        // margin%. Pine exposes this as a PROPERTY (not method).
        //
        // TV-observed semantic: returns `na` when no margin is configured
        // (both margin_long and margin_short default to 100). In that case
        // the broker isn't "holding" any capital aside from the position
        // itself — there's no margin reserve to report. Only when margin is
        // explicitly set do we sum notional × margin%.
        const s = context.strategy;
        const marginLong  = s?.config?.margin_long  ?? 100;
        const marginShort = s?.config?.margin_short ?? 100;
        const marginConfigured = marginLong !== 100 || marginShort !== 100;
        if (!s || s.opentrades.length === 0 || !marginConfigured) {
            result.capital_held = NaN;
        } else {
            let totalHeld = 0;
            for (const t of s.opentrades) {
                const notional = Math.abs(t.size) * t.entry_price;
                const marginPct = t.size > 0 ? marginLong : marginShort;
                totalHeld += notional * (marginPct / 100);
            }
            result.capital_held = totalHeld;
        }

        return result;
    };
}
