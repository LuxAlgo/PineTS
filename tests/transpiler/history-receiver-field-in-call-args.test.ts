// SPDX-License-Identifier: AGPL-3.0-only
// A field read on a history reference, `(obj[n]).field`, used as a call argument.
//
// The statement walker lowers the form to `$.get(<obj>, n).field`, but an argument wrapped in
// `<ns>.param(...)` never reaches that walker: the receiver `obj[n]` was emitted verbatim, with
// `obj` not even scoped. The closed-world verifier then rejected the generated code ("dynamic
// computed member access is not allowed", or `Undeclared identifier "obj"` for a literal index),
// so a valid script such as
//     math.avg((bar[barIndex]).high, (bar[barIndex]).low)
// could not be compiled.
//
// Each control is computed by an independent path: `bar` is a per-bar instance whose fields copy
// the built-in series, so `(bar[n]).high` is `high[n]` by definition. `k` never exceeds
// `bar_index`, so no read reaches before the first bar.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { transpile } from '../../src/transpiler/index';

const HEADER = `//@version=6
indicator("history receiver field in call args")
type INNER
    float px = close
type BAR
    float high = high
    float low = low
    int index = bar_index
    INNER inner
BAR bar = BAR.new(inner = INNER.new())
k = math.min(bar_index, 2)
`;

async function plotsOf(body: string): Promise<Record<string, string[]>> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());
    const { plots } = await pineTS.run(HEADER + body);
    const out: Record<string, string[]> = {};
    for (const [name, p] of Object.entries<any>(plots)) {
        out[name] = p.data.map((d: any) => (d.value === null || d.value === undefined || Number.isNaN(d.value) ? 'na' : Number(d.value).toFixed(6)));
    }
    return out;
}

function expectSame(p: Record<string, string[]>, got: string, want: string, minValues = 40) {
    expect(p[got], `plot "${got}"`).toBeDefined();
    expect(p[got].length).toBeGreaterThan(40);
    expect(p[got]).toEqual(p[want]);
    expect(p[got].filter((v) => v !== 'na').length).toBeGreaterThanOrEqual(minValues);
}

describe('(obj[n]).field as a call argument', () => {
    it('compiles the reported statement: math.avg((bar[barIndex]).high, (bar[barIndex]).low)', () => {
        expect(() =>
            transpile(`${HEADER}var pts = array.new<chart.point>()
if barstate.islast
    barIndex = k
    for arrayIndex = 0 to 2
        pts.push(chart.point.from_index((bar[barIndex]).index, math.avg((bar[barIndex]).high, (bar[barIndex]).low)))
plot(close)`)
        ).not.toThrow();
    });

    it('built-in namespace arguments read the instance n bars back', async () => {
        const p = await plotsOf(`plot(math.avg((bar[k]).high, (bar[k]).low), "avg")
plot(math.avg(high[k], low[k]), "avg ctrl")
plot(ta.sma((bar[k]).high, 3), "sma")
plot(ta.sma(high[k], 3), "sma ctrl")
plot(nz((bar[k]).low), "nz")
plot(nz(low[k]), "nz ctrl")
plot((bar[k]).high, "direct")
plot(high[k], "direct ctrl")
plot(series = (bar[k]).low, title = "named")
plot(low[k], "named ctrl")
plot(array.from((bar[k]).high, (bar[k]).low).sum(), "from")
plot(high[k] + low[k], "from ctrl")
plot(str.tonumber(str.tostring((bar[k]).index)), "str")
plot(bar_index[k], "str ctrl")`);
        expectSame(p, 'avg', 'avg ctrl');
        expectSame(p, 'sma', 'sma ctrl');
        expectSame(p, 'nz', 'nz ctrl');
        expectSame(p, 'direct', 'direct ctrl');
        expectSame(p, 'named', 'named ctrl');
        expectSame(p, 'from', 'from ctrl');
        expectSame(p, 'str', 'str ctrl');
    });

    it('inside an arithmetic or unary argument', async () => {
        const p = await plotsOf(`plot(math.max((bar[k]).high + 1, 0), "binary")
plot(math.max(high[k] + 1, 0), "binary ctrl")
plot(math.max((bar[k]).high - (bar[k]).low, 0), "both sides")
plot(math.max(high[k] - low[k], 0), "both sides ctrl")
plot(math.abs(-(bar[k]).low), "unary")
plot(math.abs(-low[k]), "unary ctrl")`);
        expectSame(p, 'binary', 'binary ctrl');
        expectSame(p, 'both sides', 'both sides ctrl');
        expectSame(p, 'unary', 'unary ctrl');
    });

    it('literal, expression, call and loop-variable offsets', async () => {
        const p = await plotsOf(`float lit = na
float litCtrl = na
float expr = na
float exprCtrl = na
float call = na
float callCtrl = na
if bar_index >= 3
    lit := math.max((bar[1]).high, 0)
    litCtrl := math.max(high[1], 0)
    expr := math.max((bar[k + 1]).high, 0)
    exprCtrl := math.max(high[k + 1], 0)
    call := math.max((bar[math.min(k, 1)]).high, 0)
    callCtrl := math.max(high[math.min(k, 1)], 0)
plot(lit, "lit")
plot(litCtrl, "lit ctrl")
plot(expr, "expr")
plot(exprCtrl, "expr ctrl")
plot(call, "call")
plot(callCtrl, "call ctrl")
float loop = 0.0
float loopCtrl = 0.0
for i = 0 to k
    loop += math.max((bar[i]).high, 0)
    loopCtrl += math.max(high[i], 0)
plot(loop, "loop")
plot(loopCtrl, "loop ctrl")`);
        expectSame(p, 'lit', 'lit ctrl');
        expectSame(p, 'expr', 'expr ctrl');
        expectSame(p, 'call', 'call ctrl');
        expectSame(p, 'loop', 'loop ctrl');
    });

    it('a nested field chain on the history reference', async () => {
        const p = await plotsOf(`plot(math.max((bar[k]).inner.px, 0), "nested")
plot(math.max(close[k], 0), "nested ctrl")`);
        expectSame(p, 'nested', 'nested ctrl');
    });

    it('user function arguments, and a parameter as the receiver', async () => {
        const p = await plotsOf(`twice(float v) => v * 2
plot(twice((bar[k]).high), "udf arg")
plot(twice(high[k]), "udf arg ctrl")
mid(BAR b, int m) => math.avg((b[m]).high, (b[m]).low)
plot(mid(bar, k), "param")
plot(math.avg(high[k], low[k]), "param ctrl")`);
        expectSame(p, 'udf arg', 'udf arg ctrl');
        expectSame(p, 'param', 'param ctrl');
    });
});
