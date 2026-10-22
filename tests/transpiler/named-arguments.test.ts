// SPDX-License-Identifier: AGPL-3.0-only
// Named arguments: in Pine, `f(x = a, y = b)` is the call `f(a, b)`, in any order and with any
// prefix of the arguments positional. Each case runs the named form and the positional form of the
// same call and expects the same plots. Literal values were checked on TradingView (Pine v6,
// BINANCE:BTCUSDT 1D) or by hand.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const start = new Date('2024-01-01').getTime();
const end = new Date('2024-03-01').getTime();

async function run(body: string): Promise<any> {
    const header = body.includes('strategy(') ? '' : body.includes('strategy.') ? 'strategy("s")\n' : 'indicator("s")\n';
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, start, end);
    return pineTS.run(`//@version=6\n${header}${body}\n`);
}

const na = (v: any) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));
async function plotsOf(body: string): Promise<Record<string, any[]>> {
    const ctx = await run(body);
    const out: Record<string, any[]> = {};
    for (const [name, p] of Object.entries<any>(ctx.plots)) {
        if (!name.startsWith('__')) out[name] = p.data.map((d: any) => (na(d.value) ? 'na' : d.value));
    }
    return out;
}

async function expectSame(named: string, positional: string) {
    const a = await plotsOf(named);
    const b = await plotsOf(positional);
    expect(Object.keys(a).length).toBeGreaterThan(0);
    for (const values of Object.values(a)) expect(values.some((v) => v !== 'na')).toBe(true);
    expect(a).toEqual(b);
}

const last = (values: any[]) => values[values.length - 1];

