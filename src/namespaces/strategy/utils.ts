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
    return price > referencePrice ? Math.ceil(ticks - EPS) * mintick : Math.floor(ticks + EPS) * mintick;
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
    return (Math.abs(qty) * price * pointValue * marginPct) / 100;
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
    for (const lot of ledgerOpenLots(strategy)) {
        const priceChange = lot.dir === 1 ? atPrice - lot.entry_price : lot.entry_price - atPrice;
        unrealized += priceChange * lot.qty * pointValue;
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
        const marginPct = dir === 1 ? (strategy.config.margin_long ?? 100) : (strategy.config.margin_short ?? 100);
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
        if (favNet > (trade.max_runup ?? 0)) trade.max_runup = favNet;
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
            const marginPct = direction === 1 ? (strategy.config.margin_long ?? 100) : (strategy.config.margin_short ?? 100);
            {
                const oldSize = strategy.position_size;
                const oldSign = Math.sign(oldSize);
                const isReversal = oldSign !== 0 && oldSign !== direction;
                const newOpenQty = isReversal ? Math.max(0, order.qty - Math.abs(oldSize)) : order.qty;

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
                                exitId: order.id,
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
        const limit =
            rules.max_drawdown.type === 'percent_of_equity' ? (rules.max_drawdown.value / 100) * strategy.equity_peak : rules.max_drawdown.value;
        if (strategy.max_drawdown >= limit) {
            strategy.risk_halted = true;
            return;
        }
    }
    if (rules.max_intraday_loss) {
        const limit =
            rules.max_intraday_loss.type === 'percent_of_equity'
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
        _bracket_entry: price,
        entry_bar_index: context.idx,
        entry_time: time,
        size: direction * qty, // SIGNED — matches Pine's closedtrades.size()
        commission: entryCommission,
        max_drawdown: 0,
        max_runup: 0,
        status: 'open',
    };

    strategy.opentrades.push(trade);

    // FIFO ledger-entry record for TV-style exit pairing (see
    // consumeLedger / closePartialPosition): TV's xlsx pairs exit fills
    // with entry records oldest-first, splitting at record boundaries.
    ((strategy as any)._ledger_entries ??= []).push({
        entry_id: entryId,
        entry_price: price,
        entry_time: time,
        entry_bar_index: context.idx,
        entry_comment: trade.entry_comment,
        qty,
        commission: entryCommission,
    });

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
    const lowPrice = Series.from(context.data.low).get(0);
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;

    let worstPrice = direction === 1 ? lowPrice : highPrice;
    let bestPrice = direction === 1 ? highPrice : lowPrice;
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
            if (tp !== undefined && tp < bestPrice) bestPrice = tp;
        } else {
            // Short: worst is high (cap downward by sl), best is low (cap upward by tp).
            if (sl !== undefined && sl < worstPrice) worstPrice = sl;
            if (tp !== undefined && tp > bestPrice) bestPrice = tp;
        }
    }

    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
    const adv = direction === 1 ? (price - worstPrice) * qty * pointValue : (worstPrice - price) * qty * pointValue;
    const fav = direction === 1 ? (bestPrice - price) * qty * pointValue : (price - bestPrice) * qty * pointValue;
    // Fold entry-leg commission into BOTH excursions: a trade is "down" by
    // the entry commission the moment it fills (so the adverse excursion
    // includes that cost), and the favorable excursion is the price gain NET
    // of that same cost (the trade has to overcome the commission first
    // before showing any runup). TV reports both metrics commission-netted.
    trade.max_drawdown = Math.max(0, adv) + entryCommission;
    trade.max_runup = Math.max(0, fav - entryCommission);

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
            exitId: order.id,
            exitComment: order.comment,
            isImplicitReversal: isReversal,
        });

        // If there is remaining quantity (reversal), open a new trade.
        // When the close leg consumed LESS than the order anticipated at
        // queue time (a deferred close-margin-call shrank the position
        // between queue and fill), the remaining qty exceeds the ordered
        // base size. TV books the intended base size and the overshoot as
        // TWO separate lots (each with its own exit bracket and ledger
        // row — xlsx 2021-10-02: longs 5 + 0.263108 at the same fill).
        if (remainingQty > 0) {
            const baseQty = (order as any)._base_qty;
            if (baseQty !== undefined && remainingQty > baseQty + 1e-9) {
                openTrade(context, order.id, direction, baseQty, fillPrice, fillTime, order.comment, /* isReversalOpen */ true);
                openTrade(context, order.id, direction, remainingQty - baseQty, fillPrice, fillTime, order.comment, /* isReversalOpen */ true);
            } else {
                openTrade(context, order.id, direction, remainingQty, fillPrice, fillTime, order.comment, /* isReversalOpen */ true);
            }
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

/**
 * Consume `qty` from the strategy's FIFO ledger-entry queue (records with
 * the closing lot's entry_id), splitting records at boundaries. Returns
 * the consumed slices (entry attributes + pro-rata entry commission).
 * Falls back to the physical lot's own attributes for any quantity the
 * queue cannot supply (hand-built test states have no queue records).
 */
function consumeLedger(
    strategy: StrategyState,
    physical: Trade,
    qty: number,
): Array<{ qty: number; entry_price: number; entry_time: number; entry_bar_index: number; entry_comment?: string; commission: number }> {
    const out: Array<{ qty: number; entry_price: number; entry_time: number; entry_bar_index: number; entry_comment?: string; commission: number }> =
        [];
    let need = qty;
    const queue: any[] = (strategy as any)._ledger_entries ?? [];
    for (const rec of queue) {
        if (need <= 1e-9) break;
        if (rec.entry_id !== physical.entry_id || rec.qty <= 1e-9) continue;
        const take = Math.min(rec.qty, need);
        const commShare = rec.qty > 0 ? rec.commission * (take / rec.qty) : 0;
        out.push({
            qty: take,
            entry_price: rec.entry_price,
            entry_time: rec.entry_time,
            entry_bar_index: rec.entry_bar_index,
            entry_comment: rec.entry_comment,
            commission: commShare,
        });
        rec.qty -= take;
        rec.commission -= commShare;
        need -= take;
    }
    (strategy as any)._ledger_entries = queue.filter((r) => r.qty > 1e-9);
    if (need > 1e-9) {
        const physQty = Math.abs(physical.size);
        out.push({
            qty: need,
            entry_price: physical.entry_price,
            entry_time: physical.entry_time,
            entry_bar_index: physical.entry_bar_index,
            entry_comment: physical.entry_comment,
            commission: physQty > 0 ? (physical.commission ?? 0) * (need / physQty) : 0,
        });
    }
    return out;
}

export function closePartialPosition(context: any, qtyToClose: number, exitPrice: number, exitTime: number, closeInfo?: CloseInfo): void {
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

        // TV LEDGER PAIRING: exit fills pair against a FIFO queue of ENTRY
        // RECORDS (per entry_id), SPLITTING at record boundaries — a fill
        // of 5 contracts can consume 4.74018 of the oldest unpaired entry
        // plus 0.25982 of the next, producing TWO ledger rows (TV xlsx
        // 2021-11-16). Physical lots (this loop) only drive position,
        // margin and bracket levels; the closed-trade ROWS and the
        // financial aggregates follow the ledger slices. `consumeLedger`
        // falls back to the physical lot's own attributes when no queue
        // records exist (hand-built tests).
        //
        // Per-row semantics preserved from the previous implementation:
        //   - netprofit increment = gross − exit-commission share (the
        //     entry leg was realized at fill), per the TV convention
        //     verified in the drawdown/margin QA sessions;
        //   - grossloss rollback of the entry-commission share;
        //   - SL/TP per-trade peak overrides (loss → max_runup = 0,
        //     profit → max_drawdown = entry commission share);
        //   - cash_per_order half-fee on implicit-reversal closes.
        const emitClosedRows = (qtyClosed: number) => {
            const commType = strategy.config.commission_type ?? 'percent';
            const halveFlat = closeInfo?.isImplicitReversal && commType === 'cash_per_order';
            const rawExitCommission = computeLegCommission(context, strategy, qtyClosed, exitPrice);
            const exitCommTotal = halveFlat ? rawExitCommission / 2 : rawExitCommission;

            const slices = consumeLedger(strategy, trade, qtyClosed);
            for (const s of slices) {
                const exitCommShare = exitCommTotal * (s.qty / qtyClosed);
                const priceChange = tradeDirection === 1 ? exitPrice - s.entry_price : s.entry_price - exitPrice;
                const gross = priceChange * s.qty * pointValue;

                const row: Trade = {
                    id: `trade_${strategy.opentrades.length + strategy.closedtrades.length + tradesToClose.length}`,
                    entry_id: trade.entry_id,
                    entry_comment: s.entry_comment,
                    entry_price: s.entry_price,
                    _bracket_entry: trade._bracket_entry,
                    entry_bar_index: s.entry_bar_index,
                    entry_time: s.entry_time,
                    size: tradeDirection * s.qty,
                    commission: s.commission + exitCommShare,
                    max_drawdown: trade.max_drawdown,
                    max_runup: trade.max_runup,
                    status: 'closed',
                    exit_price: exitPrice,
                    exit_bar_index: context.idx,
                    exit_time: exitTime,
                    exit_id: closeInfo?.exitId ?? trade.exit_id,
                    exit_comment: closeInfo?.exitComment ?? trade.exit_comment,
                    profit: gross - s.commission - exitCommShare,
                };
                if (closeInfo?.triggerKind === 'loss') row.max_runup = 0;
                if (closeInfo?.triggerKind === 'profit') row.max_drawdown = s.commission;

                strategy.netprofit += gross - exitCommShare;
                strategy.grossloss -= s.commission;
                if (row.profit! > 0) {
                    strategy.grossprofit += row.profit!;
                    strategy.wintrades++;
                    strategy.wintrades_total_profit += row.profit!;
                } else if (row.profit! < 0) {
                    strategy.grossloss += Math.abs(row.profit!);
                    strategy.losstrades++;
                    strategy.losstrades_total_loss += Math.abs(row.profit!);
                } else {
                    strategy.eventrades++;
                }
                strategy.closedtrades.push(row);
            }
        };

        // Epsilon on the full-close decision: when the requested qty is a
        // float hair short of the trade's size (fractional margin-call
        // remainders), treat it as a full close instead of leaving a
        // ~1e-15 ghost portion open.
        if (qtyClosing >= tradeQty - 1e-9) {
            // Fully close this physical lot.
            trade.status = 'closed';
            trade.exit_price = exitPrice;
            trade.exit_bar_index = context.idx;
            trade.exit_time = exitTime;
            emitClosedRows(tradeQty);
            remainingQty -= qtyClosing;
        } else {
            // Partially close this physical lot — emit ledger rows for the
            // closed quantity, keep the remainder open with its residual
            // PHYSICAL entry-commission share (used by the equity-peak
            // basis and margin checks).
            emitClosedRows(qtyClosing);
            const entryCommissionShare = (trade.commission ?? 0) * (qtyClosing / tradeQty);

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
    let newSize = currentSize - sizeReduction;

    // Epsilon-snap to flat: fractional quantities (margin-call partial
    // liquidations) leave float residuals (~1e-15) when the position fully
    // unwinds. An exact `=== 0` check then misses the flatten, leaving
    // position_avg_price alive on a ghost position — the script captures
    // stale TP/SL prices from it and the next entry gets phantom-exited at
    // its own entry price (QA pyramiding xlsx, 2021-11-09 BTCUSDC).
    if (Math.abs(newSize) < 1e-9) newSize = 0;

    strategy.position_size = newSize;
    updateMaxContractsHeld(strategy);

    if (newSize === 0) {
        strategy.position_avg_price = NaN;
        strategy.position_entry_name = '';
    } else if (strategy.opentrades.length > 0) {
        // Recompute average entry price from the remaining open book
        // (LEDGER view — see ledgerOpenLots). Crucial because closing
        // older entries (FIFO pairing) changes the weighted average if
        // the position was built from multiple entries at different
        // prices.
        let totalCost = 0;
        let totalQty = 0;
        for (const t of ledgerOpenLots(strategy)) {
            totalCost += t.qty * t.entry_price;
            totalQty += t.qty;
        }
        strategy.position_avg_price = totalCost / totalQty;
        // position_entry_name keeps pointing at whichever entry opened the
        // first still-open trade
        strategy.position_entry_name = strategy.opentrades[0].entry_id;
    }
}

/**
 * The open book in LEDGER view: the FIFO entry records not yet paired
 * with exit fills. ALL equity-side computations (unrealized PnL, average
 * entry, open entry commissions) must use this view so they stay
 * consistent with `netprofit`, whose increments follow the ledger slices
 * — TV's equity is fully ledger-based, and mixing ledger-realized with
 * physical-unrealized breaks total-equity invariance whenever exit
 * pairing crosses lot boundaries. Falls back to the physical lots when
 * no records exist (hand-built test states).
 */
function ledgerOpenLots(strategy: StrategyState): Array<{ qty: number; entry_price: number; commission: number; dir: number }> {
    const records: any[] = (strategy as any)._ledger_entries ?? [];
    const dir = Math.sign(strategy.position_size) || 1;
    if (records.length > 0) {
        return records.map((r) => ({ qty: r.qty, entry_price: r.entry_price, commission: r.commission, dir }));
    }
    return strategy.opentrades.map((t) => ({
        qty: Math.abs(t.size),
        entry_price: t.entry_price,
        commission: t.commission ?? 0,
        dir: Math.sign(t.size),
    }));
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
    for (const lot of ledgerOpenLots(strategy)) {
        const priceChange = lot.dir === 1 ? currentPrice - lot.entry_price : lot.entry_price - currentPrice;
        unrealizedPnL += priceChange * lot.qty * pointValue;
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

    // Open-book entry commissions (already deducted from netprofit at
    // fill) — LEDGER view, consistent with netprofit's slice increments.
    let openCommission = 0;
    for (const lot of ledgerOpenLots(strategy)) openCommission += lot.commission;

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
    if (peakBasis > strategy.equity_peak) strategy.equity_peak = peakBasis;
    if (realizedEquity < strategy.equity_trough) strategy.equity_trough = realizedEquity;

    const posSize = strategy.position_size;
    const avgPrice = strategy.position_avg_price;

    let worstExcursion = 0;
    let bestExcursion = 0;
    if (posSize !== 0 && Number.isFinite(avgPrice)) {
        const worstPrice = posSize > 0 ? lowPrice : highPrice;
        const bestPrice = posSize > 0 ? highPrice : lowPrice;
        // posSize * (avg - worstPrice) is always >= 0 (a loss); same for gain.
        // Multiplied by pointValue to convert price units → account currency.
        worstExcursion = posSize * (avgPrice - worstPrice) * pointValue;
        bestExcursion = posSize * (bestPrice - avgPrice) * pointValue;
    }

    // Drawdown = realized gap from the high-water + the open position's
    // intra-bar adverse excursion. No commission correction here: the peak
    // basis already excludes open entry commissions (see above) while
    // realizedEquity includes them — the asymmetry IS TV's model.
    const drawDown = strategy.equity_peak - realizedEquity + worstExcursion;
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

    const runUp = realizedEquity - strategy.equity_trough + bestExcursion;
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
    specificTradeId?: string,
): void {
    const strategy: StrategyState = context.strategy;

    // Per-LOT close (exit brackets): TV binds each bracket to the physical
    // entry lot whose entry price computed its level — the fill closes
    // THAT lot, not the oldest. FIFO entry/exit pairing for the ledger is
    // handled inside closePartialPosition (see the ledger-swap there).
    if (specificTradeId !== undefined) {
        const target: Trade[] = [];
        const others: Trade[] = [];
        for (const t of strategy.opentrades) {
            if (t.id === specificTradeId) target.push(t);
            else others.push(t);
        }
        if (target.length === 0) return;
        const targetQty = Math.abs(target[0].size);
        strategy.opentrades = [...target, ...others];
        closePartialPosition(context, Math.min(qtyToClose, targetQty), exitPrice, exitTime, closeInfo);
        return;
    }

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
export function processExitOrders(context: any, phase: 'open' | 'intrabar' = 'intrabar'): void {
    if (!context.strategy) return;
    const strategy: StrategyState = context.strategy;
    if (strategy.pending_orders.length === 0) return;

    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    const mintick = context.pine?.syminfo?.mintick ?? 0.01;

    // Two-phase evaluation (TV broker-emulator order precedence at the
    // bar's open):
    //   phase 'open'     — runs BEFORE entry fills. Only conditional-exit
    //                      GAP-FILLS execute (the bar opened already past a
    //                      bracket's trigger → fill at the open). Brackets
    //                      consumed here never extend to entries filling at
    //                      the same open.
    //   phase 'intrabar' — runs AFTER entry fills. Everything else:
    //                      market closes, intra-bar crossings, trail, and
    //                      gap-fills for trades that ATTACHED at this bar's
    //                      open (an exit order waiting on a not-yet-filled
    //                      entry brackets it at fill time — if the open is
    //                      already past the trigger it exits immediately).
    //
    // QA evidence (pyramiding avg_price xlsx, BTCUSDC 1D): a stop
    // gap-firing at the open closes ONLY the prior stack — the pyramid
    // entry filling at that same open survives (2024-03-21); while an exit
    // order surviving to intra-bar crossing closes same-bar entries too
    // (2020-12-17), and a waiting order attaches to a reversal entry and
    // gap-exits it at its own fill price (2021-09-08).
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
        let matching = strategy.opentrades.filter((t) => !order.from_entry || t.entry_id === order.from_entry);
        if (order._intended_trade_ids) {
            const snapshot = new Set(order._intended_trade_ids);
            matching = matching.filter((t) => snapshot.has(t.id));
        }
        if (matching.length === 0) {
            // Nothing to exit. In the pre-entry phase the order may be
            // WAITING on an entry that fills at this bar's open (TV: exit
            // orders placed before their entry wait for it) — leave it
            // pending. After entries have filled (intrabar phase), an
            // exit with no matching trades is dead — clear it.
            if (phase === 'intrabar') order.status = 'cancelled';
            continue;
        }

        const matchingQty = matching.reduce((sum, t) => sum + Math.abs(t.size), 0);
        const matchingDir = Math.sign(matching[0].size); // direction of the position to close

        // ---- Market exits from close() / close_all() ----
        if (
            order.type === 'market' &&
            order.profit === undefined &&
            order.loss === undefined &&
            order.limit === undefined &&
            order.stop === undefined &&
            order.trail_price === undefined &&
            order.trail_points === undefined
        ) {
            // Market closes fill in the intrabar phase (after entries) —
            // their interplay with reversal entries is governed by the
            // _intended_trade_ids snapshot above.
            if (phase === 'open') continue;
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
                exitId: order.id,
                exitComment: order.comment,
            });
            order.status = 'filled';
            order.fill_price = fillPrice;
            order.fill_bar = context.idx;
            order.fill_time = currentTime;
            continue;
        }

        // ---- Conditional exits from exit() ----
        // PER-TRADE exit brackets (TV broker-emulator semantics): when a
        // strategy.exit matches multiple open trades (pyramiding), TV
        // creates an independent exit bracket for EACH trade:
        //   - profit / loss (tick) legs compute the trigger from THAT
        //     trade's own entry price;
        //   - limit / stop (absolute price) legs are shared by all trades.
        // When several brackets trigger inside one bar, the fills execute
        // in intra-bar crossing order and each fill closes the OLDEST
        // remaining trades first (FIFO) — NOT necessarily the trade whose
        // bracket computed the level. Verified against the QA pyramiding
        // xlsx (BTCUSDC 1D, 2020-03-12 crash bar: five short TPs filled
        // at five different prices, assigned to trades strictly
        // oldest-first).
        //
        // Trailing legs stay COMPOSITE (one armed peak per order, armed
        // against the weighted-avg entry) — no TV evidence for per-trade
        // trail under pyramiding yet; single-trade behavior is identical
        // either way.
        let totalCost = 0;
        for (const t of matching) totalCost += Math.abs(t.size) * t.entry_price;
        const avgEntry = totalCost / matchingQty;
        const isLong = matchingDir === 1;

        // Shared absolute legs (validated below); per-trade tick legs are
        // computed inside the bracket loop further down.
        let absTp: number | undefined = order.limit;
        let absSl: number | undefined = order.stop;

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
            if (absSl !== undefined) {
                const slValid = isLong ? absSl < avgEntry : absSl > avgEntry;
                if (!slValid) absSl = undefined;
            }
            if (absTp !== undefined) {
                const tpValid = isLong ? absTp > avgEntry : absTp < avgEntry;
                if (!tpValid) absTp = undefined;
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
            if (order.limit !== undefined) absTp = undefined;
            if (order.stop !== undefined) absSl = undefined;
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
        // Trail arming + evaluation are intra-bar phenomena — they run in
        // the 'intrabar' phase only (arming twice per bar would corrupt
        // trailArmedThisBar, making the segment model treat the arming bar
        // as an armed-prior bar).
        let trailArmedThisBar = false;
        if (phase === 'intrabar' && !order.trail_armed && (order.trail_price !== undefined || order.trail_points !== undefined)) {
            let armPrice: number | undefined;
            if (order.trail_price !== undefined) armPrice = order.trail_price;
            else if (order.trail_points !== undefined) {
                armPrice = isLong ? avgEntry + order.trail_points * mintick : avgEntry - order.trail_points * mintick;
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

        // Per-trade bracket evaluation. Each triggered bracket becomes a
        // fill EVENT; events execute in intra-bar crossing order, and each
        // closes the oldest remaining matching trades first (FIFO).
        //
        // Gap-fill rule: if the bar's OPEN is already past a trigger, the
        // fill price is the OPEN, not the literal trigger price. This
        // mirrors real broker behavior — if you'd planned a stop at $100
        // and the bar opens at $95, you fill at $95.
        type FillEvent = { qty: number; price: number; kind: 'profit' | 'loss' | 'trailing'; tradeId?: string };
        const tpEvents: FillEvent[] = [];
        const slEvents: FillEvent[] = [];

        // Margin-call bracket lock: after a same-bar margin call, only the
        // bracket of the lot the MC partially consumed stays working for
        // the rest of the bar — the other lots' brackets are canceled and
        // re-created by the next strategy.exit call (see processMarginCall
        // for the QA evidence).
        const mcLock = (strategy as any)._mc_exit_lock;
        const mcLocked = mcLock && mcLock.bar === context.idx;

        for (const t of matching) {
            if (mcLocked && t.id !== mcLock.tradeId) continue;
            // Tick legs compute from the lot's PHYSICAL entry — immutable
            // under FIFO ledger pairing (see closePartialPosition).
            const entry = t._bracket_entry ?? t.entry_price;
            const tQty = Math.abs(t.size);
            let tp = absTp;
            if (tp === undefined && order.profit !== undefined) {
                tp = isLong ? entry + order.profit * mintick : entry - order.profit * mintick;
            }
            let sl = absSl;
            if (sl === undefined && order.loss !== undefined) {
                sl = isLong ? entry - order.loss * mintick : entry + order.loss * mintick;
            }

            // In the pre-entry 'open' phase only GAP conditions count (the
            // bar opened already past the trigger); intra-bar crossings
            // belong to the 'intrabar' phase.
            const tpHit =
                tp !== undefined && (phase === 'open' ? (isLong ? openPrice >= tp : openPrice <= tp) : isLong ? highPrice >= tp : lowPrice <= tp);
            const slHit =
                sl !== undefined && (phase === 'open' ? (isLong ? openPrice <= sl : openPrice >= sl) : isLong ? lowPrice <= sl : highPrice >= sl);

            // OCO per trade: when both legs are reachable within the bar,
            // the leg crossed FIRST along the assumed intra-bar path wins
            // (favorable-first → TP, adverse-first → SL).
            let kind: 'profit' | 'loss' | null = null;
            if (tpHit && slHit) kind = favorableFirst ? 'profit' : 'loss';
            else if (tpHit) kind = 'profit';
            else if (slHit) kind = 'loss';

            if (kind === 'loss') {
                const openPastSl = isLong ? openPrice <= (sl as number) : openPrice >= (sl as number);
                // TV asymmetry (637-event census from the gap_precedence
                // probe, BTCUSDT 1D): a BUY-stop — the SL leg of a SHORT
                // position — that is already in-the-money at the open does
                // NOT catch a trade that entered at that same open
                // (spared 234/234), while sell-stops and both-side limits
                // always catch (403/403). Suppress the stop leg for
                // same-bar short entries gapped past at the open; the TP
                // leg (if also reachable) still applies.
                const buyStopSparesFreshEntry = !isLong && openPastSl && t.entry_bar_index === context.idx;
                if (!buyStopSparesFreshEntry) {
                    slEvents.push({ qty: tQty, price: openPastSl ? openPrice : (sl as number), kind: 'loss', tradeId: t.id });
                } else if (tpHit) {
                    kind = 'profit';
                }
            }
            if (kind === 'profit') {
                const openPastTp = isLong ? openPrice >= (tp as number) : openPrice <= (tp as number);
                tpEvents.push({ qty: tQty, price: openPastTp ? openPrice : (tp as number), kind: 'profit', tradeId: t.id });
            }
        }

        // Crossing order within each leg: the TP leg is crossed while
        // price travels toward the FAVORABLE extreme (ascending prices for
        // a long, descending for a short); the SL leg while traveling
        // toward the ADVERSE extreme (the reverse). Gap-fills carry
        // price = open and naturally sort to the front of their leg.
        tpEvents.sort((a, b) => (isLong ? a.price - b.price : b.price - a.price));
        slEvents.sort((a, b) => (isLong ? b.price - a.price : a.price - b.price));
        // Composite trailing leg — same intra-bar segment model as before
        // (TV broker emulator), emitting an event for the REMAINING qty
        // instead of firing directly:
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
        let trailEvent: FillEvent | null = null;
        if (phase === 'intrabar' && !mcLocked && order.trail_armed && order.trail_offset !== undefined) {
            const updatePeak = () => {
                if (isLong) order.trail_peak = Math.max(order.trail_peak ?? -Infinity, highPrice);
                else order.trail_peak = Math.min(order.trail_peak ?? Infinity, lowPrice);
            };
            const triggerFromPeak = (): number =>
                isLong
                    ? (order.trail_peak as number) - (order.trail_offset as number) * mintick
                    : (order.trail_peak as number) + (order.trail_offset as number) * mintick;
            const emitTrail = (price: number) => {
                trailEvent = { qty: Infinity, price, kind: 'trailing' };
            };

            if (trailArmedThisBar) {
                // Peak is already the bar's favorable extreme (set by the
                // arming logic). Don't update again.
                const trig = triggerFromPeak();
                if (favorableFirst) {
                    // Phase 2 (favorable extreme → adverse extreme): low for
                    // long / high for short crosses trigger.
                    const hit = isLong ? lowPrice <= trig : highPrice >= trig;
                    if (hit) emitTrail(trig);
                } else {
                    // Phase 3 (favorable extreme → close): close past trigger.
                    const seg3 = isLong ? closePrice <= trig : closePrice >= trig;
                    if (seg3) emitTrail(trig);
                }
            } else if (favorableFirst) {
                // Already armed in a prior bar. Full segment model.
                updatePeak();
                const trig = triggerFromPeak();
                const hit = isLong ? lowPrice <= trig : highPrice >= trig;
                if (hit) emitTrail(trig);
            } else {
                const oldTrig = triggerFromPeak();
                const seg1 = isLong ? lowPrice <= oldTrig : highPrice >= oldTrig;
                if (seg1) {
                    emitTrail(oldTrig);
                } else {
                    updatePeak();
                    const newTrig = triggerFromPeak();
                    const seg3 = isLong ? closePrice <= newTrig : closePrice >= newTrig;
                    if (seg3) emitTrail(newTrig);
                }
            }
        }

        // Path-ordered event list (mirrors the old checkTp/checkSl/
        // checkTrail priority: TP leg first on favorable-first bars;
        // SL then trail then TP on adverse-first bars).
        const events: FillEvent[] = favorableFirst
            ? [...tpEvents, ...slEvents, ...(trailEvent ? [trailEvent] : [])]
            : [...slEvents, ...(trailEvent ? [trailEvent] : []), ...tpEvents];

        if (events.length > 0) {
            // qty / qty_percent caps apply to the TOTAL closed by this order.
            let capRemaining = matchingQty;
            if (order.qty && order.qty > 0) capRemaining = Math.min(order.qty, matchingQty);
            else if (order.qty_percent && order.qty_percent > 0) {
                capRemaining = matchingQty * (order.qty_percent / 100);
            }

            const remainingMatchingQty = () =>
                strategy.opentrades.filter((t) => !order.from_entry || t.entry_id === order.from_entry).reduce((sum, t) => sum + Math.abs(t.size), 0);

            let lastFill = NaN;
            let closedAny = false;
            for (const ev of events) {
                if (capRemaining <= 1e-9) break;
                const remaining = remainingMatchingQty();
                if (remaining <= 1e-9) break;
                const qtyThis = Math.min(ev.qty === Infinity ? remaining : ev.qty, capRemaining, remaining);
                // Apply slippage to the trigger price (closing side direction).
                const fillPrice = applySlippage(context, -matchingDir, ev.price);

                // Resolve which per-leg comment to stamp on the closed
                // trade. strategy.exit() exposes comment_profit /
                // comment_loss / comment_trailing — each fires only when
                // its leg triggers. Fall back to the generic `comment`.
                const legComment =
                    ev.kind === 'profit'
                        ? (order.comment_profit ?? order.comment)
                        : ev.kind === 'loss'
                          ? (order.comment_loss ?? order.comment)
                          : (order.comment_trailing ?? order.comment);

                // Bracket fills close their SOURCE lot (per-lot binding);
                // the trail event has no source lot and closes FIFO.
                closeMatching(
                    context,
                    order.from_entry,
                    qtyThis,
                    fillPrice,
                    currentTime,
                    {
                        triggerKind: ev.kind,
                        exitId: order.id,
                        exitComment: legComment,
                    },
                    ev.tradeId,
                );
                capRemaining -= qtyThis;
                lastFill = fillPrice;
                closedAny = true;
            }

            // The order is consumed when nothing matching remains open or
            // its qty cap is exhausted; otherwise it stays pending so the
            // surviving trades' brackets remain active on later bars (TV
            // brackets persist until filled or replaced).
            if (closedAny && (remainingMatchingQty() <= 1e-9 || capRemaining <= 1e-9)) {
                order.status = 'filled';
                order.fill_price = lastFill;
                order.fill_bar = context.idx;
                order.fill_time = currentTime;
            }
        }
    }

    // Remove filled/cancelled exit orders.
    strategy.pending_orders = strategy.pending_orders.filter((o) => o.status === 'pending');

    // Refresh equity for any caller reading metrics between processExitOrders
    // and the bar-finalize step. Peaks are latched in finalizeBar().
    markToMarket(context, closePrice);
}

/**
 * Apply a SECOND margin call scheduled by the phantom re-check (see
 * processMarginCall). TV books that fill at the PREVIOUS bar's close,
 * AFTER the script's on-close evaluation — so the script and any order
 * it queued saw the pre-MC#2 position. PineTS mirrors this by booking
 * the fill at the very start of the NEXT bar, before entries process:
 * a reversal queued at the MC bar's close (qty frozen at queue time)
 * then naturally overshoots by exactly q2, reproducing TV's phantom
 * opposite-side position (xlsx-confirmed: 2021-10-02 reversal long
 * 5.263108 = 5 + 0.263108).
 *
 * Same-direction (non-reversal) entries queued on the MC bar are
 * CANCELED — TV's transient post-MC state rejects them (2022-04-19: the
 * add queued at the 04-18 close never filled; the next add was accepted
 * a bar later). Opposite-direction reversals are unaffected (E1), and a
 * close-MC that flattens the position leaves nothing to gate (IC=900k
 * experiment: next-open entry from flat was admitted).
 */
export function applyPendingCloseMarginCall(context: any): void {
    const strategy: StrategyState = context.strategy;
    if (!strategy) return;
    const pending = (strategy as any)._pending_close_mc;
    if (!pending) return;
    (strategy as any)._pending_close_mc = null;

    if (strategy.opentrades.length === 0 || Math.sign(strategy.position_size) !== pending.dir) return;

    closePartialPosition(context, Math.min(pending.qty, Math.abs(strategy.position_size)), pending.price, pending.time, {
        exitId: 'Margin call',
        exitComment: 'Margin call',
    });

    if (Math.abs(strategy.position_size) > 1e-9) {
        for (const o of strategy.pending_orders) {
            if (o.status === 'pending' && (o.category ?? 'entry') === 'entry' && !o._isReversalEntry && parseDirection(o.direction) === pending.dir) {
                o.status = 'cancelled';
            }
        }
        strategy.pending_orders = strategy.pending_orders.filter((o) => o.status === 'pending');
    }
}

/**
 * True when the bar's first intra-bar move is ADVERSE for the current
 * position (TV broker-emulator path assumption: open closer to high →
 * open→high→low→close; open closer to low → open→low→high→close).
 * Used to path-order the margin-call checkpoint against exit fills.
 */
export function isAdverseFirstBar(context: any): boolean {
    const strategy: StrategyState = context.strategy;
    const dir = Math.sign(strategy?.position_size ?? 0);
    if (dir === 0) return false;
    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const openCloserToHigh = Math.abs(highPrice - openPrice) <= Math.abs(openPrice - lowPrice);
    return dir === 1 ? !openCloserToHigh : openCloserToHigh;
}

/**
 * Margin-call check (TV broker emulator) at one of two intra-bar
 * CHECKPOINTS along the assumed price path:
 *
 *   'open'    — right after entries fill at the bar's open: equity and
 *               required margin evaluated AT THE OPEN, liquidation fills
 *               at the open price.
 *   'extreme' — at the bar's adverse extreme (low for longs, high for
 *               shorts), liquidation fills at the extreme itself — the
 *               pessimistic broker model (intra-bar tick order unknown).
 *   'close'   — at the bar's close, after all exits: if the (possibly
 *               already-trimmed) position still breaches at the closing
 *               price, another partial liquidation fills at the close.
 *               Evidence: 2021-10-01 (profit QA) shows TWO same-bar MC
 *               prices — 4×cover at the high, then a further 0.263108
 *               at 48,147.38 (the close).
 *
 * TV checks margin along the path, interleaved with exit fills — proven
 * by the MC-ordering probe (BTCUSDT 1D, 2026-02-05): a 5-lot short
 * entered at the open was split within one bar into MC 0.00228 at the
 * OPEN price, MC 0.0888 at the high, then a TP fill of 4.90892 at the
 * lows. The caller orders the 'extreme' checkpoint BEFORE exit
 * processing on adverse-first bars and AFTER it on favorable-first bars
 * (favorable exits free margin before the adverse extreme is reached).
 *
 * Runs for ALL margin percentages including 100%. At 100% margin the
 * trader still needs full notional collateral; adverse price movement
 * that drops account equity below the position's current notional
 * triggers a margin call. This matches TV's broker-emulator behavior
 * (the "Margin calls" stat in the Strategy Tester is non-zero on 100%
 * margin runs whenever a position's mark-to-market loss exceeds equity).
 */
export function processMarginCall(context: any, checkpoint: 'open' | 'extreme' | 'close' = 'extreme'): void {
    const strategy: StrategyState = context.strategy;
    if (!strategy || strategy.opentrades.length === 0) return;

    const positionDir = Math.sign(strategy.position_size);
    if (positionDir === 0) return;

    const marginPct = positionDir === 1 ? (strategy.config.margin_long ?? 100) : (strategy.config.margin_short ?? 100);

    const openPrice = Series.from(context.data.open).get(0);
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    const currentTime = Series.from(context.data.openTime).get(0);
    const pointValue = context.pine?.syminfo?.pointvalue ?? 1;

    const adversePrice = checkpoint === 'open' ? openPrice : checkpoint === 'close' ? closePrice : positionDir === 1 ? lowPrice : highPrice;
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
        // Full-precision cover — no truncation. Verified against the
        // commission-0 margin oracle (BTCUSDC weekly) where TV's
        // liquidation qty matches PT's untruncated 4× cover exactly, and
        // against the BTCUSDC avg_price QA xlsx (TV qty 3.602232 ≈ 7
        // significant digits). An earlier 5-decimal floor was overfit to
        // the BTCUSDT margin_calls xlsx where TV's exported quantities
        // (1.21312, 0.48244) are 7-significant-digit values with trailing
        // zeros trimmed; the residual there (~$1 equity-basis opacity
        // inside TV) is sub-dollar on a $530k net and accepted.
        //
        // The marginPct/100 divisor matters below 100%: TV liquidates
        // 4×deficit/(price·m) — verified exactly on fresh TV captures at
        // margin_long/short = 50 (close-MC investigation, 2026-06-12).
        const marginFrac = marginPct / 100;
        const coverQty = deficit / (adversePrice * pointValue * marginFrac);
        const qtyToLiquidate = Math.min(totalQty, 4 * coverQty);

        // Remember the FIFO order before the close so we can identify the
        // PARTIALLY-consumed lot afterwards (the liquidation eats whole
        // lots from the front; the first lot still open afterwards is the
        // one it bit into).
        const fifoBefore = [...strategy.opentrades];
        const frontPiece = fifoBefore[0];
        const frontQty = Math.abs(frontPiece.size);
        const frontEntry = frontPiece.entry_price;

        closePartialPosition(context, qtyToLiquidate, adversePrice, currentTime, {
            exitId: 'Margin call',
            exitComment: 'Margin call',
        });

        // ---- Phantom re-check → SECOND margin call at the bar's CLOSE ----
        // TV broker-emulator behavior (reverse-engineered 2026-06-12,
        // exact on 6 TV-captured events incl. margin=50% and full-cap
        // variants; 122+ negative controls): when the margin call closed
        // the FIRST (oldest) FIFO piece ENTIRELY, TV re-evaluates the
        // margin condition in a transient state where that piece's margin
        // is freed and its unrealized PnL removed from equity, but its
        // realized PnL has NOT yet been booked. The residual deficit is
        //   D2 = D1 − p1·(p·m·pv) + u1,   u1 = p1·(p − e1)·dir·pv
        // (p1/e1 = first piece qty/entry, p = the adverse checkpoint
        // price, dir = +1 long / −1 short). If D2 > 0, a second margin
        // call q2 = min(remaining, 4·trunc6(D2/(p·m·pv))) fires — FILLED
        // AT THE BAR'S CLOSE and booked AFTER the script's on-close
        // evaluation, so the script (and any order it queues this bar)
        // still sees the pre-MC#2 position. A reversal queued at that
        // close therefore overshoots by exactly q2 on the next bar (TV
        // xlsx 2021-10-02: reversal long 5.263108 = 5 + q2). Application
        // is deferred to the start of the next bar via
        // `_pending_close_mc` (see applyPendingCloseMarginCall).
        //
        // Single-piece margin calls can never fire this (D2 < 0
        // algebraically) — only calls that consume the whole front piece
        // and span into deeper lots qualify, and even then rarely.
        if (checkpoint === 'extreme' && qtyToLiquidate >= frontQty - 1e-9 && Math.abs(strategy.position_size) > 1e-9) {
            const freedMargin = computeRequiredMargin(frontQty, adversePrice, marginPct, pointValue);
            const u1 = frontQty * (adversePrice - frontEntry) * positionDir * pointValue;
            const d2 = deficit - freedMargin + u1;
            if (d2 > 0) {
                const closeP = Series.from(context.data.close).get(0);
                const trunc6 = (x: number) => Math.trunc(x * 1e6) / 1e6;
                const cover2 = trunc6(d2 / (adversePrice * pointValue * marginFrac));
                const q2 = Math.min(Math.abs(strategy.position_size), 4 * cover2);
                if (q2 > 1e-9) {
                    (strategy as any)._pending_close_mc = {
                        qty: q2,
                        price: closeP,
                        time: currentTime,
                        dir: positionDir,
                    };
                }
            }
        }

        // TV broker-emulator rule (QA evidence): a margin call CANCELS all
        // working exit brackets for the rest of the bar EXCEPT the bracket
        // of the lot it partially consumed. The canceled lots get fresh
        // brackets from the next strategy.exit call (next bar).
        // Evidence: 2024-08-03 (avg_price QA) — after MC 0.59552 at the
        // high, the shared TP at 59,954 filled ONLY the touched lot's
        // remainder 4.40448; the other covered lot exited next day at the
        // refreshed level. Same split on 2021-05-16 (profit QA: only the
        // MC-touched lot's TP filled same-bar, untouched lots filled next
        // day at their own levels) and on the MC-probe triple bar
        // 2026-02-05 (the only lot was the touched one → its TP filled).
        const survivor = fifoBefore.find((t) => t.status === 'open');
        (strategy as any)._mc_exit_lock = { bar: context.idx, tradeId: survivor?.id ?? null };
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
    const strategy: StrategyState = context.strategy;
    const highPrice = Series.from(context.data.high).get(0);
    const lowPrice = Series.from(context.data.low).get(0);
    const closePrice = Series.from(context.data.close).get(0);
    markToMarket(context, closePrice);
    updateEquityPeaks(context, highPrice, lowPrice);

    // Record the MARK-TO-MARKET equity at each calendar month's last bar,
    // for the end-of-run Sharpe / Sortino ratios (see
    // finalizeStrategyRun). TV samples the equity curve monthly regardless
    // of the chart timeframe; we keep the last bar's equity per UTC
    // calendar month (overwrite within a month, append on rollover).
    const barTime = Series.from(context.data.openTime).get(0);
    if (Number.isFinite(barTime)) {
        const d = new Date(barTime);
        const monthKey = d.getUTCFullYear() * 12 + d.getUTCMonth();
        const series = (strategy._monthly_equity ??= []);
        if (strategy._last_month_key === monthKey && series.length > 0) {
            series[series.length - 1] = strategy.equity;
        } else {
            series.push(strategy.equity);
            strategy._last_month_key = monthKey;
        }
    }
}

/**
 * End-of-run finalize: compute the risk-adjusted performance ratios
 * (Sharpe / Sortino) from the monthly equity curve captured during the
 * run. Called ONCE after the last bar (see PineTS.class.ts).
 *
 * TV broker-emulator formula (confirmed against the Help Center docs and
 * reverse-engineered to the third decimal across 7 QA datasets,
 * 2026-06-15):
 *   - Sample the MARK-TO-MARKET equity at each calendar month's close.
 *   - Monthly simple returns rᵢ = Eᵢ / Eᵢ₋₁ − 1, anchored at the initial
 *     capital (the first return runs from initial_capital to month 1).
 *   - MR = mean(rᵢ);  RFR = risk_free_rate / 100 / 12 (annual % → monthly).
 *   - Sharpe  = (MR − RFR) / SD,  SD = √(Σ(rᵢ − MR)² / N)   (population).
 *   - Sortino = (MR − RFR) / DD,  DD = √(Σ min(0, rᵢ − RFR)² / N)
 *     (downside deviation over ALL N returns, target = RFR — per TV's
 *     documented DD = sqrt(sum(min(0, Xᵢ − T))² / N)).
 *   - No annualization.
 *
 * Note: the ratios are only as accurate as the bar-by-bar equity path;
 * they ride on the strategy engine's mark-to-market fidelity. With < 2
 * monthly returns (very short backtests) they are left at 0.
 */
export function finalizeStrategyRun(context: any): void {
    const strategy: StrategyState = context?.strategy;
    if (!strategy) return;

    // CAGR is independent of the monthly equity curve (it only needs the
    // first/last bar times and the realized P&L), so compute it before the
    // Sharpe / Sortino short-circuit below.
    strategy.cagr = computeCagr(context);

    const series = strategy._monthly_equity ?? [];
    const equities = [strategy.initial_capital, ...series];
    const returns: number[] = [];
    for (let i = 1; i < equities.length; i++) {
        const prev = equities[i - 1];
        if (prev !== 0 && Number.isFinite(prev) && Number.isFinite(equities[i])) {
            returns.push(equities[i] / prev - 1);
        }
    }

    if (returns.length < 2) {
        strategy.sharpe_ratio = 0;
        strategy.sortino_ratio = 0;
        return;
    }

    const rfrMonthly = (strategy.config.risk_free_rate ?? 2) / 100 / 12;
    const n = returns.length;
    const mean = returns.reduce((s, r) => s + r, 0) / n;
    const excess = mean - rfrMonthly;

    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);

    const downsideSq = returns.reduce((s, r) => s + Math.min(0, r - rfrMonthly) ** 2, 0) / n;
    const dd = Math.sqrt(downsideSq);

    strategy.sharpe_ratio = sd > 0 ? excess / sd : 0;
    strategy.sortino_ratio = dd > 0 ? excess / dd : 0;
}

/**
 * Compound Annual Growth Rate (%) of strategy equity over the full backtest
 * window. Mirrors the LuxAlgo `cagr()` Pine helper applied to the strategy
 * leg: entry = (firstBarTime, initial_capital), exit = (lastBarTime,
 * initial_capital + netprofit).
*
*   daysBetween = (lastBarTime − firstBarTime) / MS_IN_ONE_DAY
*   years       = daysBetween / 365
*   CAGR%       = 100 × ((exit / entry) ^ (1 / years) − 1)
*
* The window spans the FIRST to the LAST loaded bar's open time (Pine's
* `var int firstTime = time` latched on bar 0, and `last_bar_time`). With a
* span under one day, or non-finite capital figures, the result is NaN —
* matching the Pine helper's `na` branch.
*/
const MS_IN_ONE_DAY = 24 * 60 * 60 * 1000;

function computeCagr(context: any): number {
    const strategy: StrategyState = context?.strategy;
    if (!strategy) return NaN;

    const candles = context?.marketData;
    if (!Array.isArray(candles) || candles.length === 0) return NaN;

    const firstTime = candles[0]?.openTime;
    const lastTime = candles[candles.length - 1]?.openTime;
    if (!Number.isFinite(firstTime) || !Number.isFinite(lastTime)) return NaN;

    const entryPrice = strategy.initial_capital ?? 0;
    const exitPrice = entryPrice + (strategy.netprofit ?? 0);
    const daysBetween = (lastTime - firstTime) / MS_IN_ONE_DAY;
    if (daysBetween < 1 || !Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || entryPrice === 0) {
        return NaN;
    }

    const years = daysBetween / 365;
    return 100 * (Math.pow(exitPrice / entryPrice, 1 / years) - 1);
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
        position_avg_price: NaN, // Pine returns NaN when flat
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

        // Risk-adjusted ratios (computed at end-of-run) + their internal
        // monthly-equity accumulator.
        sharpe_ratio: 0,
        sortino_ratio: 0,
        cagr: NaN,
        _monthly_equity: [],
        _last_month_key: -1,

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
