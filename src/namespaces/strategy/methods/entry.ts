// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { calculateOrderQty, parseDirection, wouldExceedPyramiding, roundOrderLevel, sizingPrice, isMarketCloseOrder, partialCloseQty, brokerPrice, placeOrder, whenBlocks } from '../utils';
import { Order } from '../types';
import { Series } from '../../../Series';
import { parseArgsForPineParams } from '../../utils';
import { checkOrderQty, checkPendingDirection } from '../validation';

/**
 * Pine signature:
 *   strategy.entry(id, direction, qty, limit, stop, oca_name, oca_type,
 *                  comment, alert_message, disable_alert) → void
 *
 * Differences vs strategy.order:
 *   - Respects the strategy() declaration's `pyramiding` cap (no-op when
 *     the direction's open-trade count already equals the cap).
 *   - Auto-reverses the current position when direction is opposite:
 *     the resulting market order's qty is sized to close the existing
 *     position AND open a new one of the requested qty in the new direction.
 */
const ENTRY_SIGNATURES = [
    ['id', 'direction', 'qty', 'limit', 'stop', 'oca_name', 'oca_type', 'comment', 'alert_message', 'disable_alert'],
];
const ENTRY_ARGS_TYPES = {
    id: 'string',
    direction: 'series',
    qty: 'series',
    limit: 'series',
    stop: 'series',
    oca_name: 'string',
    oca_type: 'string',
    comment: 'string',
    alert_message: 'string',
    disable_alert: 'boolean',
};

