// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PineTS } from '../src/PineTS.class';
import type { Context } from '../src/Context.class';

// Run with: node --import tsx scripts/benchmark-page-projection.ts
// Four cold child processes in ABBA order; no network or external fixtures.
const barCount = 5000;
const source = `//@version=6
indicator("Synthetic pagination benchmark")
plot(ta.sma(close, 14), "sma")
`;

async function measure(mode: string) {
    const bars = Array.from({ length: barCount }, (_, i) => ({
        openTime: Date.UTC(2024, 0, 1) + i * 60_000,
        closeTime: Date.UTC(2024, 0, 1) + (i + 1) * 60_000 - 1,
        open: 100 + i % 100, high: 102 + i % 100, low: 99 + i % 100,
        close: 100 + i % 100, volume: 10,
    }));
    const runtime = new PineTS(bars);
    await runtime.ready();
    let fullContext: Context | undefined;
    let pages = 0;
    const started = performance.now();
    const iterator = mode === 'projection'
        ? runtime.run(source, undefined, 1, { pageProjection: context => ({ fullContext: context }) })
        : runtime.run(source, undefined, 1);
    for await (const page of iterator) {
        fullContext = page!.fullContext;
        pages++;
    }
    const elapsedMs = performance.now() - started;
    assert.equal(pages, barCount);
    const outputSha256 = createHash('sha256').update(JSON.stringify({ result: fullContext!.result, plots: fullContext!.plots })).digest('hex');
    return { mode, barCount, pages, elapsedMs, outputSha256 };
}

if (process.argv[2] === 'child') {
    console.log(JSON.stringify(await measure(process.argv[3])));
} else {
    const order = ['default', 'projection', 'projection', 'default'];
    const measurements = order.map(mode => JSON.parse(execFileSync(process.execPath,
        ['--import', 'tsx', fileURLToPath(import.meta.url), 'child', mode], { encoding: 'utf8' })));
    assert.equal(new Set(measurements.map(row => row.outputSha256)).size, 1, 'Output changed');
    const mean = (mode: string) => measurements.filter(row => row.mode === mode).reduce((sum, row) => sum + row.elapsedMs, 0) / 2;
    console.log(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch,
        order: 'ABBA', measurements, defaultMeanMs: mean('default'), projectionMeanMs: mean('projection'),
        reductionPercent: 100 * (1 - mean('projection') / mean('default')),
        scope: 'Synthetic 5000-bar indicator, pageSize 1; run-to-generator-exhaustion timing, excluding data initialization and process startup. No combined or full-history optimizer claim.',
    }, null, 2));
}
