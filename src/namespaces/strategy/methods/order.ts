// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { calculateOrderQty, parseDirection } from '../utils';
import { Order } from '../types';
import { Series } from '../../../Series';
import { parseArgsForPineParams } from '../../utils';

/**
 * Pine signature for strategy.order():
 *   strategy.order(id, direction, qty, limit, stop, oca_name, oca_type,
 *                  comment, alert_message, disable_alert) → void
 *
 * The transpiler emits Pine's named-arg form as a trailing options object,
 * e.g. `strategy.order("buy", strategy.long, qty=1)` becomes
 *      `strategy.order("buy", "long", {qty: 1})`.
 *
 * parseArgsForPineParams handles both the all-positional form
 *      strategy.order("buy", "long", 1)
 * AND the trailing-named-options form
 *      strategy.order("buy", "long", {qty: 1, limit: 100})
 * AND the all-named form
 *      strategy.order({id: "buy", direction: "long", qty: 1})
 * uniformly.
 */
const ORDER_SIGNATURES = [
    ['id', 'direction', 'qty', 'limit', 'stop', 'oca_name', 'oca_type', 'comment', 'alert_message', 'disable_alert'],
];

const ORDER_ARGS_TYPES = {
    id: 'string',
    // direction can be the literal 'long'/'short' string OR a series wrapper
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

/**
 * Place a basic order.
 * Pine reference: https://www.tradingview.com/pine-script-reference/v5/#fun_strategy{dot}order
 */
export function order(context: any) {
    return (...args: any[]) => {
        if (!context.strategy) {
            throw new Error('strategy.order() called before strategy() declaration');
        }

        const parsed = parseArgsForPineParams<any>(args, ORDER_SIGNATURES, ORDER_ARGS_TYPES);

        // The transpiler may have already unwrapped Series via strategy.param,
        // but defensive extraction handles wrappers from any caller (e.g. when
        // users invoke strategy.order from a JS function).
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

        // Parse direction to numeric (+1 long, -1 short)
        const dir = parseDirection(directionVal);

        // Reference price for qty conversion (cash / percent_of_equity sizing).
        // The order itself fills at the NEXT bar's open, but qty is locked in
        // at the call site using the current close — matching TradingView's
        // backtest accounting.
        const currentPrice = Series.from(context.data.close).get(0);
        const calculatedQty = calculateOrderQty(context, qtyValue, dir, currentPrice);

        // Determine order type from which price levels are set.
        let orderType: 'market' | 'limit' | 'stop' | 'stop-limit' = 'market';
        if (limitValue !== undefined && stopValue !== undefined) {
            orderType = 'stop-limit';
        } else if (limitValue !== undefined) {
            orderType = 'limit';
        } else if (stopValue !== undefined) {
            orderType = 'stop';
        }

        const currentTime = Series.from(context.data.openTime).get(0);

        const orderObj: Order = {
            id: idValue,
            direction: dir,
            qty: calculatedQty,
            type: orderType,
            limit: limitValue,
            stop: stopValue,
            bar: context.idx,
            time: currentTime,
            status: 'pending',
            oca_name: ocaName,
            oca_type: ocaType as 'cancel' | 'reduce' | 'none' | undefined,
            comment: commentValue,
        };

        context.strategy.pending_orders.push(orderObj);

        return orderObj;
    };
}
