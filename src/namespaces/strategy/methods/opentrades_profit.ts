// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * strategy.opentrades.profit() - Get unrealized profit of an open trade
 *
 * @param trade_num - The trade number (0-based index)
 * @returns The current unrealized profit/loss
 */
export function opentrades_profit(context: any) {
    return (trade_num: number) => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        const trades = engine.getOpenTrades();
        if (trade_num < 0 || trade_num >= trades.length) {
            return 0;
        }

        const trade = trades[trade_num];
        const currentPrice = context.data.close instanceof Series
            ? context.data.close.get(0)
            : context.data.close;

        if (trade.direction === 'long') {
            return (currentPrice - trade.entry_price) * trade.size;
        } else {
            return (trade.entry_price - currentPrice) * trade.size;
        }
    };
}
