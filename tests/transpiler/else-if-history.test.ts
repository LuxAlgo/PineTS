import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// TradingView evaluates an `else if` condition only when the earlier branches were not taken, but a
// history series in it (`f()[1]`) is recorded on every bar the `if` statement runs, the same as one
// in a lazy `?:` / `and` operand. `ta.cum(1)[1] == bar_index` therefore holds on every bar where
// the condition is reached, while a plain `ta.cum(1)` there only counts the bars that reach it.

const mk = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2019-01-01').getTime(), new Date('2019-06-01').getTime());

const values = (plots: any, title: string) => plots[title].data.map((p: any) => p.value);

async function run(body: string) {
    const { plots } = await mk().run(`//@version=6
indicator("else-if history")
odd = bar_index % 2 == 1
${body}
`);
    return plots;
}

// 2 on even bars, `odd` on odd bars (from bar 1, where `[1]` exists).
const expectOddBars = (out: number[], odd: number) => {
    expect(out.length).toBeGreaterThan(50);
    out.forEach((v, i) => expect(v, `bar ${i}`).toBe(i % 2 === 0 ? 2 : odd));
};

describe('history series in an else-if condition', () => {
    it('records `ta.cum(1)[1]` on every bar', async () => {
        const plots = await run(`
r = 0
if not odd
    r := 2
else if ta.cum(1)[1] == bar_index
    r := 1
plot(r, "r")
`);
        expectOddBars(values(plots, 'r'), 1);
    });

    it('keeps a plain call in the condition lazy', async () => {
        const plots = await run(`
r = 0
if not odd
    r := 2
else if ta.cum(1) == bar_index + 1
    r := 1
plot(r, "r")
`);
        expectOddBars(values(plots, 'r'), 0);
    });

    it('records the series when it is a function argument or inside an expression', async () => {
        const plots = await run(`
r1 = 0
if not odd
    r1 := 2
else if math.max(ta.cum(1)[1], 0) == bar_index
    r1 := 1
plot(r1, "elseifArg")
r2 = not odd ? 2 : math.max(ta.cum(1)[1], 0) == bar_index ? 1 : 0
plot(r2, "ternaryArg")
r3 = odd and math.max(ta.cum(1)[1], 0) == bar_index ? 1 : (not odd ? 2 : 0)
plot(r3, "andArg")
r4 = 0
if not odd
    r4 := 2
else if math.max((close - open)[1], -1e12) == close[1] - open[1]
    r4 := 1
plot(r4, "elseifExpr")
`);
        for (const t of ['elseifArg', 'ternaryArg', 'andArg', 'elseifExpr']) {
            expectOddBars(values(plots, t), 1);
        }
    });

    it('records it for every link of the chain and inside a user function', async () => {
        const plots = await run(`
g(bool o) =>
    r = 0
    if not o
        r := 2
    else if ta.cum(1)[1] == bar_index
        r := 1
    r
plot(g(odd), "fn")
r = 0
if not odd
    r := 2
else if bar_index % 3 == 0
    r := 3
else if ta.cum(1)[1] == bar_index
    r := 1
plot(r, "third")
`);
        expectOddBars(values(plots, 'fn'), 1);
        values(plots, 'third').forEach((v: number, i: number) => expect(v, `bar ${i}`).toBe(i % 2 === 0 ? 2 : i % 3 === 0 ? 3 : 1));
    });

    it('records it where the enclosing block runs, not on every bar', async () => {
        const plots = await run(`
r = 0
if bar_index % 3 != 0
    if not odd
        r := 2
    else if ta.cum(1)[1] == math.floor(bar_index * 2 / 3)
        r := 1
plot(r, "r")
`);
        // The block runs on bars with i % 3 != 0; at such a bar, the record's previous value counts
        // the block runs before it: floor(2i / 3). Bar 1 is the first run, where `[1]` is na.
        values(plots, 'r').forEach((v: number, i: number) => expect(v, `bar ${i}`).toBe(i % 3 === 0 ? 0 : i % 2 === 0 ? 2 : i === 1 ? 0 : 1));
    });

    it('leaves a history reference in a block body per execution', async () => {
        const plots = await run(`
r = 0
if odd
    r := ta.cum(1)[1] == bar_index ? 1 : 0
plot(r, "r")
`);
        expect(values(plots, 'r').every((v: number) => v === 0)).toBe(true);
    });

    it('matches a reference trend built from every-bar 10-bar extremes', async () => {
        // From the first BTCUSDT bar: on 2017-09-04 the low breaks the 10-bar low of every bar but
        // not the low of the bars that reached the `else if`.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDT', 'D', null, new Date('2017-08-17').getTime(), new Date('2018-01-01').getTime());
        const { plots } = await pineTS.run(`//@version=6
indicator("trend")
var int trend = 1
if high > ta.highest(high, 10)[1]
    trend := 1
else if low < ta.lowest(low, 10)[1]
    trend := -1
plot(trend, "trend")
plot(high, "high")
plot(low, "low")
`);
        const high = values(plots, 'high');
        const low = values(plots, 'low');
        const expected: number[] = [];
        let trend = 1;
        for (let i = 0; i < high.length; i++) {
            if (i >= 10) {
                const hh = Math.max(...high.slice(i - 10, i));
                const ll = Math.min(...low.slice(i - 10, i));
                if (high[i] > hh) trend = 1;
                else if (low[i] < ll) trend = -1;
            }
            expected.push(trend);
        }
        expect(expected).toContain(-1);
        expect(values(plots, 'trend')).toEqual(expected);
    });
});
