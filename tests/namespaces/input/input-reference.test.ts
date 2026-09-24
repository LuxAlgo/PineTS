// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * The 14 input functions of the Pine v6 reference manual: the manual's
 * examples, the metadata TradingView derives for every input (labels,
 * defaults, options, display), the argument checks its compiler performs,
 * and runtime behavior in local scopes.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';
import { Indicator } from '../../../src/Indicator';
import { transpile } from '../../../src/transpiler/index';

const pine = (...lines: string[]) => ['//@version=6', 'indicator("t")', ...lines].join('\n') + '\n';
const meta = (src: string) => new Indicator(src).getInputsMeta();
const fails = (lines: string[], message: string) => expect(() => transpile(pine(...lines))).toThrow(message);
const compiles = (lines: string[]) => expect(() => transpile(pine(...lines))).not.toThrow();

async function firstValues(ind: Indicator, names: string[], n = 3): Promise<Record<string, number[]>> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(ind);
    return Object.fromEntries(names.map((name) => [name, plots[name].data.slice(0, n).map((p: any) => p.value)]));
}
const plotted = (names: string[]) => names.map((n) => `plot(${n}, "${n}")`);

describe('reference manual examples: input metadata', () => {
    it('input()', () => {
        const src = pine(
            'i_switch = input(true, "On/Off")',
            'plot(i_switch ? open : na)',
            'i_len = input(7, "Length")',
            'i_src = input(close, "Source")',
            'plot(ta.sma(i_src, i_len))',
            'i_border = input(142.50, "Price Border")',
            'hline(i_border)',
            'i_col = input(color.red, "Plot Color")',
            'plot(close, color=i_col)',
            'i_text = input("Hello!", "Message")',
        );
        expect(meta(src).map((m) => [m.id, m.name, m.type, m.defval, m.display])).toEqual([
            ['in_0', 'On/Off', 'bool', true, 'none'],
            ['in_1', 'Length', 'int', 7, 'all'],
            ['in_2', 'Source', 'source', 'close', 'all'],
            ['in_3', 'Price Border', 'float', 142.5, 'all'],
            ['in_4', 'Plot Color', 'color', '#F23645FF', 'none'],
            ['in_5', 'Message', 'string', 'Hello!', 'all'],
        ]);
        expect(meta(src)[2].options).toEqual(['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'hlcc4', 'ohlc4']);
    });

    it('input.float and input.int (range and options overloads)', () => {
        const f = meta(
            pine(
                'a = input.float(0.5, "Sin Angle", minval=-3.14, maxval=3.14, step=0.02)',
                'b = input.float(0, "Cos Angle", options=[-3.14, -1.57, 0, 1.57, 3.14])',
            ),
        );
        expect([f[0].minval, f[0].maxval, f[0].step, f[0].defval]).toEqual([-3.14, 3.14, 0.02, 0.5]);
        expect([f[1].type, f[1].defval, f[1].options]).toEqual(['float', 0, [-3.14, -1.57, 0, 1.57, 3.14]]);
        const i = meta(pine('a = input.int(10, "Length 1", minval=5, maxval=21, step=1)', 'b = input.int(10, "Length 2", options=[5, 10, 21])'));
        expect([i[0].minval, i[0].maxval, i[0].step]).toEqual([5, 21, 1]);
        expect(i[1].options).toEqual([5, 10, 21]);
    });

    it('input.price with a named defval, input.session with options, input.time, input.text_area, input.timeframe', () => {
        expect(
            meta(pine('price1 = input.price(title="Date", defval=42)', 'price2 = input.price(54, title="Date")')).map((m) => [
                m.name,
                m.type,
                m.defval,
            ]),
        ).toEqual([
            ['Date', 'price', 42],
            ['Date', 'price', 54],
        ]);
        expect(meta(pine('i_sess = input.session("1300-1700", "Session", options=["0930-1600", "1300-1700", "1700-2100"])'))[0].options).toEqual([
            '0930-1600',
            '1300-1700',
            '1700-2100',
        ]);
        expect(meta(pine('i_date = input.time(timestamp("20 Jul 2021 00:00 +0300"), "Date")')).map((m) => [m.type, m.defval, m.display])).toEqual([
            ['time', 1626728400000, 'none'],
        ]);
        expect(
            meta(pine('i_text = input.text_area(defval = "Hello \\nWorld!", title = "Message")')).map((m) => [m.type, m.defval, m.display]),
        ).toEqual([['text_area', 'Hello \nWorld!', 'none']]);
        expect(meta(pine(`i_res = input.timeframe('D', "Resolution", options=['D', 'W', 'M'])`)).map((m) => [m.type, m.defval, m.options])).toEqual([
            ['timeframe', 'D', ['D', 'W', 'M']],
        ]);
    });

    it('input.enum without options lists every field of the enum, titles included', () => {
        const src = pine(
            'enum tz',
            '    utc  = "UTC"',
            '    exch = ""',
            '    ny   = "America/New_York"',
            '    chi  = "America/Chicago"',
            '    lon  = "Europe/London"',
            '    tok  = "Asia/Tokyo"',
            'selectedTimezone = input.enum(tz.utc, "Session Timezone")',
        );
        expect(meta(src)[0].options).toEqual(['UTC', '', 'America/New_York', 'America/Chicago', 'Europe/London', 'Asia/Tokyo']);
        expect(meta(pine('enum E', '    a = "Alpha"', '    b', '    c = "Gamma"', 'e = input.enum(E.b, "E")'))[0]).toMatchObject({
            defval: 'b',
            options: ['Alpha', 'b', 'Gamma'],
        });
        expect(meta(pine('enum E', '    a = "A"', '    b = "B"', 'e = input.enum(true ? E.b : E.a, "E")'))[0]).toMatchObject({
            defval: 'B',
            options: ['A', 'B'],
        });
    });
});

describe('input metadata defaults', () => {
    it('display defaults to none for bool, color, time and text_area inputs, all otherwise', () => {
        const m = meta(
            pine(
                'a = input.bool(true)',
                'b = input.color(color.red)',
                'c = input.time(0)',
                'd = input.text_area("x")',
                'e = input.int(1)',
                'f = input.string("x")',
                'g = input.symbol("X")',
                'h = input.price(1)',
                'k = input.int(1, display = display.none)',
            ),
        );
        expect(m.map((x) => x.display)).toEqual(['none', 'none', 'none', 'none', 'all', 'all', 'all', 'all', 'none']);
    });

    it('a source input lists the eight selectable sources, but a volume override is still accepted', () => {
        const ind = new Indicator(pine('s = input.source(volume, "S")'));
        expect(ind.getInputsMeta()[0]).toMatchObject({
            defval: 'volume',
            options: ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'hlcc4', 'ohlc4'],
        });
        ind.input['s'] = 'volume';
        expect(ind.input['s']).toBe('volume');
    });

    it('positional arguments of the bare source input() put inline and group before tooltip', () => {
        expect(meta(pine('s = input(close, "S", "inl", "grp", "tip")'))[0]).toMatchObject({ inline: 'inl', group: 'grp', tooltip: 'tip' });
        expect(meta(pine('a = input(5, "T", "tip", "inl", "grp")'))[0]).toMatchObject({ tooltip: 'tip', inline: 'inl', group: 'grp' });
    });

    it('active accepts an input bool', () => {
        compiles(['on = input.bool(true, "On")', 'n = input.int(5, "N", active = on)']);
    });
});

describe('input metadata in published-script patterns', () => {
    it('constants declared after an input on the same line are visible to later inputs', () => {
        const m = meta(pine(`res = input.timeframe('1'), W = 'high/low', C = 'close'`, `iSrc = input.string(W, 'option', options = [W, C])`));
        expect(m[1]).toMatchObject({ defval: 'high/low', options: ['high/low', 'close'] });
    });

    it('namespace constants report their value', () => {
        const m = meta(
            pine(
                's = input.string(size.small, "Size", options = [size.tiny, size.small, size.normal])',
                'p = input.string(position.top_right, "Position")',
            ),
        );
        expect(m.map((x) => [x.defval, x.options])).toEqual([
            ['small', ['tiny', 'small', 'normal']],
            ['top_right', undefined],
        ]);
    });

    it('timestamp() with a non-ISO date string folds', () => {
        expect(meta(pine('t = input.time(timestamp("04 Mar 2024 00:00"), "Anchor")'))[0].defval).toBe(1709510400000);
    });

    it('color.new transparency maps to the rounded alpha byte', () => {
        expect(meta(pine('c = input.color(color.new(#607D8B, 90))'))[0].defval).toBe('#607D8B1A');
    });

    it('active is evaluated with the default of the inputs it references', () => {
        const m = meta(
            pine(
                `summaryMethod = input.string('Mean', 'Summary', options = ['Mean', 'Percentile'])`,
                `percentile = input.int(50, active = summaryMethod == 'Percentile')`,
            ),
        );
        expect(m[1].active).toBe(false);
    });

    it('a variable sharing a user function name is labelled by its Pine name', async () => {
        const src = pine(`statistic = input.string('Mean')`, 'statistic(x) => x', 'k = str.length(statistic)', ...plotted(['k']));
        expect(meta(src).map((m) => [m.name, m.varId])).toEqual([['statistic', 'statistic']]);
        expect(await firstValues(new Indicator(src, { statistic: 'Median' }), ['k'], 1)).toEqual({ k: [6] });
    });

    it('a display combination has no single value; an empty tooltip is omitted', () => {
        const m = meta(pine('a = input.int(100, "A", display = display.all - display.status_line)', 'b = input.int(1, "B", tooltip = "")'));
        expect(m[0].display).toBeUndefined();
        expect(m[1].tooltip).toBeUndefined();
    });
});

describe('input argument checks', () => {
    it('na defaults', () => {
        for (const [fn, col] of [
            ['input.int', 15],
            ['input.float', 17],
            ['input.string', 18],
            ['input.time', 16],
            ['input.price', 17],
            ['input.session', 19],
            ['input.symbol', 18],
            ['input.timeframe', 21],
            ['input.text_area', 21],
            ['input.color', 17],
        ] as const) {
            fails([`a = ${fn}(na)`], `The "defval" parameter of the "${fn}()" function cannot accept a "na" argument. at 3:${col}`);
        }
        fails(
            ['b = input.bool(na)'],
            'Cannot call "input.bool" with argument "defval"="na". An argument of "simple na" type was used but a "const bool"  is expected. at 3:16',
        );
        fails(['a = input(na)'], 'Arguments of input function must be of constant type, or "source" builtin variables. at 3:5');
        fails(
            ['a = input.source(na)'],
            'Invalid value for the "defval" parameter of the "input.source" function. Possible values: [open, high, low, close, hl2, hlc3, ohlc4, hlcc4]. at 3:5',
        );
    });

    it('a constant of the wrong type', () => {
        const err = (fn: string, param: string, desc: string, used: string, expected: string, at: string) =>
            `Cannot call "${fn}" with argument "${param}"="${desc}". An argument of "${used}" type was used but a "const ${expected}"  is expected. at ${at}`;
        fails(['b = input.bool(1)'], err('input.bool', 'defval', '1', 'literal int', 'bool', '3:16'));
        fails(['c = input.color("red")'], err('input.color', 'defval', 'red', 'literal string', 'color', '3:17'));
        fails(['a = input.float("1")'], err('input.float', 'defval', '1', 'literal string', 'float', '3:17'));
        fails(['a = input.float(true)'], err('input.float', 'defval', 'true', 'literal bool', 'float', '3:17'));
        fails(['a = input.int(2.5)'], err('input.int', 'defval', '2.5', 'literal float', 'int', '3:15'));
        fails(['a = input.int(5.0)'], err('input.int', 'defval', '5', 'literal float', 'int', '3:15'));
        fails(['a = input.int(-2.5)'], err('input.int', 'defval', 'call "operator -" (const float)', 'const float', 'int', '3:15'));
        fails(['a = input.int(1.5 * 2)'], err('input.int', 'defval', 'call "operator *" (const float)', 'const float', 'int', '3:15'));
        fails(['F = 2.5', 'a = input.int(F)'], err('input.int', 'defval', 'F', 'const float', 'int', '4:15'));
        fails(['a = input.bool(1 + 1)'], err('input.bool', 'defval', 'call "operator +" (const int)', 'const int', 'bool', '3:16'));
        fails(['L = 1', 'a = input.bool(L)'], err('input.bool', 'defval', 'L', 'const int', 'bool', '4:16'));
        fails(['S = "red"', 'a = input.color(S)'], err('input.color', 'defval', 'S', 'const string', 'color', '4:17'));
        fails(['s = input.string(5)'], err('input.string', 'defval', '5', 'literal int', 'string', '3:18'));
        fails(['a = input.time(1.5)'], err('input.time', 'defval', '1.5', 'literal float', 'int', '3:16'));
        fails(['a = input.int(1, 5)'], err('input.int', 'title', '5', 'literal int', 'string', '3:18'));
        fails(['a = input.int(10, step = 0.5)'], err('input.int', 'step', '0.5', 'literal float', 'int', '3:26'));
        fails(['a = input.int(5, minval = 1.5)'], err('input.int', 'minval', '1.5', 'literal float', 'int', '3:27'));
        fails(
            ['a = input.float(1, options = [1, "x"])'],
            'Cannot call "input.float" with argument "options"="1,x". An argument of "[literal int, literal string]" type was used but a "[const float...]"  is expected. at 3:30',
        );
        fails(
            ['a = input.string("a", options = ["a", 1])'],
            'Cannot call "input.string" with argument "options"="a,1". An argument of "[literal string, literal int]" type was used but a "[const string...]"  is expected. at 3:33',
        );
    });

    it('constants of an accepted type compile', () => {
        compiles(['a = input.float(1, "A")', 'b = input.float(-2)', 'c = input.price(42)']);
        compiles([
            'color C = #089981',
            'color D = color.new(C, 50)',
            'a = input.color(C, "A")',
            'b = input.color(D, "B")',
            'c = input.color(#00ff0080)',
        ]);
        compiles(['var string G = "Core"', 'string POS = "Top"', 'a = input.string(POS, "P", options = [POS, "Bottom"], group = G)']);
    });

    it('the default must lie within minval and maxval', () => {
        const msg = `Input's "defval" value must be between "minval" and "maxval"`;
        fails(['a = input.float(5, minval = 0, maxval = 1)'], `${msg} at 3:17`);
        fails(['a = input.float(-1, minval = 0)'], `${msg} at 3:17`);
        fails(['a = input.float(1, minval = 5, maxval = 2)'], `${msg} at 3:17`);
        fails(['a = input.int(50, minval = 1, maxval = 10)'], `${msg} at 3:15`);
        fails(['a = input.int(10, maxval = 5)'], `${msg} at 3:15`);
        compiles(['a = input.int(1, minval = 1, maxval = 1)']);
    });

    it('the default must be one of the options', () => {
        fails(['a = input.float(2, options = [1, 3])'], `input's defval should be in options, but 2 is not in [1, 3] at 3:17`);
        fails(['a = input.float(1.25, options = [1.5, 2.75])'], `input's defval should be in options, but 1.25 is not in [1.5, 2.75] at 3:17`);
        fails(['a = input.float(-1, options = [-3.14, 0])'], `input's defval should be in options, but -1 is not in [-3.14, 0] at 3:17`);
        fails(['a = input.int(4, options = [1, 2, 3])'], `input's defval should be in options, but 4 is not in [1, 2, 3] at 3:15`);
        fails(['m = input.string("WMA", options = ["SMA", "EMA"])'], `input's defval should be in options, but 'WMA' is not in [SMA, EMA] at 3:18`);
        fails(['a = input.string("x", options = ["a b", "c"])'], `input's defval should be in options, but 'x' is not in [a b, c] at 3:18`);
        fails(
            ['a = input.session("0000-0100", options = ["0930-1600"])'],
            `input's defval should be in options, but '0000-0100' is not in [0930-1600] at 3:19`,
        );
        fails(['a = input.timeframe("60", options = ["D", "W"])'], `input's defval should be in options, but '60' is not in [D, W] at 3:21`);
        fails(
            ['enum E', '    a', '    b', '    c', 'e = input.enum(E.c, options = [E.a, E.b])'],
            `input's defval should be in options, but 'E.c' is not in [E.a, E.b] at 7:16`,
        );
    });

    it('input.enum fields must belong to one enum', () => {
        fails(
            ['enum E', '    a', '    b', 'enum F', '    x', 'e = input.enum(E.a, options = [E.a, F.x])'],
            'All values passed to "input.enum()" as its "defval" or "options" must be fields of the same enum. at 8:5',
        );
    });

    it('named arguments must exist on the function', () => {
        fails(['a = input.int(1, foo = 2)'], 'The "input.int" function does not have an argument with the name "foo" at 3:18');
        fails(['a = input(1, options = [1, 2])'], 'The "input" function does not have an argument with the name "options" at 3:14');
        fails(['a = input.bool(true, options = [true])'], 'The "input.bool" function does not have an argument with the name "options" at 3:22');
        fails(
            ['a = input.source(close, options = [close])'],
            'The "input.source" function does not have an argument with the name "options" at 3:25',
        );
        fails(['a = input.text_area("x", inline = "i")'], 'The "input.text_area" function does not have an argument with the name "inline" at 3:26');
    });
});

describe('input runtime behavior', () => {
    it('inputs declared in an if/else read the branch that ran', async () => {
        const src = pine('var k = 0', 'if bar_index > 1', '    k := input.int(14)', 'else', '    k := input.int(200)', ...plotted(['k']));
        expect(await firstValues(new Indicator(src), ['k'])).toEqual({ k: [200, 200, 14] });
        expect(await firstValues(new Indicator(src, { in_0: 3, in_1: 7 }), ['k'])).toEqual({ k: [7, 7, 3] });
    });

    it('input.enum with options runs', async () => {
        const src = pine(
            'enum E',
            '    a = "Alpha"',
            '    b = "Beta"',
            '    c = "Gamma"',
            'e = input.enum(E.c, "E", options = [E.a, E.c])',
            'x = e == E.c ? 1 : 0',
            ...plotted(['x']),
        );
        expect(await firstValues(new Indicator(src), ['x'])).toEqual({ x: [1, 1, 1] });
    });

    it('color inputs carry TradingView palette values', async () => {
        const src = pine(
            'd = input.color(true ? color.blue : color.red, "D")',
            'r = color.r(d)',
            'g = color.g(d)',
            'b = color.b(d)',
            'c = input.color(color.rgb(1, 2, 3, 40), "C")',
            't = color.t(c)',
            ...plotted(['r', 'g', 'b', 't']),
        );
        expect(meta(src)[0].defval).toBe('#2962FFFF');
        expect(await firstValues(new Indicator(src), ['r', 'g', 'b', 't'], 1)).toEqual({ r: [41], g: [98], b: [255], t: [40] });
    });

    it('timestamp() with a non-ISO date string uses the exchange timezone, not the machine timezone', async () => {
        const src = pine('t = input.time(timestamp("04 Mar 2024 00:00"), "Anchor")', 'u = timestamp("04 Mar 2024 00:00")', ...plotted(['t', 'u']));
        expect(await firstValues(new Indicator(src), ['t', 'u'], 1)).toEqual({ t: [1709510400000], u: [1709510400000] });
    });

    it('an input in a for loop is one input read on every iteration', async () => {
        const src = pine('s = 0.0', 'for i = 0 to 2', '    s += input.float(0.5, "Step")', ...plotted(['s']));
        expect(meta(src)).toHaveLength(1);
        expect(await firstValues(new Indicator(src), ['s'])).toEqual({ s: [1.5, 1.5, 1.5] });
    });
});
