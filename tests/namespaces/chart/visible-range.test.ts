// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Visible-range built-ins + setVisibleRange + update() + usesVisibleRange tag.
 *
 * Motivation: indicators like Supply-and-Demand-Visible-Range gate all
 * rendering on `time == chart.left_visible_bar_time` / `right_visible_bar_time`.
 * Before this fix the gates were `time == undefined` (always false) and nothing
 * displayed. PineTS now provides marketData-derived defaults and a host-side
 * setter to override them.
 */

import { describe, expect, it } from 'vitest';
import { PineTS, Provider } from 'index';

const makePineTS = () =>
    new PineTS(Provider.Mock, 'BTCUSDC', 'D', null,
        new Date('2019-01-01').getTime(),
        new Date('2019-01-10').getTime());

const lastValue = (plots: any, key: string) => {
    const d = plots[key]?.data;
    return d?.[d.length - 1]?.value;
};
const firstValue = (plots: any, key: string) => plots[key]?.data?.[0]?.value;

describe('chart.left_visible_bar_time / chart.right_visible_bar_time', () => {
    it('defaults to first/last bar openTime when setVisibleRange is not called', async () => {
        const pine = makePineTS();
        const { plots, marketData } = await pine.run(`
//@version=5
indicator("vr-defaults")
plot(chart.left_visible_bar_time, "L")
plot(chart.right_visible_bar_time, "R")
`);
        expect(firstValue(plots, 'L')).toEqual(marketData[0].openTime);
        expect(firstValue(plots, 'R')).toEqual(marketData[marketData.length - 1].openTime);
    });

    it('setVisibleRange overrides the defaults on the next run', async () => {
        const pine = makePineTS();
        const customLeft = new Date('2019-01-03').getTime();
        const customRight = new Date('2019-01-05').getTime();
        pine.setVisibleRange(customLeft, customRight);

        const { plots } = await pine.run(`
//@version=5
indicator("vr-setter")
plot(chart.left_visible_bar_time, "L")
plot(chart.right_visible_bar_time, "R")
`);
        expect(firstValue(plots, 'L')).toEqual(customLeft);
        expect(firstValue(plots, 'R')).toEqual(customRight);
    });

    it('script gated on `time == chart.left_visible_bar_time` fires at default first bar', async () => {
        // Before the fix this was `time == undefined` → branch never taken → n stayed at 0.
        const pine = makePineTS();
        const { plots } = await pine.run(`
//@version=5
indicator("vr-gate")
var int n = 0
if time == chart.left_visible_bar_time
    n := 1
plot(n, "n")
`);
        // n should latch to 1 on the first bar and persist.
        expect(lastValue(plots, 'n')).toEqual(1);
    });
});

describe('PineTS.usesVisibleRange() static-analysis tag', () => {
    it('returns false for scripts that do not reference visible-range built-ins', async () => {
        const pine = makePineTS();
        await pine.run(`
//@version=5
indicator("no-vr")
plot(close)
`);
        expect(pine.usesVisibleRange()).toBe(false);
    });

    it('returns true when the script references chart.left_visible_bar_time', async () => {
        const pine = makePineTS();
        await pine.run(`
//@version=5
indicator("uses-left")
plot(chart.left_visible_bar_time, "L")
`);
        expect(pine.usesVisibleRange()).toBe(true);
    });

    it('returns true when the script references chart.right_visible_bar_time', async () => {
        const pine = makePineTS();
        await pine.run(`
//@version=5
indicator("uses-right")
plot(chart.right_visible_bar_time, "R")
`);
        expect(pine.usesVisibleRange()).toBe(true);
    });

    it('ignores occurrences inside comments (comments stripped during pine2js)', async () => {
        const pine = makePineTS();
        await pine.run(`
//@version=5
indicator("vr-only-in-comment")
// This script mentions chart.left_visible_bar_time in a comment only.
plot(close)
`);
        expect(pine.usesVisibleRange()).toBe(false);
    });
});

describe('PineTS.update() — smart re-run gating', () => {
    const code = `
//@version=5
indicator("vr-update")
plot(chart.left_visible_bar_time, "L")
`;
    const codeNoVR = `
//@version=5
indicator("no-vr-update")
plot(close, "c")
`;

    it('first call to update() always executes (no cached result)', async () => {
        const pine = makePineTS();
        const ctx = await pine.update(code);
        expect(ctx).toBeDefined();
        expect(ctx.plots.L).toBeDefined();
    });

    it('second update() with no viewport change returns the cached result (same identity)', async () => {
        const pine = makePineTS();
        const ctx1 = await pine.update(code);
        const ctx2 = await pine.update();
        expect(ctx2).toBe(ctx1);
    });

    it('update() re-runs when usesVisibleRange and viewport changed', async () => {
        const pine = makePineTS();
        const ctx1 = await pine.update(code);
        pine.setVisibleRange(
            new Date('2019-01-03').getTime(),
            new Date('2019-01-05').getTime(),
        );
        const ctx2 = await pine.update();
        expect(ctx2).not.toBe(ctx1);
        // New viewport's left should be reflected in the plot:
        expect(firstValue(ctx2.plots, 'L')).toEqual(new Date('2019-01-03').getTime());
    });

    it('update() does NOT re-run when script is not viewport-dependent, even after setVisibleRange', async () => {
        const pine = makePineTS();
        const ctx1 = await pine.update(codeNoVR);
        pine.setVisibleRange(
            new Date('2019-01-03').getTime(),
            new Date('2019-01-05').getTime(),
        );
        const ctx2 = await pine.update();
        expect(ctx2).toBe(ctx1); // cached — viewport change is irrelevant
    });

    it('throws if no code is provided on the first call', async () => {
        const pine = makePineTS();
        await expect(pine.update()).rejects.toThrow(/pineTSCode is required/);
    });
});
