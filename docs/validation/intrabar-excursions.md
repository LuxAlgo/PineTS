# Intrabar trade and equity excursions — draft validation

This is the trade and aggregate equity excursion split requested in [the review of #311](https://github.com/LuxAlgo/PineTS/pull/311#issuecomment-6020275599), rebased onto `dev` at `90209d4`. Cash sizing, quantity flooring, limit slippage, exit lifecycle and order-price rounding remain separate.

## Reproducible arithmetic regressions

`tests/namespaces/strategy/intrabar-excursions.test.ts` contains synthetic OHLC bars with explicit symbol metadata (`pointvalue = 2`, `mincontract = 1`, `mintick = 0.25`). Its expected values are hand-calculated from the [documented historical broker-emulator path](https://www.tradingview.com/pine-script-docs/concepts/strategies/#broker-emulator), not copied from PineTS output.

For example, a three-contract long entered at 100 on a bar `[open=100, high=105, low=80, close=100]` follows open → high → low → close. A stop at 90 sees the high before it exits: run-up is `(105−100) × 3 × 2 = 30`, drawdown is `(100−90) × 3 × 2 = 60`. The low at 80 occurs after exit and does not belong to the trade.

The fixtures cover long/short stops and targets, market exits at the open, entry and exit slippage, intrabar stop entries, partial exits, reversal entries, trailing retracement, margin checkpoints and immediate/on-close execution. Entry path positions use the unslipped quote; execution prices remain distinct. The existing equal-distance high-first precedence is preserved, since changing which orders fill requires separate native evidence.

## Fresh native fixture comparison

On October6,2026, the original [public Pine v6 probe](excursion-comparison/probe.pine) ran on a newly isolated ordinary daily `CME_MINI:MNQ1!` chart. Exact source readback SHA256 is `37fb4e138073c3267c6a20859c921d0760fd6d48f9f5afe9eff1df3291bd6b4c`. Attached properties matched the [frozen contract](excursion-comparison/capture-contract.json): fixed quantity1, initial capital1,000,000, zero fees/slippage/margins, all recalculation/close flags false, Bar Magnifier off. Native plots confirmed pointvalue2, mincontract1, mintick0.25. The chart-scope report completed with10closed trades.

Local replay on300matching chart candles compared nine numeric fields per trade at tolerance1e-8: entry/exit timestamps and prices, quantity, commission, profit, drawdown and run-up. All90 comparisons matched. Aggregate drawdown1,809.5, run-up2,856 and net profit1,468.5 also matched. [Sanitized result](excursion-comparison/native-result.json) records exact tested commit, scope and limitations; raw candles and full native reports remain local. The historical85-trade reference in #311 is not used as evidence here.

Reproduce with the locked dependencies from repository root using `node --import tsx docs/validation/excursion-comparison/replay.mts /absolute/native-capture.json`. Capture JSON must follow the contract and preserve exact native settings/source/metadata. Native bar open timestamps were captured exactly; closeTime was derived from the17:00–16:00 session, and this probe does not use on-close/immediate execution. The native equity accessor returned only a summary, so no equity-curve comparison is claimed.

This is one long-only bracket fixture. Multi-position, reversal, partial-close, fee and slippage paths remain covered by independent synthetic arithmetic, and broader native evidence is still needed before claiming general broker parity. The existing16chart-state fingerprints remained identical and the shared operator lock was released after capture. No existing layout or private script was edited.

## Aggregate book replay and causal limits

Per-trade intervals are recomputed from prior-bar peaks. Aggregate `strategy.max_drawdown` / `strategy.max_runup` instead replay the opening signed FIFO book, realized profit and commissions through actual fill deltas and the surviving quote path. This includes partial exits, multiple entries, reversals, close processing, deferred previous-close liquidations and streaming snapshot restoration. `aggregate-excursions.test.ts` contains 14 independent arithmetic fixtures; the per-trade suite contains 17.

The entry/exit scheduler is unchanged and can produce fills in queue order rather than chronological quote order. Independent entries can be sorted by path position, but a closing delta must follow the entries it consumes, and a reversal opening must follow its closing leg. When the scheduler closes a same-bar entry at an earlier path position, aggregate replay clamps that close to the consumed entry's position. Execution prices and ledger rows remain unchanged. This avoids creating phantom positions before their entries; it is a causal accounting convention for the existing scheduler, not evidence that its fills match TradingView. Two regression fixtures cover such a market close and reversal following a later stop entry.

This patch does not implement a globally chronological entry/exit scheduler, Bar Magnifier, or repair the outstanding trailing-fill changes in #367. Native verification must include multi-order and mixed entry/exit bars; synthetic tests alone do not establish general broker parity.
