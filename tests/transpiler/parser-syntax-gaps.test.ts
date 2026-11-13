// SPDX-License-Identifier: AGPL-3.0-only
// Comma-separated declarations in a function body, dotted parameter types with `[]`, and the v6 `once`
// structure. Each expected value is what TradingView shows on every bar of the same script (BINANCE:BTCUSDT 1h);
// the realtime and compile-error cases of `once` follow the Pine User Manual (Conditional structures).

import { describe, it, expect, vi } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';

async function run(body: string, version = 6) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2025, 0, 1), Date.UTC(2025, 0, 2));
    const { plots } = await pineTS.run(`//@version=${version}\nindicator("t")\n${body}`);
    const col = (title: string) => plots[title].data.map((d: any) => d.value);
    return col;
}

describe('comma-separated declarations inside a function body (16)', () => {
    it('accepts var, typed and tuple declarations followed by other statements on the same line', async () => {
        const col = await run(`
g() => [close, open]
f() =>
    var a = 0., var b = 0., c = close
    a + b + c
k() =>
    [x, y] = g(), d = x - y, var e = 1.0, e += 1, d + e
m() =>
    var float s = 0., s += close, float t = s / 2, t
n() =>
    float t = 1.0, t * 2
q() =>
    int i = 3, float j = i / 2, j + 0.25
plot(f(), "f")
plot(k(), "k")
plot(m(), "m")
plot(n(), "n")
plot(q(), "q")
plot(close, "close")
plot(open, "open")
plot(bar_index, "bi")
`);
        const close = col('close');
        const open = col('open');
        let sum = 0;
        col('bi').forEach((bi: number, i: number) => {
            sum += close[i];
            expect(col('f')[i]).toBeCloseTo(close[i], 8);
            expect(col('k')[i]).toBeCloseTo(close[i] - open[i] + bi + 2, 8);
            expect(col('m')[i]).toBeCloseTo(sum / 2, 6);
            expect(col('n')[i]).toBe(2);
            expect(col('q')[i]).toBe(1.75);
        });
    });
});

describe('dotted parameter types (17)', () => {
    it('parses chart.point[] / chart.point / array<chart.point> parameters', async () => {
        const col = await run(`
f(chart.point[] pts) =>
    pts.size()
g(chart.point p) =>
    p.price
h(array<chart.point> pts, simple int n) =>
    pts.size() * n
var chart.point[] ps = array.new<chart.point>()
if ps.size() < 3
    ps.push(chart.point.from_index(bar_index, close))
plot(f(ps), "f")
plot(g(chart.point.from_index(bar_index, close)) - close, "g")
plot(h(ps, 2), "h")
`);
        expect(col('f')).toEqual(col('f').map((_: number, i: number) => Math.min(i + 1, 3)));
        expect(col('g').every((v: number) => v === 0)).toBe(true);
        expect(col('h')).toEqual(col('f').map((v: number) => v * 2));
    });
});

