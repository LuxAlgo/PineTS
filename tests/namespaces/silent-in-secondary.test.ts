// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: side-effect-only operations executed inside a secondary
 * context (the auxiliary PineTS instance that `request.security` /
 * `request.security_lower_tf` spawns) used to do their full work — push
 * to plot streams, allocate drawing objects, fire alerts, etc. — even
 * though the secondary's only observable output is the single captured
 * expression read via `secContext.params[...]`. On large LTF/HTF gaps
 * the redundant work dominated runtime: a 50-bar daily chart running
 * Structural-Leg-Profiler at 1m secondary resolution would build /
 * mutate ~72k drawing objects per chart bar before the main loop could
 * advance.
 *
 * Fix: the @silentInSecondary method decorator makes drawing
 * constructors / setters / deletes, plot-family functions, and alert
 * helpers no-op when invoked on a secondary context. The captured
 * value is unchanged (the secondary still runs the rest of the user
 * script and its `params[...]` capture happens on the same call site
 * with the same value).
 *
 * `log.*` is intentionally NOT silenced — log.info()/warning()/error()
 * are diagnostic and should remain visible from secondaries.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('silentInSecondary — side-effect helpers no-op in secondary contexts', () => {
    // We exercise the secondary-vs-primary divergence by running the same
    // script first in the main context and then asking
    // `request.security_lower_tf` to evaluate an expression in a secondary
    // (same-symbol, same-timeframe, daily). The secondary IS spawned and
    // the user script DOES run end-to-end inside it — but every drawing /
    // plot / alert call inside should be silenced, leaving the
    // captured-expression value unchanged.

    it('drawing helpers no-op when context.isSecondaryContext is true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2018-12-10').getTime(),
            new Date('2019-01-21').getTime());

        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, line, label, box, polyline, ta } = context.pine;
            // Pull a daily series via security_lower_tf; we wrap close in
            // ta.sma so the captured expression is NOT a pure builtin —
            // that forces the slow-path secondary (full user-script
            // execution), which is what the silencing decorator targets.
            const _res = await request.security_lower_tf('BTCUSDC', 'D', ta.sma(close, 3));
            // These are drawing side effects — when this body runs in the
            // secondary they should all be silenced.
            line.new(0, 0, 1, 1);
            label.new(0, 0, 'x');
            box.new(0, 0, 1, 1);
            polyline.new([]);
        });

        // Sanity: the main context DID accumulate drawings (these calls
        // ran in the primary, where the decorator does nothing).
        const mainLines = (context as any).pine.line.all;
        const mainLabels = (context as any).pine.label.all;
        const mainBoxes = (context as any).pine.box.all;
        expect(mainLines.length).toBeGreaterThan(0);
        expect(mainLabels.length).toBeGreaterThan(0);
        expect(mainBoxes.length).toBeGreaterThan(0);

        // The secondary context cached on the main: its drawing arrays
        // must be empty because every `*.new()` in there short-circuited.
        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        expect(ltfKey).toBeDefined();
        const sec = (context as any).cache[ltfKey!].context;
        expect(sec.pine.line.all.length).toBe(0);
        expect(sec.pine.label.all.length).toBe(0);
        expect(sec.pine.box.all.length).toBe(0);
        expect(sec.pine.polyline.all.length).toBe(0);
    });

    it('plot helpers no-op when context.isSecondaryContext is true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2018-12-10').getTime(),
            new Date('2019-01-21').getTime());

        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, plot, plotchar, ta } = context.pine;
            // Force slow-path secondary by wrapping close in ta.sma.
            const _res = await request.security_lower_tf('BTCUSDC', 'D', ta.sma(close, 3));
            plot(close, 'main_plot');
            plotchar(close, 'main_plotchar');
        });

        // Main context: plots were registered.
        const mainKeys = Object.keys((context as any).plots);
        expect(mainKeys.includes('main_plot')).toBe(true);
        expect(mainKeys.includes('main_plotchar')).toBe(true);

        // Secondary context: those same titles must NOT appear because
        // plot/plotchar were silenced. (The framework's internal
        // __labels__/__lines__/etc. plot keys are pre-allocated and may
        // exist; we check user-named entries specifically.)
        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const sec = (context as any).cache[ltfKey!].context;
        const secKeys = Object.keys(sec.plots);
        expect(secKeys.includes('main_plot')).toBe(false);
        expect(secKeys.includes('main_plotchar')).toBe(false);
    });

    it('alert helpers no-op when context.isSecondaryContext is true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2018-12-10').getTime(),
            new Date('2019-01-21').getTime());

        // Force every-bar alert mode so the alert call always tries to fire.
        pineTS.setAlertMode('all');

        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, alert, ta } = context.pine;
            // Force slow-path secondary by wrapping close in ta.sma.
            const _res = await request.security_lower_tf('BTCUSDC', 'D', ta.sma(close, 3));
            alert.any('fire');
        });

        // Main: alerts accumulated.
        expect((context as any).alerts.length).toBeGreaterThan(0);
        // Secondary: silenced.
        const cacheKeys = Object.keys((context as any).cache || {});
        const ltfKey = cacheKeys.find((k) => k.includes('_lower'));
        const sec = (context as any).cache[ltfKey!].context;
        expect(sec.alerts.length).toBe(0);
    });

    it('captured expression value is unchanged by silencing', async () => {
        // The whole point: silencing the side effects must not change
        // what `request.security_lower_tf` returns.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null,
            new Date('2018-12-10').getTime(),
            new Date('2019-02-04').getTime());

        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { request, line, label, plotchar } = context.pine;
            const res = await request.security_lower_tf('BTCUSDC', 'D', close);
            // Capture the LTF array's size as a scalar plotchar — easier
            // to assert than the array itself.
            const sz = res && res.size ? res.size() : 0;
            plotchar(sz, 'sz');
            // Side effects: silenced in the secondary, kept in the main.
            line.new(0, 0, 1, 1);
            label.new(0, 0, 'x');
        });

        // The captured `res` should still have valid data — Layer 1 +
        // decorator combined shouldn't alter the value, only suppress
        // side effects.
        const szData = (context as any).plots['sz']?.data ?? [];
        expect(szData.length).toBeGreaterThan(0);
        // At least one chart bar must have a non-zero LTF size (the
        // request returned data).
        const hasNonZero = szData.some((d: any) => typeof d.value === 'number' && d.value > 0);
        expect(hasNonZero).toBe(true);
    });
});
