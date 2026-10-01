import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Member chains (`m0.body`, `pts.last().price`, `o.inner.body`), built-in namespace
// variables (`ta.tr[1]`, `strategy.closedtrades[1]`) and `strategy.closedtrades.X(...)`
// inside conditions, call arguments and function return values. Series are built from
// bar_index or recomputed from the bars, so the expected value on bar i is computed by
// hand; every shape was checked against TradingView.

type Bar = { i: number; open: number; high: number; low: number; close: number; volume: number };

async function run(body: string, decl = 'indicator("member access")') {
    const src = `//@version=6
${decl}
${body}
plot(bar_index, "bi")
plot(open, "o")
plot(high, "h")
plot(low, "l")
plot(close, "c")
plot(volume, "v")`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(src);
    const col = (t: string) => plots[t].data.map((d: any) => d.value);
    const [bi, o, h, l, c, v] = ['bi', 'o', 'h', 'l', 'c', 'v'].map(col);
    const times = plots['bi'].data.map((d: any) => d.time);
    const bars: Bar[] = bi.map((i: number, k: number) => ({ i, open: o[k], high: h[k], low: l[k], close: c[k], volume: v[k] }));
    expect(bars.length).toBeGreaterThan(40);
    // Plot data omits na bars, so a missing value reads as na.
    const get = (title: string) => {
        expect(plots[title], `plot "${title}"`).toBeDefined();
        const byTime = new Map(plots[title].data.map((d: any) => [d.time, d.value]));
        return times.map((t: number) => (byTime.has(t) ? byTime.get(t) : NaN)) as number[];
    };
    return { bars, times: times as number[], get };
}

function expectSeries(values: number[], expected: (k: number) => number, from = 0) {
    for (let k = from; k < values.length; k++) {
        const e = expected(k);
        if (Number.isNaN(e)) expect(values[k], `bar ${k}`).toBeNaN();
        else expect(values[k], `bar ${k}`).toBeCloseTo(e, 8);
    }
}

// `ta.tr` is na on bar 0 (no previous close), so expectations reading it start at bar 1 or later.
const trueRange = (bars: Bar[], k: number) =>
    Math.max(bars[k].high - bars[k].low, Math.abs(bars[k].high - bars[k - 1].close), Math.abs(bars[k].low - bars[k - 1].close));