describe('once (v6)', () => {
    it('runs its block the first time the condition is true, per call site, and never again', async () => {
        const col = await run(`
var float atThree = na
once bar_index >= 3
    atThree := bar_index
var int runs = 0
once bar_index % 4 == 1
    runs += 1
var int d = 0
once
    d += 1
f(float src) =>
    var float v = na
    once src > 5
        v := src
    v
var float inIf = na
if bar_index % 2 == 0
    once bar_index >= 3
        inIf := bar_index
var float nested = na
once bar_index >= 2
    once bar_index == 5
        nested := 1
float naCond = na
var int naRuns = 0
once naCond > 0
    naRuns += 1
plot(atThree, "atThree")
plot(runs, "runs")
plot(d, "d")
plot(f(bar_index), "a")
plot(f(bar_index * 2), "b")
plot(inIf, "inIf")
plot(nested, "nested")
plot(naRuns, "naRuns")
plot(bar_index, "bi")
`);
        col('bi').forEach((bi: number, i: number) => {
            if (bi < 3) expect(col('atThree')[i]).toBeNaN();
            else expect(col('atThree')[i]).toBe(3);
            expect(col('runs')[i]).toBe(bi >= 1 ? 1 : 0);
            expect(col('d')[i]).toBe(1);
            // Separate call sites: bar_index > 5 first at bar 6, 2 * bar_index > 5 first at bar 3.
            if (bi < 6) expect(col('a')[i]).toBeNaN();
            else expect(col('a')[i]).toBe(6);
            if (bi < 3) expect(col('b')[i]).toBeNaN();
            else expect(col('b')[i]).toBe(6);
            // Inside an if: the block first runs on an even bar >= 3.
            if (bi < 4) expect(col('inIf')[i]).toBeNaN();
            else expect(col('inIf')[i]).toBe(4);
            // The outer block ran at bar 2, when the inner condition was false: never again.
            expect(col('nested')[i]).toBeNaN();
            expect(col('naRuns')[i]).toBe(0);
        });
    });

    it('does not evaluate the condition after the block has run', async () => {
        const col = await run(`
var calls = array.new<int>()
cond(int[] a) =>
    a.push(1)
    bar_index >= 3
var int runs = 0
once cond(calls)
    runs += 1
plot(calls.size(), "calls")
plot(runs, "runs")
plot(bar_index, "bi")
`);
        col('bi').forEach((bi: number, i: number) => {
            expect(col('calls')[i]).toBe(Math.min(bi + 1, 4));
            expect(col('runs')[i]).toBe(bi >= 3 ? 1 : 0);
        });
    });

    it('keeps `once` usable as a variable name in Pine v6', async () => {
        const col = await run(`
once = close
once := once + 1
var int above = 0
if close + 2 > once
    above += 1
plot(once - close, "d")
plot(above, "above")
plot(bar_index, "bi")
`);
        expect(col('d').every((v: number) => Math.abs(v - 1) < 1e-9)).toBe(true);
        col('bi').forEach((bi: number, i: number) => expect(col('above')[i]).toBe(bi + 1));
    });
});

