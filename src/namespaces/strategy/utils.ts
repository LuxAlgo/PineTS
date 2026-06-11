// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { Order, StrategyState, Trade } from './types';
import { Series } from '../../Series';

/**
 * Parse strategy() function arguments
 */
export function parseStrategyOptions(args: any[]): any {
    // Pine v5/v6 strategy() signature:
    //   strategy(title, shorttitle, overlay, format, precision, scale,
    //            pyramiding, calc_on_order_fills, ...)
    // The transpiler emits leading POSITIONAL strings (title, optionally
    // shorttitle) followed by a trailing object with all named args.
    // Three input shapes show up in practice:
    //   1. strategy("title")                       — title only
    //   2. strategy("title", { opts })             — title + named args
    //   3. strategy("title", "shorttitle", {opts}) — Pine v6 with shorttitle
    // The original implementation handled #1 and #2 but DROPPED the
    // trailing options object in #3 (returning only { title }), which
    // silently lost commission_type, commission_value, overlay, and every
    // other named arg.
    if (args.length === 0) return {};

    // If first arg is itself an object, treat it as the whole options bag.
    if (typeof args[0] === 'object' && args[0] !== null) {
        return args[0];
    }

    const options: any = {};
    if (typeof args[0] === 'string') options.title = args[0];

    // Walk remaining args. Strings are positional (so far only shorttitle
    // is observed in this position). The LAST object encountered is the
    // named-args bundle — its keys win over positional fields if there's
    // overlap (matching Pine's behavior of named args overriding positional).
    let trailingOptions: any = null;
    for (let i = 1; i < args.length; i++) {
        const a = args[i];
        if (typeof a === 'string') {
            // Currently only shorttitle slots in as a positional string.
            // If future Pine versions add more positional strings, extend
            // here.
            if (options.shorttitle === undefined) options.shorttitle = a;
        } else if (typeof a === 'object' && a !== null) {
            trailingOptions = a;
        }
    }
    if (trailingOptions) Object.assign(options, trailingOptions);
    return options;
}

/**
 * Round a stop/limit price to the symbol's mintick grid, AWAY from the
 * reference price (typically the current bar's close at order placement).
 *
 * Pine's broker emulator places stop/limit orders on the mintick grid
 * conservatively — a buy stop at 4188.4541 above current 4184 becomes
 * 4188.46 (ceiling), not 4188.45. This makes the order trigger LATER
 * (requires more price movement), mirroring real-broker order placement.
 *
 * The rule:
 *   price > referencePrice → ceil to mintick (push price UP)
 *   price < referencePrice → floor to mintick (push price DOWN)
 *   price === referencePrice → return as-is
 *
 * Covers all four cases naturally:
 *   - Buy stop above current  → ceil
 *   - Sell stop below current → floor
 *   - Buy limit below current → floor
 *   - Sell limit above current → ceil
 *   - Long TP above entry / SL below entry → ceil / floor
 *   - Short TP below entry / SL above entry → floor / ceil
 *
 * For mintick === 0 or undefined (defensive), returns the price unchanged.
 */
export function roundToMintick(price: number, referencePrice: number, mintick: number): number {
    if (!mintick || mintick <= 0 || !Number.isFinite(price)) return price;
    if (price === referencePrice) return price;
    const ticks = price / mintick;
    // Small epsilon guards against float-imprecision flipping an
    // already-on-grid value to the next tick.
    const EPS = 1e-9;
    return price > referencePrice
        ? Math.ceil(ticks - EPS) * mintick
        : Math.floor(ticks + EPS) * mintick;
}

/**
 * Margin required to hold a position of `qty` contracts at `price`, given
 * the `marginPct` (% of notional that must be posted as collateral). The
 * pointValue factor converts price units to account-currency dollars
 * (1 for crypto, varies for futures).
 *
 * Pine docs (strategy() declaration): `margin_long` / `margin_short` is
 * the percentage of notional held as collateral. 100 = no leverage, 20 =
 * 5× leverage, etc.
 */
export function computeRequiredMargin(qty: number, price: number, marginPct: number, pointValue: number): number {
    return Math.abs(qty) * price * pointValue * marginPct / 100;
}

/**
 * Account equity computed AS IF the marketprice were `atPrice` — used to
 * check what equity would be at a hypothetical intra-bar price (e.g. the
 * bar's adverse extreme for a margin-call check).
 *
 *   equity_at_price = initial_capital + netprofit + unrealizedPnL_at_price
 *
 * The mark-to-market is computed against EVERY open trade's entry price.
 */
export function computeEquityAtPrice(context: any, atPrice: number): number {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let unrealized = 0;
    for (const trade of strategy.opentrades) {
        const dir = Math.sign(trade.size);
        const priceChange = dir === 1 ? atPrice - trade.entry_price : trade.entry_price - atPrice;
        unrealized += priceChange * Math.abs(trade.size) * pointValue;
    }
    return strategy.initial_capital + strategy.netprofit + unrealized;
}

/**
 * Total margin currently held by all open positions, valued at `atPrice`.
 * Per-position margin uses `margin_long` for longs and `margin_short` for
 * shorts (Pine semantic — see strategy() declaration).
 */
export function computeHeldMargin(context: any, atPrice: number): number {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let total = 0;
    for (const trade of strategy.opentrades) {
        const dir = Math.sign(trade.size);
        const marginPct = dir === 1
            ? (strategy.config.margin_long  ?? 100)
            : (strategy.config.margin_short ?? 100);
        total += computeRequiredMargin(trade.size, atPrice, marginPct, pointValue);
    }
    return total;
}

/**
 * Calculate order quantity based on strategy configuration
 */
export function calculateOrderQty(context: any, specifiedQty: number | undefined, direction: number, fillPrice: number): number {
    const strategy: StrategyState = context.strategy;

    // Get qty type and value, calling functions if needed
    let qtyType = strategy.config.default_qty_type || 'fixed';
    let qtyValue = strategy.config.default_qty_value || 1;

    // If qtyType is a function, call it to get the actual string value
    if (typeof qtyType === 'function') {
        qtyType = (qtyType as Function)();
    }

    // If qtyValue is a function, call it to get the actual numeric value
    if (typeof qtyValue === 'function') {
        qtyValue = (qtyValue as Function)();
    }

    // Pine's broker emulator truncates the computed qty to 6 decimal
    // places. The precision is hardcoded — independent of the symbol's
    // mincontract or pricescale. Truncation applies to every code path
    // (specifiedQty, fixed, cash, percent_of_equity) so a downstream
    // mark-to-market loop doesn't accumulate the sub-microscopic delta
    // between the raw float and TV's reported size over many bars.
    const QTY_PRECISION = 1e6;
    const truncateQty = (q: number) => Math.floor(q * QTY_PRECISION) / QTY_PRECISION;

    if (specifiedQty !== undefined && specifiedQty !== null) {
        return truncateQty(Math.abs(specifiedQty));
    }

    let rawQty: number;
    switch (qtyType) {
        case 'fixed':
            rawQty = qtyValue;
            break;

        case 'cash':
            // Calculate how many units we can buy with the cash amount
            rawQty = qtyValue / fillPrice;
            break;

        case 'percent_of_equity': {
            // Calculate quantity based on percentage of equity
            // qty_value=10 means 10% of equity
            const positionValue = (strategy.equity * qtyValue) / 100;
            rawQty = positionValue / fillPrice;
            break;
        }

        default:
            rawQty = qtyValue;
    }
    return truncateQty(rawQty);
}

/**
 * Process pending orders and execute them
 */
