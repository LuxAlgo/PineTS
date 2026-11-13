// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Strategy broker behaviors pinned against TradingView (BTCUSDC 1W, the same bars as the Mock
 * weekly data). Every expected value is TradingView's output for the same script.
 */
import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const run = async (code: string, end = '2019-09-01') => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date(end).getTime());
    const { plots } = await pineTS.run(code);
    return (name: string, day: string) => plots[name].data.find((p: any) => new Date(p.time).toISOString().slice(0, 10) === day)?.value;
};

describe('strategy broker parity (TradingView 1W)', () => {
    it('max_intraday_filled_orders lets every market order filling at the open fill before closing out', async () => {
        const at = await run(`//@version=5
strategy("t", overlay=true, initial_capital=100000)
strategy.risk.max_intraday_filled_orders(2)
if time >= timestamp("2019-06-01 00:00") and time <= timestamp("2019-08-15 00:00")
    strategy.order("O1", strategy.long, qty=1)
    strategy.order("O2", strategy.long, qty=1)
    strategy.order("O3", strategy.long, qty=1)
ct = strategy.closedtrades
plot(ct, "ct")
plot(strategy.position_size, "pos")
plot(ct > 0 and strategy.closedtrades.entry_id(ct - 1) == "O3" ? 1 : 0, "lastO3")
`);
        // TV: all three orders fill, then the rule closes the three trades; the next bar is blocked
        expect(at('ct', '2019-06-10')).toBe(3);
        expect(at('lastO3', '2019-06-10')).toBe(1);
        expect(at('pos', '2019-06-10')).toBe(0);
        expect(at('ct', '2019-06-17')).toBe(3);
        expect(at('ct', '2019-06-24')).toBe(6);
    });

    it('entries placed while flat all fill past the pyramiding cap', async () => {
        const at = await run(`//@version=5
strategy("t", overlay=true, initial_capital=1000000, default_qty_type=strategy.fixed, default_qty_value=1, pyramiding=1)
var float lvlA = na
var float lvlB = na
p = bar_index % 8
if p == 0
    lvlA := close * 0.985
    lvlB := close * 0.955
    strategy.entry("LA", strategy.long, qty=1, limit=lvlA)
    strategy.entry("LB", strategy.long, qty=1, limit=lvlB)
if p == 4
    strategy.close_all()
if p == 6
    strategy.cancel_all()
    strategy.close_all()
ot = strategy.opentrades
plot(ot, "ot")
plot(ot > 1 ? strategy.opentrades.entry_price(1) : na, "ep1")
plot(ot > 1 and strategy.opentrades.entry_id(1) == "LB" ? 1 : 0, "id1LB")
`);
        // TV: both buy limits fill on the bar that dips through them, pyramiding = 1 notwithstanding
        expect(at('ot', '2019-04-08')).toBe(2);
        expect(at('id1LB', '2019-04-08')).toBe(1);
        expect(at('ep1', '2019-04-08')).toBeCloseTo(4958.64, 2);
    });

    it('a stop-limit limit below the stop fills only if the bar comes back to it after the trigger', async () => {
        const at = await run(`//@version=5
strategy("t", overlay=true, initial_capital=100000, default_qty_type=strategy.fixed, default_qty_value=1)
p = bar_index % 18
if p == 0
    strategy.order("SLA", strategy.long, qty=1, stop=close * 1.02, limit=close * 1.06)
if p == 3
    strategy.cancel("SLA")
    strategy.close("SLA")
if p == 6
    strategy.order("SLB", strategy.long, qty=1, stop=close * 1.02, limit=close * 0.92)
if p == 9
    strategy.cancel("SLB")
    strategy.close("SLB")
if p == 12
    strategy.order("SLC", strategy.long, qty=1, stop=close * 0.95, limit=close * 1.05)
if p == 15
    strategy.cancel("SLC")
    strategy.close("SLC")
ct = strategy.closedtrades
plot(ct, "ct")
plot(strategy.position_size, "pos")
plot(strategy.netprofit, "np")
`);
        // TV: SLB's stop triggers on 2019-06-10 between the low and the high, its limit is never reached after
        for (const day of ['2019-06-10', '2019-06-17', '2019-06-24', '2019-07-01']) {
            expect(at('pos', day)).toBe(0);
            expect(at('ct', day)).toBe(3);
        }
        expect(at('np', '2019-07-01')).toBeCloseTo(2506.5, 2);
    });

    it('an exit without from_entry gives each entry id its own qty', async () => {
        const at = await run(`//@version=5
strategy("t", overlay=true, initial_capital=1000000, default_qty_type=strategy.fixed, default_qty_value=1, pyramiding=2)
p = bar_index % 12
if p == 0
    strategy.entry("E1", strategy.long, qty=1)
if p == 2
    strategy.entry("E2", strategy.long, qty=1)
if p == 4
    strategy.exit("PX", qty=1, profit=10 / syminfo.mintick)
if p == 8
    strategy.close_all()
ct = strategy.closedtrades
plot(ct, "ct")
plot(strategy.position_size, "pos")
plot(strategy.netprofit, "np")
plot(ct > 0 and strategy.closedtrades.exit_id(ct - 1) == "PX" ? 1 : 0, "byPX")
`, '2019-04-22');
        // TV: qty = 1 on each of E1 and E2, both closed by PX
        expect(at('pos', '2019-04-08')).toBe(0);
        expect(at('ct', '2019-04-08')).toBe(4);
        expect(at('byPX', '2019-04-08')).toBe(1);
        expect(at('np', '2019-04-08')).toBeCloseTo(2661.88, 2);
    });

    it('an exit waiting on a cancelled entry attaches to a later entry with the same id', async () => {
        const at = await run(`//@version=5
strategy("t", overlay=true, initial_capital=100000, default_qty_type=strategy.fixed, default_qty_value=1)
p = bar_index % 20
if p == 0
    strategy.entry("L", strategy.long, qty=1, limit=close * 0.5)
    strategy.exit("X", "L", profit=10)
if p == 2
    strategy.cancel("L")
if p == 4
    strategy.entry("L", strategy.long, qty=1)
if p == 8
    strategy.close("L")
ct = strategy.closedtrades
i = ct - 1
plot(ct, "ct")
plot(ct > 0 and strategy.closedtrades.exit_id(i) == "X" ? 1 : 0, "byX")
plot(ct > 0 ? math.round((strategy.closedtrades.exit_price(i) - strategy.closedtrades.entry_price(i)) / syminfo.mintick) : na, "ticks")
plot(ct > 0 ? strategy.closedtrades.exit_bar_index(i) - strategy.closedtrades.entry_bar_index(i) : na, "held")
`, '2019-02-11');
        // TV: X takes profit 10 ticks above the fill on the fill bar of the market L
        expect(at('ct', '2019-01-14')).toBe(1);
        expect(at('byX', '2019-01-14')).toBe(1);
        expect(at('ticks', '2019-01-14')).toBe(10);
        expect(at('held', '2019-01-14')).toBe(0);
    });

    it('once max_cons_loss_days stops trading, a later strategy.close is rejected too', async () => {
        const at = await run(`//@version=5
strategy("t", overlay=true, initial_capital=100000, commission_type=strategy.commission.cash_per_order, commission_value=4000)
strategy.risk.max_cons_loss_days(2)
inTrade = time >= timestamp("2019-06-01 00:00") and time <= timestamp("2019-08-15 00:00")
if inTrade and strategy.position_size == 0
    strategy.entry("L", strategy.long, qty=1)
if strategy.position_size > 0
    strategy.close("L")
plot(strategy.position_size, "pos")
plot(strategy.closedtrades, "ct")
plot(strategy.netprofit, "np")
`);
        // TV: the entry placed before the trip fills, its close never does
        for (const day of ['2019-07-01', '2019-07-29', '2019-08-26']) {
            expect(at('pos', day)).toBe(1);
            expect(at('ct', day)).toBe(1);
            expect(at('np', day)).toBeCloseTo(-10661.7, 2);
        }
    });
});
