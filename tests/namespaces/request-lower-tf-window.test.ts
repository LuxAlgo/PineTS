// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Regression: request.security_lower_tf used to subtract a flat 30-day
 * buffer from the secondary context's start date. The buffer was lifted
 * from the higher-timeframe `security` path (where it's needed for
 * indicator warmup), but for LOWER-timeframe security the secondary's
 * window is bounded by the chart's own window — every LTF bar that
 * contributes to a chart bar lies inside that chart bar's
 * [openTime, closeTime]. The 30-day buffer caused the secondary to
 * load and iterate ~43,000 extra 1-minute bars before the main loop
 * could advance past bar 0, manifesting as a multi-minute hang on
 * small charts (e.g. 50 bars on 5m running Structural-Leg-Profiler).
 *
 * Fix: drop the buffer, use the chart's earliest openTime directly.
 *
 * This test verifies the bounded data window without going to the
 * network — it uses Mock weekly data with a daily LTF request, then
 * inspects the cached secondary context.
 */

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('request.security_lower_tf window bounding', () => {
    it('secondary context is bounded by the chart window — no historical buffer', async () => {
        // Chart: BTCUSDC weekly, ~6 bars (Dec 10 → Jan 21 ≈ 42 days).
        const chartStart = new Date('2018-12-10').getTime();
        const chartEnd = new Date('2019-01-21').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, chartStart, chartEnd);

        const context = await pineTS.run(async (context) => {
            const { close } = context.data;
            const { plotchar, request } = context.pine;
            const res = await request.security_lower_tf('BTCUSDC', 'D', close);
            plotchar(res, '_p');
        });

        // The secondary context is cached on the main context. Find it.
        const cacheKeys = Object.keys((context as any).cache || {});
        expect(cacheKeys.length).toBeGreaterThan(0);
        const ltfCacheKey = cacheKeys.find((k) => k.includes('_lower'));
        expect(ltfCacheKey, 'expected a _lower cache entry, got: ' + cacheKeys.join(',')).toBeDefined();
        const sec = (context as any).cache[ltfCacheKey!].context;

        // Chart window is ~42 days. With the bug (30-day buffer), the
        // secondary would load roughly 42 + 30 = ~72 daily bars. After
        // the fix it should be bounded by the chart's window, i.e. <= ~42.
        // We read openTime/closeTime — those are populated by both the
        // slow path (full pineTS.run) and the fast path (pure-builtin
        // shortcut), so this assertion is path-agnostic.
        const secLen = sec.data.openTime.data.length;
        expect(secLen, `secondary daily-bar count should be bounded by chart window`).toBeLessThanOrEqual(45);
        // Sanity floor — must have actually loaded the LTF data we need.
        expect(secLen).toBeGreaterThanOrEqual(28);

        // Also: the earliest secondary bar must NOT be earlier than the
        // chart's earliest bar (ie. no buffer applied).
        const secFirstOpen = sec.data.openTime.data[0];
        expect(secFirstOpen, 'secondary should not start before the chart').toBeGreaterThanOrEqual(chartStart);
    });
});