export function processStrategyOrders(context: any): void {
    if (!context.strategy) return;

    const strategy: StrategyState = context.strategy;
    const { pending_orders } = strategy;

    // Get current bar's OHLC data
    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);

    // Per-trade peak adverse / favorable excursion (max-drawdown / max-runup
    // on each open trade) using INTRA-BAR high/low rather than close-only.
    // Both excursions are commission-netted (entry leg charged on fill):
    //   - max_drawdown includes the entry commission as a baseline cost.
    //   - max_runup is the favorable price gain net of that same cost.
    // This matches TV's per-trade reporting.
    //
    // pointValue converts a one-unit price move into account-currency dollars.
    // For BTC and most crypto/forex it's 1; for futures it can be e.g. $50
    // per point on the ES E-mini. Multiplied into every priceChange × qty
    // computation throughout this file so excursions and P&L are in $.
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    for (const trade of strategy.opentrades) {
        const tradeQty = Math.abs(trade.size);
        const isLongTrade = trade.size > 0;
        const entryComm = trade.commission ?? 0;
        const advPrice = isLongTrade
            ? (trade.entry_price - lowPrice) * tradeQty * pointValue
            : (highPrice - trade.entry_price) * tradeQty * pointValue;
        const favPrice = isLongTrade
            ? (highPrice - trade.entry_price) * tradeQty * pointValue
            : (trade.entry_price - lowPrice) * tradeQty * pointValue;
        const advNet = Math.max(0, advPrice) + entryComm;
        const favNet = Math.max(0, favPrice - entryComm);
        if (advNet > (trade.max_drawdown ?? 0)) trade.max_drawdown = advNet;
        if (favNet > (trade.max_runup    ?? 0)) trade.max_runup    = favNet;
    }

    // Mark-to-market at OPEN price so fill logic / risk checks see accurate equity.
    // Peaks are NOT latched here; updateEquityPeaks runs once at the bar's end.
    markToMarket(context, openPrice);

    // Process each pending order that was placed on a previous bar
    for (const order of pending_orders) {
        if (order.status !== 'pending') continue;

        // Skip exit-category orders — processExitOrders handles them.
        if ((order.category ?? 'entry') === 'exit') continue;

        // Orders placed on bar N can only fill on bar N+1 or later
        // Skip if this order was placed on the current bar (context.idx)
        if (order.bar >= context.idx) {
            continue;
        }

        let shouldFill = false;
        let fillPrice = openPrice;

        // Determine if order should be filled based on type
        switch (order.type) {
            case 'market':
                // Market orders fill at current bar's open (which is "next bar's open" from order placement)
                shouldFill = true;
                fillPrice = openPrice;
                break;

            case 'limit':
                // Limit orders fill when price reaches the limit level
                if (order.limit !== undefined) {
                    const direction = parseDirection(order.direction);
                    if (direction === 1 && lowPrice <= order.limit) {
                        // Long limit order - buy when price drops to limit
                        shouldFill = true;
                        fillPrice = order.limit;
                    } else if (direction === -1 && highPrice >= order.limit) {
                        // Short limit order - sell when price rises to limit
                        shouldFill = true;
                        fillPrice = order.limit;
                    }
                }
                break;

            case 'stop':
                // Stop orders fill when price crosses the stop level
                if (order.stop !== undefined) {
                    const direction = parseDirection(order.direction);
                    if (direction === 1 && highPrice >= order.stop) {
                        // Long stop order - buy when price rises to stop
                        shouldFill = true;
                        fillPrice = order.stop;
                    } else if (direction === -1 && lowPrice <= order.stop) {
                        // Short stop order - sell when price falls to stop
                        shouldFill = true;
                        fillPrice = order.stop;
                    }
                }
                break;
        }

        if (shouldFill) {
            // Pre-fill risk check: block if any active risk rule violates.
            if (isOrderBlockedByRisk(strategy, order)) {
                order.status = 'cancelled';
                continue;
            }

            // Apply slippage against the trade direction (longs fill higher,
            // shorts fill lower). slippage is in ticks of syminfo.mintick.
            const direction = parseDirection(order.direction);
            fillPrice = applySlippage(context, direction, fillPrice);

            // Pre-trade margin check (Pine broker emulator). When the
            // required margin for the new position would exceed available
            // equity at fill time, the order is silently dropped — no
            // trade record, no log. For reversals the close leg always
            // succeeds (frees its prior margin) and only the new open leg
            // is checked. For pyramiding (same-direction adds), held
            // margin from existing positions stays locked.
            //
            // Runs for ALL margin percentages. At 100% margin the required
            // margin equals the full notional (qty * price * pointValue * 1),
            // matching TV's broker-emulator behavior of rejecting entries
            // whose notional exceeds available equity even with no leverage.
            const marginPct = direction === 1
                ? (strategy.config.margin_long  ?? 100)
                : (strategy.config.margin_short ?? 100);
            {
                const oldSize = strategy.position_size;
                const oldSign = Math.sign(oldSize);
                const isReversal = oldSign !== 0 && oldSign !== direction;
                const newOpenQty = isReversal
                    ? Math.max(0, order.qty - Math.abs(oldSize))
                    : order.qty;

                if (newOpenQty > 0) {
                    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
                    // Equity is already MtM'd at OPEN by markToMarket() at the
                    // top of processStrategyOrders, so strategy.equity is the
                    // current account value. Subtract margin held by positions
                    // that will REMAIN after this order:
                    //   - reversal: nothing remains from old position.
                    //   - pyramiding (same dir): existing held margin stays.
                    //   - fresh entry: nothing held to begin with.
                    let heldMarginRemaining = 0;
                    if (oldSign === direction) {
                        heldMarginRemaining = computeHeldMargin(context, openPrice);
                    }
                    const availableEquity = strategy.equity - heldMarginRemaining;
                    const requiredMargin = computeRequiredMargin(newOpenQty, fillPrice, marginPct, pointValue);

                    if (requiredMargin > availableEquity) {
                        // TV broker emulator: the margin check only guards the
                        // OPEN leg. On a reversal, the close leg always
                        // executes (it frees margin / realizes the position) —
                        // TV's exit shows the reversal order's id as exit id
                        // while no opposite position appears. Verified against
                        // QA margin_calls xlsx: after a partial margin-call
                        // liquidation, the remainder was closed by the next
                        // reversal order whose open leg was margin-rejected.
                        const qtyToClose = Math.min(Math.abs(oldSize), order.qty);
                        if (isReversal && qtyToClose > 0) {
                            closePartialPosition(context, qtyToClose, fillPrice, currentTime, {
                                exitId:      order.id,
                                exitComment: order.comment,
                            });
                            order.status = 'filled';
                            order.fill_price = fillPrice;
                            order.fill_bar = context.idx;
                            order.fill_time = currentTime;
                        } else {
                            order.status = 'cancelled';
                        }
                        continue;
                    }
                }
            }

            // Execute the order using the pre-calculated qty
            executeOrder(context, order, fillPrice, currentTime);
            order.status = 'filled';
            order.fill_price = fillPrice;
            order.fill_bar = context.idx;
            order.fill_time = currentTime;
        }
    }

    // Remove filled and cancelled orders
    strategy.pending_orders = pending_orders.filter((o) => o.status === 'pending');

    // Refresh equity at CLOSE for processExitOrders' opening read.
    // Peaks are latched at the bar's end inside processExitOrders.
    markToMarket(context, closePrice);
    updateStrategyMetrics(context);
}

/**
 * Parse direction string/number to numeric value
 */
export function parseDirection(direction: number | string): number {
    if (typeof direction === 'number') return direction;
    if (direction === 'long') return 1;
    if (direction === 'short') return -1;
    return 0;
}

/**
 * Charge commission for one fill leg (entry OR exit) given the qty filled and
 * the price at fill. Returns the dollar amount to deduct.
 *
 * Pine commission types:
 *   - strategy.commission.percent          : commission_value % of leg notional
 *   - strategy.commission.cash_per_contract: commission_value per contract filled
 *   - strategy.commission.cash_per_order   : commission_value flat per fill leg
 */
function computeLegCommission(context: any, strategy: StrategyState, qty: number, price: number): number {
    const type = strategy.config.commission_type ?? 'percent';
    const value = strategy.config.commission_value ?? 0;
    if (!value || value === 0) return 0;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    switch (type) {
        case 'percent':
            // Notional = qty × price × pointValue, commission is value% of it.
            return Math.abs(qty) * price * pointValue * (value / 100);
        case 'cash_per_contract':
            // value is in account currency per contract — no pointValue factor.
            return Math.abs(qty) * value;
        case 'cash_per_order':
            return value;
        default:
            return 0;
    }
}

/**
 * Apply slippage to a nominal fill price, shifting against the trade's
 * direction (longs fill higher, shorts fill lower). slippage is expressed in
 * ticks of `syminfo.mintick`. Returns the adjusted fill price.
 */
function applySlippage(context: any, direction: number, nominalPrice: number): number {
    const strategy: StrategyState = context.strategy;
    const slippage = strategy.config.slippage ?? 0;
    if (!slippage || slippage === 0) return nominalPrice;
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;
    const slippageAmount = slippage * mintick;
    return direction === 1 ? nominalPrice + slippageAmount : nominalPrice - slippageAmount;
}

/**
 * Update max_contracts_held_* peaks after a position-size change.
 * Called whenever position_size mutates (openTrade / closePartialPosition).
 */
function updateMaxContractsHeld(strategy: StrategyState): void {
    const abs = Math.abs(strategy.position_size);
    if (abs > strategy.max_contracts_held_all) strategy.max_contracts_held_all = abs;
    if (strategy.position_size > strategy.max_contracts_held_long) {
        strategy.max_contracts_held_long = strategy.position_size;
    }
    if (-strategy.position_size > strategy.max_contracts_held_short) {
        strategy.max_contracts_held_short = -strategy.position_size;
    }
}