// Pine User Manual, Conditional structures, "`once` on the realtime bar": a `once` that has not fired yet is
// evaluated on each tick of the realtime bar; unless the tick is the bar's closing tick, rollback resets it on
// the next tick, so it can run its block several times on one realtime bar. Running on a closing tick makes it
// inactive for good. `varip` variables and logs are not rolled back.
// TradingView, BINANCE:BTCUSDT 1m (Nov 2026), the docs example with var twins: on the first realtime bar the
// per-tick block ran on all 40 ticks (varip count 1..40, var count 1 on each), the closing block ran together
// with it on the 40th (closing) tick, and neither ran again on the following bars.
describe('once on the realtime bar (v6)', () => {
    const MIN = 60_000;

    // Bars 0..8 are closed, bar 9 is forming at load. Update 1: a tick on bar 9. Update 2: bar 9 closes, bar 10
    // opens. Later updates: ticks on bar 10.
    function liveProvider() {
        const t0 = Math.floor(Date.now() / MIN) * MIN - 9 * MIN;
        const bar = (i: number, close: number, closed: boolean) => ({
            open: 100 + i,
            high: 102 + i,
            low: 99 + i,
            close,
            volume: 1,
            openTime: t0 + i * MIN,
            closeTime: closed ? Math.min(t0 + (i + 1) * MIN - 1, Date.now() - 1) : t0 + (i + 1) * MIN + 10 * MIN,
        });
        let updates = 0;
        return {
            getMarketData: async (_t: string, _tf: string, _l?: number, sDate?: number) => {
                if (sDate === undefined) return Array.from({ length: 10 }, (_, i) => bar(i, 101 + i, i < 9));
                updates++;
                if (updates === 1) return [bar(9, 110.5, false)];
                if (updates === 2) return [bar(9, 111, true), bar(10, 111, false)];
                return [bar(10, 111 + updates * 0.1, false)];
            },
            getSymbolInfo: async () => null,
        };
    }

    // Live updates append a plot point per execution; the bar's value is the last one with its time.
    const perBar = (ctx: any, title: string) => [...new Map(ctx.plots[title].data.map((d: any) => [d.time, d.value])).values()];

    // Each step: the update to apply (null for the initial load) and the expected state after it.
    async function replay(source: string, titles: string[], steps: { plots: number[][]; logs: string[] }[]) {
        const logs: string[] = [];
        const spy = vi.spyOn(console, 'log').mockImplementation((m: any) => void logs.push(String(m).replace(/^\[[^\]]*\] /, '')));
        try {
            const pine = new PineTS(liveProvider() as any, 'TEST', '1');
            await pine.ready();
            const ctx: any = await pine.run(source);
            for (let s = 0; s < steps.length; s++) {
                if (s > 0) await pine.updateTail(ctx);
                expect(titles.map((t) => perBar(ctx, t)), `step ${s}`).toEqual(steps[s].plots);
                expect(logs.splice(0), `logs of step ${s}`).toEqual(steps[s].logs);
            }
        } finally {
            spy.mockRestore();
        }
    }

    const docsExample = (kw: string) => `//@version=6
indicator("\`once\` upon a realtime bar")

//@variable counts how many times the first \`count\` block executes per bar.
${kw} int realTimeCount = 0
//@variable counts how many times the second \`count\` block, which runs only on the closing tick, executes per bar.
${kw} int closingTickCount = 0

// Evaluate our \`once\` blocks only on realtime bars, so that a closed bar does not fire them once and forever.
if barstate.isrealtime
    // Fires on every tick of the first realtime bar on which the script executes.
    once
        realTimeCount += 1  // Increase the realtime count by one.
        log.info("Close > open on this tick.")  // Log a message.
    // Fires on the *closing tick* of the first realtime bar on which the script executes.
    once barstate.isconfirmed
        closingTickCount += 1  // Increase the closing count by one.
        log.info("Close > open on the closing tick.")  // Log a message.

// Plot both counts.
plot(realTimeCount,    "Once per realtime tick")
plot(closingTickCount, "Once per realtime bar", color.red)
// Plot a zero line.
hline(0, linestyle = hline.style_dotted)
`;
    const TICK = 'Close > open on this tick.';
    const CLOSING = 'Close > open on the closing tick.';
    const zeros = Array(9).fill(0);

    it('docs example with varip: the per-tick block runs on every tick of the first realtime bar, the closing one once', async () => {
        await replay(docsExample('varip'), ['Once per realtime tick', 'Once per realtime bar'], [
            { plots: [[...zeros, 1], [...zeros, 0]], logs: [TICK] },
            { plots: [[...zeros, 2], [...zeros, 0]], logs: [TICK] },
            { plots: [[...zeros, 3, 3], [...zeros, 1, 1]], logs: [TICK, CLOSING] },
            { plots: [[...zeros, 3, 3], [...zeros, 1, 1]], logs: [] },
            { plots: [[...zeros, 3, 3], [...zeros, 1, 1]], logs: [] },
        ]);
    });

    it('docs example with var: both counters go to 1 and stay there, the blocks still run (and log) on every tick', async () => {
        await replay(docsExample('var'), ['Once per realtime tick', 'Once per realtime bar'], [
            { plots: [[...zeros, 1], [...zeros, 0]], logs: [TICK] },
            { plots: [[...zeros, 1], [...zeros, 0]], logs: [TICK] },
            { plots: [[...zeros, 1, 1], [...zeros, 1, 1]], logs: [TICK, CLOSING] },
            { plots: [[...zeros, 1, 1], [...zeros, 1, 1]], logs: [] },
        ]);
    });

    it('a `once` inside a function first called on the realtime bar is reset by rollback too', async () => {
        await replay(
            `//@version=6
indicator("t")
withVarip() =>
    varip int n = 0
    once
        n += 1
    n
withVar() =>
    var int n = 0
    once
        n += 1
    n
var int a = 0
var int b = 0
if barstate.isrealtime
    a := withVarip()
    b := withVar()
plot(a, "a")
plot(b, "b")
`,
            ['a', 'b'],
            [
                { plots: [[...zeros, 1], [...zeros, 1]], logs: [] },
                { plots: [[...zeros, 2], [...zeros, 1]], logs: [] },
                { plots: [[...zeros, 3, 3], [...zeros, 1, 1]], logs: [] },
                { plots: [[...zeros, 3, 3], [...zeros, 1, 1]], logs: [] },
            ]
        );
    });
});

