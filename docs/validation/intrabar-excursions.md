# Intrabar trade and equity excursions — draft validation

This is the trade and aggregate equity excursion split requested in [the review of #311](https://github.com/LuxAlgo/PineTS/pull/311#issuecomment-6020275599), rebased onto `dev` at `90209d4`. Cash sizing, quantity flooring, limit slippage, exit lifecycle and order-price rounding remain separate.

## Reproducible arithmetic regressions

`tests/namespaces/strategy/intrabar-excursions.test.ts` contains synthetic OHLC bars with explicit symbol metadata (`pointvalue = 2`, `mincontract = 1`, `mintick = 0.25`). Its expected values are hand-calculated from the [documented historical broker-emulator path](https://www.tradingview.com/pine-script-docs/concepts/strategies/#broker-emulator), not copied from PineTS output.

For example, a three-contract long entered at 100 on a bar `[open=100, high=105, low=80, close=100]` follows open → high → low → close. A stop at 90 sees the high before it exits: run-up is `(105−100) × 3 × 2 = 30`, drawdown is `(100−90) × 3 × 2 = 60`. The low at 80 occurs after exit and does not belong to the trade.

The fixtures cover long/short stops and targets, market exits at the open, entry and exit slippage, intrabar stop entries, partial exits, reversal entries, trailing retracement, margin checkpoints and immediate/on-close execution. Entry path positions use the unslipped quote; execution prices remain distinct. The existing equal-distance high-first precedence is preserved, since changing which orders fill requires separate native evidence.

## Native comparison still required

No fresh TradingView comparison is included. The supported `tab_new` operation could not verify a unique isolated chart. A subsequent typed UI operation could not address the desktop shell's New tab target (`outcome:not_started`), so no existing layout was changed. The historical 85-trade reference cited in #311 has not been rerun on this `dev` baseline and is not evidence for this draft.

Before this becomes ready for review, capture an original minimal public Pine v6 probe on ordinary candles, Bar Magnifier off, with the exact source, date range, chart timeframe, symbol metadata and strategy settings. Replay matching candles locally, separately record order-sizing prices and execution prices, and compare the per-trade ledger, drawdown/run-up and summary metrics. No private strategy or downloaded vendor candle archive is part of this contribution.

## Aggregate book replay and causal limits

Per-trade intervals are recomputed from prior-bar peaks. Aggregate `strategy.max_drawdown` / `strategy.max_runup` instead replay the opening signed FIFO book, realized profit and commissions through actual fill deltas and the surviving quote path. This includes partial exits, multiple entries, reversals, close processing, deferred previous-close liquidations and streaming snapshot restoration. `aggregate-excursions.test.ts` contains 14 independent arithmetic fixtures; the per-trade suite contains 17.

The entry/exit scheduler is unchanged and can produce fills in queue order rather than chronological quote order. Independent entries can be sorted by path position, but a closing delta must follow the entries it consumes, and a reversal opening must follow its closing leg. When the scheduler closes a same-bar entry at an earlier path position, aggregate replay clamps that close to the consumed entry's position. Execution prices and ledger rows remain unchanged. This avoids creating phantom positions before their entries; it is a causal accounting convention for the existing scheduler, not evidence that its fills match TradingView. Two regression fixtures cover such a market close and reversal following a later stop entry.

This patch does not implement a globally chronological entry/exit scheduler, Bar Magnifier, or repair the outstanding trailing-fill changes in #367. Native verification must include multi-order and mixed entry/exit bars; synthetic tests alone do not establish general broker parity.