/**
 * Returns true if adding a same-direction entry would exceed the strategy's
 * pyramiding cap. Counts existing open trades in the requested direction.
 *
 * `strategy.entry()` (when implemented) consults this; `strategy.order()` does
 * NOT — Pine treats strategy.order as a low-level primitive that ignores the
 * pyramiding limit.
 */
export function wouldExceedPyramiding(strategy: StrategyState, direction: number): boolean {
    const cap = strategy.config.pyramiding ?? 1;
    let openSameSide = 0;
    for (const t of strategy.opentrades) {
        if (Math.sign(t.size) === direction) openSameSide++;
    }
    return openSameSide >= cap;
}

/**
 * Pre-fill risk-rule check. Returns true if the order should be BLOCKED.
 *
 * Consulted rules (independent; first violation wins):
 *   - risk_halted (latched by any catastrophic rule)
 *   - allow_entry_in: 'long' blocks short orders; 'short' blocks long
 *   - max_position_size: post-fill |position_size| would exceed N
 */
export function isOrderBlockedByRisk(strategy: StrategyState, order: Order): boolean {
    if (strategy.risk_halted) return true;
    const rules = strategy.risk_rules;
    const orderDir = order.direction;

    if (rules.allow_entry_in) {
        if (rules.allow_entry_in === 'long' && orderDir === -1) return true;
        if (rules.allow_entry_in === 'short' && orderDir === 1) return true;
    }
    if (rules.max_position_size !== undefined) {
        const postSize = strategy.position_size + orderDir * order.qty;
        if (Math.abs(postSize) > rules.max_position_size) return true;
    }
    return false;
}

/**
 * Latches `risk_halted` when any catastrophic rule trips (max_drawdown,
 * max_intraday_loss, max_cons_loss_days). Once halted, all entries are
 * blocked for the rest of the run.
 *
 * Called after each close. The intraday rules use simple cumulative
 * approximations — true day-rollover detection would require bar timestamp
 * + timezone logic that's deferred.
 */
export function evaluateCatastrophicRiskHalt(strategy: StrategyState): void {
    if (strategy.risk_halted) return;
    const rules = strategy.risk_rules;

    if (rules.max_drawdown) {
        const limit = rules.max_drawdown.type === 'percent_of_equity'
            ? (rules.max_drawdown.value / 100) * strategy.equity_peak
            : rules.max_drawdown.value;
        if (strategy.max_drawdown >= limit) {
            strategy.risk_halted = true;
            return;
        }
    }
    if (rules.max_intraday_loss) {
        const limit = rules.max_intraday_loss.type === 'percent_of_equity'
            ? (rules.max_intraday_loss.value / 100) * strategy.initial_capital
            : rules.max_intraday_loss.value;
        if (strategy.grossloss >= limit) {
            strategy.risk_halted = true;
            return;
        }
    }
    if (rules.max_cons_loss_days) {
        let consecutive = 0;
        for (let i = strategy.closedtrades.length - 1; i >= 0; i--) {
            if ((strategy.closedtrades[i].profit ?? 0) < 0) consecutive++;
            else break;
        }
        if (consecutive >= rules.max_cons_loss_days.count) {
            strategy.risk_halted = true;
        }
    }
}

/**
 * Open a new trade.
 *
 * @param direction +1 long, -1 short
 * @param qty       unsigned contract count
 * @param price     fill price
 * @param time      fill time (ms)
 */
export function openTrade(
    context: any,
    entryId: string,
    direction: number,
    qty: number,
    price: number,
    time: number,
    entryComment?: string,
    isReversalOpen?: boolean,
): void {
    const strategy: StrategyState = context.strategy;
    const tradeNum = strategy.opentrades.length + strategy.closedtrades.length;

    // Charge entry-leg commission up front; trade.commission will be increased
    // by the exit leg when it closes (or proportional share on partial close).
    //
    // For cash_per_order on a reversal open, charge only HALF the flat fee:
    // the other half is charged to the closing leg in closePartialPosition,
    // matching TV's 50/50 split of the order's flat fee between the two legs.
    const commTypeOpen = strategy.config.commission_type ?? 'percent';
    const halveFlat = isReversalOpen && commTypeOpen === 'cash_per_order';
    const rawEntryCommission = computeLegCommission(context, strategy, qty, price);
    const entryCommission = halveFlat ? rawEntryCommission / 2 : rawEntryCommission;

    const trade: Trade = {
        id: `trade_${tradeNum}`,
        entry_id: entryId,
        // TV's strategy.closedtrades.entry_comment falls back to the entry id
        // when no explicit comment was passed to strategy.entry/order. Mirror
        // that by stamping the id as the entry comment when none is given.
        entry_comment: entryComment ?? entryId,
        entry_price: price,
        entry_bar_index: context.idx,
        entry_time: time,
        size: direction * qty,   // SIGNED — matches Pine's closedtrades.size()
        commission: entryCommission,
        max_drawdown: 0,
        max_runup: 0,
        status: 'open',
    };

    strategy.opentrades.push(trade);

    // Realize the entry commission immediately as a cash outflow. TV reports
    // strategy.netprofit and strategy.grossloss net of entry commission the
    // moment the trade opens (commission is a real cost paid at fill, not
    // Entry commission hits strategy.netprofit (and grossloss as a pending
    // liability) AT FILL TIME — matches TV's `strategy.netprofit` value
    // during an open trade (verified against xlsx exports: TV's "Net profit"
    // line during an open position equals closed-trades-total minus the
    // sum of open trades' entry commissions). The exit commission is
    // realized in closePartialPosition when the trade actually closes.
    //
    // Drawdown compensation: `updateEquityPeaks` adds the open trades'
    // entry commission BACK to the drawdown formula. This mirrors TV's
    // drawdown formula which has an explicit `+ openCommission` term —
    // the result is correct for any peak timing (before vs during open
    // trade), see math in the QA-drawdown analysis notes.
    if (entryCommission > 0) {
        strategy.netprofit -= entryCommission;
        strategy.grossloss += entryCommission;
    }

    // Per-trade fill-bar excursion: capture this bar's intra-bar H/L against
    // the just-filled trade. Without this, the per-trade loop at the top of
    // processStrategyOrders misses the fill bar (it ran before this trade
    // existed in opentrades), and the bar's adverse / favorable excursion is
    // lost from trade.max_drawdown / trade.max_runup.
    //
    // Clamp at pending SL/TP trigger prices: a trade with an attached stop
    // can't actually experience price excursions past the stop — once price
    // touches the stop, the trade closes there. Without clamping, a same-bar
    // entry+SL trade records the bar's full low (a phantom excursion that
    // never happened to this trade).
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice  = Series.from(context.data.low).get(0);
    const mintick   = context.pine?.syminfo?.mintick ?? 0.01;

    let worstPrice = direction === 1 ? lowPrice  : highPrice;
    let bestPrice  = direction === 1 ? highPrice : lowPrice;
    for (const exitOrder of strategy.pending_orders) {
        if ((exitOrder.category ?? 'entry') !== 'exit') continue;
        if (exitOrder.from_entry && exitOrder.from_entry !== entryId) continue;

        // SL trigger price (stop=absolute, loss=ticks-from-entry).
        let sl: number | undefined;
        if (exitOrder.stop !== undefined) sl = exitOrder.stop;
        else if (exitOrder.loss !== undefined) {
            sl = direction === 1 ? price - exitOrder.loss * mintick : price + exitOrder.loss * mintick;
        }
        // TP trigger price (limit=absolute, profit=ticks-from-entry).
        let tp: number | undefined;
        if (exitOrder.limit !== undefined) tp = exitOrder.limit;
        else if (exitOrder.profit !== undefined) {
            tp = direction === 1 ? price + exitOrder.profit * mintick : price - exitOrder.profit * mintick;
        }

        if (direction === 1) {
            // Long: worst is low (cap upward by sl), best is high (cap downward by tp).
            if (sl !== undefined && sl > worstPrice) worstPrice = sl;
            if (tp !== undefined && tp < bestPrice)  bestPrice  = tp;
        } else {
            // Short: worst is high (cap downward by sl), best is low (cap upward by tp).
            if (sl !== undefined && sl < worstPrice) worstPrice = sl;
            if (tp !== undefined && tp > bestPrice)  bestPrice  = tp;
        }
    }

    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    const adv = direction === 1 ? (price - worstPrice) * qty * pointValue : (worstPrice - price) * qty * pointValue;
    const fav = direction === 1 ? (bestPrice  - price) * qty * pointValue : (price - bestPrice)  * qty * pointValue;
    // Fold entry-leg commission into BOTH excursions: a trade is "down" by
    // the entry commission the moment it fills (so the adverse excursion
    // includes that cost), and the favorable excursion is the price gain NET
    // of that same cost (the trade has to overcome the commission first
    // before showing any runup). TV reports both metrics commission-netted.
    trade.max_drawdown = Math.max(0, adv) + entryCommission;
    trade.max_runup    = Math.max(0, fav - entryCommission);

    // Update flat position scalars
    const oldSize = strategy.position_size;
    const newSize = oldSize + trade.size;

    if (oldSize === 0) {
        // Opening fresh position
        strategy.position_size = newSize;
        strategy.position_avg_price = price;
        strategy.position_entry_name = entryId;
    } else if (Math.sign(oldSize) === Math.sign(newSize)) {
        // Adding to existing same-direction position — weighted-avg the entry price
        const totalCost = Math.abs(oldSize) * strategy.position_avg_price + qty * price;
        const totalQty = Math.abs(newSize);
        strategy.position_avg_price = totalCost / totalQty;
        strategy.position_size = newSize;
    }

    updateMaxContractsHeld(strategy);
}

