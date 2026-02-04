import { describe, expect, it } from 'vitest';

import { PineTS, Provider } from 'index';

describe('Strategy - Order Methods', () => {
    it('Order', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = `
//@version=6
strategy('PineTS Tests', overlay=false, default_qty_type=strategy.percent_of_equity, default_qty_value=10)


length = input.int(10, "Length")
sma = ta.sma(close, length)
ssma = 100 * (close - sma) / sma

// ─────────────────────────────────────────────
// Scenario selector
// ─────────────────────────────────────────────
scenario = input.string("market", title="Scenario", options=["market", "limit", "stop", "stop_limit", "reverse", "add_to_position"])

// ─────────────────────────────────────────────
// Strategy logic — each scenario triggers differently
// ─────────────────────────────────────────────
longCondition = ssma > 0 and ssma[1] <= 0
shortCondition = ssma < 0 and ssma[1] >= 0

// if longCondition
//     strategy.order(id="long_mkt", direction=strategy.long)
// if shortCondition
//     strategy.order(id="short_mkt", direction=strategy.short)
    
switch scenario
    "market" =>
        if longCondition
            strategy.order(id="long_mkt", direction=strategy.long)
        if shortCondition
            strategy.order(id="short_mkt", direction=strategy.short)

    "limit" =>
        // Place limit orders slightly below/above current price
        if longCondition
            strategy.order(id="long_lim", direction=strategy.long, limit=close * 0.995)
        if shortCondition
            strategy.order(id="short_lim", direction=strategy.short, limit=close * 1.005)

    "stop" =>
        if longCondition
            strategy.order(id="long_stop", direction=strategy.long, stop=close * 1.005)
        if shortCondition
            strategy.order(id="short_stop", direction=strategy.short, stop=close * 0.995)

    "stop_limit" =>
        if longCondition
            strategy.order(id="long_sl", direction=strategy.long, stop=close * 1.005, limit=close * 1.003)
        if shortCondition
            strategy.order(id="short_sl", direction=strategy.short, stop=close * 0.5, limit=close * 0.997)

    "reverse" =>
        if longCondition
            strategy.order(id="flip", direction=strategy.long)
        if shortCondition
            strategy.order(id="flip", direction=strategy.short)

    "add_to_position" =>
        // Multiple entries on the same side — tests accumulation
        if longCondition
            strategy.order(id="long_add_1", direction=strategy.long)
        if ssma > 5 and ssma[1] <= 5
            strategy.order(id="long_add_2", direction=strategy.long)
        if ssma > 10 and ssma[1] <= 10
            strategy.order(id="long_add_3", direction=strategy.long)
        if shortCondition
            strategy.order(id="close_all", direction=strategy.short)


//  ────────────────────────────────────────────
// Log: res | opentrades | closedtrades | netprofit | position_size | position_avg_price | position_entry
//  ────────────────────────────────────────────
//if not barstate.islast and time >= startDate and time <= endDate
//    log.info('{0} {1} {2} {3} {4} {5}', strategy.opentrades, strategy.closedtrades, strategy.netprofit, strategy.position_size, strategy.position_avg_price, strategy.position_size)

_opentrades = strategy.opentrades
plotchar(_opentrades, "_opentrades")
_closedtrades = strategy.closedtrades
plotchar(_closedtrades, "_closedtrades")
_netprofit = strategy.netprofit
plotchar(_netprofit, "_netprofit")
_position_size = strategy.position_size
plotchar(_position_size, "_position_size")
_position_avg_price = strategy.position_avg_price
plotchar(_position_avg_price, "_position_avg_price")
_position_entry = strategy.position_entry
plotchar(_position_entry, "_position_entry")`;

        const { result, plots } = await pineTS.run(sourceCode);

        let _opentrades = plots['_opentrades']?.data;
        let _closedtrades = plots['_closedtrades']?.data;
        let _netprofit = plots['_netprofit']?.data;
        let _position_size = plots['_position_size']?.data;
        let _position_avg_price = plots['_position_avg_price']?.data;
        let _position_entry = plots['_position_entry']?.data;

        const startDate = new Date('2019-07-15').getTime();
        const endDate = new Date('2019-11-20').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _opentrades.length; i++) {
            const time = _opentrades[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //round to 3 decimals
            const opentrades = _opentrades[i].value;
            const closedTrades = _closedtrades[i].value;
            const netprofit = Math.round(_netprofit[i].value * 1000) / 1000;
            const position_size = Math.round(_position_size[i].value * 1000) / 1000;
            const position_avg_price = Math.round(_position_avg_price[i].value * 1000) / 1000;
            const position_entry = Math.round(_position_entry[i].value * 1000) / 1000;

            plotdata_str += `[${str_time}]: ${opentrades} ${closedTrades} ${netprofit} ${position_size} ${position_avg_price} ${position_entry}\n`;
        }

        const expected_plot = `[2019-07-15T00:00:00.000-00:00]: 0 0 0 0 NaN 0
[2019-07-22T00:00:00.000-00:00]: 0 0 0 0 NaN 0
[2019-07-29T00:00:00.000-00:00]: 1 0 0 -10.488 9527.01 -10.488
[2019-08-05T00:00:00.000-00:00]: 1 1 -12998.245 -1.514 9527.01 -1.514
[2019-08-12T00:00:00.000-00:00]: 1 1 -12998.245 -1.514 9527.01 -1.514
[2019-08-19T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-08-26T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-09-02T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-09-09T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-09-16T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-09-23T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-09-30T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-10-07T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-10-14T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-10-21T00:00:00.000-00:00]: 2 1 -12998.245 -11.069 10206.469 -11.069
[2019-10-28T00:00:00.000-00:00]: 1 3 -6344.572 -0.672 10314.1 -0.672
[2019-11-04T00:00:00.000-00:00]: 1 3 -6344.572 -0.672 10314.1 -0.672
[2019-11-11T00:00:00.000-00:00]: 2 3 -6344.572 -11.68 9112.776 -11.68
[2019-11-18T00:00:00.000-00:00]: 2 3 -6344.572 -11.68 9112.776 -11.68`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
