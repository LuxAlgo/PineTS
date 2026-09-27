# Futures sizing, limit fills and intrabar excursions

This patch corrects three strategy-runtime differences observed against native TradingView reports. It does not establish general strategy parity.

- Cash and percentage sizing divide allocations by `price * syminfo.pointvalue`, then round down to `syminfo.mincontract`. Missing or nonpositive minimum-contract metadata retains the six-decimal fallback. Zero or nonfinite order sizes cannot create a position.
- Limit entries and profit-limit exits do not receive slippage. Market and stop fills retain slippage, including stop-exit slippage in the closed trade's adverse excursion.
- Trade and account excursions follow the visited portion of the historical OHLC path. Closing at a stop retains earlier favorable movement, and a target exit retains earlier adverse movement. Reached extremes are recorded before fills change the position. The remaining path is recorded for surviving positions. Equidistant opens visit the low first, as observed in the native reference.

TradingView documents [minimum tradable quantities and slippage by order type](https://www.tradingview.com/support/solutions/43000628599-strategy-properties/) and the [closing-bar path used for drawdown](https://www.tradingview.com/support/solutions/43000681690-max-drawdown-intrabar/).

## Reproductions

The committed tests use small broker contexts and independently calculated expectations. The excursion tests also include minimal native MNQ 5-minute fill cases captured on 2026-09-14. They require neither network access nor private strategy source.

For example, a native two-contract short entered at 29773.75 and stopped at 29897.75. The exit bar later reached 29941.5. The old runtime reported $671 adverse excursion by including that later high; the correct value is $496. Its earlier $63 run-up must also survive the stop exit.

The old sizing snapshot in `order.test.ts` assumed six decimal places despite the Mock provider supplying a 0.00001 minimum contract. The updated values were independently recomputed with decimal FIFO accounting from the fixture's existing crossover dates and OHLC data. They were not copied from the new runtime output.

## Validation

Commands run against this patch:

```sh
npm test -- --run
npm run build:dev:es
npx tsc --noEmit -p tsconfig.dts.json
```

All 22 new regression cases passed. The full suite had 1,783 passing cases and 68 failures. A separate clean worktree at upstream `1fdcf4ab5f8994046f1a95eb741d0fec00e34328` had the identical 68 failing test names, with 1,761 passing cases. No failing cases were added. Build and declaration typecheck passed.

Additional local replays used unchanged saved Pine source, captured settings, and identical native candles:

| Native reference | Before | After |
| --- | --- | --- |
| 85 closed MNQ trades, full captured history | All trade fills matched, but 74 per-trade excursions differed. Drawdown 2163 versus native 2177; run-up 2524.5 versus native 2592. | All 85 trade ledgers and per-trade excursions match. All compared summary metrics match, including drawdown 2177 and run-up 2592. |
| 15 closed MNQ trades in an archived overlap window | Six profit-limit exits slipped one extra tick; net 105 versus native 108. | All 15 ledgers and per-trade excursions match; net 108. Earlier native history is outside the captured window, so this is not a full-history report claim. |
| Allocation smaller than one MNQ contract | Native zero trades; local 236 fractional-contract trades. | Zero trades on both engines. This is a sizing control, not a nonempty strategy parity test. |
| 100% equity Donchian reference | Native trades, local no trades because oversized orders failed margin. | Orders now execute, but trade counts and P&L still differ. Full parity remains unresolved. |

Other saved strategies still have missing or different trades. This patch does not change the broker's overall order scheduler, add Bar Magnifier support, or resolve those other differences. Native captures and private strategy sources remain local; they are not included in this contribution.