/**
 * Execute an order
 * strategy.order() modifies the net position directly
 */
function executeOrder(context: any, order: Order, fillPrice: number, fillTime: number): void {
    const strategy: StrategyState = context.strategy;
    const direction = parseDirection(order.direction);
    const oldPosition = strategy.position_size;
    const oldSign = Math.sign(oldPosition);

    // Check if we are reducing/reversing the position
    // (Long position and selling, or Short position and buying)
    const isReducing = (oldSign === 1 && direction === -1) || (oldSign === -1 && direction === 1);

    if (isReducing) {
        // We are reducing or reversing
        // First, use the order to close existing trades. For a reversal,
        // the reversing order's id/comment become the EXIT id/comment of
        // the prior trade — that's TV behavior.
        const qtyToClose = Math.min(Math.abs(oldPosition), order.qty);
        const remainingQty = order.qty - qtyToClose;
        // True reversal: the SAME order both flattens the prior position
        // AND opens a new one in the opposite direction. For cash_per_order
        // commission, TV charges the order's flat fee ONCE total — split
        // 50/50 between the closing leg and the opening leg (so the closing
        // trade gets +value/2 and the new trade also gets +value/2 on its
        // entry). Marking the close with isImplicitReversal triggers that
        // half-charge in closePartialPosition; the new openTrade is told
        // separately to apply the same half-charge.
        const isReversal = remainingQty > 0;
        closePartialPosition(context, qtyToClose, fillPrice, fillTime, {
            exitId:      order.id,
            exitComment: order.comment,
            isImplicitReversal: isReversal,
        });

        // If there is remaining quantity (reversal), open a new trade.
        if (remainingQty > 0) {
            openTrade(context, order.id, direction, remainingQty, fillPrice, fillTime, order.comment, /* isReversalOpen */ true);
        }
    } else {
        // We are increasing position or opening fresh
        openTrade(context, order.id, direction, order.qty, fillPrice, fillTime, order.comment);
    }
}

/**
 * Close partial or full position.
 *
 * FIFO accounting: closes oldest open trades first. Splits a trade if the
 * close qty is smaller than the trade's remaining qty.
 */
export interface CloseInfo {
    /** Which exit leg triggered ('profit'/'loss'/'trailing'), null otherwise. */
    triggerKind?: 'profit' | 'loss' | 'trailing' | null;
    /** Exit order's id, set onto the closed trade as trade.exit_id. */
    exitId?: string;
    /** Resolved exit comment (the matching comment_profit/loss/trailing). */
    exitComment?: string;
    /**
     * True when this close is part of a single REVERSAL order that will
     * also open a new trade in the opposite direction. Affects
     * `cash_per_order` commission: TV charges the flat fee ONCE per order
     * placement, attributed to the new entry — the implicit close leg of
     * the reversal does NOT incur a second flat charge. Per-leg types
     * (percent, cash_per_contract) are unaffected by this flag.
     */
    isImplicitReversal?: boolean;
}

export function closePartialPosition(
    context: any,
    qtyToClose: number,
    exitPrice: number,
    exitTime: number,
    closeInfo?: CloseInfo,
): void {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let remainingQty = qtyToClose;

    // Close trades from oldest to newest (FIFO)
    const tradesToClose = [...strategy.opentrades];
    strategy.opentrades = [];

    for (const trade of tradesToClose) {
        if (remainingQty <= 0) {
            // Keep this trade open
            strategy.opentrades.push(trade);
            continue;
        }

        const tradeQty = Math.abs(trade.size);
        const qtyClosing = Math.min(tradeQty, remainingQty);
        const tradeDirection = Math.sign(trade.size);

        if (qtyClosing >= tradeQty) {
            // Fully close this trade
            trade.status = 'closed';
            trade.exit_price = exitPrice;
            trade.exit_bar_index = context.idx;
            trade.exit_time = exitTime;

            // Gross P&L from price change (direction-aware). PointValue
            // converts the price-change × qty units into account currency.
            const priceChange = tradeDirection === 1 ? exitPrice - trade.entry_price : trade.entry_price - exitPrice;
            const grossPnL = priceChange * tradeQty * pointValue;

            // Capture entry-only commission BEFORE adding the exit leg — used
            // below for the TP-override on max_drawdown.
            const entryOnlyComm = trade.commission ?? 0;

            // Charge entry + exit commission legs and bank them on the trade.
            // trade.commission already holds the entry leg charged in openTrade().
            // Exception: for `cash_per_order` on a reversal close, the
            // reversal order's flat fee is split 50/50 between the closing
            // leg and the opening leg (matching TV — each side gets value/2).
            const commType = strategy.config.commission_type ?? 'percent';
            const halveFlatExit = closeInfo?.isImplicitReversal && commType === 'cash_per_order';
            const rawExitCommission = computeLegCommission(context, strategy, tradeQty, exitPrice);
            const exitCommission = halveFlatExit ? rawExitCommission / 2 : rawExitCommission;
            trade.commission = entryOnlyComm + exitCommission;

            // Override per-trade peaks based on which exit leg actually fired
            // (TV semantic for SL/TP closes — TV assumes worst-case ordering
            // and reports excursion only on the side that triggered):
            //   loss     (SL fired)  → no favorable movement happened → mfe = 0
            //   profit   (TP fired)  → no adverse movement happened, only the
            //                          entry-commission baseline cost remains.
            // Reversal / close()/close_all() leave triggerKind undefined and
            // the trade's accumulated excursions stand.
            if (closeInfo?.triggerKind === 'loss')   trade.max_runup    = 0;
            if (closeInfo?.triggerKind === 'profit') trade.max_drawdown = entryOnlyComm;

            // Stamp the exit metadata onto the closed trade. exit_id is the
            // exit ORDER's id ('ExA' / 'ExB' / etc.); exit_comment is the
            // resolved per-leg comment (comment_loss / comment_profit /
            // comment_trailing) selected by the trigger kind.
            if (closeInfo?.exitId !== undefined)      trade.exit_id      = closeInfo.exitId;
            if (closeInfo?.exitComment !== undefined) trade.exit_comment = closeInfo.exitComment;

            // Profit on the trade is NET of all commission (entry + exit).
            trade.profit = grossPnL - trade.commission;

            // netprofit: roll in the INCREMENTAL P&L from this close. The
            // entry-leg commission was already realized at fill, so the
            // close-time contribution is grossPnL − exitCommission.
            const incremental = grossPnL - exitCommission;
            strategy.netprofit += incremental;

            // grossprofit / grossloss per Pine docs: total currency value of
            // all COMPLETED winning / losing trades. So at close we ROLL
            // BACK the entry-commission contribution to grossloss (which was
            // added at fill) and partition the trade's total profit by sign.
            // Open trades' entry commission stays in grossloss until they
            // close (matches TV's commission_slippage behavior).
            strategy.grossloss -= entryOnlyComm;
            if (trade.profit > 0) {
                strategy.grossprofit += trade.profit;
                strategy.wintrades++;
                strategy.wintrades_total_profit += trade.profit;
            } else if (trade.profit < 0) {
                strategy.grossloss += Math.abs(trade.profit);
                strategy.losstrades++;
                strategy.losstrades_total_loss += Math.abs(trade.profit);
            } else {
                strategy.eventrades++;
            }

            strategy.closedtrades.push(trade);
            remainingQty -= qtyClosing;
        } else {
            // Partially close this trade — split it into a closed portion + remaining open portion
            const tradeNum = strategy.opentrades.length + strategy.closedtrades.length;

            const priceChange = tradeDirection === 1 ? exitPrice - trade.entry_price : trade.entry_price - exitPrice;
            const grossPnL = priceChange * qtyClosing * pointValue;

            // Proportional entry-leg commission for the closed portion + full
            // exit-leg commission. Same cash_per_order half-on-reversal rule
            // as the full-close path above (each side gets value/2 of the
            // reversal order's flat fee).
            const entryCommissionShare = (trade.commission ?? 0) * (qtyClosing / tradeQty);
            const commTypePartial = strategy.config.commission_type ?? 'percent';
            const halveFlatPartial = closeInfo?.isImplicitReversal && commTypePartial === 'cash_per_order';
            const rawExitCommPartial = computeLegCommission(context, strategy, qtyClosing, exitPrice);
            const exitCommission = halveFlatPartial ? rawExitCommPartial / 2 : rawExitCommPartial;
            const closedCommission = entryCommissionShare + exitCommission;

            const closedPortion: Trade = {
                ...trade,
                id: `trade_${tradeNum}`,
                size: tradeDirection * qtyClosing,
                status: 'closed',
                exit_price: exitPrice,
                exit_bar_index: context.idx,
                exit_time: exitTime,
                commission: closedCommission,
                profit: grossPnL - closedCommission,
                // Stamp exit metadata from the closing order.
                exit_id:      closeInfo?.exitId      ?? trade.exit_id,
                exit_comment: closeInfo?.exitComment ?? trade.exit_comment,
            };

            // Apply the same SL/TP per-trade peak overrides to the closed
            // portion (full close path comments above explain the semantic).
            if (closeInfo?.triggerKind === 'loss')   closedPortion.max_runup    = 0;
            if (closeInfo?.triggerKind === 'profit') closedPortion.max_drawdown = entryCommissionShare;

            // Incremental P&L from this partial close — entry-leg share was
            // already realized at fill, so the close-time contribution to
            // netprofit is grossPnL − exit commission only.
            const incremental = grossPnL - exitCommission;
            strategy.netprofit += incremental;

            // grossprofit / grossloss: roll back the entry-share contribution
            // to grossloss (added at fill) and partition the closed portion's
            // total profit by sign (mirrors the full-close path).
            strategy.grossloss -= entryCommissionShare;
            if (closedPortion.profit! > 0) {
                strategy.grossprofit += closedPortion.profit!;
                strategy.wintrades++;
                strategy.wintrades_total_profit += closedPortion.profit!;
            } else if (closedPortion.profit! < 0) {
                strategy.grossloss += Math.abs(closedPortion.profit!);
                strategy.losstrades++;
                strategy.losstrades_total_loss += Math.abs(closedPortion.profit!);
            } else {
                strategy.eventrades++;
            }

            strategy.closedtrades.push(closedPortion);

            // The remaining open portion keeps the residual entry commission share.
            trade.size = tradeDirection * (tradeQty - qtyClosing);
            trade.commission = (trade.commission ?? 0) - entryCommissionShare;
            strategy.opentrades.push(trade);
            remainingQty = 0;
        }
    }

    // Catastrophic risk-rule halt check after this close.
    evaluateCatastrophicRiskHalt(strategy);

    // Update flat position scalars from the (possibly shrunken) open-trade book
    const currentSize = strategy.position_size;
    const sizeReduction = Math.sign(currentSize) * qtyToClose; // Reduce magnitude
    const newSize = currentSize - sizeReduction;

    strategy.position_size = newSize;
    updateMaxContractsHeld(strategy);

    if (newSize === 0) {
        strategy.position_avg_price = NaN;
        strategy.position_entry_name = '';
    } else if (strategy.opentrades.length > 0) {
        // Recompute average entry price from remaining open trades.
        // Crucial because closing older trades (FIFO) changes the weighted
        // average if the position was built from multiple entries at
        // different prices.
        let totalCost = 0;
        let totalQty = 0;
        for (const t of strategy.opentrades) {
            const tQty = Math.abs(t.size);
            totalCost += tQty * t.entry_price;
            totalQty += tQty;
        }
        strategy.position_avg_price = totalCost / totalQty;
        // position_entry_name keeps pointing at whichever entry opened the
        // first still-open trade
        strategy.position_entry_name = strategy.opentrades[0].entry_id;
    }
}

