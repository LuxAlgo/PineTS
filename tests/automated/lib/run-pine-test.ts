// SPDX-License-Identifier: AGPL-3.0-only

import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';
import { deepEqual, deepDiff } from '../../compatibility/lib/serializer';
import fs from 'fs';
import { expect } from 'vitest';

// ── Types ────────────────────────────────────────────────────────────

interface TvLogEntry {
    time: string;
    values: any[];
}

export interface PineTestOptions {
    pineScript: string;
    tvLogs: TvLogEntry[];
    ticker?: string;
    timeframe?: string;
    precision?: number; // rounding decimals (TV rounds to ~3), default 3
    epsilon?: number; // tolerated diff after rounding, default 0 (exact match)
}

// ── Pine script metadata extraction ──────────────────────────────────

/**
 * Extract plot names from plotchar/plot calls in order of appearance.
 * Finds the first string literal in each plotchar()/plot() line — that's the title.
 */
function extractPlotNames(pineScript: string): string[] {
    const names: string[] = [];
    for (const line of pineScript.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.match(/^(?:plotchar|plotshape|plotarrow|plot)\s*\(/)) continue;

        const strRe = /['"]([^'"]*)['"]/g;
        let m: RegExpExecArray | null;
        const literals: string[] = [];
        while ((m = strRe.exec(trimmed)) !== null) {
            literals.push(m[1]);
        }
        if (literals.length > 0) {
            names.push(literals[0]);
        }
    }
    return names;
}

function extractDateRange(pineScript: string): { start: number; end: number } {
    const startMatch = pineScript.match(/__startDate\s*=\s*timestamp\(\s*"([^"]+)"\s*\)/);
    const endMatch = pineScript.match(/__endDate\s*=\s*timestamp\(\s*"([^"]+)"\s*\)/);
    if (!startMatch || !endMatch) {
        throw new Error('Pine script must contain __startDate and __endDate with timestamp("...") format');
    }
    return {
        start: new Date(startMatch[1]).getTime(),
        end: new Date(endMatch[1]).getTime(),
    };
}

function extractSignature(pineScript: string): string {
    const match = pineScript.match(/__signature\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '';
}

// ── Value normalisation ──────────────────────────────────────────────

/**
 * Round a numeric value to N decimal places.
 * TradingView's log.info truncates numbers to ~3 decimals, so we round
 * both sides to the same precision before comparing.
 */
function roundValue(val: any, decimals: number): any {
    if (typeof val === 'number' && isFinite(val)) {
        const factor = 10 ** decimals;
        return Math.round(val * factor) / factor;
    }
    return val;
}

function normalizeValue(val: any, precision: number): any {
    if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower === 'nan' || lower === 'na') return NaN;
        if (lower === 'infinity') return Infinity;
        if (lower === '-infinity') return -Infinity;
    }
    return roundValue(val, precision);
}

// ── Core comparison function ─────────────────────────────────────────

export async function runPineTest(options: PineTestOptions): Promise<void> {
    // precision: TradingView's log.info rounds numbers to ~3 decimal places,
    //   so we round both sides to the same precision before comparing.
    // epsilon: tolerated absolute diff after rounding (0 = exact match).
    const { pineScript, tvLogs, ticker = 'BTCUSDC', timeframe = 'W', precision = 3, epsilon = 0 } = options;

    const plotNames = extractPlotNames(pineScript);
    const dateRange = extractDateRange(pineScript);
    const signature = extractSignature(pineScript);

    expect(plotNames.length, 'Pine script must contain at least one plotchar/plot call').toBeGreaterThan(0);
    expect(tvLogs.length, 'TV logs must not be empty').toBeGreaterThan(0);

    if (signature) {
        expect(tvLogs[0].values[0], 'Signature mismatch between script and logs').toBe(signature);
    }

    const expectedCols = tvLogs[0].values.length - 1;
    expect(plotNames.length, `Plot count (${plotNames.length}) must match log value columns (${expectedCols})`).toBe(expectedCols);

    // Run PineTS with 1-year warmup before the log window
    const warmupMs = 365 * 24 * 60 * 60 * 1000;
    const pineTS = new PineTS(Provider.Mock, ticker, timeframe, null, dateRange.start - warmupMs, dateRange.end);
    const { plots } = await pineTS.run(pineScript);

    // Build time → value map for each plot
    const pineDataByPlot: Record<string, Map<number, number>> = {};
    for (const name of plotNames) {
        const plotEntry = plots[name];
        expect(plotEntry, `Plot "${name}" not found in PineTS output (available: ${Object.keys(plots).join(', ')})`).toBeDefined();

        const timeMap = new Map<number, number>();
        for (const point of plotEntry.data) {
            timeMap.set(point.time, point.value);
        }
        pineDataByPlot[name] = timeMap;
    }

    // Build both sides in the same { time, values } shape, rounded to the same
    // precision so floating-point display differences don't cause false failures.
    const tvNormalized: TvLogEntry[] = tvLogs.map((entry) => ({
        time: entry.time,
        values: [signature, ...entry.values.slice(1).map((v) => normalizeValue(v, precision))],
    }));

    const pineResults: TvLogEntry[] = tvLogs.map((entry) => {
        const entryTime = new Date(entry.time).getTime();
        const values: any[] = [signature];
        for (const name of plotNames) {
            const v = pineDataByPlot[name]?.get(entryTime);
            values.push(roundValue(v !== undefined ? v : NaN, precision));
        }
        return { time: entry.time, values };
    });

    const diffs = deepDiff(tvNormalized, pineResults, epsilon);
    if (diffs.length > 0) {
        console.log(`\n── ${diffs.length} difference(s) ──`);
        for (const d of diffs) {
            console.log(`  ${d.path}: expected=${d.expected} actual=${d.actual}`);
        }
        console.log('');
    }
    expect(diffs.length, `${diffs.length} value mismatch(es) between TradingView and PineTS`).toBe(0);
}

// ── File-based convenience wrapper ───────────────────────────────────

export async function runPineTestFromFiles(
    pineFilePath: string,
    logsFilePath: string,
    options?: { ticker?: string; timeframe?: string; precision?: number; epsilon?: number },
): Promise<void> {
    const pineScript = fs.readFileSync(pineFilePath, 'utf8');
    const tvLogs: TvLogEntry[] = JSON.parse(fs.readFileSync(logsFilePath, 'utf8'));
    return runPineTest({ pineScript, tvLogs, ...options });
}
