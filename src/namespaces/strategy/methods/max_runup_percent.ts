// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Maximum equity run-up percent. Mirrors the `max_drawdown_percent`
 * semantic — TV reports the RUNNING MAX of the per-latch ratio,
 * `(latched_runup / equity_at_that_latch) × 100`, across all latches
 * in the strategy's lifetime.
 *
 * In most strategies the runup ratio grows monotonically with each
 * latch, so this matches a derived `(current_max_runup /
 * current_equity_at_runup_peak) × 100`. But in scenarios where a
 * later latch produces a larger absolute runup yet a smaller
 * percentage (because equity grew faster than the runup), TV keeps
 * the highest ratio ever seen — same as the drawdown semantic.
 *
 * The running max is maintained in `updateEquityPeaks` whenever
 * max_runup is latched to a new peak — see utils.ts.
 */
export function max_runup_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s) return 0;
        return s.max_runup_percent_value ?? 0;
    };
}
