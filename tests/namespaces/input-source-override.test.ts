// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';

/**
 * Regression guard: a RUNTIME override of an `input.source()` arrives as the
 * series NAME (e.g. `{ src: 'hlc3' }`) — the only serializable encoding a host
 * (or a worker boundary) can send. The runtime must dereference that name to
 * the named series' current-bar value, NOT hand the raw string to the script.
 *
 * Hosts (e.g. Vela) echo DEFAULTS back as overrides too, so even `{ src: 'close' }`
 * must behave exactly like "no override".
 *
 * Expected values are hand-computed from the synthetic bars below (independent
 * reference): close[i] = 100 + i, hlc3[i] = ((200+i) + (50+i) + (100+i)) / 3.
 */

const N = 30;
const bars = Array.from({ length: N }, (_, i) => ({
    openTime: 1_700_000_000_000 + i * 3_600_000,
    closeTime: 1_700_000_000_000 + (i + 1) * 3_600_000,
    open: 100 + i,
    high: 200 + i,
    low: 50 + i,
    close: 100 + i,
    volume: 1000 + i,
}));

const closeAt = (i: number) => 100 + i;
const hlc3At = (i: number) => (200 + i + (50 + i) + (100 + i)) / 3;

const CODE = `//@version=6
indicator("SrcOverride")
src = input.source(close, "Source")
plot(src, "raw")
plot(ta.sma(src, 3), "sma")`;

const BARE_CODE = `//@version=6
indicator("BareSrcOverride")
src = input(close, "Source")
plot(src, "raw")`;

async function run(code: string, inputs?: Record<string, unknown>) {
    const pineTS = new PineTS(bars, 'TEST', '1h');
    const ind = inputs ? new Indicator(code, inputs) : new Indicator(code);
    const ctx = await pineTS.run(ind);
    const values = (key: string) => (ctx.plots?.[key]?.data ?? []).map((p: any) => p.value);
    return { raw: values('raw'), sma: values('sma') };
}

describe('input.source runtime overrides (source name → series resolution)', () => {
    it('no override → plots the declared default (close)', async () => {
        const { raw } = await run(CODE);
        expect(raw.length).toBe(N);
        for (let i = 0; i < N; i++) expect(raw[i]).toBe(closeAt(i));
    });

    it('varId-keyed override { src: "hlc3" } resolves to the hlc3 series', async () => {
        const { raw, sma } = await run(CODE, { src: 'hlc3' });
        expect(raw.length).toBe(N);
        for (let i = 0; i < N; i++) expect(raw[i]).toBeCloseTo(hlc3At(i), 8);
        // The QA symptom: ta.sma over the overridden source must be numeric, not NaN.
        const lastSma = sma[N - 1];
        const expectedSma = (hlc3At(N - 3) + hlc3At(N - 2) + hlc3At(N - 1)) / 3;
        expect(lastSma).toBeCloseTo(expectedSma, 8);
    });

    it('echoing the default back as an override { src: "close" } behaves like no override', async () => {
        const { raw, sma } = await run(CODE, { src: 'close' });
        for (let i = 0; i < N; i++) expect(raw[i]).toBe(closeAt(i));
        const expectedSma = (closeAt(N - 3) + closeAt(N - 2) + closeAt(N - 1)) / 3;
        expect(sma[N - 1]).toBeCloseTo(expectedSma, 8);
    });

    it('title-keyed override { "Source": "hlc3" } resolves too (legacy path)', async () => {
        const { raw } = await run(CODE, { Source: 'hlc3' });
        for (let i = 0; i < N; i++) expect(raw[i]).toBeCloseTo(hlc3At(i), 8);
    });

    it('unknown source name falls back to the declared default', async () => {
        const { raw } = await run(CODE, { src: 'not_a_source' });
        for (let i = 0; i < N; i++) expect(raw[i]).toBe(closeAt(i));
    });

    it('every builtin source name resolves to its own series', async () => {
        const expected: Record<string, (i: number) => number> = {
            open: (i) => 100 + i,
            high: (i) => 200 + i,
            low: (i) => 50 + i,
            close: closeAt,
            hl2: (i) => (200 + i + (50 + i)) / 2,
            hlc3: hlc3At,
            ohlc4: (i) => (100 + i + (200 + i) + (50 + i) + (100 + i)) / 4,
            hlcc4: (i) => (200 + i + (50 + i) + (100 + i) + (100 + i)) / 4,
            volume: (i) => 1000 + i,
        };
        for (const [name, at] of Object.entries(expected)) {
            const { raw } = await run(CODE, { src: name });
            expect(raw.length, `source ${name}`).toBe(N);
            for (let i = 0; i < N; i++) expect(raw[i], `source ${name} @ bar ${i}`).toBeCloseTo(at(i), 8);
        }
    });

    it('bare input(close, ...) auto-typed as source resolves overrides too', async () => {
        const { raw } = await run(BARE_CODE, { src: 'hlc3' });
        expect(raw.length).toBe(N);
        for (let i = 0; i < N; i++) expect(raw[i]).toBeCloseTo(hlc3At(i), 8);
    });

    it('bare input() with a string default keeps string overrides untouched', async () => {
        const code = `//@version=6
indicator("StrInput")
mode = input("EMA", "Mode")
plot(mode == "SMA" ? 1 : 0, "isSma")`;
        const pineTS = new PineTS(bars, 'TEST', '1h');
        const ctx = await pineTS.run(new Indicator(code, { mode: 'SMA' }));
        const values = (ctx.plots?.['isSma']?.data ?? []).map((p: any) => p.value);
        expect(values[N - 1]).toBe(1);
    });
});