/**
 * Mark-to-market the open positions to `currentPrice`, updating
 * `strategy.openprofit` and `strategy.equity`. Does NOT touch the
 * max_drawdown / max_runup peaks — those are latched once per bar by
 * `updateEquityPeaks` AFTER all entry+exit fills have settled, so that
 * trades closed mid-bar by TP / SL are reflected as realized P&L (rather
 * than as a phantom intra-bar excursion against the bar's raw H/L).
 */
function markToMarket(context: any, currentPrice: number): void {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    let unrealizedPnL = 0;
    for (const trade of strategy.opentrades) {
        const tradeQty = Math.abs(trade.size);
        const tradeDirection = Math.sign(trade.size);
        const priceChange = tradeDirection === 1 ? currentPrice - trade.entry_price : trade.entry_price - currentPrice;
        unrealizedPnL += priceChange * tradeQty * pointValue;
    }
    strategy.openprofit = unrealizedPnL;
    strategy.equity = strategy.initial_capital + strategy.netprofit + unrealizedPnL;
}

/**
 * Latch `strategy.max_drawdown` and `strategy.max_runup` using INTRA-BAR
 * high/low excursions of the CURRENT open position (after all fills have
 * settled for the bar).
 *
 * Algorithm:
 *   1. `equity_peak` / `equity_trough` track the running high/low of
 *      REALIZED equity (initial_capital + netprofit). They step only on
 *      closed-trade P&L.
 *   2. For the still-open position (single weighted-avg via position_size /
 *      position_avg_price), compute worst- and best-case unrealized excursion
 *      against the bar's adverse / favorable extreme:
 *        long:  worstPrice = low,   bestPrice = high
 *        short: worstPrice = high,  bestPrice = low
 *   3. drawdown_this_bar = (equity_peak  − realized_equity) + worst_excursion
 *      runup_this_bar    = (realized_equity − equity_trough) + best_excursion
 *   4. Latch the running maxima.
 *
 * Why latch only after fills: a trade closed by TP / SL during the bar
 * realizes exactly its stop/target P&L. Computing drawdown against the bar's
 * raw low BEFORE the fill would overcount — the trade never actually marked
 * to that low because the stop fired first. Running this only after fills
 * means closed trades contribute via `realizedEquity` (their actual close
 * price), and only positions that survived the bar contribute via H/L.
 *
 * Per-trade excursions (trade.max_drawdown / trade.max_runup) are tracked
 * separately at the top of processStrategyOrders against the same bar H/L.
 */
function updateEquityPeaks(context: any, highPrice: number, lowPrice: number): void {
    const strategy: StrategyState = context.strategy;
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;

    const realizedEquity = strategy.initial_capital + strategy.netprofit;

    // Open-trade entry commissions (already deducted from netprofit at fill).
    let openCommission = 0;
    for (const t of strategy.opentrades) openCommission += t.commission ?? 0;

    // PEAK basis excludes the open trades' entry commissions. TV latches the
    // equity high-water on the intermediate funds state right after a close
    // settles — BEFORE the entry commission of a trade opened on the same
    // bar (reversal) is charged. PT processes the reversal close+open
    // atomically, so the peak basis adds the open entry commissions back.
    // Verified against QA margin_calls xlsx (1% percent commission): TV's
    // peak was exactly closed-trades-cum (+148,279.33) while the reversal
    // trade opened on the peak bar had already cost 2,483.81 in entry
    // commission. The TROUGH basis keeps the commission deducted
    // (pessimistic on both sides — matches TV's run-up line exactly).
    const peakBasis = realizedEquity + openCommission;
    if (peakBasis > strategy.equity_peak)        strategy.equity_peak   = peakBasis;
    if (realizedEquity < strategy.equity_trough) strategy.equity_trough = realizedEquity;

    const posSize = strategy.position_size;
    const avgPrice = strategy.position_avg_price;

    let worstExcursion = 0;
    let bestExcursion = 0;
    if (posSize !== 0 && Number.isFinite(avgPrice)) {
        const worstPrice = posSize > 0 ? lowPrice  : highPrice;
        const bestPrice  = posSize > 0 ? highPrice : lowPrice;
        // posSize * (avg - worstPrice) is always >= 0 (a loss); same for gain.
        // Multiplied by pointValue to convert price units → account currency.
        worstExcursion = posSize * (avgPrice - worstPrice) * pointValue;
        bestExcursion  = posSize * (bestPrice - avgPrice)  * pointValue;
    }

    // Drawdown = realized gap from the high-water + the open position's
    // intra-bar adverse excursion. No commission correction here: the peak
    // basis already excludes open entry commissions (see above) while
    // realizedEquity includes them — the asymmetry IS TV's model.
    const drawDown = (strategy.equity_peak   - realizedEquity) + worstExcursion;
    if (drawDown > strategy.max_drawdown) {
        strategy.max_drawdown = drawDown;
        // Snapshot Max_Equity (the realized high-water in force at this
        // moment) — denominator for max_drawdown_percent. Per TV's docs:
        //   ddpct = max_drawdown / Max_Equity-at-latch × 100
        strategy.equity_at_drawdown_peak = strategy.equity_peak;

        // TV's max_drawdown_percent is the RUNNING MAX of the per-latch
        // ratio, not (current_max_drawdown / current_equity_at_peak).
        // The two diverge when a later latch has a larger absolute
        // drawdown but a smaller percentage (equity grew faster). Track
        // the high-water ratio independently of the absolute peak.
        if (strategy.equity_peak > 0) {
            const ratio = (100 * drawDown) / strategy.equity_peak;
            if (ratio > strategy.max_drawdown_percent_value) {
                strategy.max_drawdown_percent_value = ratio;
            }
        }
    }

    const runUp   = (realizedEquity - strategy.equity_trough) + bestExcursion;
    if (runUp > strategy.max_runup) {
        strategy.max_runup = runUp;
        // Snapshot the total equity at this peak — denominator for max_runup_percent.
        strategy.equity_at_runup_peak = realizedEquity + bestExcursion;

        // Symmetric running-max-of-ratio for max_runup_percent. See the
        // max_drawdown_percent comment above for the semantic reason.
        if (strategy.equity_at_runup_peak > 0) {
            const ratio = (100 * runUp) / strategy.equity_at_runup_peak;
            if (ratio > strategy.max_runup_percent_value) {
                strategy.max_runup_percent_value = ratio;
            }
        }
    }
}

