# Intrabar excursion accounting — draft validation

This is the excursion-only split requested in [the review of #311](https://github.com/LuxAlgo/PineTS/pull/311#issuecomment-6020275599), rebased onto `dev` at `90209d4`. Cash sizing, quantity flooring, limit slippage, exit lifecycle and order-price rounding remain separate.

## Reproducible arithmetic regressions

`tests/namespaces/strategy/intrabar-excursions.test.ts` contains synthetic OHLC bars with explicit symbol metadata (`pointvalue = 2`, `mincontract = 1`, `mintick = 0.25`). Its expected values are hand-calculated from the [documented historical broker-emulator path](https://www.tradingview.com/pine-script-docs/concepts/strategies/#broker-emulator), not copied from PineTS output.

For example, a three-contract long entered at 100 on a bar `[open=100, high=105, low=80, close=100]` follows open → high → low → close. A stop at 90 sees the high before it exits: run-up is `(105−100) × 3 × 2 = 30`, drawdown is `(100−90) × 3 × 2 = 60`. The low at 80 occurs after exit and does not belong to the trade.

The fixtures cover long/short stops and targets, market exits at the open, entry and exit slippage, intrabar stop entries, partial exits, reversal entries, trailing retracement, margin checkpoints and immediate/on-close execution. Entry path positions use the unslipped quote; execution prices remain distinct. The existing equal-distance high-first precedence is preserved, since changing which orders fill requires separate native evidence.

## Native comparison still required

No fresh TradingView comparison is included. The supported TradingView `tab_new` operation returned `success:false`, `outcome:uncertain`, and could not verify a unique isolated new chart. Native capture stopped at that point to preserve existing charts and scripts. The historical 85-trade reference cited in #311 has not been rerun on this `dev` baseline and is not evidence for this draft.

Before this becomes ready for review, capture an original minimal public Pine v6 probe on ordinary candles, Bar Magnifier off, with the exact source, date range, chart timeframe, symbol metadata and strategy settings. Replay matching candles locally, separately record order-sizing prices and execution prices, and compare the per-trade ledger, drawdown/run-up and summary metrics. No private strategy or downloaded vendor candle archive is part of this contribution.

This patch follows the existing order-processing phases. It does not implement a globally chronological entry/exit scheduler, Bar Magnifier, or repair the outstanding trailing-fill changes in #367. Native verification must include multi-order and mixed entry/exit bars; synthetic tests alone do not establish general broker parity.
