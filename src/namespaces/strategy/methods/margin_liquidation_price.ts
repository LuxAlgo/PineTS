// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Price at which the current leveraged position would be force-liquidated.
 * Returns NaN when flat or when the relevant margin% is 100 (no leverage).
 *
 * Official TV formula, documented at
 * https://www.tradingview.com/support/solutions/43000717375/ :
 *
 *   MarginLiquidationPriceRaw =
 *       ((InitialCapital + NetProfit) / (PointValue * AbsPositionSize)
 *        − Direction * EntryPrice)
 *     / (MarginPercent / 100 − Direction)
 *
 * Where:
 *   InitialCapital + NetProfit = realized account equity (initial cash
 *                                 plus closed-trade P&L; excludes openprofit)
 *   PointValue                 = syminfo.pointvalue (1 for crypto, varies
 *                                 for futures contracts)
 *   AbsPositionSize            = |strategy.position_size|
 *   Direction                  = +1 for long, −1 for short
 *   EntryPrice                 = strategy.position_avg_price
 *   MarginPercent              = margin_long for longs, margin_short for shorts
 *
 * Verified at margin_long ∈ {30, 50} against TV on BTCUSDC weekly via probes
 * in .scratchpad/liq-probes (since cleaned up). A long-only reverse-
 * -engineered closed form happened to match both probes, but extrapolated
 * incorrectly to shorts; this is the canonical TV formula and covers both
 * directions correctly.
 */
export function margin_liquidation_price(context: any) {
    return () => {
        const s = context.strategy;
        if (!s || s.position_size === 0) return NaN;
        const avgPrice = s.position_avg_price;
        if (!Number.isFinite(avgPrice)) return NaN;

        const direction = Math.sign(s.position_size);
        const marginPct = direction === 1
            ? (s.config.margin_long  ?? 100)
            : (s.config.margin_short ?? 100);
        if (marginPct >= 100) return NaN;  // No leverage → no liquidation.

        const qty        = Math.abs(s.position_size);
        const pointValue = context.pine?.syminfo?.pointvalue ?? 1;
        const realizedEq = (s.initial_capital ?? 0) + (s.netprofit ?? 0);

        const numerator   = realizedEq / (pointValue * qty) - direction * avgPrice;
        const denominator = marginPct / 100 - direction;
        const raw         = numerator / denominator;

        // Per the TV docs, the raw value is rounded to the nearest mintick:
        // DOWN for longs (toward more negative, safer/farther from current),
        // UP for shorts (toward more positive, safer/farther from current).
        const mintick = context.pine?.syminfo?.mintick ?? 0.01;
        return direction === 1
            ? Math.floor(raw / mintick) * mintick
            : Math.ceil(raw / mintick)  * mintick;
    };
}
