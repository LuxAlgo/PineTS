// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Order } from '../types';
import { Series } from '../../../Series';
import { parseArgsForPineParams, extractCallsiteId } from '../../utils';
import { roundToMintick, roundOrderLevel, parseDirection, placeOrder, floorQty, trailArmPrice } from '../utils';
import { checkExitLegs, checkQtyPercent } from '../validation';

/**
 * Pine signature (21 named args):
 *   strategy.exit(id, from_entry, qty, qty_percent, profit, limit, loss,
 *                 stop, trail_price, trail_points, trail_offset, oca_name,
 *                 comment, comment_profit, comment_loss, comment_trailing,
 *                 alert_message, alert_profit, alert_loss, alert_trailing,
 *                 disable_alert) → void
 *
 * Behavior:
 *   Stores a conditional exit order on `state.pending_orders` with
 *   category='exit'. Each bar, `processExitOrders()` (in utils.ts) checks
 *   TP / SL / trailing-stop conditions against bar high/low against the
 *   matching open trades, and fires a market close at the trigger price
 *   when hit. Multiple exit legs on a single call are treated OCO — the
 *   first leg to trigger fires; the exit order is then removed.
 *
 *   `profit` and `loss` are in TICKS (units of syminfo.mintick). `limit`
 *   and `stop` are absolute prices. `trail_price` + `trail_offset` form an
 *   absolute-price trailing-stop arm/ride pair; `trail_points` +
 *   `trail_offset` form a ticks-from-entry arm/ride pair.
 */
const EXIT_SIGNATURES = [
    [
        'id', 'from_entry', 'qty', 'qty_percent', 'profit', 'limit', 'loss', 'stop',
        'trail_price', 'trail_points', 'trail_offset', 'oca_name', 'comment',
        'comment_profit', 'comment_loss', 'comment_trailing', 'alert_message',
        'alert_profit', 'alert_loss', 'alert_trailing', 'disable_alert',
    ],
];
const EXIT_ARGS_TYPES = {
    id: 'string',
    from_entry: 'string',
    qty: 'series', qty_percent: 'series',
    profit: 'series', limit: 'series',
    loss: 'series', stop: 'series',
    trail_price: 'series', trail_points: 'series', trail_offset: 'series',
    oca_name: 'string',
    comment: 'string', comment_profit: 'string', comment_loss: 'string', comment_trailing: 'string',
    alert_message: 'string', alert_profit: 'string', alert_loss: 'string', alert_trailing: 'string',
    disable_alert: 'boolean',
};