/**
 * FIFO close of `qtyToClose` contracts from open trades, optionally filtered
 * by `fromEntry` — when set, only trades whose `entry_id === fromEntry` are
 * eligible. Falls back to closing across all open trades when empty/undefined.
 *
 * Wraps `closePartialPosition` by temporarily reorganizing `opentrades` so
 * the matching trades sit at the head of the FIFO queue.
 */
export function closeMatching(
    context: any,
    fromEntry: string | undefined,
    qtyToClose: number,
    exitPrice: number,
    exitTime: number,
    closeInfo?: CloseInfo,
): void {
    const strategy: StrategyState = context.strategy;

    if (!fromEntry || fromEntry === '') {
        // No filter — close FIFO across all open trades.
        closePartialPosition(context, qtyToClose, exitPrice, exitTime, closeInfo);
        return;
    }

    // Reorder: matching trades first (preserving their relative order),
    // non-matching second. closePartialPosition closes FIFO from the front
    // so this gives us a filtered FIFO.
    const matching: Trade[] = [];
    const others: Trade[] = [];
    for (const t of strategy.opentrades) {
        if (t.entry_id === fromEntry) matching.push(t);
        else others.push(t);
    }
    const matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
    if (matchingQty === 0) return;
    const effectiveClose = Math.min(qtyToClose, matchingQty);

    strategy.opentrades = [...matching, ...others];
    closePartialPosition(context, effectiveClose, exitPrice, exitTime, closeInfo);
}

/**
 * Process exit-category orders each bar (after entry-order fills, before the
 * user script runs). Handles:
 *   - Market exits from strategy.close() / strategy.close_all() (fill at
 *     current bar's open if placed previously).
 *   - Conditional exits from strategy.exit() — TP / SL / trailing-stop
 *     triggers evaluated against current bar's high/low. Trailing-stop
 *     peak (trade.trail_peak) is updated each bar even when not triggered.
 */
