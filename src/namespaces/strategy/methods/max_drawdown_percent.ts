// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Maximum drawdown percent. TV's empirical semantic — verified via
 * QA #1's stress test on BTCUSDC weekly 2018-12 → 2024-12 — is the
 * RUNNING MAX of `(latched_drawdown / equity_at_that_latch) × 100`
 * across all latch events over the strategy's lifetime, NOT a
 * derived `(current_max_drawdown / current_equity_at_peak) × 100`.
 *
 * The two interpretations diverge when a later latch produces a
 * larger absolute drawdown but a smaller percentage (because equity
 * grew faster than the drawdown). Example from QA #1:
 *   2020-05-04: dd = 8,578  / equity-peak 100,000  → 8.578%
 *   2021-05-10: dd = 10,489 / equity-peak 127,910  → 8.200%
 * The "derived" interpretation would report 8.200% on 2021-05-10;
 * TV (and PT now) reports 8.578% — the highest ratio ever seen.
 *
 * The running max is maintained in `updateEquityPeaks` whenever
 * max_drawdown is latched to a new peak — see utils.ts.
 */
export function max_drawdown_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s) return 0;
        return s.max_drawdown_percent_value ?? 0;
    };
}
