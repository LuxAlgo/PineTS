// SPDX-License-Identifier: AGPL-3.0-only

/**
 * request.* and drawing behaviors pinned against TradingView. Every expected value is
 * TradingView's output for the same script.
 */
import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { parseArgsForPineParams } from '../../src/namespaces/utils';

const mk = () => new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-07').getTime(), new Date('2019-03-01').getTime());

describe('request.* (TradingView)', () => {
    it('security_lower_tf on an invalid symbol with ignore_invalid_symbol returns na', async () => {
        const { plots } = await mk().run(`//@version=5
indicator("r")
la = request.security_lower_tf("BINANCE:ZZZZFAKEPAIR999", "1D", close, ignore_invalid_symbol = true)
plot(na(la) ? 1 : 0, "v6")
`);
        // TV: the array id is na
        for (const p of plots['v6'].data) expect(p.value).toBe(1);
    });

    it('a matrix, map or UDT argument is a value, not the named-arguments object', () => {
        class Box {
            constructor(public rows = 2) {}
        }
        const signatures = [
            ['symbol', 'timeframe', 'expression'],
            ['symbol', 'timeframe', 'expression', 'gaps'],
        ];
        const types = { symbol: 'series', timeframe: 'series', expression: 'any', gaps: 'series' };
        const value = new Box();
        const parsed: any = parseArgsForPineParams(['BTCUSDC', 'M', value, 'gaps_on'], signatures, types);
        // TV: request.security(tid, "M", fmat(), barmerge.gaps_on) gaps the matrix like any value
        expect(parsed.expression).toBe(value);
        expect(parsed.gaps).toBe('gaps_on');
    });
});

describe('drawings from chart points and degenerate lines (TradingView)', () => {
    it('constructors without xloc use bar_index: a from_time point gives an na x', async () => {
        const { plots } = await mk().run(`//@version=5
indicator("d", overlay = true)
p1 = chart.point.from_time(time[1], 100.0)
p2 = chart.point.from_time(time, 120.0)
l = line.new(p1, p2)
b = box.new(p1, p2)
lb = label.new(p2, "x")
plot(na(line.get_x1(l)) ? 1 : 0, "lx")
plot(na(box.get_left(b)) ? 1 : 0, "bx")
plot(na(label.get_x(lb)) ? 1 : 0, "lbx")
plot(chart.point.now().price - close, "now")
`);
        const last = (n: string) => plots[n].data[plots[n].data.length - 1].value;
        // TV: true | true | true, and chart.point.now() prices at close
        expect([last('lx'), last('bx'), last('lbx'), last('now')]).toEqual([1, 1, 1, 0]);
    });

    it('line.get_price of a vertical or single-point line is na', async () => {
        const { plots } = await mk().run(`//@version=5
indicator("d", overlay = true)
lv = line.new(bar_index - 5, 100.0, bar_index - 5, 200.0)
lp = line.new(bar_index - 4, 120.0, bar_index - 4, 120.0)
lh = line.new(bar_index - 8, 150.0, bar_index - 2, 150.0)
plot(na(line.get_price(lv, bar_index - 5)) ? 1 : 0, "v3")
plot(na(line.get_price(lp, bar_index - 4)) ? 1 : 0, "v5")
plot(line.get_price(lh, bar_index + 5), "v8")
`);
        const last = (n: string) => plots[n].data[plots[n].data.length - 1].value;
        // TV: na at the line's own x too; a horizontal line still extrapolates (150)
        expect([last('v3'), last('v5'), last('v8')]).toEqual([1, 1, 150]);
    });
});
