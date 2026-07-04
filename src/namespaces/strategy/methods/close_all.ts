// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Order } from '../types';
import { Series } from '../../../Series';
import { parseArgsForPineParams } from '../../utils';

/**
 * Close ALL open positions at market, regardless of which entry opened them.
 *
 * Pine signature:
 *   strategy.close_all(comment, alert_message, immediately, disable_alert) → void
 */
const CLOSE_ALL_SIGNATURES = [['comment', 'alert_message', 'immediately', 'disable_alert']];
const CLOSE_ALL_ARGS_TYPES = {
    comment: 'string',
    alert_message: 'string',
    immediately: 'boolean',
    disable_alert: 'boolean',
};

export function close_all(context: any) {
    return (...args: any[]) => {
        if (!context.strategy) {
            throw new Error('strategy.close_all() called before strategy() declaration');
        }
        const parsed = parseArgsForPineParams<any>(args, CLOSE_ALL_SIGNATURES, CLOSE_ALL_ARGS_TYPES);

        // TV semantic: strategy.close_all() called with no open positions is
        // a no-op. Without this guard, the queued order survives to the next
        // bar and closes the next entry that fills at its entry price (zero
        // PnL), because from_entry='' matches any new trade. Notably this
        // affects scripts that call close_all on indicator conditions that
        // can fire when the position is already flat (e.g. exit-bar-count
        // indicators where the count signal coincides with a fresh entry on
        // the next bar). The position-state check has to happen at QUEUE
        // time, not fill time — by fill time the new entry has already
        // filled and would match.
        if (context.strategy.opentrades.length === 0) return;

        // TV semantic: strategy.close_all() supersedes any pending conditional
        // strategy.exit() orders for the entire book. Without this, both the
        // close_all market and the conditional exits fire on the next bar,
        // double-closing the position. Conditional exits are identified by
        // having at least one of profit/loss/limit/stop/trail_* set; close()
        // / close_all() markets leave all of those undefined.
        const isConditionalExit = (o: Order) =>
            (o.category ?? 'entry') === 'exit' &&
            (o.profit !== undefined ||
                o.loss !== undefined ||
                o.limit !== undefined ||
                o.stop !== undefined ||
                o.trail_price !== undefined ||
                o.trail_points !== undefined);

        const pending = context.strategy.pending_orders;
        for (const o of pending) {
            if (isConditionalExit(o) && o.status === 'pending') {
                o.status = 'cancelled';
            }
        }
        context.strategy.pending_orders = pending.filter((o: Order) => o.status === 'pending');

        // Snapshot the IDs of open trades at CALL time so the close order
        // remains bound to its originally-intended position. If a reversal
        // entry queued the same bar fills first on the next bar and
        // implicitly closes the snapshotted trades, this close_all has no
        // target left and `processExitOrders` will cancel it instead of
        // catching the freshly-opened reversal trade. Matches TV's binding
        // of strategy.close_all() to the position at call time.
        const order: Order = {
            id: 'close_all',
            direction: 0, // resolved at fill time
            qty: 0, // resolved at fill time (sum of |all open trades|)
            type: 'market',
            bar: context.idx,
            time: Series.from(context.data.openTime).get(0),
            status: 'pending',
            category: 'exit',
            from_entry: '', // empty == match-all (within the snapshot)
            comment: parsed.comment,
            alert_message: parsed.alert_message,
            immediately: parsed.immediately === true,
            disable_alert: parsed.disable_alert,
            _intended_trade_ids: context.strategy.opentrades.map((t: any) => t.id),
        };
        context.strategy.pending_orders.push(order);
    };
}
