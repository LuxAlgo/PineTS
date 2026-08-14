// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { calculateOrderQty, parseDirection, wouldExceedPyramiding, roundToMintick } from '../utils';
import { Order } from '../types';
import { Series } from '../../../Series';
import { parseArgsForPineParams } from '../../utils';

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

        const extractValue = (val: any) => {
            if (val === undefined || val === null) return val;
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
            if (typeof val === 'function') return val();
            if (val instanceof Series) return val.get(0);
            if (Array.isArray(val)) return val[val.length - 1];
            if (typeof val === 'object' && val.get !== undefined) return val.get(0);
            return val;
        };

        const idValue       = extractValue(parsed.id);
        const directionVal  = extractValue(parsed.direction);
        const qtyValue      = extractValue(parsed.qty);
        const limitValue    = extractValue(parsed.limit);
        const stopValue     = extractValue(parsed.stop);
        const ocaName       = extractValue(parsed.oca_name);
        const ocaType       = extractValue(parsed.oca_type);
        const commentValue  = extractValue(parsed.comment);

        const dir = parseDirection(directionVal);
        const strategy = context.strategy;

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
        let currentSize = strategy.position_size;
        for (const o of strategy.pending_orders) {
            if (o.bar === context.idx && o.category === 'entry' && o.type === 'market') {
                currentSize += parseDirection(o.direction) * o.qty;
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
        const currentPrice = Series.from(context.data.close).get(0);
        const baseQty = calculateOrderQty(context, qtyValue, dir, currentPrice);

        const isReversal = currentSize !== 0 && Math.sign(currentSize) !== dir;
        const totalQty = isReversal ? Math.abs(currentSize) + baseQty : baseQty;

        // Determine order type from limit/stop presence
        let orderType: 'market' | 'limit' | 'stop' | 'stop-limit' = 'market';
        if (limitValue !== undefined && stopValue !== undefined) {
            orderType = 'stop-limit';
        } else if (limitValue !== undefined) {
            orderType = 'limit';
        } else if (stopValue !== undefined) {
            orderType = 'stop';
        }

        // Snap limit/stop to the mintick grid AWAY from current price (the
        // broker-emulator convention — see roundToMintick). For market
        // orders this is a no-op.
        const mintick = context.pine?.syminfo?.mintick ?? 0;
        const limitValueRounded = limitValue !== undefined ? roundToMintick(limitValue, currentPrice, mintick) : undefined;
        const stopValueRounded  = stopValue  !== undefined ? roundToMintick(stopValue,  currentPrice, mintick) : undefined;

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
        } as any;

        strategy.pending_orders.push(orderObj);
    };
}