export function processExitOrders(context: any): void {
    if (!context.strategy) return;
    const strategy: StrategyState = context.strategy;
    if (strategy.pending_orders.length === 0) return;

    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;

    for (const order of strategy.pending_orders) {
        if (order.status !== 'pending') continue;
        if ((order.category ?? 'entry') !== 'exit') continue;

        // Gather matching open trades (from_entry filter; '' = all).
        // For market closes from strategy.close_all() / strategy.close(id),
        // additionally restrict to the trade IDs captured at QUEUE time —
        // these orders are bound to the position state at call time, not
        // fill time. If a reversal entry implicitly closed the snapshotted
        // trades before this order fires, the order has no target and gets
        // cancelled, mirroring TV's behavior of treating
        // strategy.close_all() as a no-op when its intended position is
        // already gone.
        let matching = strategy.opentrades.filter(
            (t) => !order.from_entry || t.entry_id === order.from_entry,
        );
        if (order._intended_trade_ids) {
            const snapshot = new Set(order._intended_trade_ids);
            matching = matching.filter((t) => snapshot.has(t.id));
        }
        if (matching.length === 0) {
            // Nothing to exit — clear the order.
            order.status = 'cancelled';
            continue;
        }

        const matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
        const matchingDir = Math.sign(matching[0].size); // direction of the position to close

        // ---- Market exits from close() / close_all() ----
        if (order.type === 'market' && order.profit === undefined && order.loss === undefined &&
            order.limit === undefined && order.stop === undefined &&
            order.trail_price === undefined && order.trail_points === undefined) {
            // Skip orders placed on the current bar — they fill on the next bar's open.
            if (order.bar >= context.idx) continue;

            // Determine fill price; immediately=true (when supported) would fire
            // at current close; default is current bar's open.
            let fillPrice = order.immediately ? closePrice : openPrice;
            // Apply slippage against the close direction (opposite of position direction).
            fillPrice = applySlippage(context, -matchingDir, fillPrice);

            let qtyToClose = matchingQty;
            if (order.qty && order.qty > 0) qtyToClose = Math.min(order.qty, matchingQty);
            else if (order.qty_percent && order.qty_percent > 0) {
                qtyToClose = matchingQty * (order.qty_percent / 100);
            }

            closeMatching(context, order.from_entry, qtyToClose, fillPrice, currentTime, {
                exitId:      order.id,
                exitComment: order.comment,
            });
            order.status = 'filled';
            order.fill_price = fillPrice;
            order.fill_bar = context.idx;
            order.fill_time = currentTime;
            continue;
        }

        // ---- Conditional exits from exit() ----
        // Aggregate-position semantics: matching trades are treated as one
        // composite position with weighted-avg entry. Each leg (TP / SL / trail)
        // computes a trigger price off that avg.
        let totalCost = 0;
        for (const t of matching) totalCost += Math.abs(t.size) * t.entry_price;
        const avgEntry = totalCost / matchingQty;
        const isLong = matchingDir === 1;

        // Compute trigger prices.
        // profit (ticks) → absolute TP price
        let tpPrice: number | undefined;
        if (order.limit !== undefined) tpPrice = order.limit;
        else if (order.profit !== undefined) {
            tpPrice = isLong
                ? avgEntry + order.profit * mintick
                : avgEntry - order.profit * mintick;
        }
        // loss (ticks) → absolute SL price
        let slPrice: number | undefined;
        if (order.stop !== undefined) slPrice = order.stop;
        else if (order.loss !== undefined) {
            slPrice = isLong
                ? avgEntry - order.loss * mintick
                : avgEntry + order.loss * mintick;
        }

        // Validate trigger prices are on the correct side of avgEntry —
        // EPHEMERAL pattern only. A wrong-sided leg (e.g. SL below entry
        // for a short, TP above entry for a short) typically arises when
        // the user computes the price from strategy.position_avg_price
        // BEFORE a reversal fill — the value reflects the OUTGOING
        // position. For sparse/ephemeral exits (variable scoped inside
        // an if-block), TV's lazy series-eval gives NA on non-trigger
        // bars → no fire; PT mirrors that by dropping the wrong-sided
        // leg here.
        //
        // For PERSISTENT exits (every-bar refresh, main-scope variable),
        // TV trusts the captured value and lets gap-fill produce the
        // actual reachable price — a stale TP sitting on the wrong side
        // of entry will still fire at the bar's open via gap-fill when
        // the open is past the trigger. Dropping wrong-sided legs here
        // would miss that.
        if (!order._isPersistent) {
            if (slPrice !== undefined) {
                const slValid = isLong ? slPrice < avgEntry : slPrice > avgEntry;
                if (!slValid) slPrice = undefined;
            }
            if (tpPrice !== undefined) {
                const tpValid = isLong ? tpPrice > avgEntry : tpPrice < avgEntry;
                if (!tpValid) tpPrice = undefined;
            }
        }

        // Stale-attachment drop: when the exit was queued at the same bar
        // as the reversal entry it attaches to, the user's absolute
        // limit/stop values were computed from the OUTGOING position's
        // avg. TV's behavior depends on the user's variable scope: if the
        // variable was scoped to an if-block (lazy series eval gives NA
        // on non-trigger bars), TV doesn't fire; if the variable is in
        // main scope (always-defined value), TV fires the captured value.
        //
        // Cadence detection runs at queue time (see exit.ts): the
        // `_isPersistent` flag is set when the user called this same
        // call site on the prior bar (i.e. the strategy.exit line is
        // being re-executed every bar). Persistent capture → trust the
        // value (mirrors TV's main-scope path). Ephemeral capture →
        // drop the absolute legs (mirrors TV's NA-on-non-trigger-bar
        // path for if-block-scoped vars).
        if (order._attachedAtReversal && !order._isPersistent) {
            if (order.limit !== undefined) tpPrice = undefined;
            if (order.stop  !== undefined) slPrice = undefined;
        }

        // Trailing-stop state.
        // Two arming modes:
        //   trail_price: armed when market reaches the absolute price level
        //   trail_points: armed when market moves N ticks in favor from entry
        // After arming, ride at trail_offset ticks behind the running peak.
        //
        // Pine semantic: the trail cannot arm and trigger on the same
        // bar. The arming bar establishes the running peak; the trigger
        // check is suppressed for that bar only. SL and TP triggers are
        // independent and still fire on the arming bar.
        let trailArmedThisBar = false;
        if (!order.trail_armed && (order.trail_price !== undefined || order.trail_points !== undefined)) {
            let armPrice: number | undefined;
            if (order.trail_price !== undefined) armPrice = order.trail_price;
            else if (order.trail_points !== undefined) {
                armPrice = isLong
                    ? avgEntry + order.trail_points * mintick
                    : avgEntry - order.trail_points * mintick;
            }
            if (armPrice !== undefined) {
                const armed = isLong ? highPrice >= armPrice : lowPrice <= armPrice;
                if (armed) {
                    order.trail_armed = true;
                    order.trail_peak = isLong ? highPrice : lowPrice;
                    trailArmedThisBar = true;
                }
            }
        }
        // Peak update is now deferred to checkTrail so we can split it
        // around the intra-bar segment that TV's broker emulator assumes
        // (favorable-first: peak updates BEFORE trigger check;
        //  adverse-first: peak updates AFTER segment-1 check against the
        //  OLD peak's trigger). Eager peak update produced phantom early
        //  fires on adverse-first bars where the bar's high established
        //  the new peak only AFTER the low had already passed.

        // The trail trigger is now computed inside checkTrail's
        // segment branches (using OLD peak for segment 1, NEW peak for
        // segment 3 on adverse-first; new peak unconditionally on
        // favorable-first). See checkTrail below.

        // Evaluate triggers against this bar.
        //
        // TV's intra-bar order assumption — when both TP and SL could've fired,
        // which fires first is determined by the bar's open's PROXIMITY to high
        // vs low (TV docs, "Concepts / Strategies / Broker emulator"):
        //   open closer to HIGH → assumed order: open → high → low → close
        //                         (first move is up — favorable for longs, adverse for shorts)
        //   open closer to LOW  → assumed order: open → low → high → close
        //                         (first move is down — adverse for longs, favorable for shorts)
        //
        // For a long: open-near-high fires TP first, open-near-low fires SL first.
        // For a short: open-near-high fires SL first, open-near-low fires TP first.
        // Trail is treated as an adverse-side trigger (it kicks in on a retrace
        // against the favorable peak), so it fires together with SL.
        const openCloserToHigh = Math.abs(highPrice - openPrice) <= Math.abs(openPrice - lowPrice);
        const favorableFirst = isLong ? openCloserToHigh : !openCloserToHigh;

        let triggered = false;
        let triggerPrice: number = NaN;
        let triggerKind: 'profit' | 'loss' | 'trailing' | null = null;

        // Gap-fill rule: if the bar's OPEN is already past the trigger
        // (favorable side for the position), the actual fill price is the
        // OPEN, not the literal trigger price. This mirrors real broker
        // behavior — if you'd planned a stop at $100 and the bar opens at
        // $95, you fill at $95, not $100. For favorable triggers (TP for
        // long means open above limit; TP for short means open below limit)
        // the trader gets the favorable gap. For adverse triggers (SL),
        // same gap detection but on the adverse side.
        const checkSl = () => {
            if (triggered || slPrice === undefined) return;
            const slHit = isLong ? lowPrice <= slPrice : highPrice >= slPrice;
            if (slHit) {
                triggered = true;
                // Adverse-side gap: long SL with open below stop, or short SL with open above stop.
                const openPastSl = isLong ? openPrice <= slPrice : openPrice >= slPrice;
                triggerPrice = openPastSl ? openPrice : slPrice;
                triggerKind = 'loss';
            }
        };
        const checkTrail = () => {
            if (triggered) return;
            if (!order.trail_armed || order.trail_offset === undefined) return;

            // Intra-bar segment model (TV broker emulator):
            //
            // Favorable-first (open closer to high for long; open closer to
            // low for short):
            //   Phase 1: open → favorable extreme (price rides to bar H for
            //            long / bar L for short). Peak updates to that.
            //   Phase 2: favorable extreme → adverse extreme. Trigger
            //            (= NEW peak ± offset) may be crossed.
            //   Phase 3: adverse extreme → close. (Already covered.)
            //
            // Adverse-first (open closer to adverse extreme):
            //   Phase 1: open → adverse extreme. Peak is still PRIOR. Check
            //            trigger using OLD peak; if crossed, fire there.
            //   Phase 2: adverse → favorable extreme. Peak updates now.
            //   Phase 3: favorable → close. If close descends/rises
            //            through the NEW trigger, fire at the NEW trigger.
            //
            // Arming THIS bar is a sub-case: the peak was JUST established
            // at the arming moment (bar's H for long / L for short). The
            // segment-1 check with OLD peak doesn't apply (trail wasn't
            // armed yet). Only phase 2 (favorable-first) or phase 3
            // (adverse-first) can fire on the arming bar.
            //
            // The fill is always the LITERAL trigger price — gap-fill at
            // open is incorrect for trail (the bar's open precedes any
            // peak update for this trade).
            const updatePeak = () => {
                if (isLong) order.trail_peak = Math.max(order.trail_peak ?? -Infinity, highPrice);
                else        order.trail_peak = Math.min(order.trail_peak ?? Infinity, lowPrice);
            };
            const triggerFromPeak = (): number => isLong
                ? (order.trail_peak as number) - (order.trail_offset as number) * mintick
                : (order.trail_peak as number) + (order.trail_offset as number) * mintick;

            if (trailArmedThisBar) {
                // Peak is already the bar's favorable extreme (set by the
                // arming logic). Don't update again.
                const trig = triggerFromPeak();
                if (favorableFirst) {
                    // Phase 2 (favorable extreme → adverse extreme): low for
                    // long / high for short crosses trigger.
                    const hit = isLong ? lowPrice <= trig : highPrice >= trig;
                    if (hit) {
                        triggered = true;
                        triggerPrice = trig;
                        triggerKind = 'trailing';
                    }
                } else {
                    // Phase 3 (favorable extreme → close): close past trigger.
                    const seg3 = isLong ? closePrice < trig : closePrice > trig;
                    if (seg3) {
                        triggered = true;
                        triggerPrice = trig;
                        triggerKind = 'trailing';
                    }
                }
                return;
            }

            // Already armed in a prior bar. Use the full segment model.
            if (favorableFirst) {
                updatePeak();
                const trig = triggerFromPeak();
                const hit = isLong ? lowPrice <= trig : highPrice >= trig;
                if (hit) {
                    triggered = true;
                    triggerPrice = trig;
                    triggerKind = 'trailing';
                }
            } else {
                const oldTrig = triggerFromPeak();
                const seg1 = isLong ? lowPrice <= oldTrig : highPrice >= oldTrig;
                if (seg1) {
                    triggered = true;
                    triggerPrice = oldTrig;
                    triggerKind = 'trailing';
                    return;
                }
                updatePeak();
                const newTrig = triggerFromPeak();
                const seg3 = isLong ? closePrice < newTrig : closePrice > newTrig;
                if (seg3) {
                    triggered = true;
                    triggerPrice = newTrig;
                    triggerKind = 'trailing';
                }
            }
        };
        const checkTp = () => {
            if (triggered || tpPrice === undefined) return;
            const tpHit = isLong ? highPrice >= tpPrice : lowPrice <= tpPrice;
            if (tpHit) {
                triggered = true;
                // Favorable-side gap: long TP with open above limit, or short TP with open below limit.
                const openPastTp = isLong ? openPrice >= tpPrice : openPrice <= tpPrice;
                triggerPrice = openPastTp ? openPrice : tpPrice;
                triggerKind = 'profit';
            }
        };

        if (favorableFirst) {
            // First extreme is the favorable one → TP fires before SL/trail.
            checkTp();
            checkSl();
            checkTrail();
        } else {
            // First extreme is the adverse one → SL/trail fire before TP.
            checkSl();
            checkTrail();
            checkTp();
        }

        if (triggered) {
            // Apply slippage to the trigger price (closing side direction).
            const fillPrice = applySlippage(context, -matchingDir, triggerPrice);

            let qtyToClose = matchingQty;
            if (order.qty && order.qty > 0) qtyToClose = Math.min(order.qty, matchingQty);
            else if (order.qty_percent && order.qty_percent > 0) {
                qtyToClose = matchingQty * (order.qty_percent / 100);
            }

            // Resolve which per-leg comment to stamp on the closed trade.
            // strategy.exit() exposes comment_profit / comment_loss /
            // comment_trailing — each fires only when its leg triggers.
            // Fall back to the order's generic `comment` if the per-leg
            // string isn't set.
            const legComment =
                triggerKind === 'profit'   ? (order.comment_profit   ?? order.comment) :
                triggerKind === 'loss'     ? (order.comment_loss     ?? order.comment) :
                triggerKind === 'trailing' ? (order.comment_trailing ?? order.comment) :
                                              order.comment;

            closeMatching(context, order.from_entry, qtyToClose, fillPrice, currentTime, {
                triggerKind,
                exitId:      order.id,
                exitComment: legComment,
            });
            order.status = 'filled';
            order.fill_price = fillPrice;
            order.fill_bar = context.idx;
            order.fill_time = currentTime;
        }
    }

    // Remove filled/cancelled exit orders.
    strategy.pending_orders = strategy.pending_orders.filter((o) => o.status === 'pending');

    // Refresh equity for any caller reading metrics between processExitOrders
    // and the bar-finalize step. Peaks are latched in finalizeBar().
    markToMarket(context, closePrice);
}

