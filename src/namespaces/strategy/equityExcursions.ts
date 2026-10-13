// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { StrategyState } from './types';

/** Signed quantity and signed entry cost describe the ledger's unrealized P&L. */
export interface EquityBook {
    size: number;
    cost: number;
    commission: number;
    netprofit: number;
}

type EquityPeaks = Pick<StrategyState,
    'equity_peak' | 'equity_trough' | 'max_drawdown' | 'max_runup' |
    'equity_at_drawdown_peak' | 'equity_at_runup_peak' |
    'max_drawdown_percent_value' | 'max_runup_percent_value'>;

export interface EquityReplay {
    bar: number;
    time: number;
    path: number[];
    pointValue: number;
    book: EquityBook;
    peaks: EquityPeaks;
    fills: Array<{ path: number; delta: EquityBook }>;
}

const PEAK_FIELDS: Array<keyof EquityPeaks> = [
    'equity_peak', 'equity_trough', 'max_drawdown', 'max_runup',
    'equity_at_drawdown_peak', 'equity_at_runup_peak',
    'max_drawdown_percent_value', 'max_runup_percent_value',
];

export function createEquityReplay(strategy: StrategyState, book: EquityBook, bar: number, time: number, path: number[], pointValue: number): EquityReplay {
    const peaks = {} as EquityPeaks;
    for (const key of PEAK_FIELDS) peaks[key] = strategy[key];
    return { bar, time, path, pointValue, book, peaks, fills: [] };
}

export function recordEquityFill(replay: EquityReplay, path: number, before: EquityBook, after: EquityBook): void {
    replay.fills.push({ path: Math.max(0, Math.min(3, path)), delta: {
        size: after.size - before.size,
        cost: after.cost - before.cost,
        commission: after.commission - before.commission,
        netprofit: after.netprofit - before.netprofit,
    } });
}

/**
 * Replay recorded fills without changing the real ledger or fill scheduler.
 * Replaying from the opening snapshot allows a later-processed, earlier-price
 * exit to correct this bar's peaks. Stable sorting preserves close/open order
 * for reversals and multiple fills at the same quote.
 */
export function replayEquityExcursions(strategy: StrategyState, replay: EquityReplay): void {
    if (!replay.path.every(Number.isFinite)) return;
    const peaks = { ...replay.peaks };
    const book = { ...replay.book };
    const at = (position: number): number => {
        if (position === 3) return replay.path[3];
        const segment = Math.floor(position);
        return replay.path[segment] + (replay.path[segment + 1] - replay.path[segment]) * (position - segment);
    };
    const sample = (price: number): void => {
        const realized = strategy.initial_capital + book.netprofit;
        // Preserve the existing realized-equity basis: peak excludes open
        // entry commissions; trough retains their cash deduction.
        peaks.equity_peak = Math.max(peaks.equity_peak, realized + book.commission);
        peaks.equity_trough = Math.min(peaks.equity_trough, realized);
        const equity = realized + (book.size * price - book.cost) * replay.pointValue;
        const drawdown = peaks.equity_peak - equity;
        const runup = equity - peaks.equity_trough;
        if (drawdown > peaks.max_drawdown) {
            peaks.max_drawdown = drawdown;
            peaks.equity_at_drawdown_peak = peaks.equity_peak;
        }
        if (runup > peaks.max_runup) {
            peaks.max_runup = runup;
            peaks.equity_at_runup_peak = equity;
        }
        if (peaks.equity_peak > 0) peaks.max_drawdown_percent_value = Math.max(peaks.max_drawdown_percent_value, 100 * drawdown / peaks.equity_peak);
        if (equity > 0) peaks.max_runup_percent_value = Math.max(peaks.max_runup_percent_value, 100 * runup / equity);
    };
    let cursor = 0;
    sample(at(cursor));
    for (const fill of [...replay.fills].sort((a, b) => a.path - b.path)) {
        for (let vertex = Math.floor(cursor) + 1; vertex < fill.path; vertex++) sample(at(vertex));
        sample(at(fill.path));
        book.size += fill.delta.size;
        book.cost += fill.delta.cost;
        book.commission += fill.delta.commission;
        book.netprofit += fill.delta.netprofit;
        // Execution slippage and commissions change account equity here;
        // the quoted market price for surviving lots remains unchanged.
        sample(at(fill.path));
        cursor = fill.path;
    }
    for (let vertex = Math.floor(cursor) + 1; vertex <= 3; vertex++) sample(at(vertex));
    for (const key of PEAK_FIELDS) strategy[key] = peaks[key];
}