export function entry(context: any) {
    return (...args: any[]) => {
        if (!context.strategy) {
            throw new Error('strategy.entry() called before strategy() declaration');
        }
        const parsed = parseArgsForPineParams<any>(args, ENTRY_SIGNATURES, ENTRY_ARGS_TYPES);
        if (whenBlocks(parsed)) return;

        const extractValue = (val: any) => {
            if (val === undefined || val === null) return val;
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
            if (typeof val === 'function') return val();
            if (val instanceof Series) return val.get(0);
            if (Array.isArray(val)) return val[val.length - 1];
            if (typeof val === 'object' && val.get !== undefined) return val.get(0);
            return val;
        };

        // An na price leg is absent (`limit = na` places a market order); `qty = na` uses the default.
        const isNaValue = (v: any) => (typeof v === 'number' && Number.isNaN(v)) || (typeof v === 'object' && v !== null && '__value' in v);
        const priceLeg = (v: any) => (isNaValue(v) ? undefined : v);
        const idValue       = extractValue(parsed.id);
        const directionVal  = extractValue(parsed.direction);
        const qtyValue      = priceLeg(extractValue(parsed.qty));
        const limitValue    = priceLeg(extractValue(parsed.limit));
        const stopValue     = priceLeg(extractValue(parsed.stop));
        const ocaName       = extractValue(parsed.oca_name);
        const ocaType       = extractValue(parsed.oca_type);
        const commentValue  = extractValue(parsed.comment);

        const dir = parseDirection(directionVal);
        const strategy = context.strategy;
        checkOrderQty('strategy.entry', qtyValue);
        checkPendingDirection('strategy.entry', strategy, idValue, dir);

        // Project the position forward over MARKET entry orders already queued
        // on THIS bar: they fill (in queue order) before this one, so the
        // reversal/add classification AND the reversal close-qty must be
        // computed against the position they will leave behind — not the stale
        // pre-fill position_size. Without this, several opposite-direction
        // entries queued on the same bar EACH re-add the full close-qty and
        // EACH bypass the pyramiding cap (QA "Sim Pyramiding": short -3 + three
        // long entries → PineTS +9 vs TradingView +3, where only the first
        // entry reverses and the rest are plain pyramiding adds). The net
        // position change per queued order is `direction × qty`, which is exact
        // even for a reversal order since its qty already bakes in the close-qty.
        // strategy.close / close_all market orders queued before this entry fill ahead of it
        // too, so a close followed by an opposite entry opens just the entry's own qty, and a
        // partial close leaves only the rest to reverse (TV, #316).
        let currentSize = strategy.position_size;
        for (const o of strategy.pending_orders) {
            if (o.bar !== context.idx || o.status !== 'pending') continue;
            // strategy.entry and strategy.order market orders (TV: an entry queued after a pending
            // strategy.order in the other direction is sized to reverse it too)
            if ((o.category === 'entry' || o.category === undefined) && o.type === 'market') {
                currentSize += parseDirection(o.direction) * o.qty;
            } else if (isMarketCloseOrder(o) && currentSize !== 0) {
                let trades = strategy.opentrades.filter((t: any) => !o.from_entry || t.entry_id === o.from_entry);
                if (o._intended_trade_ids) {
                    const snapshot = new Set(o._intended_trade_ids);
                    trades = trades.filter((t: any) => snapshot.has(t.id));
                }
                const tradesQty = trades.reduce((sum: number, t: any) => sum + Math.abs(t.size), 0);
                let closeQty = tradesQty;
                if (o.qty && o.qty > 0) closeQty = Math.min(o.qty, tradesQty);
                else if (o.qty_percent && o.qty_percent > 0) closeQty = partialCloseQty(context, tradesQty, o.qty_percent);
                currentSize -= Math.sign(currentSize) * Math.min(closeQty, Math.abs(currentSize));
            }
        }

        // Pyramiding cap: only enforced when ADDING to a same-direction position
        // (not when opening from flat or reversing). Pine's semantic.
        const isAddingSameSide = Math.sign(currentSize) === dir && currentSize !== 0;
        if (isAddingSameSide && wouldExceedPyramiding(strategy, dir)) {
            return; // no-op
        }

        // Determine the order qty. For a reversal (direction differs from
        // current position), Pine ADDS the absolute current position to the
        // requested qty so that one market order both flattens the prior
        // position AND opens the new direction with the requested size.
        const currentPrice = brokerPrice(context, Series.from(context.data.close).get(0));

        // Determine order type from limit/stop presence
        let orderType: 'market' | 'limit' | 'stop' | 'stop-limit' = 'market';
        if (limitValue !== undefined && stopValue !== undefined) {
            orderType = 'stop-limit';
        } else if (limitValue !== undefined) {
            orderType = 'limit';
        } else if (stopValue !== undefined) {
            orderType = 'stop';
        }

        // Limit / stop levels go on the mintick grid by the order's side (see roundOrderLevel).
        const mintick = context.pine?.syminfo?.mintick ?? 0;
        const limitValueRounded = limitValue !== undefined ? roundOrderLevel(limitValue, dir, 'limit', mintick) : undefined;
        const stopValueRounded  = stopValue  !== undefined ? roundOrderLevel(stopValue,  dir, 'stop',  mintick) : undefined;

        const baseQty = calculateOrderQty(context, qtyValue, dir, sizingPrice(stopValueRounded, limitValueRounded, currentPrice, dir), limitValueRounded === undefined);

        const isReversal = currentSize !== 0 && Math.sign(currentSize) !== dir;
        // An order smaller than the symbol's minimum quantity is rejected.
        if (baseQty <= 0 && !isReversal) return;
        const totalQty = isReversal ? Math.abs(currentSize) + baseQty : baseQty;

        const currentTime = Series.from(context.data.openTime).get(0);

        const orderObj: Order = {
            id: idValue,
            direction: dir,
            qty: totalQty,
            type: orderType,
            limit: limitValueRounded,
            stop: stopValueRounded,
            bar: context.idx,
            time: currentTime,
            status: 'pending',
            category: 'entry',
            oca_name: ocaName,
            oca_type: ocaType as 'cancel' | 'reduce' | 'none' | undefined,
            comment: commentValue,
            _isReversalEntry: isReversal,
            // Ordered base size (before the reversal close-qty addition).
            // executeOrder uses it to split a reversal OVERSHOOT into its
            // own lot when a deferred close-margin-call shrank the
            // position between queue and fill — TV books the base and the
            // overshoot as two separate lots (xlsx 2021-10-02: 5 +
            // 0.263108 longs at the same fill).
            _base_qty: baseQty,
            // Reverses a position that only the market entries queued before it on this bar open.
            _reversesPending: isReversal && Math.sign(strategy.position_size) !== Math.sign(currentSize),
        } as any;

        // An entry with the id of an unfilled strategy.entry / strategy.order modifies that order, also
        // on the bar it was placed (TV: entry("M") then entry("M", qty = 2) on one bar is one trade of 2;
        // a limit entry moved away on the same bar never fills at the first level).
        strategy.pending_orders = strategy.pending_orders.filter(
            (o: Order) => !((o.category === 'entry' || o.category === undefined) && o.id === idValue && o.status === 'pending'),
        );
        placeOrder(strategy, orderObj);
    };
}