export function exit(context: any) {
    return (...args: any[]) => {
        if (!context.strategy) {
            throw new Error('strategy.exit() called before strategy() declaration');
        }

        // Drop the transpiler-injected callsite sentinel before parsing args.
        extractCallsiteId(args);

        const parsed = parseArgsForPineParams<any>(args, EXIT_SIGNATURES, EXIT_ARGS_TYPES);
        checkExitLegs(parsed);

        const extractValue = (val: any) => {
            if (val === undefined || val === null) return val;
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
            if (typeof val === 'function') return val();
            if (val instanceof Series) return val.get(0);
            if (Array.isArray(val)) return val[val.length - 1];
            if (typeof val === 'object' && val.get !== undefined) return val.get(0);
            return val;
        };

        const idValue          = extractValue(parsed.id);
        const fromEntry        = extractValue(parsed.from_entry);
        const qty              = extractValue(parsed.qty);
        const qtyPercent       = extractValue(parsed.qty_percent);
        // An na leg is absent: `limit = na` with `profit = ...` uses the profit leg.
        const isNaValue = (v: any) => (typeof v === 'number' && Number.isNaN(v)) || (typeof v === 'object' && v !== null && '__value' in v);
        const leg = (v: any) => (isNaValue(v) ? undefined : v);
        // Fractional tick counts (TradingView, mintick 0.01): `profit` / `loss` round to the next
        // whole tick away from the entry (30000.4 and 30000.6 → 30001), `trail_offset` truncates
        // (2000.4, 2000.5 and 2000.6 → 2000).
        const wholeAway = (v: any) => (typeof v === 'number' ? Math.ceil(v - 1e-9) : v);
        const wholeTrunc = (v: any) => (typeof v === 'number' ? Math.trunc(v + Math.sign(v) * 1e-9) : v);
        const profit           = wholeAway(leg(extractValue(parsed.profit)));
        const limitRaw         = leg(extractValue(parsed.limit));
        const loss             = wholeAway(leg(extractValue(parsed.loss)));
        const stopRaw          = leg(extractValue(parsed.stop));
        const trailPriceRaw    = leg(extractValue(parsed.trail_price));
        const trailPoints      = leg(extractValue(parsed.trail_points));
        const trailOffset      = wholeTrunc(leg(extractValue(parsed.trail_offset)));

        // Whether this exit attaches to a pending entry that reverses the position (see the
        // entry-bar exit path in processExitOrders).
        const fromEntryId = fromEntry ?? '';
        const pendingEntry = fromEntryId
            ? context.strategy.pending_orders.find(
                  (o: Order) => o.category === 'entry' && o.id === fromEntryId && o.status === 'pending',
              )
            : context.strategy.pending_orders.find(
                  (o: Order) => o.category === 'entry' && o.status === 'pending',
              );
        const attachedAtReversal = !!pendingEntry?._isReversalEntry;

        // An exit for an entry id that is neither open nor pending when it is called places nothing
        // (TradingView, BTCUSDT 1h / AAPL 1D: `strategy.exit("x", "D", ...)` called once just before
        // `strategy.entry("D", ...)` never fires, 0 / 74).
        if (fromEntryId && !pendingEntry && !(context.strategy.opentrades as any[]).some((t) => t.entry_id === fromEntryId)) return;
        // `qty_percent` is only checked when `qty` does not override it
        if (qty === undefined || qty === null || isNaValue(qty)) checkQtyPercent('strategy.exit', qtyPercent);

        // Limit / stop levels go on the mintick grid by the exit's side, as entry levels do (TV, AAPL
        // 1D: a short's stop at 53.4925 placed with the close at 53.5425 works at 53.50). Without a
        // position or entry to tell the side, and for trail_price, they round away from the close
        // (in a calc_on_order_fills execution, from the fill point).
        const mintick = context.pine?.syminfo?.mintick ?? 0;
        const currentClose = context._fillPointPrice ?? Series.from(context.data.close).get(0);
        const openTrade = (context.strategy.opentrades as any[]).find((t) => !fromEntryId || t.entry_id === fromEntryId);
        const positionDir = openTrade ? Math.sign(openTrade.size) : pendingEntry ? parseDirection(pendingEntry.direction) : 0;
        const level = (raw: number | undefined, kind: 'limit' | 'stop') =>
            raw === undefined ? undefined : positionDir ? roundOrderLevel(raw, -positionDir, kind, mintick) : roundToMintick(raw, currentClose, mintick);
        const limit       = level(limitRaw, 'limit');
        const stop        = level(stopRaw, 'stop');
        const trailPrice  = trailPriceRaw !== undefined ? roundToMintick(trailPriceRaw, currentClose, mintick) : undefined;

        // Pine semantic: calling strategy.exit with the same `id` REPLACES the
        // prior pending exit order (allowing dynamic TP/SL adjustment each
        // bar). Without this, stale exits accumulate across the strategy's
        // lifetime — they survive past their originating trade, and when a
        // later trade happens to satisfy the wrong-sided / stale-reversal
        // checks geometrically, the old order fires at a phantom price.
        // Same id + same from_entry scope is the replacement key.
        const exitId = idValue ?? 'exit';
        const list = context.strategy.pending_orders as Order[];
        const replaced: Order[] = [];
        for (let i = list.length - 1; i >= 0; i--) {
            const o = list[i];
            if (o.category === 'exit' && o.id === exitId && (o.from_entry ?? '') === fromEntryId && o.status === 'pending') {
                replaced.push(o);
                list.splice(i, 1);
            }
        }

        // With every price leg na the call places no order, and a re-call cancels the
        // pending exit it replaces (TradingView). It must not become a market close.
        if ([profit, limit, loss, stop, trailPrice, trailPoints].every((v) => v === undefined)) return;

        const order: Order = {
            id: exitId,
            direction: 0,           // resolved at trigger based on matching trades
            // floored to the symbol's step; 0 is the whole position (TV, AAPL: qty = 0.5 exits all 4)
            qty: qty !== undefined && qty !== null && !isNaValue(qty) ? floorQty(context, Math.abs(Number(qty))) : 0,
            qty_percent: isNaValue(qtyPercent) ? undefined : qtyPercent,
            type: 'market',
            bar: context.idx,
            time: Series.from(context.data.openTime).get(0),
            status: 'pending',
            category: 'exit',
            from_entry: fromEntryId,
            profit, loss, limit, stop,
            trail_price: trailPrice,
            _trailPriceRaw: trailPriceRaw,
            trail_points: trailPoints,
            trail_offset: trailOffset,
            oca_name: extractValue(parsed.oca_name),
            _priceLegsWin: context.pineVersion === 5,
            // an exit's orders belong to its OCA group as strategy.oca.reduce members
            oca_type: extractValue(parsed.oca_name) ? 'reduce' : undefined,
            comment: extractValue(parsed.comment),
            comment_profit: extractValue(parsed.comment_profit),
            comment_loss: extractValue(parsed.comment_loss),
            comment_trailing: extractValue(parsed.comment_trailing),
            alert_message: extractValue(parsed.alert_message),
            alert_profit: extractValue(parsed.alert_profit),
            alert_loss: extractValue(parsed.alert_loss),
            alert_trailing: extractValue(parsed.alert_trailing),
            disable_alert: extractValue(parsed.disable_alert),
            _attachedAtReversal: attachedAtReversal,
            // Was a position open when this exit was placed? Such an order belongs to THAT position and dies with it
            // (see processExitOrders); an exit placed while flat waits for its entry, as on TradingView.
            _placedWithPosition: context.strategy.opentrades.length > 0,
            _placedDir: Math.sign(context.strategy.position_size),
        };

        // Trail state carry-over: each trade's armed flag and running peak are
        // engine-accumulated state, not user parameters. A re-call with the same
        // activation (trail_price as passed, trail_points) keeps them, whatever else
        // changes (offset, loss, ...). A re-call that moves the activation is a new
        // trailing order that starts over (TV, BTCUSDT 1h: `trail_price = close`
        // re-called every bar exits a long at the previous close minus the offset,
        // 78,979.99, not at the previous high minus the offset, 79,020.61). The
        // passed value is compared: its tick rounding follows the close.
        const trails = replaced.find((o) => o._trailByTrade && o._trailPriceRaw === trailPriceRaw && o.trail_points === trailPoints);
        if (trails) order._trailByTrade = { ...trails._trailByTrade };
        // A trail whose activation level the close has already reached is active from that close,
        // with the close as its peak (TV, ES: a short's trail activating at 2,013 placed on a 1,994.5
        // close, offset 4, fills at 1,998.5 on the next bar).
        if (order.trail_offset !== undefined && (trailPrice !== undefined || trailPoints !== undefined)) {
            const close = context._fillPointPrice ?? Series.from(context.data.close).get(0);
            for (const t of context.strategy.opentrades as any[]) {
                if (fromEntryId && t.entry_id !== fromEntryId) continue;
                if (order._trailByTrade?.[t.id]?.armed) continue;
                const dir = Math.sign(t.size);
                const arm = trailArmPrice(order, t._bracket_entry ?? t.entry_price, dir, mintick);
                if (Number.isFinite(close) && dir * (close - arm) >= 0) (order._trailByTrade ??= {})[t.id] = { armed: true, peak: close };
            }
        }
        // Placement order decides which exit's quantity is reserved first (see exitCapacity); a
        // re-call keeps the place of the exit it replaces.
        const strat = context.strategy as any;
        const seqs: Map<string, number> = (strat._exit_seqs ??= new Map());
        const seqKey = `${exitId}\u0000${fromEntryId}`;
        if (!seqs.has(seqKey)) seqs.set(seqKey, seqs.size + 1);
        order._seq = seqs.get(seqKey);
        placeOrder(context.strategy, order);
    };
}
