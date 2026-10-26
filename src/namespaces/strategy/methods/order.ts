// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { calculateOrderQty, parseDirection, sizingPrice, roundOrderLevel, brokerPrice, placeOrder, whenBlocks } from '../utils';
import { Order } from '../types';
import { Series } from '../../../Series';
import { parseArgsForPineParams } from '../../utils';
import { checkOrderQty, checkPendingDirection } from '../validation';

/**
 * Pine signature for strategy.order():
 *   strategy.order(id, direction, qty, limit, stop, oca_name, oca_type,
 *                  comment, alert_message, disable_alert) â†’ void
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
        if (whenBlocks(parsed)) return;

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

        // An na price leg is absent (`limit = na` places a market order); `qty = na` uses the default.
        const isNaValue = (v: any) => (typeof v === 'number' && Number.isNaN(v)) || (typeof v === 'object' && v !== null && '__value' in v);
        const priceLeg = (v: any) => (isNaValue(v) ? undefined : v);
        const idValue       = extractValue(parsed.id);
        const directionVal  = extractValue(parsed.direction);
        const qtyValue      = priceLeg(extractValue(parsed.qty));
        let limitValue      = priceLeg(extractValue(parsed.limit));
        let stopValue       = priceLeg(extractValue(parsed.stop));
        const ocaName       = extractValue(parsed.oca_name);
        const ocaType       = extractValue(parsed.oca_type);
        const commentValue  = extractValue(parsed.comment);

        // Parse direction to numeric (+1 long, -1 short)
        const dir = parseDirection(directionVal);
        checkOrderQty('strategy.order', qtyValue);
        checkPendingDirection('strategy.order', context.strategy, idValue, dir);

        // Reference price for qty conversion (cash / percent_of_equity sizing).
        // The order itself fills at the NEXT bar's open, but qty is locked in
        // at the call site using the current close (the stop price of a stop or
        // stop-limit order, the limit price of a limit order) â€” matching
        // TradingView's backtest accounting.
        const currentPrice = brokerPrice(context, Series.from(context.data.close).get(0));
        // Limit / stop levels go on the mintick grid by the order's side, as for strategy.entry
        // (TV: a buy limit at position_avg_price * 0.999 = 63,914.94108 works at 63,914.94).
        const mintick = context.pine?.syminfo?.mintick ?? 0;
        if (limitValue !== undefined) limitValue = roundOrderLevel(limitValue, dir, 'limit', mintick);
        if (stopValue !== undefined) stopValue = roundOrderLevel(stopValue, dir, 'stop', mintick);
        const calculatedQty = calculateOrderQty(context, qtyValue, dir, sizingPrice(stopValue, limitValue, currentPrice, dir), limitValue === undefined);
        // An order smaller than the symbol's minimum quantity is rejected.
        if (calculatedQty <= 0) return undefined;

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

        // An order with the id of an unfilled strategy.order / strategy.entry modifies it instead of
        // adding another, also on the bar it was placed (TV: order("O", qty = 1) then order("O", qty = 2)
        // is one trade of 2; a limit order re-placed every bar fills once).
        context.strategy.pending_orders = context.strategy.pending_orders.filter(
            (o: Order) => !((o.category === undefined || o.category === 'entry') && o.id === idValue && o.status === 'pending'),
        );
        placeOrder(context.strategy, orderObj);

        return orderObj;
    };
}