/**
 * Margin-call check (TV broker emulator). After all entries and user-defined
 * exits have processed for the bar, check whether the bar's INTRA-BAR
 * adverse movement (low for longs, high for shorts) would have pushed
 * account equity below required maintenance margin. If yes, FORCE LIQUIDATE
 * all open positions at the bar's adverse extreme with exit_id="Margin call".
 *
 * The exit price is the bar's adverse extreme itself, NOT the theoretical
 * threshold where equity would exactly equal required margin. This is the
 * pessimistic broker model — the trader is assumed to be liquidated at
 * the worst intra-bar price, since intra-bar tick order is unknown.
 *
 * Runs for ALL margin percentages including 100%. At 100% margin the
 * trader still needs full notional collateral; adverse price movement
 * that drops account equity below the position's current notional
 * triggers a margin call. This matches TV's broker-emulator behavior
 * (the "Margin calls" stat in the Strategy Tester is non-zero on 100%
 * margin runs whenever a position's mark-to-market loss exceeds equity).
 */
export function processMarginCall(context: any): void {
    const strategy: StrategyState = context.strategy;
    if (!strategy || strategy.opentrades.length === 0) return;

    const positionDir = Math.sign(strategy.position_size);
    if (positionDir === 0) return;

    const marginPct = positionDir === 1
        ? (strategy.config.margin_long  ?? 100)
        : (strategy.config.margin_short ?? 100);

    const highPrice   = Series.from(context.data.high).get(0);
    const lowPrice    = Series.from(context.data.low).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    const pointValue  = context.pine?.syminfo?.pointvalue ?? 1;

    const adversePrice = positionDir === 1 ? lowPrice : highPrice;
    const totalQty = Math.abs(strategy.position_size);
    const equityAtAdverse = computeEquityAtPrice(context, adversePrice);
    const requiredMarginAtAdverse = computeRequiredMargin(totalQty, adversePrice, marginPct, pointValue);

    if (equityAtAdverse < requiredMarginAtAdverse) {
        // PARTIAL liquidation (TV broker-emulator rule): compute the margin
        // deficit at the adverse extreme, convert it to contracts at that
        // price, and liquidate 4× that amount — the 4× buffer prevents the
        // trimmed position from being immediately margin-called again on
        // the next tick. The remainder of the position stays open. Capped
        // at the full position size for catastrophic deficits.
        //
        // Verified against TV xlsx exports (MACD/BTCUSDT 1D, 100% margin):
        // TV liquidated 1.21312 of a 5-contract short (deficit $33,603.64
        // at price 110,797.38 → 4 × 0.30328) and 0.48244 of another
        // (deficit $10,924.98 at 90,574.00 → 4 × 0.12061).
        const deficit = requiredMarginAtAdverse - equityAtAdverse;
        // TV floors the cover quantity to 5 decimal places BEFORE the 4×
        // multiplier — both xlsx liquidation quantities reproduce exactly
        // under this rule (4 × 0.30328 = 1.21312, 4 × 0.12061 = 0.48244)
        // and under no other truncation placement.
        const coverQty = Math.floor((deficit / (adversePrice * pointValue)) * 1e5) / 1e5;
        const qtyToLiquidate = Math.min(totalQty, 4 * coverQty);
        closePartialPosition(context, qtyToLiquidate, adversePrice, currentTime, {
            exitId:      'Margin call',
            exitComment: 'Margin call',
        });
    }
}

/**
 * End-of-bar finalize: refresh equity at CLOSE and latch
 * `strategy.max_drawdown` / `strategy.max_runup` using the bar's H/L. Runs
 * UNCONDITIONALLY once per bar (after entry+exit fills are done), regardless
 * of whether the strategy uses exit orders.
 */
export function finalizeStrategyBar(context: any): void {
    if (!context.strategy) return;
    const highPrice  = Series.from(context.data.high).get(0);
    const lowPrice   = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    markToMarket(context, closePrice);
    updateEquityPeaks(context, highPrice, lowPrice);
}

/**
 * Update strategy metrics
 */
function updateStrategyMetrics(context: any): void {
    const strategy: StrategyState = context.strategy;

    // Net profit is already calculated when trades close.
    // Equity is updated with unrealized P&L.
    // Equity-curve peaks (max_drawdown / max_runup) and aggregate
    // win/loss stats are deferred to a later pass when those scalar
    // getters are implemented.
    void strategy;
}

/**
 * Initialize strategy state
 */
export function initializeStrategy(context: any, config: any): void {
    const defaults = {
        title: '',
        shorttitle: '',
        overlay: false,
        format: 'inherit',
        precision: 10,
        scale: 'right',
        pyramiding: 1,
        calc_on_order_fills: false,
        calc_on_every_tick: false,
        max_bars_back: 0,
        backtest_fill_limits_assumption: 0,
        default_qty_type: 'fixed',
        default_qty_value: 1,
        initial_capital: 1000000,
        currency: 'USD',
        slippage: 0,
        commission_type: 'percent',
        commission_value: 0,
        margin_long: 100,
        margin_short: 100,
        explicit_plot_zorder: false,
        max_lines_count: 50,
        max_labels_count: 50,
        max_boxes_count: 50,
        max_polylines_count: 50,
        risk_free_rate: 2,
        use_bar_magnifier: false,
        fill_orders_on_standard_ohlc: false,
    };

    // Layer order: spec defaults ← source call args ← user .prop overrides (latest wins).
    const finalConfig = { ...defaults, ...config, ...(context._propOverrides ?? {}) };
    const initialCapital = finalConfig.initial_capital;

    context.strategy = {
        config: finalConfig,

        // Trade collections
        opentrades: [],
        closedtrades: [],
        pending_orders: [],

        // Flat position scalars
        position_size: 0,
        position_avg_price: NaN,        // Pine returns NaN when flat
        position_entry_name: '',

        // Account info
        initial_capital: initialCapital,
        account_currency: finalConfig.currency || 'USD',
        equity: initialCapital,
        netprofit: 0,
        grossprofit: 0,
        grossloss: 0,
        openprofit: 0,

        // Peaks
        max_drawdown: 0,
        max_runup: 0,
        equity_peak: initialCapital,
        equity_trough: initialCapital,
        equity_at_runup_peak: initialCapital,
        equity_at_drawdown_peak: initialCapital,
        max_drawdown_percent_value: 0,
        max_runup_percent_value: 0,

        // Trade-stat counters
        wintrades: 0,
        losstrades: 0,
        eventrades: 0,
        wintrades_total_profit: 0,
        losstrades_total_loss: 0,

        // Position-size peaks
        max_contracts_held_all: 0,
        max_contracts_held_long: 0,
        max_contracts_held_short: 0,

        // Risk-management rules (configured via strategy.risk.*)
        risk_rules: {},
        risk_halted: false,

        // Cadence tracking for strategy.exit (see types.ts).
        _exit_call_history: new Map<string, number>(),
        _exit_fallback_counter: 0,
        _exit_fallback_last_bar: -1,
    };
}