// Verdicts, messages and positions are TradingView's compiler output for the same sources (Nov 2026).
describe('once cannot be used as a value (v6)', () => {
    const h = '//@version=6\nindicator("t")\n';
    const F = 'f() =>\n    once close > open\n        label.new(bar_index, close)\n';
    const M = 'method m(float x) =>\n    once x > 0\n        label.new(bar_index, x)\n';
    const compile = (body: string) => pineToJS(h + body + '\n');
    const onceValue = (at: string) =>
        'A `once` statement cannot return a value or be assigned to a variable. Convert the statement to an equivalent ' +
        `\`if\` or \`switch\` structure to return a usable result. at ${at}`;
    const voidAssign = (at: string) => `Void expression cannot be assigned to a variable at ${at}`;

    it('rejects a `once` structure where a value is expected', () => {
        expect(compile('var string txt = ""\ntxt += once close > open\n    txt := "a"\nplot(close)').error).toBe(onceValue('4:8'));
        expect(compile('x = once close > open\n    1\nplot(close)').error).toBe(onceValue('3:5'));
        expect(compile('x = once\n    1\nplot(close)').error).toBe(onceValue('3:5'));
    });

    it('rejects the value of a call to a function or method that ends with a `once` structure', () => {
        expect(compile(F + 'y = f()\nplot(close)').error).toBe(voidAssign('6:1'));
        // A function ending with a call to such a function has no value either.
        expect(compile(F + 'g() => f()\ny = g()\nplot(close)').error).toBe(voidAssign('7:1'));
        expect(compile(M + 'y = close.m()\nplot(close)').error).toBe(voidAssign('6:1'));
        expect(compile(M + 'y = m(close)\nplot(close)').error).toBe(voidAssign('6:1'));
        expect(compile(F + '[a, b] = f()\nplot(close)').error).toBe(
            'Cannot assign a variable to a tuple. The right side must be a function call or structure ("if", "switch", "for", "while") ' +
                'returning a tuple with the same number of elements. at 6:1'
        );
        // TradingView goes on with the expected type (`but a "series float"  is expected`), which PineTS does not track.
        expect(compile(F + 'plot(f())').error).toMatch(/^Cannot call "plot" with argument "call "f" \(void\)"\. An argument of "void" type was used\. at 6:6$/);
        expect(compile(F + 'z = 1\nz := f() + 1\nplot(z)').error).toBe(
            'Cannot call "operator +" with argument "expr0"="call "f" (void)". An argument of "void" type was used. at 7:6'
        );
    });

    it('accepts such calls as statements', () => {
        expect(compile(F + 'f()\nplot(close)').success).toBe(true);
        expect(compile(F + 'g() => f()\ng()\nplot(close)').success).toBe(true);
        expect(compile(F + 'if close > open\n    f()\nplot(close)').success).toBe(true);
        expect(compile(M + 'close.m()\nplot(close)').success).toBe(true);
        // A `once` that is not the last statement leaves the function its value.
        expect(compile('f() =>\n    once close > open\n        label.new(bar_index, close)\n    1\ny = f()\nplot(y)').success).toBe(true);
    });

    it('docs "`once` compilation error demo": compiles as published, fails once Structure 3 is uncommented', () => {
        const demo = (structure3: string) => `var string txt = ""
once close > open
    txt := "Structure 1 works."
var bool condition2Fired = false
txt += if close > open and not condition2Fired
    condition2Fired := true
    "\\nStructure 2 works."
${structure3}
if barstate.islast
    label.new(bar_index + 1, open, txt, style = label.style_label_left)`;
        expect(compile(demo('// txt += once close > open\n//     txt := "\\nStructure 3 works."')).success).toBe(true);
        expect(compile(demo('txt += once close > open\n    txt := "\\nStructure 3 works."')).error).toBe(onceValue('10:8'));
    });

    it('rejects an `else` after a `once` block', () => {
        expect(compile('once close > open\n    label.new(bar_index, close)\nelse\n    label.new(bar_index, open)\nplot(close)').success).toBe(false);
    });
});

describe('once as a name in Pine v5', () => {
    it('keeps `once` usable as a variable name in Pine v5', async () => {
        const col = await run(`
once = close
once := once + 1
plot(once - close, "d")
`, 5);
        expect(col('d').every((v: number) => Math.abs(v - 1) < 1e-9)).toBe(true);
    });
});
