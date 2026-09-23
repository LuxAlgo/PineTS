// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Issue #312: `ta.crossover(close, open)` in the TEST position of a ternary that is
 * itself a call argument — `plot(ta.crossover(close, open) ? 1 : 0)` — was emitted as
 *
 *     ta.crossover($.get(p1, 0), $.get(p2, 0), "_ta0")
 *
 * i.e. the current-bar SCALARS instead of the `ta.param(...)` series. `Series.from(scalar)`
 * has length 1, so every `[1]` lookup inside the function was NaN and the cross family
 * (which reads `source[1]`) never returned true.
 *
 * The emission bug was not specific to the cross family: EVERY `ta.*` call in that
 * position received scalars. Functions that keep their own incremental state
 * (`ta.sma`, `ta.change`, ...) survived because they only need the current value, but
 * anything that reads history from the source series (`ta.cross*`, `ta.rising`,
 * `ta.falling`, `ta.mfi`, `ta.cmo`, `ta.cog`, `ta.correlation`, `ta.percentrank`,
 * `ta.highestbars`, `ta.mode`, `ta.pivothigh`, ...) was silently wrong.
 *
 * Reference for the "plain" forms below: once the emission was fixed, the inline
 * test-position form of each function in this file matches TradingView (Sep 2026).
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { transpile } from '../../src/transpiler';

const pine = (body: string) => `//@version=6\nindicator("t")\n${body}`;

function mk() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
}

describe('issue #312 — verbatim repro on synthetic bars with a clean open/close cross', () => {
    // 6 bars: close below open for 3 bars, above for 2, then below again.
    // Expected values are hand-derived from the Pine definitions:
    //   crossover  = close[1] <= open[1] and close > open   → bar 3
    //   crossunder = close[1] >= open[1] and close < open   → bar 5
    //   rising(2)  = close > close[1] and close[1] > close[2] → bars 3, 4
    const H = 3_600_000;
    const t0 = Date.UTC(2024, 0, 1);
    const oc: Array<[number, number]> = [
        [100, 98],
        [100, 97],
        [100, 99],
        [100, 103],
        [100, 104],
        [100, 96],
    ];
    const bars = oc.map(([open, close], i) => ({
        openTime: t0 + i * H,
        closeTime: t0 + (i + 1) * H,
        open,
        high: Math.max(open, close) + 1,
        low: Math.min(open, close) - 1,
        close,
        volume: 1000,
    }));

    it('cross family and ta.rising fire on the expected bars', async () => {
        const { plots } = await new PineTS(bars, 'SYN', '60').run(`//@version=6
indicator("cross probe 4", overlay=false)
plot(close, "close")
plot(open, "open")
plot(ta.crossover(close, open) ? 1 : 0, "co_native")
plot(ta.crossunder(close, open) ? 1 : 0, "cu_native")
plot(ta.cross(close, open) ? 1 : 0, "x_native")
plot(ta.rising(close, 2) ? 1 : 0, "rising")
`);
        const v = (name: string) => plots[name].data.map((p) => p.value);
        expect(v('co_native')).toEqual([0, 0, 0, 1, 0, 0]);
        expect(v('cu_native')).toEqual([0, 0, 0, 0, 0, 1]);
        expect(v('x_native')).toEqual([0, 0, 0, 1, 0, 1]);
        expect(v('rising')).toEqual([0, 0, 0, 1, 1, 0]);
    });
});

