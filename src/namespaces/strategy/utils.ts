// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { Order, StrategyState, Trade } from './types';
import { Series } from '../../Series';

/**
 * Parse strategy() function arguments
 */
export function parseStrategyOptions(args: any[]): any {
    if (args.length === 0) return {};

    // If first arg is a string, it's the title
    if (typeof args[0] === 'string') {
        const options: any = { title: args[0] };

        // If second arg is object, merge it
        if (args.length > 1 && typeof args[1] === 'object') {
            return { ...options, ...args[1] };
        }

        return options;
    }

    // If first arg is object, use it directly
    if (typeof args[0] === 'object') {
        return args[0];
    }

    return {};
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

    if (specifiedQty !== undefined && specifiedQty !== null) {
        return Math.abs(specifiedQty);
    }

    switch (qtyType) {
        case 'fixed':
            return qtyValue;

        case 'cash':
            // Calculate how many units we can buy with the cash amount
            return qtyValue / fillPrice;

        case 'percent_of_equity':
            // Calculate quantity based on percentage of equity
            // qty_value=10 means 10% of equity
            const positionValue = (strategy.equity * qtyValue) / 100;
            const equityQty = positionValue / fillPrice;
            return equityQty;

        default:
            return qtyValue;
    }
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
    for (const trade of strategy.opentrades) {
        const tradeQty = Math.abs(trade.size);
        const isLongTrade = trade.size > 0;
        const entryComm = trade.commission ?? 0;
        const advPrice = isLongTrade
            ? (trade.entry_price - lowPrice) * tradeQty
            : (highPrice - trade.entry_price) * tradeQty;
        const favPrice = isLongTrade
            ? (highPrice - trade.entry_price) * tradeQty
            : (trade.entry_price - lowPrice) * tradeQty;
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
function computeLegCommission(strategy: StrategyState, qty: number, price: number): number {
    const type = strategy.config.commission_type ?? 'percent';
    const value = strategy.config.commission_value ?? 0;
    if (!value || value === 0) return 0;
    switch (type) {
        case 'percent':
            return Math.abs(qty) * price * (value / 100);
        case 'cash_per_contract':
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
export function openTrade(context: any, entryId: string, direction: number, qty: number, price: number, time: number): void {
    const strategy: StrategyState = context.strategy;
    const tradeNum = strategy.opentrades.length + strategy.closedtrades.length;

    // Charge entry-leg commission up front; trade.commission will be increased
    // by the exit leg when it closes (or proportional share on partial close).
    const entryCommission = computeLegCommission(strategy, qty, price);

    const trade: Trade = {
        id: `trade_${tradeNum}`,
        entry_id: entryId,
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

    const adv = direction === 1 ? (price - worstPrice) * qty : (worstPrice - price) * qty;
    const fav = direction === 1 ? (bestPrice  - price) * qty : (price - bestPrice)  * qty;
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
        // First, use the order to close existing trades
        const qtyToClose = Math.min(Math.abs(oldPosition), order.qty);
        closePartialPosition(context, qtyToClose, fillPrice, fillTime);

        // If there is remaining quantity (reversal), open a new trade
        const remainingQty = order.qty - qtyToClose;
        if (remainingQty > 0) {
            openTrade(context, order.id, direction, remainingQty, fillPrice, fillTime);
        }
    } else {
        // We are increasing position or opening fresh
        openTrade(context, order.id, direction, order.qty, fillPrice, fillTime);
    }
}

/**
 * Close partial or full position.
 *
 * FIFO accounting: closes oldest open trades first. Splits a trade if the
 * close qty is smaller than the trade's remaining qty.
 */
export function closePartialPosition(
    context: any,
    qtyToClose: number,
    exitPrice: number,
    exitTime: number,
    triggerKind?: 'profit' | 'loss' | 'trailing' | null,
): void {
    const strategy: StrategyState = context.strategy;
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

            // Gross P&L from price change (direction-aware)
            const priceChange = tradeDirection === 1 ? exitPrice - trade.entry_price : trade.entry_price - exitPrice;
            const grossPnL = priceChange * tradeQty;

            // Capture entry-only commission BEFORE adding the exit leg — used
            // below for the TP-override on max_drawdown.
            const entryOnlyComm = trade.commission ?? 0;

            // Charge entry + exit commission legs and bank them on the trade.
            // trade.commission already holds the entry leg charged in openTrade().
            const exitCommission = computeLegCommission(strategy, tradeQty, exitPrice);
            trade.commission = entryOnlyComm + exitCommission;

            // Override per-trade peaks based on which exit leg actually fired
            // (TV semantic for SL/TP closes — TV assumes worst-case ordering
            // and reports excursion only on the side that triggered):
            //   loss     (SL fired)  → no favorable movement happened → mfe = 0
            //   profit   (TP fired)  → no adverse movement happened, only the
            //                          entry-commission baseline cost remains.
            // Reversal / close()/close_all() leave triggerKind undefined and
            // the trade's accumulated excursions stand.
            if (triggerKind === 'loss')   trade.max_runup    = 0;
            if (triggerKind === 'profit') trade.max_drawdown = entryOnlyComm;

            // Profit on the trade is NET of all commission.
            trade.profit = grossPnL - trade.commission;

            // Update gross profit/loss + win/loss/even counters (post-commission)
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
            const grossPnL = priceChange * qtyClosing;

            // Proportional entry-leg commission for the closed portion + full exit-leg commission.
            const entryCommissionShare = (trade.commission ?? 0) * (qtyClosing / tradeQty);
            const exitCommission = computeLegCommission(strategy, qtyClosing, exitPrice);
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
            };

            // Update gross profit/loss + win/loss/even counters (post-commission)
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

    // Update net profit
    strategy.netprofit = strategy.grossprofit - strategy.grossloss;

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
    let unrealizedPnL = 0;
    for (const trade of strategy.opentrades) {
        const tradeQty = Math.abs(trade.size);
        const tradeDirection = Math.sign(trade.size);
        const priceChange = tradeDirection === 1 ? currentPrice - trade.entry_price : trade.entry_price - currentPrice;
        unrealizedPnL += priceChange * tradeQty;
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

    const realizedEquity = strategy.initial_capital + strategy.netprofit;
    if (realizedEquity > strategy.equity_peak)   strategy.equity_peak   = realizedEquity;
    if (realizedEquity < strategy.equity_trough) strategy.equity_trough = realizedEquity;

    const posSize = strategy.position_size;
    const avgPrice = strategy.position_avg_price;

    let worstExcursion = 0;
    let bestExcursion = 0;
    if (posSize !== 0 && Number.isFinite(avgPrice)) {
        const worstPrice = posSize > 0 ? lowPrice  : highPrice;
        const bestPrice  = posSize > 0 ? highPrice : lowPrice;
        // posSize * (avg - worstPrice) is always >= 0 (a loss):
        //   long  (posSize > 0): low <  avg → avg - low > 0  → product > 0
        //   short (posSize < 0): high > avg → avg - high < 0 → product = neg * neg > 0
        worstExcursion = posSize * (avgPrice - worstPrice);
        // posSize * (bestPrice - avg) is always >= 0 (a gain), symmetric to above.
        bestExcursion  = posSize * (bestPrice - avgPrice);
    }

    const drawDown = (strategy.equity_peak   - realizedEquity) + worstExcursion;
    if (drawDown > strategy.max_drawdown) strategy.max_drawdown = drawDown;

    const runUp   = (realizedEquity - strategy.equity_trough) + bestExcursion;
    if (runUp > strategy.max_runup) {
        strategy.max_runup = runUp;
        // Snapshot the total equity at this peak — denominator for max_runup_percent.
        strategy.equity_at_runup_peak = realizedEquity + bestExcursion;
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
    triggerKind?: 'profit' | 'loss' | 'trailing' | null,
): void {
    const strategy: StrategyState = context.strategy;

    if (!fromEntry || fromEntry === '') {
        // No filter — close FIFO across all open trades.
        closePartialPosition(context, qtyToClose, exitPrice, exitTime, triggerKind);
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
    closePartialPosition(context, effectiveClose, exitPrice, exitTime, triggerKind);
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
        const matching = strategy.opentrades.filter(
            (t) => !order.from_entry || t.entry_id === order.from_entry,
        );
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

            closeMatching(context, order.from_entry, qtyToClose, fillPrice, currentTime);
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

        // Trailing-stop state.
        // Two arming modes:
        //   trail_price: armed when market reaches the absolute price level
        //   trail_points: armed when market moves N ticks in favor from entry
        // After arming, ride at trail_offset ticks behind the running peak.
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
                }
            }
        } else if (order.trail_armed) {
            // Already armed — update peak.
            if (isLong) order.trail_peak = Math.max(order.trail_peak ?? -Infinity, highPrice);
            else order.trail_peak = Math.min(order.trail_peak ?? Infinity, lowPrice);
        }

        let trailTrigger: number | undefined;
        if (order.trail_armed && order.trail_peak !== undefined && order.trail_offset !== undefined) {
            trailTrigger = isLong
                ? order.trail_peak - order.trail_offset * mintick
                : order.trail_peak + order.trail_offset * mintick;
        }

        // Evaluate triggers against this bar.
        // TV convention: when both TP and SL could've fired in the same bar,
        // SL fires (pessimistic assumption — bar's range hit SL "first").
        // Trailing fires when low <= trailTrigger (long) or high >= trailTrigger (short).
        let triggered = false;
        let triggerPrice: number = NaN;
        let triggerKind: 'profit' | 'loss' | 'trailing' | null = null;

        // SL check (pessimistic first)
        if (slPrice !== undefined) {
            const slHit = isLong ? lowPrice <= slPrice : highPrice >= slPrice;
            if (slHit) {
                triggered = true;
                triggerPrice = slPrice;
                triggerKind = 'loss';
            }
        }
        // Trail check (if not already SL-triggered)
        if (!triggered && trailTrigger !== undefined) {
            const trailHit = isLong ? lowPrice <= trailTrigger : highPrice >= trailTrigger;
            if (trailHit) {
                triggered = true;
                triggerPrice = trailTrigger;
                triggerKind = 'trailing';
            }
        }
        // TP check (if not already SL/trail-triggered)
        if (!triggered && tpPrice !== undefined) {
            const tpHit = isLong ? highPrice >= tpPrice : lowPrice <= tpPrice;
            if (tpHit) {
                triggered = true;
                triggerPrice = tpPrice;
                triggerKind = 'profit';
            }
        }

        if (triggered) {
            // Apply slippage to the trigger price (closing side direction).
            const fillPrice = applySlippage(context, -matchingDir, triggerPrice);

            let qtyToClose = matchingQty;
            if (order.qty && order.qty > 0) qtyToClose = Math.min(order.qty, matchingQty);
            else if (order.qty_percent && order.qty_percent > 0) {
                qtyToClose = matchingQty * (order.qty_percent / 100);
            }

            closeMatching(context, order.from_entry, qtyToClose, fillPrice, currentTime, triggerKind);
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

    const finalConfig = { ...defaults, ...config };
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
    };
}
