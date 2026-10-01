// SPDX-License-Identifier: AGPL-3.0-only
// syminfo.ticker(sym) / syminfo.prefix(sym), ticker.new / ticker.modify modifiers, alert.freq_* values,
// syminfo values of a crypto symbol, ask / bid, timeframe.isticks.
// Every expected string and value was printed by TradingView (BINANCE:BTCUSDT 1h) for the same expression;
// the Mock provider serves BTCUSDC, so expressions built from syminfo use that symbol.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

/** Runs `checks` (one `name: expression` per line) and returns the last-bar value of each. */
async function evaluate(checks: Record<string, string>, symbol = 'BTCUSDC') {
    const body = Object.entries(checks)
        .map(([name, expr]) => `plot(${expr}, "${name}")`)
        .join('\n');
    const pineTS = new PineTS(Provider.Mock, symbol, '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 2));
    const { plots } = await pineTS.run(`//@version=6\nindicator("t")\n${body}\n`);
    const out: Record<string, number> = {};
    for (const name of Object.keys(checks)) out[name] = plots[name].data[plots[name].data.length - 1].value;
    return out;
}

const is = (expr: string, expected: string) => `${expr} == '${expected}' ? 1 : 0`;

describe('syminfo.ticker(symbol) / syminfo.prefix(symbol) (6a)', () => {
    it('split a symbol into its exchange prefix and ticker', async () => {
        const v = await evaluate({
            t1: is('syminfo.ticker("BINANCE:ETHUSDT")', 'ETHUSDT'),
            p1: is('syminfo.prefix("BINANCE:ETHUSDT")', 'BINANCE'),
            t2: is('syminfo.ticker(syminfo.tickerid)', 'BTCUSDC'),
            p2: is('syminfo.prefix(syminfo.tickerid)', 'BINANCE'),
            t3: is('syminfo.ticker("ETHUSDT")', ''),
            p3: is('syminfo.prefix("ETHUSDT")', ''),
            t4: is('syminfo.ticker(ticker.new("BINANCE", "ETHUSDT", session.extended))', 'ETHUSDT'),
            t5: is('syminfo.ticker(ticker.heikinashi("BINANCE:ETHUSDT"))', 'ETHUSDT'),
            t6: is('syminfo.ticker("BINANCE:ETHUSDT.P")', 'ETHUSDT.P'),
            p6: is('syminfo.prefix(":ETHUSDT")', ''),
            variable: is('syminfo.ticker', 'BTCUSDC'),
            len: 'str.length(syminfo.ticker("BINANCE:ETHUSDT"))',
        });
        expect(v).toEqual({ t1: 1, p1: 1, t2: 1, p2: 1, t3: 1, p3: 1, t4: 1, t5: 1, t6: 1, p6: 1, variable: 1, len: 7 });
    });
});

describe('ticker.new / ticker.modify encode session and adjustment modifiers (K9)', () => {
    it('match TradingView tickerids', async () => {
        const v = await evaluate({
            new1: is('ticker.new("BINANCE", "BTCUSDT", session.extended)', '={"session":"extended","symbol":"BINANCE:BTCUSDT"}'),
            new2: is('ticker.new("BINANCE", "BTCUSDT", session.regular, adjustment.dividends)', '={"adjustment":"dividends","symbol":"BINANCE:BTCUSDT"}'),
            new3: is('ticker.new("BINANCE", "BTCUSDT")', 'BINANCE:BTCUSDT'),
            new4: is('ticker.new("BINANCE", "BTCUSDT", adjustment = adjustment.splits)', '={"adjustment":"splits","symbol":"BINANCE:BTCUSDT"}'),
            new5: is('ticker.new("BINANCE", "BTCUSDT", backadjustment = backadjustment.on, settlement_as_close = settlement_as_close.off)', '={"backadjustment":"default","settlement-as-close":false,"symbol":"BINANCE:BTCUSDT"}'),
            new6: is('ticker.new("BINANCE", "BTCUSDT", adjustment = adjustment.none)', '={"adjustment":"none","symbol":"BINANCE:BTCUSDT"}'),
            new7: is('ticker.new("BINANCE", "BTCUSDT", backadjustment = backadjustment.off)', 'BINANCE:BTCUSDT'),
            new8: is('ticker.new("BINANCE", "BTCUSDT", settlement_as_close = settlement_as_close.inherit)', 'BINANCE:BTCUSDT'),
            new9: is('ticker.new("BINANCE", "BTCUSDT", session.extended, adjustment.splits, backadjustment.on, settlement_as_close.on)', '={"adjustment":"splits","backadjustment":"default","session":"extended","settlement-as-close":true,"symbol":"BINANCE:BTCUSDT"}'),
            mod1: is('ticker.modify(syminfo.tickerid, session.extended)', '={"session":"extended","symbol":"BINANCE:BTCUSDC"}'),
            mod2: is('ticker.modify(ticker.new("BINANCE", "BTCUSDT", session.extended), adjustment = adjustment.dividends)', '={"adjustment":"dividends","session":"extended","symbol":"BINANCE:BTCUSDT"}'),
            mod3: is('ticker.modify(syminfo.tickerid)', 'BINANCE:BTCUSDC'),
            mod4: is('ticker.modify(ticker.new("BINANCE", "BTCUSDT", session.extended), session.regular)', 'BINANCE:BTCUSDT'),
            mod5: is('ticker.modify(ticker.new("BINANCE", "BTCUSDT", backadjustment = backadjustment.on), backadjustment = backadjustment.off)', 'BINANCE:BTCUSDT'),
            mod6: is('ticker.modify(ticker.new("BINANCE", "BTCUSDT", settlement_as_close = settlement_as_close.on), settlement_as_close = settlement_as_close.inherit)', '={"settlement-as-close":true,"symbol":"BINANCE:BTCUSDT"}'),
            std: is('ticker.standard(ticker.new("BINANCE", "BTCUSDT", session.extended))', 'BINANCE:BTCUSDT'),
            inh: is('ticker.inherit(ticker.new("BINANCE", "BTCUSDT", session.extended), "BINANCE:ETHUSDT")', '={"session":"extended","symbol":"BINANCE:ETHUSDT"}'),
            // TradingView: the order of ticker.heikinashi and ticker.modify does not matter.
            order: 'ticker.heikinashi(ticker.modify("BINANCE:BTCUSDC", session.extended)) == ticker.modify(ticker.heikinashi("BINANCE:BTCUSDC"), session.extended) ? 1 : 0',
        });
        for (const [name, ok] of Object.entries(v)) expect({ name, ok }).toEqual({ name, ok: 1 });
    });

    it('request.security / request.security_lower_tf accept an encoded tickerid and serve its symbol', async () => {
        const v = await evaluate({
            same: 'request.security(ticker.new("BINANCE", "BTCUSDC", session.extended), "60", close) == close ? 1 : 0',
            htf: 'request.security(ticker.modify("BINANCE:BTCUSDC", adjustment = adjustment.splits), "240", close) == request.security("BINANCE:BTCUSDC", "240", close) ? 1 : 0',
            ltf: 'array.size(request.security_lower_tf(ticker.new("BINANCE", "BTCUSDC", session.extended), "30", close)) == array.size(request.security_lower_tf("BINANCE:BTCUSDC", "30", close)) ? 1 : 0',
        });
        expect(v).toMatchObject({ same: 1, htf: 1, ltf: 1 });
    });
});

describe('constants and syminfo values of a crypto symbol (K9)', () => {
    it('alert.freq_* are "all", "once_per_bar", "once_per_bar_close"', async () => {
        const v = await evaluate({
            all: is('alert.freq_all', 'all'),
            bar: is('alert.freq_once_per_bar', 'once_per_bar'),
            close: is('alert.freq_once_per_bar_close', 'once_per_bar_close'),
        });
        expect(v).toEqual({ all: 1, bar: 1, close: 1 });
    });

    it('syminfo.session is "regular", syminfo.root the ticker, fundamentals and expiration na', async () => {
        const v = await evaluate({
            session: is('syminfo.session', 'regular'),
            root: is('syminfo.root', 'BTCUSDC'),
            type: is('syminfo.type', 'crypto'),
            employees: 'na(syminfo.employees) ? 1 : 0',
            shares: 'na(syminfo.shares_outstanding_total) ? 1 : 0',
            recommendations: 'na(syminfo.recommendations_total) ? 1 : 0',
            target: 'na(syminfo.target_price_average) ? 1 : 0',
            expiration: 'na(syminfo.expiration_date) ? 1 : 0',
            employeesNz: 'nz(syminfo.employees, -1)',
        });
        expect(v).toEqual({ session: 1, root: 1, type: 1, employees: 1, shares: 1, recommendations: 1, target: 1, expiration: 1, employeesNz: -1 });
    });

    it('ask / bid are na and timeframe.isticks is false off the tick timeframe', async () => {
        const v = await evaluate({
            ask: 'na(ask) ? 1 : 0',
            bid: 'na(bid) ? 1 : 0',
            isticks: 'timeframe.isticks ? 1 : 0',
        });
        expect(v).toEqual({ ask: 1, bid: 1, isticks: 0 });
    });
});
