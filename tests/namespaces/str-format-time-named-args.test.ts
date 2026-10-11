// SPDX-License-Identifier: AGPL-3.0-only
// str.format_time with named `format` / `timezone` arguments.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

afterEach(() => vi.restoreAllMocks());

const MINUTE = 60_000;
const T0 = Date.UTC(2024, 0, 1);
const bars = [10, 20, 30].map((close, i) => ({
    openTime: T0 + i * MINUTE,
    closeTime: T0 + (i + 1) * MINUTE,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
}));

async function logs(source: string): Promise<string[]> {
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...a: any[]) => lines.push(a.join(' ').replace(/^\[[^\]]+\]\s/, '')));
    await new PineTS(bars, 'TEST', '1').run(source);
    return [...new Set(lines)];
}

describe('str.format_time named arguments', () => {
    // 1704153600000 is 2024-01-02T00:00:00Z.
    it('applies a named timezone with the default format', async () => {
        const lines = await logs(`//@version=6
indicator("t")
if barstate.islast
    t = 1704153600000
    log.info("positional=" + str.format_time(t, "yyyy-MM-dd'T'HH:mm:ssZ", "UTC-5"))
    log.info("named=" + str.format_time(t, timezone = "UTC-5"))`);
        expect(lines).toEqual(['positional=2024-01-01T19:00:00-0500', 'named=2024-01-01T19:00:00-0500']);
    });

    it('applies named format and timezone, together and after a positional format', async () => {
        const lines = await logs(`//@version=6
indicator("t")
if barstate.islast
    t = 1704153600000
    log.info("both=" + str.format_time(t, format = "HH:mm", timezone = "UTC+2"))
    log.info("mixed=" + str.format_time(t, "HH:mm", timezone = "UTC+2"))
    log.info("format=" + str.format_time(t, format = "yyyy-MM-dd", timezone = "UTC"))`);
        expect(lines).toEqual(['both=02:00', 'mixed=02:00', 'format=2024-01-02']);
    });
});