describe('named arguments of built-ins compile to the positional call', () => {
    const cases: [string, string, string][] = [
        ['ta.sma', 'plot(ta.sma(source = close, length = 5), "a")', 'plot(ta.sma(close, 5), "a")'],
        ['reversed order', 'plot(ta.sma(length = 5, source = close), "a")', 'plot(ta.sma(close, 5), "a")'],
        ['positional prefix', 'plot(ta.rsi(close, length = 7), "a")', 'plot(ta.rsi(close, 7), "a")'],
        ['expression with history', 'plot(ta.change(source = close - open, length = 2), "a")', 'plot(ta.change(close - open, 2), "a")'],
        ['ta.highest of an expression', 'plot(ta.highest(length = 3, source = high - low), "a")', 'plot(ta.highest(high - low, 3), "a")'],
        ['nested named calls', 'plot(ta.sma(source = ta.ema(source = close, length = 3), length = 5), "a")', 'plot(ta.sma(ta.ema(close, 3), 5), "a")'],
        ['tuple', '[m, s, h] = ta.macd(source = close, fastlen = 6, slowlen = 13, siglen = 4)\nplot(h, "a")', '[m, s, h] = ta.macd(close, 6, 13, 4)\nplot(h, "a")'],
        ['overload chosen by names', 'plot(ta.pivothigh(leftbars = 2, rightbars = 2), "a")\nplot(ta.pivothigh(source = low, leftbars = 2, rightbars = 2), "b")', 'plot(ta.pivothigh(2, 2), "a")\nplot(ta.pivothigh(low, 2, 2), "b")'],
        ['math', 'plot(math.pow(exponent = 3, base = close), "a")\nplot(math.round(number = close / 7, precision = 2), "b")', 'plot(math.pow(close, 3), "a")\nplot(math.round(close / 7, 2), "b")'],
        ['str', 'plot(str.length(string = str.tostring(value = close, format = "#.##")), "a")\nplot(str.pos(source = "Hello World", str = "World"), "b")', 'plot(str.length(str.tostring(close, "#.##")), "a")\nplot(str.pos("Hello World", "World"), "b")'],
        ['color', 'c = color.new(color = color.rgb(red = close % 255, green = 20, blue = 30), transp = 40)\nplot(color.r(color = c), "a")\nplot(color.t(c), "b")\nplot(color.b(color.from_gradient(value = close, bottom_value = low, top_value = high, bottom_color = color.red, top_color = color.blue)), "c")', 'c = color.new(color.rgb(close % 255, 20, 30), 40)\nplot(color.r(c), "a")\nplot(color.t(c), "b")\nplot(color.b(color.from_gradient(close, low, high, color.red, color.blue)), "c")'],
        ['type conversions', 'plot(int(x = close / 3), "a")\nplot(bool(x = close > open) ? 1 : 0, "b")\nplot(str.length(string(x = close)), "c")', 'plot(int(close / 3), "a")\nplot(bool(close > open) ? 1 : 0, "b")\nplot(str.length(string(close)), "c")'],
        ['nz / na', 'plot(nz(source = ta.valuewhen(condition = close > open, source = close, occurrence = 1), replacement = -1), "a")\nplot(na(x = close) ? 1 : 0, "b")', 'plot(nz(ta.valuewhen(close > open, close, 1), -1), "a")\nplot(na(close) ? 1 : 0, "b")'],
        ['ticker / timeframe / syminfo', 'plot(str.length(ticker.heikinashi(symbol = syminfo.tickerid)), "a")\nplot(timeframe.in_seconds(timeframe = "60"), "b")\nplot(timeframe.change(timeframe = "W") ? 1 : 0, "c")\nplot(str.length(syminfo.ticker(symbol = "BINANCE:BTCUSDT")), "d")', 'plot(str.length(ticker.heikinashi(syminfo.tickerid)), "a")\nplot(timeframe.in_seconds("60"), "b")\nplot(timeframe.change("W") ? 1 : 0, "c")\nplot(str.length(syminfo.ticker("BINANCE:BTCUSDT")), "d")'],
        ['chart.point', 'p = chart.point.new(time = time, index = bar_index, price = close)\nplot(p.price, "a")\nplot(chart.point.copy(id = p).index, "b")', 'p = chart.point.new(time, bar_index, close)\nplot(p.price, "a")\nplot(chart.point.copy(p).index, "b")'],
        ['array function form', 'a = array.from(3.0, 1.0, 2.0)\nplot(array.get(id = a, index = 1), "a")\nplot(array.percentile_nearest_rank(id = a, percentage = 50), "b")', 'a = array.from(3.0, 1.0, 2.0)\nplot(array.get(a, 1), "a")\nplot(array.percentile_nearest_rank(a, 50), "b")'],
        ['array.new_float', 'a = array.new_float(size = 2, initial_value = close)\nplot(a.get(1), "a")', 'a = array.new_float(2, close)\nplot(a.get(1), "a")'],
        ['matrix / map function form', 'm = matrix.new<float>(rows = 2, columns = 2, initial_value = 1.0)\nmatrix.set(id = m, row = 1, column = 0, value = close)\nplot(matrix.get(id = m, row = 1, column = 0), "a")\nmp = map.new<string, float>()\nmap.put(id = mp, key = "k", value = open)\nplot(map.get(id = mp, key = "k"), "b")', 'm = matrix.new<float>(2, 2, 1.0)\nmatrix.set(m, 1, 0, close)\nplot(matrix.get(m, 1, 0), "a")\nmp = map.new<string, float>()\nmap.put(mp, "k", open)\nplot(map.get(mp, "k"), "b")'],
        ['request.security expression', 'plot(request.security(symbol = syminfo.tickerid, timeframe = "W", expression = ta.sma(source = close, length = 2)), "a")', 'plot(request.security(syminfo.tickerid, "W", ta.sma(close, 2)), "a")'],
        ['request.security, skipped gaps', 'plot(request.security(lookahead = barmerge.lookahead_on, expression = close, timeframe = "W", symbol = syminfo.tickerid), "a")', 'plot(request.security(syminfo.tickerid, "W", close, barmerge.gaps_off, barmerge.lookahead_on), "a")'],
        ['inside a conditional and a loop', 'float v = na\nif bar_index % 2 == 0\n    v := ta.sma(source = close, length = 3)\nfloat s = 0\nfor i = 0 to 2\n    s += math.pow(base = i, exponent = 2)\nplot(v, "a")\nplot(s, "b")', 'float v = na\nif bar_index % 2 == 0\n    v := ta.sma(close, 3)\nfloat s = 0\nfor i = 0 to 2\n    s += math.pow(i, 2)\nplot(v, "a")\nplot(s, "b")'],
        ['inside a function with a series parameter', 'f(src) => ta.sma(source = src, length = 3)\nplot(f(close - open), "a")', 'f(src) => ta.sma(src, 3)\nplot(f(close - open), "a")'],
        ['call split over lines', 'plot(ta.wma(source = close,\n     length = 5), "a")', 'plot(ta.wma(close, 5), "a")'],
    ];
    for (const [name, named, positional] of cases) {
        it(name, async () => expectSame(named, positional));
    }

    it('gives the values checked on TradingView', async () => {
        const p = await plotsOf(`plot(math.pow(exponent = 3, base = 2), "pow")
plot(timeframe.in_seconds(timeframe = "60"), "secs")
plot(str.pos(source = "Hello World", str = "World"), "pos")
plot(color.t(color = color.new(color = color.rgb(red = 10, green = 20, blue = 30), transp = 40)), "t")
plot(color.r(color = color.rgb(red = 10, green = 20, blue = 30)), "r")`);
        expect(last(p['pow'])).toBe(8);
        expect(last(p['secs'])).toBe(3600);
        expect(last(p['pos'])).toBe(6);
        expect(last(p['t'])).toBe(40);
        expect(last(p['r'])).toBe(10);
    });

    it('a skipped parameter takes its default', async () => {
        await expectSame('plot(str.length(ticker.new("BINANCE", "BTCUSDT", adjustment = adjustment.splits)), "a")', 'plot(str.length(ticker.new("BINANCE", "BTCUSDT", session.regular, adjustment.splits)), "a")');
        await expectSame('plot(math.random(max = 10, seed = 7), "a")', 'plot(math.random(0, 10, 7), "a")');
        const p = await plotsOf('a = array.new_float(initial_value = 1.5)\nplot(a.size(), "size")');
        expect(last(p['size'])).toBe(0);
    });
});