describe('member chains inside expressions', () => {
    const UDT = `
type M
    float body
type P
    float price
    int idx
type Outer
    M inner
m0 = M.new(bar_index % 2 == 0 ? 1.0 : -1.0)
var pts = array.new<P>()
pts.push(P.new(bar_index * 1.0, bar_index))
o = Outer.new(M.new(bar_index * 2.0))`;

    it('lowers field access on a global in a function return value', async () => {
        const { get } = await run(`${UDT}
retCmp() =>
    m0.body > 0.0
retGet(int i) =>
    pts.get(i).price == bar_index
retLast() =>
    pts.last().price - 1
retNested() =>
    o.inner.body / 2
plot(retCmp() ? 1 : 0, "retCmp")
plot(retGet(pts.size() - 1) ? 1 : 0, "retGet")
plot(retLast(), "retLast")
plot(retNested(), "retNested")`);
        expectSeries(get('retCmp'), (i) => (i % 2 === 0 ? 1 : 0));
        expectSeries(get('retGet'), () => 1);
        expectSeries(get('retLast'), (i) => i - 1);
        expectSeries(get('retNested'), (i) => i);
    });

    it('lowers field access in if conditions, and chains and call arguments', async () => {
        const { get } = await run(`${UDT}
ifCond() =>
    r = 0
    if pts.last().price > 3 and m0.body > 0
        r := 1
    r
callArg() =>
    math.max(pts.last().price - 10, o.inner.body * 0)
andChain() =>
    pts.size() > 1 and pts.get(pts.size() - 2).price == bar_index - 1
g = 0
if pts.last().price > 3
    g := 1
plot(ifCond(), "ifCond")
plot(callArg(), "callArg")
plot(andChain() ? 1 : 0, "andChain")
plot(g, "globalIf")
plot(math.max(pts.last().price - 10, 0), "globalArg")
plot(o.inner.body * 2, "globalNested")`);
        expectSeries(get('ifCond'), (i) => (i > 3 && i % 2 === 0 ? 1 : 0));
        expectSeries(get('callArg'), (i) => Math.max(i - 10, 0));
        expectSeries(get('andChain'), (i) => (i >= 1 ? 1 : 0));
        expectSeries(get('globalIf'), (i) => (i > 3 ? 1 : 0));
        expectSeries(get('globalArg'), (i) => Math.max(i - 10, 0));
        expectSeries(get('globalNested'), (i) => i * 4);
    });

    it('lowers the fields of a local UDT in a returned tuple', async () => {
        const { get } = await run(`${UDT}
pair() =>
    P loc = P.new(bar_index * 10.0, bar_index)
    [loc.price, loc.idx]
[pv, pidx] = pair()
plot(pv, "tuplePrice")
plot(pidx, "tupleIdx")`);
        expectSeries(get('tuplePrice'), (i) => i * 10);
        expectSeries(get('tupleIdx'), (i) => i);
    });

    it('lowers enum members compared in a function return value', async () => {
        const { get } = await run(`
enum Phase
    idle
    busy
st = bar_index % 3 == 0 ? Phase.busy : Phase.idle
isBusy() =>
    st == Phase.busy
plot(isBusy() ? 1 : 0, "isBusy")`);
        expectSeries(get('isBusy'), (i) => (i % 3 === 0 ? 1 : 0));
    });
});

describe('history of a built-in ta variable inside expressions', () => {
    it('reads ta.tr / ta.obv N bars back in call arguments, conditions and return values', async () => {
        const { bars, get } = await run(`
n = 2
up = 0
if ta.tr > ta.tr[1]
    up := 1
prevTr() =>
    ta.tr[1] + 0
plot(ta.tr[1] * 2, "trPrev2x")
plot(ta.obv - ta.obv[1], "obvDiff")
plot(up, "trUp")
plot(prevTr(), "fnPrevTr")
plot(ta.tr[n] + 0, "varOffset")`);
        const tr = (k: number) => trueRange(bars, k);
        expectSeries(get('trPrev2x'), (k) => 2 * tr(k - 1), 2);
        expectSeries(get('obvDiff'), (k) => Math.sign(bars[k].close - bars[k - 1].close) * bars[k].volume, 1);
        expectSeries(get('trUp'), (k) => (tr(k) > tr(k - 1) ? 1 : 0), 2);
        expectSeries(get('fnPrevTr'), (k) => tr(k - 1), 2);
        expectSeries(get('varOffset'), (k) => tr(k - 2), 3);
    });

    it('records the history on every bar, not only where the reference runs', async () => {
        const { bars, get } = await run(`
lazy = close > open and ta.tr[1] > ta.tr
y = -1.0
if bar_index % 3 == 0
    y := ta.tr[1]
plot(lazy ? 1 : 0, "lazyAnd")
plot(y, "inIfBlock")`);
        const tr = (k: number) => trueRange(bars, k);
        expectSeries(get('lazyAnd'), (k) => (bars[k].close > bars[k].open && tr(k - 1) > tr(k) ? 1 : 0), 2);
        expectSeries(get('inIfBlock'), (k) => (k % 3 === 0 ? tr(k - 1) : -1), 2);
    });
});