describe('issue #312 — ta.* in a ternary test passed as a call argument receives series, not scalars', () => {
    // Exact symptom from the report: a `ta.X(...)` call whose arguments are `$.get(pN, 0)`.
    const SCALAR_ARG_CALL = /ta\.\w+\((?:[^()]|\([^()]*\))*\$\.get\(p\d+, 0\)/;

    const positions: Array<[string, string]> = [
        ['plot(test ? a : b)', 'plot(ta.crossover(close, open) ? 1 : 0)'],
        ['plot(test ? series : series)', 'plot(ta.crossover(close, open) ? close : open)'],
        ['nested ternary in the taken branch', 'plot(close > 0 ? (ta.crossover(close, open) ? 1 : 0) : 0)'],
        ['ternary feeding another ta call', 'plot(ta.sma(ta.crossover(close, open) ? 1 : 0, 3))'],
        ['ternary as array.from element', 'a = array.from(ta.crossover(close, open) ? 1 : 0)\nplot(array.get(a, 0))'],
        ['ternary as a named argument', 'plot(close, color = ta.crossunder(close, open) ? color.red : color.green)'],
        ['ternary as user-function argument', 'f(x) => x\nplot(f(ta.crossover(close, open) ? 1 : 0))'],
        ['ternary as request.security expression', 'plot(request.security(syminfo.tickerid, "240", ta.crossover(close, open) ? 1 : 0))'],
        ['`not` around the call', 'plot(not ta.crossover(close, open) ? 1 : 0)'],
        ['left operand of and', 'plot(ta.crossover(close, open) and close > 0 ? 1 : 0)'],
        ['alertcondition argument', 'alertcondition(ta.crossover(close, open) ? true : false, "x")'],
        ['label text argument', 'label.new(bar_index, close, ta.crossover(close, open) ? "up" : "no")'],
        ['ta call over other ta calls', 'plot(ta.crossover(ta.sma(close, 3), ta.sma(close, 8)) ? 1 : 0)'],
        ['other history readers', 'plot(ta.rising(close, 2) ? 1 : 0)\nplot(ta.mfi(close, 5) > 50 ? 1 : 0)\nplot(ta.pivothigh(high, 2, 2) > 0 ? 1 : 0)'],
    ];
    for (const [name, body] of positions) {
        it(`${name}: no \`$.get(pN, 0)\` argument in any ta.* call`, () => {
            const code = transpile(pine(body)).toString();
            expect(code).not.toMatch(SCALAR_ARG_CALL);
        });
    }
});

describe('issue #312 — inline test-position form equals the plain-assignment form (all ta.* families)', () => {
    // `plot(ta.X(...) OP c ? 1 : 0)` must equal `v = ta.X(...)` / `plot(v OP c ? 1 : 0)`.
    // Both forms are the same Pine computation; only the argument emission differs.
    // Every row is a function that reads history from its SOURCE series and therefore
    // breaks (not just drifts) when handed scalars, plus a few stateful ones for coverage.
    const HEADER = `f = ta.ema(close, 3)
s = ta.ema(close, 8)
`;
    const cases: Array<[string, string, string]> = [
        // [name, expression, comparison suffix]
        ['ta.crossover', 'ta.crossover(close, open)', ''],
        ['ta.crossunder', 'ta.crossunder(close, open)', ''],
        ['ta.cross', 'ta.cross(close, open)', ''],
        ['ta.rising', 'ta.rising(close, 2)', ''],
        ['ta.falling', 'ta.falling(close, 2)', ''],
        ['ta.mfi', 'ta.mfi(close, 5)', ' > 50'],
        ['ta.cmo', 'ta.cmo(close, 5)', ' > 0'],
        ['ta.cog', 'ta.cog(close, 5)', ' > -3'],
        ['ta.correlation', 'ta.correlation(close, open, 5)', ' > 0.5'],
        ['ta.percentrank', 'ta.percentrank(close, 5)', ' > 50'],
        ['ta.highestbars', 'ta.highestbars(close, 5)', ' == 0'],
        ['ta.lowestbars', 'ta.lowestbars(close, 5)', ' == 0'],
        ['ta.mode', 'ta.mode(math.round(close / 100), 5)', ' > 0'],
        ['ta.percentile_nearest_rank', 'ta.percentile_nearest_rank(close, 5, 50)', ' > close'],
        ['ta.percentile_linear_interpolation', 'ta.percentile_linear_interpolation(close, 5, 50)', ' > close'],
        ['ta.pivothigh', 'ta.pivothigh(high, 2, 2)', ' > 0'],
        ['ta.pivotlow', 'ta.pivotlow(low, 2, 2)', ' > 0'],
        ['ta.valuewhen', 'ta.valuewhen(close > open, close, 0)', ' > close'],
        ['ta.barssince', 'ta.barssince(close > open)', ' > 2'],
        ['ta.change', 'ta.change(close)', ' > 0'],
        ['ta.sma', 'ta.sma(close, 5)', ' > close'],
        ['ta.wma', 'ta.wma(close, 5)', ' > close'],
        ['ta.highest', 'ta.highest(close, 5)', ' == close'],
        ['ta.stdev', 'ta.stdev(close, 5)', ' > 100'],
        ['ta.rsi', 'ta.rsi(close, 5)', ' > 50'],
        ['ta.linreg', 'ta.linreg(close, 5, 0)', ' > close'],
        ['ta.crossover of ta.sma', 'ta.crossover(ta.sma(close, 3), ta.sma(close, 8))', ''],
        ['ta.barssince of ta.crossover', 'ta.barssince(ta.crossover(f, s))', ' < 3'],
        ['ta.valuewhen of ta.crossunder', 'ta.valuewhen(ta.crossunder(f, s), close, 0)', ' > close'],
    ];
    for (const [name, expr, cmp] of cases) {
        it(`${name}`, async () => {
            const { plots } = await mk().run(
                pine(`${HEADER}plot(${expr}${cmp} ? 1 : 0, "x")
v = ${expr}
plot(v${cmp} ? 1 : 0, "ref")`)
            );
            const x = plots['x'].data.map((p) => p.value);
            const ref = plots['ref'].data.map((p) => p.value);
            expect(x).toEqual(ref);
            // non-degenerate: the predicate must actually flip on this data
            expect(ref.includes(1)).toBe(true);
            expect(ref.includes(0)).toBe(true);
        });
    }

    it('structural positions: nested, not, ta-of-ternary, array.from, udf arg', async () => {
        const { plots } = await mk().run(
            pine(`${HEADER}xo = ta.crossover(f, s)
xu = ta.crossunder(f, s)
g(x) => x
plot(close > 0 ? (ta.crossunder(f, s) ? 1 : 0) : 0, "nested")
plot(close > 0 ? (xu ? 1 : 0) : 0, "nested_ref")
plot(not ta.crossover(f, s) ? 1 : 0, "not")
plot(not xo ? 1 : 0, "not_ref")
plot(ta.sma(ta.crossover(f, s) ? 1 : 0, 3), "sma_of")
plot(ta.sma(xo ? 1 : 0, 3), "sma_of_ref")
plot(array.get(array.from(ta.crossover(f, s) ? 1 : 0), 0), "arr")
plot(xo ? 1 : 0, "arr_ref")
plot(g(ta.crossover(f, s) ? 1 : 0), "udf")
plot(g(xo ? 1 : 0), "udf_ref")`)
        );
        const v = (name: string) => plots[name].data.map((p) => p.value);
        for (const name of ['nested', 'not', 'sma_of', 'arr', 'udf']) {
            expect(v(name), name).toEqual(v(`${name}_ref`));
        }
        expect(v('arr_ref').includes(1)).toBe(true);
    });

    it('ternary as the request.security expression', async () => {
        const { plots } = await mk().run(
            pine(`plot(request.security(syminfo.tickerid, "240", ta.crossover(close, open) ? 1 : 0), "x")
v = ta.crossover(close, open) ? 1 : 0
plot(request.security(syminfo.tickerid, "240", v), "ref")`)
        );
        const x = plots['x'].data.map((p) => p.value);
        const ref = plots['ref'].data.map((p) => p.value);
        expect(x).toEqual(ref);
        expect(ref.includes(1)).toBe(true);
    });
});
