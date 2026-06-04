// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Maximum equity run-up as a percent of the TOTAL EQUITY at the peak moment
 * (not initial_capital). TV reports max_runup_percent as
 *   max_runup / (realized_equity_at_peak + best_intrabar_excursion_at_peak) * 100
 * which is the runup as a fraction of the highest equity ever reached. We
 * snapshot that denominator in `equity_at_runup_peak` whenever `max_runup`
 * is bumped.
 */
export function max_runup_percent(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || !s.equity_at_runup_peak) return 0;
        return (100 * s.max_runup) / s.equity_at_runup_peak;
    };
}