describe('history with a variable offset', () => {
    it('lowers the offset of time inside a call argument', async () => {
        const { times, get } = await run(`
n = 2
plot(time[n] / 1000 - time / 1000, "time")`);
        expectSeries(get('time'), (k) => (times[k - 2] - times[k]) / 1000, 2);
    });

    it('lowers the offset of a call result in conditions, call arguments and return expressions', async () => {
        const { get } = await run(`
n = 2
b = 0
if ta.sma(bar_index, 1)[n] > 5
    b := 1
f() =>
    ta.sma(bar_index, 1)[n] > 5 ? 1 : -1
g() =>
    ta.sma(bar_index, 1)[n] * 3
plot(b, "ifTest")
plot(f(), "fnCondition")
plot(g(), "fnBinary")
plot(ta.sma(bar_index, 1)[n] + 0, "argBinary")`);
        expectSeries(get('ifTest'), (i) => (i - 2 > 5 ? 1 : 0), 2);
        expectSeries(get('fnCondition'), (i) => (i - 2 > 5 ? 1 : -1), 2);
        expectSeries(get('fnBinary'), (i) => 3 * (i - 2), 2);
        expectSeries(get('argBinary'), (i) => i - 2, 2);
    });
});

describe('strategy.closedtrades / strategy.opentrades', () => {
    // Entry signal on bars 10k, close signal on bars 10k+5; market orders fill at the next
    // bar's open, so a trade is open on bars 10k+1 .. 10k+5 and closes on bar 10k+6.
    const DECL = 'strategy("trades", initial_capital = 1000000, default_qty_type = strategy.fixed, default_qty_value = 1)';
    const SIGNALS = `
if bar_index % 10 == 0
    strategy.entry("L", strategy.long)
if bar_index % 10 == 5
    strategy.close("L")`;
    const closedAt = (i: number) => (i >= 6 ? Math.floor((i - 6) / 10) + 1 : 0);
    const isOpen = (i: number) => i % 10 >= 1 && i % 10 <= 5;

    it('calls the namespace in strategy.closedtrades.X(...) / opentrades.X(...) inside call arguments', async () => {
        const { get } = await run(
            `${SIGNALS}
plot(strategy.closedtrades > 0 ? strategy.closedtrades.entry_bar_index(strategy.closedtrades - 1) : na, "lastEntryBar")
plot(math.max(strategy.opentrades > 0 ? strategy.opentrades.entry_bar_index(0) : -1, -1), "openEntryBar")
plot(math.abs(strategy.opentrades > 0 ? strategy.opentrades.size(0) : 0), "openSize")`,
            DECL
        );
        expectSeries(get('lastEntryBar'), (i) => (closedAt(i) > 0 ? 10 * (closedAt(i) - 1) + 1 : NaN));
        expectSeries(get('openEntryBar'), (i) => (isOpen(i) ? 10 * Math.floor(i / 10) + 1 : -1));
        expectSeries(get('openSize'), (i) => (isOpen(i) ? 1 : 0));
    });

    it('plots the counts and reads them N bars back', async () => {
        const { get } = await run(
            `${SIGNALS}
justClosed = 0
if strategy.closedtrades > strategy.closedtrades[1]
    justClosed := 1
justOpened = strategy.position_size > 0 and strategy.position_size[1] == 0
plot(strategy.closedtrades, "closed")
plot(strategy.opentrades, "open")
plot(strategy.closedtrades[1], "closedPrev")
plot(strategy.opentrades[1], "openPrev")
plot(justClosed, "justClosed")
plot(justOpened ? 1 : 0, "justOpened")`,
            DECL
        );
        expectSeries(get('closed'), closedAt);
        expectSeries(get('open'), (i) => (isOpen(i) ? 1 : 0));
        expectSeries(get('closedPrev'), (i) => closedAt(i - 1), 1);
        expectSeries(get('openPrev'), (i) => (isOpen(i - 1) ? 1 : 0), 1);
        expectSeries(get('justClosed'), (i) => (i % 10 === 6 ? 1 : 0), 1);
        expectSeries(get('justOpened'), (i) => (i % 10 === 1 ? 1 : 0), 1);
    });
});
