import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// History-referencing operator `[]` in the positions where it diverged from TradingView.
// Series are built from bar_index, so the expected value on bar i is computed by hand;
// the semantics (history of expressions and call results, an `na` offset reading the
// current bar) were checked on TradingView.

const WARMUP = 6;

async function plotsOf(body: string, decl = 'indicator("history operator")', endDate = '2024-01-03') {
    const src = `//@version=6
${decl}
${body}
plot(bar_index, "bi")`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date(endDate).getTime());
    const { plots } = await pineTS.run(src);
    const bars: [number, number][] = plots['bi'].data.map((d: any) => [d.time, d.value]);
    expect(bars.length).toBeGreaterThan(40);
    // Plot data omits na bars, so a missing value reads as na.
    return (title: string) => {
        expect(plots[title], `plot "${title}"`).toBeDefined();
        const byTime = new Map(plots[title].data.map((d: any) => [d.time, d.value]));
        return bars.map(([t, i]) => [i, byTime.has(t) ? byTime.get(t) : NaN] as [number, number]);
    };
}

function expectSeries(series: [number, number][], expected: (i: number) => number, from = WARMUP) {
    for (const [i, v] of series) {
        if (i < from) continue;
        expect(v, `bar ${i}`).toBe(expected(i));
    }
}

describe('history of a call result inside a call argument', () => {
    it('reads the call result N bars back in plot(), math.*, na() and user function arguments', async () => {
        const get = await plotsOf(`
f(x) => x
plot(ta.sma(bar_index, 1)[3], "ta")
plot(math.max(bar_index, 0)[2], "math")
plot(f(bar_index)[1], "userFn")
plot(ta.sma(bar_index, 1)[bar_index % 3], "seriesOffset")
plot(math.min(ta.sma(bar_index, 1)[2], 1e9), "nestedArg")
plot(na(ta.sma(bar_index, 3)[1]) ? 1 : 0, "naArg")`);
        expectSeries(get('ta'), (i) => i - 3);
        expectSeries(get('math'), (i) => i - 2);
        expectSeries(get('userFn'), (i) => i - 1);
        expectSeries(get('seriesOffset'), (i) => i - (i % 3));
        expectSeries(get('nestedArg'), (i) => i - 2);
        // ta.sma(…, 3) is valid from bar 2, so its [1] is valid from bar 3.
        expectSeries(get('naArg'), (i) => (i < 3 ? 1 : 0), 0);
    });

    it('reads strategy.* built-ins N bars back inside plot()', async () => {
        const get = await plotsOf(
            `plot(strategy.position_size[1], "pos")\nplot(strategy.equity[1], "equity")`,
            'strategy("history operator", initial_capital = 100000)'
        );
        expectSeries(get('pos'), () => 0);
        expectSeries(get('equity'), () => 100000);
    });

    it('matches the assigned form inside request.security()', async () => {
        const get = await plotsOf(`
g() =>
    s = ta.sma(close, 3)
    s[2]
plot(request.security(syminfo.tickerid, "D", ta.sma(close, 3)[2]), "inline")
plot(request.security(syminfo.tickerid, "D", g()), "assigned")`,
            undefined,
            '2024-01-15'
        );
        const inline = get('inline');
        const assigned = get('assigned');
        expect(assigned.filter(([, v]) => !Number.isNaN(v)).length).toBeGreaterThan(20);
        for (let k = 0; k < inline.length; k++) expect(inline[k][1]).toBe(assigned[k][1]);
    });
});