describe('named arguments of method calls', () => {
    it('array / matrix / map methods', async () => {
        await expectSame(
            'a = array.from(3.0, 1.0, 2.0)\na.push(value = close)\na.insert(index = 0, value = open)\nplot(a.get(index = 1), "a")\nplot(a.size(), "b")\nplot(a.slice(index_from = 1, index_to = 3).sum(), "c")',
            'a = array.from(3.0, 1.0, 2.0)\na.push(close)\na.insert(0, open)\nplot(a.get(1), "a")\nplot(a.size(), "b")\nplot(a.slice(1, 3).sum(), "c")'
        );
        await expectSame(
            'm = matrix.new<float>(2, 2, 1.0)\nm.set(row = 1, column = 0, value = close)\nplot(m.get(column = 0, row = 1), "a")\nmp = map.new<string, float>()\nmp.put(key = "k", value = close)\nplot(mp.get(key = "k"), "b")',
            'm = matrix.new<float>(2, 2, 1.0)\nm.set(1, 0, close)\nplot(m.get(1, 0), "a")\nmp = map.new<string, float>()\nmp.put("k", close)\nplot(mp.get("k"), "b")'
        );
    });

    it('drawing methods with several parameters', async () => {
        await expectSame(
            'var l = line.new(bar_index, close, bar_index, close)\nl.set_xy2(x = bar_index, y = high)\nplot(l.get_y2(), "a")\nvar b = box.new(bar_index, high, bar_index, low)\nb.set_lefttop(top = high + 1, left = bar_index)\nplot(b.get_top(), "b")',
            'var l = line.new(bar_index, close, bar_index, close)\nl.set_xy2(bar_index, high)\nplot(l.get_y2(), "a")\nvar b = box.new(bar_index, high, bar_index, low)\nb.set_lefttop(bar_index, high + 1)\nplot(b.get_top(), "b")'
        );
    });

    it('user-defined methods, with a skipped parameter', async () => {
        const decl = 'type P\n    float v = 1\nmethod scaled(P this, float k = 2, float add = 0) => this.v * k + add\np = P.new(3)\n';
        await expectSame(`${decl}plot(p.scaled(add = 1), "a")`, `${decl}plot(p.scaled(2, 1), "a")`);
        const p = await plotsOf(`${decl}plot(p.scaled(add = 1), "a")\nplot(p.scaled(add = 1, k = 4), "b")`);
        expect(last(p['a'])).toBe(7);
        expect(last(p['b'])).toBe(13);
    });
});

describe('named arguments of user-defined functions', () => {
    it('a skipped parameter takes its default', async () => {
        const p = await plotsOf('f(a, b = 2, c = 3) => a * 100 + b * 10 + c\nplot(f(1, c = 7), "skip")\nplot(f(c = 7, b = 5, a = 1), "reversed")');
        expect(last(p['skip'])).toBe(127);
        expect(last(p['reversed'])).toBe(157);
    });
});

