import { describe, expect, it } from 'vitest';
import { PineTS, Provider } from 'index';

/**
 * TA Functions — Series Backfill in Conditional and Single-Call Contexts
 *
 * Verifies that all 13 window-based TA functions correctly backfill their
 * rolling window from the source series when called in contexts where the
 * per-callsite call count is low (conditional blocks, barstate.islast).
 *
 * The context.idx fallback ensures that when the chart has enough historical
 * bars (context.idx >= length-1), the window is filled from the source
 * series regardless of callCount. This enables correct results in:
 *   - Conditional blocks (function called on subset of bars)
 *   - barstate.islast (function called exactly once)
 *
 * Expected data sourced from TradingView (BTCUSDC, Weekly, 2025).
 */
describe('TA Functions - Series Backfill in Conditional and Single-Call Contexts', () => {
    // TradingView reference data (BTCUSDC Weekly)
    // 10 bars from 2025-04-07 to 2025-06-09
    // Conditional block starts at 2025-04-01 (first bar: Apr 7)
    // Period = 5 for all functions

    // ── TV expected: top-level values (always warmed up) ──────────────
    const TV_TOP = {
        sma:  [82629.566, 83147.566, 84686.368, 87067.988, 92220.552, 96771.086, 101546.688, 103931.572, 106233.078, 106528.338],
        hi:   [86083.58, 86083.58, 93777.59, 94280.01, 104128, 106489.84, 109058, 109058, 109058, 109058],
        lo:   [78365.18, 78365.18, 78365.18, 78365.18, 83737.17, 85179.99, 93777.59, 94280.01, 104128, 105604.3],
        std:  [2506.389, 2704.493, 5081.517, 6122.577, 7348.338, 7721.377, 6335.317, 5082.336, 1609.845, 1302.775],
        var_: [6281988.033, 7314283.297, 25821818.108, 37485954.482, 53998067.179, 59619669.467, 40136244.837, 25830136.582, 2591600.349, 1697223.559],
        dev:  [1824.647, 2223.217, 3833.938, 5568.65, 6209.578, 6830.267, 6014.31, 3860.625, 1232.674, 1011.865],
        wma:  [82267.963, 83118.105, 86661.446, 89859.327, 95545.997, 100302.427, 104398.065, 105783.172, 106401.828, 106192.235],
        lr:   [81544.758, 83059.182, 90611.602, 95442.004, 102196.888, 107365.108, 110100.818, 109486.372, 106739.328, 105520.03],
        cci:  [40.468, 60.945, 158.083, 86.341, 127.84, 94.86, 83.26, 30.573, -24.096, -60.88],
        med:  [82589.99, 83737.17, 83737.17, 85179.99, 93777.59, 94280.01, 104128, 105702.01, 105787.54, 105787.54],
        roc:  [3.742, 3.136, 8.938, 14.457, 32.875, 27.172, 28.032, 12.716, 12.206, 1.418],
        chg:  [3020.43, 2590, 7694.01, 11908.1, 25762.82, 22752.67, 23878.01, 11924.42, 11507.53, 1476.3],
        alma: [81093.283, 83624.001, 88391.133, 92804.356, 98092.476, 103739.441, 107119.001, 107343.024, 106168.232, 105730.13],
    };

    // ── PineTS expected: conditional values ────────────────────────────
    // With context.idx backfill, all functions get their window filled from
    // the source series on the very first call (context.idx >> length).
    // Calls 0-3: PineTS backfills → values match TV_TOP (TV itself returns
    //   NaN for most functions here, but PineTS diverges intentionally to
    //   support barstate.islast).
    // Calls 4+: rolling window is naturally full → values match TV exactly.
    const PINETS_COND = {
        // All period-5 functions: backfill from call 0, values = TV_TOP
        sma:  TV_TOP.sma,
        std:  TV_TOP.std,
        var_: TV_TOP.var_,
        dev:  TV_TOP.dev,
        wma:  TV_TOP.wma,
        cci:  TV_TOP.cci,
        med:  TV_TOP.med,
        alma: TV_TOP.alma,
        hi:   TV_TOP.hi,
        lo:   TV_TOP.lo,
        lr:   TV_TOP.lr,
        // roc/change need length+1 values; context.idx >= length triggers backfill
        roc:  TV_TOP.roc,
        chg:  TV_TOP.chg,
    };

    const PINE_CODE = `
//@version=5
indicator("Backfill Test", overlay=false)

_sma_top = ta.sma(close, 5)
_hi_top = ta.highest(close, 5)
_lo_top = ta.lowest(close, 5)
_std_top = ta.stdev(close, 5)
_var_top = ta.variance(close, 5)
_dev_top = ta.dev(close, 5)
_wma_top = ta.wma(close, 5)
_lr_top = ta.linreg(close, 5, 0)
_cci_top = ta.cci(close, 5)
_med_top = ta.median(close, 5)
_roc_top = ta.roc(close, 5)
_chg_top = ta.change(close, 5)
_alma_top = ta.alma(close, 5, 0.85, 6)

float _sma_cond = na
float _hi_cond = na
float _lo_cond = na
float _std_cond = na
float _var_cond = na
float _dev_cond = na
float _wma_cond = na
float _lr_cond = na
float _cci_cond = na
float _med_cond = na
float _roc_cond = na
float _chg_cond = na
float _alma_cond = na

if not barstate.islast and time >= timestamp("2025-04-01 00:00") and time <= timestamp("2025-06-15 00:00")
    _sma_cond := ta.sma(close, 5)
    _hi_cond := ta.highest(close, 5)
    _lo_cond := ta.lowest(close, 5)
    _std_cond := ta.stdev(close, 5)
    _var_cond := ta.variance(close, 5)
    _dev_cond := ta.dev(close, 5)
    _wma_cond := ta.wma(close, 5)
    _lr_cond := ta.linreg(close, 5, 0)
    _cci_cond := ta.cci(close, 5)
    _med_cond := ta.median(close, 5)
    _roc_cond := ta.roc(close, 5)
    _chg_cond := ta.change(close, 5)
    _alma_cond := ta.alma(close, 5, 0.85, 6)

plot(_sma_top, "sma_top")
plot(_sma_cond, "sma_cond")
plot(_hi_top, "hi_top")
plot(_hi_cond, "hi_cond")
plot(_lo_top, "lo_top")
plot(_lo_cond, "lo_cond")
plot(_std_top, "std_top")
plot(_std_cond, "std_cond")
plot(_var_top, "var_top")
plot(_var_cond, "var_cond")
plot(_dev_top, "dev_top")
plot(_dev_cond, "dev_cond")
plot(_wma_top, "wma_top")
plot(_wma_cond, "wma_cond")
plot(_lr_top, "lr_top")
plot(_lr_cond, "lr_cond")
plot(_cci_top, "cci_top")
plot(_cci_cond, "cci_cond")
plot(_med_top, "med_top")
plot(_med_cond, "med_cond")
plot(_roc_top, "roc_top")
plot(_roc_cond, "roc_cond")
plot(_chg_top, "chg_top")
plot(_chg_cond, "chg_cond")
plot(_alma_top, "alma_top")
plot(_alma_cond, "alma_cond")
`;

    // Mapping from short name to plot name suffix
    const FUNCS = ['sma', 'hi', 'lo', 'std', 'var_', 'dev', 'wma', 'lr', 'cci', 'med', 'roc', 'chg', 'alma'] as const;
    const PLOT_NAMES: Record<string, { top: string; cond: string }> = {
        sma:  { top: 'sma_top',  cond: 'sma_cond' },
        hi:   { top: 'hi_top',   cond: 'hi_cond' },
        lo:   { top: 'lo_top',   cond: 'lo_cond' },
        std:  { top: 'std_top',  cond: 'std_cond' },
        var_: { top: 'var_top',  cond: 'var_cond' },
        dev:  { top: 'dev_top',  cond: 'dev_cond' },
        wma:  { top: 'wma_top',  cond: 'wma_cond' },
        lr:   { top: 'lr_top',   cond: 'lr_cond' },
        cci:  { top: 'cci_top',  cond: 'cci_cond' },
        med:  { top: 'med_top',  cond: 'med_cond' },
        roc:  { top: 'roc_top',  cond: 'roc_cond' },
        chg:  { top: 'chg_top',  cond: 'chg_cond' },
        alma: { top: 'alma_top', cond: 'alma_cond' },
    };

    // Helper: compare two values with relative tolerance
    function approxEqual(actual: number, expected: number, label: string, relTol = 5e-4) {
        if (isNaN(expected)) {
            expect(isNaN(actual), `${label}: expected NaN, got ${actual}`).toBe(true);
            return;
        }
        if (expected === 0) {
            expect(Math.abs(actual), `${label}: expected ~0, got ${actual}`).toBeLessThan(1e-6);
            return;
        }
        const relErr = Math.abs(actual - expected) / Math.abs(expected);
        expect(relErr, `${label}: actual=${actual}, expected=${expected}, relErr=${relErr}`).toBeLessThan(relTol);
    }

    it('conditional callsite warmup pattern and values match TV data', async () => {
        const pineTS = new PineTS(
            Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2025-01-01').getTime(),
            new Date('2025-08-01').getTime()
        );

        const { plots } = await pineTS.run(PINE_CODE);

        // Extract plot values within the conditional window
        const startMs = new Date('2025-04-07T00:00:00Z').getTime();
        const endMs = new Date('2025-06-10T00:00:00Z').getTime();

        function extract(plotName: string): number[] {
            const data = plots[plotName]?.data;
            expect(data, `plot '${plotName}' should exist`).toBeDefined();
            const filtered = data.filter((d: any) => d.time >= startMs && d.time <= endMs);
            return filtered.map((d: any) => d.value);
        }

        // Verify we have 10 bars in the window
        const smaTopVals = extract('sma_top');
        expect(smaTopVals.length, 'should have 10 weekly bars in window').toBe(10);

        // ── Test 1: All functions return values from call 0 (context.idx backfill) ──
        // With context.idx >= length-1 (chart has enough bars), all functions
        // backfill their window from the source series on the very first call.
        for (const fn of FUNCS) {
            const vals = extract(PLOT_NAMES[fn].cond);
            expect(isNaN(vals[0]), `${fn}_cond[0] should NOT be NaN (backfilled from series)`).toBe(false);
        }

        // ── Test 2: Conditional matches top-level from call 0 ─────
        // With context.idx backfill, all functions get their window filled
        // from the source series immediately, so values match top-level.
        for (const fn of FUNCS) {
            const topVals = extract(PLOT_NAMES[fn].top);
            const condVals = extract(PLOT_NAMES[fn].cond);
            for (let i = 0; i < 10; i++) {
                approxEqual(condVals[i], topVals[i], `${fn} convergence [${i}]`);
            }
        }

        // ── Test 3: Top-level values match TV reference data ───────
        for (const fn of FUNCS) {
            const topVals = extract(PLOT_NAMES[fn].top);
            const tvTop = TV_TOP[fn];
            for (let i = 0; i < 10; i++) {
                approxEqual(topVals[i], tvTop[i], `${fn}_top[${i}] vs TV`);
            }
        }

        // ── Test 4: Conditional values match expected reference data ──
        // Calls 0-3 (period-5) / 0-4 (roc/chg): PineTS returns backfilled
        // values that match TV_TOP, but TV itself returns NaN here.
        // We skip these early calls and only compare from the point where
        // both PineTS conditional and TV conditional agree (window naturally full).
        for (const fn of FUNCS) {
            const condVals = extract(PLOT_NAMES[fn].cond);
            const expected = PINETS_COND[fn];
            const startIdx = (fn === 'roc' || fn === 'chg') ? 5 : 4;
            for (let i = startIdx; i < 10; i++) {
                approxEqual(condVals[i], expected[i], `${fn}_cond[${i}] vs expected`);
            }
        }
    }, 60000);

    /**
     * Single-call backfill: TA functions inside barstate.islast
     *
     * When a TA function is called ONLY inside barstate.islast, it is invoked
     * exactly once (callCount=1). The context.idx fallback ensures the window
     * is filled from the source series when the chart has enough historical
     * bars (context.idx >= length-1), so all functions return valid values.
     */
    it('single-call context produces valid values for all TA functions', async () => {
        const pineTS = new PineTS(
            Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2018-12-10').getTime(),
            new Date('2020-01-27').getTime()
        );

        const code = `
//@version=5
indicator("barstate.islast TA test", overlay=false)

// Top-level reference values (always warmed up)
_sma_top  = ta.sma(close, 5)
_std_top  = ta.stdev(close, 5)
_var_top  = ta.variance(close, 5)
_dev_top  = ta.dev(close, 5)
_wma_top  = ta.wma(close, 5)
_cci_top  = ta.cci(close, 5)
_med_top  = ta.median(close, 5)
_alma_top = ta.alma(close, 5, 0.85, 6)
_lr_top   = ta.linreg(close, 5, 0)
_roc_top  = ta.roc(close, 5)
_chg_top  = ta.change(close, 5)
_hi_top   = ta.highest(close, 5)
_lo_top   = ta.lowest(close, 5)

// barstate.islast: each function called exactly once
float _sma_last  = na
float _std_last  = na
float _var_last  = na
float _dev_last  = na
float _wma_last  = na
float _cci_last  = na
float _med_last  = na
float _alma_last = na
float _lr_last   = na
float _roc_last  = na
float _chg_last  = na
float _hi_last   = na
float _lo_last   = na

if barstate.islast
    _sma_last  := ta.sma(close, 5)
    _std_last  := ta.stdev(close, 5)
    _var_last  := ta.variance(close, 5)
    _dev_last  := ta.dev(close, 5)
    _wma_last  := ta.wma(close, 5)
    _cci_last  := ta.cci(close, 5)
    _med_last  := ta.median(close, 5)
    _alma_last := ta.alma(close, 5, 0.85, 6)
    _lr_last   := ta.linreg(close, 5, 0)
    _roc_last  := ta.roc(close, 5)
    _chg_last  := ta.change(close, 5)
    _hi_last   := ta.highest(close, 5)
    _lo_last   := ta.lowest(close, 5)

plot(_sma_top, "sma_top")
plot(_sma_last, "sma_last")
plot(_std_top, "std_top")
plot(_std_last, "std_last")
plot(_var_top, "var_top")
plot(_var_last, "var_last")
plot(_dev_top, "dev_top")
plot(_dev_last, "dev_last")
plot(_wma_top, "wma_top")
plot(_wma_last, "wma_last")
plot(_cci_top, "cci_top")
plot(_cci_last, "cci_last")
plot(_med_top, "med_top")
plot(_med_last, "med_last")
plot(_alma_top, "alma_top")
plot(_alma_last, "alma_last")
plot(_lr_top, "lr_top")
plot(_lr_last, "lr_last")
plot(_roc_top, "roc_top")
plot(_roc_last, "roc_last")
plot(_chg_top, "chg_top")
plot(_chg_last, "chg_last")
plot(_hi_top, "hi_top")
plot(_hi_last, "hi_last")
plot(_lo_top, "lo_top")
plot(_lo_last, "lo_last")
`;

        const { plots } = await pineTS.run(code);

        // All functions that use the callCount-based backfill pattern
        const FUNCS_TO_TEST = [
            { name: 'sma',  top: 'sma_top',  last: 'sma_last' },
            { name: 'stdev', top: 'std_top',  last: 'std_last' },
            { name: 'variance', top: 'var_top', last: 'var_last' },
            { name: 'dev',  top: 'dev_top',  last: 'dev_last' },
            { name: 'wma',  top: 'wma_top',  last: 'wma_last' },
            { name: 'cci',  top: 'cci_top',  last: 'cci_last' },
            { name: 'median', top: 'med_top', last: 'med_last' },
            { name: 'alma', top: 'alma_top', last: 'alma_last' },
            { name: 'linreg', top: 'lr_top',  last: 'lr_last' },
            { name: 'roc',  top: 'roc_top',  last: 'roc_last' },
            { name: 'change', top: 'chg_top', last: 'chg_last' },
            // Already fixed:
            { name: 'highest', top: 'hi_top', last: 'hi_last' },
            { name: 'lowest',  top: 'lo_top', last: 'lo_last' },
        ];

        const lastIdx = plots['sma_top'].data.length - 1;

        for (const fn of FUNCS_TO_TEST) {
            const topData = plots[fn.top]?.data;
            const lastData = plots[fn.last]?.data;

            expect(topData, `${fn.name}: top plot should exist`).toBeDefined();
            expect(lastData, `${fn.name}: last plot should exist`).toBeDefined();

            const topVal = topData[lastIdx].value;
            const lastVal = lastData[lastIdx].value;

            // Top-level should always have a value on the last bar
            expect(isNaN(topVal), `${fn.name}_top should not be NaN on last bar`).toBe(false);

            // barstate.islast value should NOT be NaN (context.idx backfill)
            expect(isNaN(lastVal), `${fn.name}_last should not be NaN on last bar`).toBe(false);

            // barstate.islast value should match top-level
            const relErr = Math.abs(lastVal - topVal) / Math.abs(topVal);
            expect(
                relErr,
                `${fn.name}: last (${lastVal}) should match top (${topVal}), relErr=${relErr}`
            ).toBeLessThan(5e-4);
        }
    }, 60000);
});