describe('history of a parenthesized expression', () => {
    it('applies the offset in assignments and in call arguments', async () => {
        const get = await plotsOf(`
a = (bar_index * 2)[1]
plot(a, "binAssign")
plot((bar_index * 2)[1], "binArg")
b = (bar_index % 2 == 0 ? bar_index : -bar_index)[1]
plot(b, "ternAssign")
plot((bar_index % 2 == 0 ? bar_index : -bar_index)[1], "ternArg")
c = (bar_index % 2 == 0)[1] ? 1 : 0
plot(c, "boolAssign")
plot((bar_index % 2 == 0)[1] ? 1 : 0, "boolArg")
d = (-bar_index)[2]
plot(d, "unaryAssign")
e = (bar_index % 2 == 0 and bar_index % 3 == 0)[1] ? 1 : 0
plot(e, "logicalAssign")`);
        const tern = (i: number) => ((i - 1) % 2 === 0 ? i - 1 : -(i - 1));
        const even = (i: number) => ((i - 1) % 2 === 0 ? 1 : 0);
        expectSeries(get('binAssign'), (i) => 2 * (i - 1));
        expectSeries(get('binArg'), (i) => 2 * (i - 1));
        expectSeries(get('ternAssign'), tern);
        expectSeries(get('ternArg'), tern);
        expectSeries(get('boolAssign'), even);
        expectSeries(get('boolArg'), even);
        expectSeries(get('unaryAssign'), (i) => -(i - 2));
        expectSeries(get('logicalAssign'), (i) => ((i - 1) % 6 === 0 ? 1 : 0));
    });
});

describe('an na offset reads the current bar', () => {
    it('in assignments, plot() / math.* / na() arguments, for int and float offsets', async () => {
        const get = await plotsOf(`
int k = bar_index % 2 == 0 ? na : 1
float kf = bar_index % 2 == 0 ? na : 1.0
x = bar_index[k]
plot(x, "assign")
plot(bar_index[k], "plotArg")
plot(math.max(bar_index[k], 0), "mathArg")
plot(na(bar_index[k]) ? -1 : 1, "naArg")
y = bar_index[kf]
plot(y, "float")
plot(close[k] == (bar_index % 2 == 0 ? close : close[1]) ? 1 : 0, "close")`);
        const cur = (i: number) => (i % 2 === 0 ? i : i - 1);
        expectSeries(get('assign'), cur);
        expectSeries(get('plotArg'), cur);
        expectSeries(get('mathArg'), cur);
        expectSeries(get('naArg'), () => 1);
        expectSeries(get('float'), cur);
        expectSeries(get('close'), () => 1);
    });
});

describe('a built-in series used as the offset inside a call argument', () => {
    it('uses its current value', async () => {
        const get = await plotsOf(`
g(v) => v
plot(bar_index[bar_index], "plotArg")
plot(g(bar_index[bar_index]), "userFnArg")
plot(math.max(bar_index[bar_index], -1), "mathArg")
plot(close[bar_index] == close[bar_index] ? 1 : 0, "closeArg")`);
        expectSeries(get('plotArg'), () => 0);
        expectSeries(get('userFnArg'), () => 0);
        expectSeries(get('mathArg'), () => 0);
        expectSeries(get('closeArg'), () => 1);
    });
});

describe('a function parameter used as the offset on a call result', () => {
    it('uses the parameter value, whether the call is assigned or passed as an argument', async () => {
        const get = await plotsOf(`
k = 3
f4(x, n) => ta.sma(x, 1)[n]
f5(x, n) => (x * 2)[n]
f6(x) => ta.sma(x, 1)[k]
f7(x) => (x * 2)[bar_index % 3]
plot(f4(bar_index, 2), "arg")
y = f4(bar_index, 2)
plot(y, "assigned")
plot(f4(bar_index, bar_index % 3), "seriesArg")
plot(f5(bar_index, 1), "expr")
plot(f6(bar_index), "globalOffset")
plot(f7(bar_index), "builtinExprOffset")`);
        expectSeries(get('arg'), (i) => i - 2);
        expectSeries(get('assigned'), (i) => i - 2);
        expectSeries(get('seriesArg'), (i) => i - (i % 3));
        expectSeries(get('expr'), (i) => 2 * (i - 1));
        expectSeries(get('globalOffset'), (i) => i - 3);
        expectSeries(get('builtinExprOffset'), (i) => 2 * (i - (i % 3)));
    });
});