describe('named arguments of drawing and table functions', () => {
    it('table.cell / table.merge_cells / table.clear with a named table_id', async () => {
        const named = await run(`var t = table.new(position.top_right, 3, 3)
table.cell(table_id = t, column = 1, row = 2, text = "x", text_color = color.red)
table.cell(table_id = t, column = 0, row = 0, text = "y")
table.merge_cells(table_id = t, start_column = 0, start_row = 1, end_column = 1, end_row = 1)
table.clear(table_id = t, start_column = 0, start_row = 0)`);
        const cells = named.plots['__tables__'].data[0].value[0].cells;
        expect(cells[2][1]).toMatchObject({ text: 'x', text_color: '#F23645' });
        expect(cells[0][0]).toBeFalsy();
    });

    it('table.new keeps positional arguments before named ones', async () => {
        const ctx = await run('var t = table.new(position.bottom_left, 2, 2, color.yellow, frame_width = 2)');
        expect(ctx.plots['__tables__'].data[0].value[0]).toMatchObject({ bgcolor: '#FDD835', frame_width: 2 });
    });

    it('linefill.set_color as a method', async () => {
        const ctx = await run('l1 = line.new(bar_index, low, bar_index + 1, low)\nl2 = line.new(bar_index, high, bar_index + 1, high)\nf = linefill.new(l1, l2, color.blue)\nf.set_color(color = color.red)');
        expect(ctx.plots['__linefills__'].data[0].value.at(-1).color).toBe('#F23645');
    });

    it('fill() between two hlines', async () => {
        const ctx = await run('h1 = hline(1)\nh2 = hline(2)\nfill(hline1 = h1, hline2 = h2, color = color.red, title = "F", fillgaps = true)');
        expect(ctx.plots['F']).toMatchObject({ plot1: expect.anything(), plot2: expect.anything(), options: { fillgaps: true } });
    });
});

describe('named arguments of strategy.risk and alerts', () => {
    it('strategy.risk.* read their named arguments', async () => {
        const ctx = await run('strategy.risk.max_intraday_filled_orders(count = 2, alert_message = "m")\nstrategy.risk.allow_entry_in(value = strategy.direction.long)');
        expect(ctx.strategy.risk_rules.max_intraday_filled_orders).toMatchObject({ count: 2, alert_message: 'm' });
        expect(ctx.strategy.risk_rules.allow_entry_in).toBe('long');
    });
});

describe('positional arguments past the first few', () => {
    it('plot keeps every positional argument, linestyle included', async () => {
        const ctx = await run('plot(close, "p", color.red, 2, plot.style_stepline, true, 1, 1, true, false, 10, display.data_window, format.percent, 3, true, plot.linestyle_dashed)');
        expect(ctx.plots['p'].options).toMatchObject({ join: true, editable: false, show_last: 10, display: 'data_window', format: 'percent', precision: 3, force_overlay: true, linestyle: 'linestyle_dashed' });
    });

    it('plotchar and barcolor keep their positional arguments', async () => {
        const ctx = await run('plotchar(close, "c", "X", location.belowbar, color.red, 1, "txt", color.green, false, size.large, 10)\nbarcolor(color.red, 1, false, 10, "b")');
        expect(ctx.plots['c'].options).toMatchObject({ offset: 1, text: 'txt', editable: false, size: 'large', show_last: 10 });
        expect(ctx.plots['b'].options).toMatchObject({ offset: 1, editable: false, show_last: 10 });
    });

    it('label.new accepts a size in points and keeps the arguments after it', async () => {
        const ctx = await run('var l = label.new(bar_index, close, "t", xloc.bar_index, yloc.price, color.red, label.style_label_down, color.white, 14, text.align_left, "tip")');
        expect(ctx.plots['__labels__'].data[0].value[0]).toMatchObject({ size: 14, textalign: 'left', tooltip: 'tip' });
    });

    it('strategy() reads overlay and the other positional settings', async () => {
        const ctx = await run('strategy("T", "S", true, format.price, 3, scale.right, 2)\nplot(close)');
        expect(ctx.strategy.config).toMatchObject({ title: 'T', shorttitle: 'S', overlay: true, precision: 3, pyramiding: 2 });
    });

    it('fill() between two hlines has no show_last', async () => {
        const ctx = await run('h1 = hline(1)\nh2 = hline(2)\nfill(h1, h2, color.red, "F", false, true, display.data_window)');
        expect(ctx.plots['F'].options).toMatchObject({ editable: false, fillgaps: true, display: 'data_window' });
    });

    it('matrix.sort follows order.ascending / order.descending', async () => {
        const p = await plotsOf(`build() =>
    m = matrix.new<float>(3, 1, 0.0)
    m.set(0, 0, 3.0)
    m.set(1, 0, 1.0)
    m.set(2, 0, 2.0)
    m
a = build()
matrix.sort(a, 0, order.ascending)
d = build()
matrix.sort(d, 0, order.descending)
n = build()
n.sort(order = order.ascending)
plot(a.get(0, 0), "asc")
plot(d.get(0, 0), "desc")
plot(n.get(0, 0), "named")`);
        expect(last(p['asc'])).toBe(1);
        expect(last(p['desc'])).toBe(3);
        expect(last(p['named'])).toBe(1);
    });
});
