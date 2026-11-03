# Optional page projection

At page size one, a consumer reading only `page.fullContext` currently constructs
one extra `Context`, including its namespace and drawing helpers, for each bar.
The proposed fourth `run()` argument lets that consumer return a small projection
of the existing full context. The default page API remains unchanged. This is an
opt-in public API proposal for maintainer review.

The committed synthetic tests cover default page slicing, sizes 1/3/20, partial
pages, period limits, early iterator closure, synchronous and asynchronous
projection errors, invalid page sizes, per-bar strategy state/finalization, and
live rollback with idle `null` signals. The three-bar SMA expectations are hand
calculated from an arithmetic close sequence. Six of the original eight cases
failed on the unmodified upstream source because the projection was ignored.

Reproduce the independent synthetic benchmark with:

```sh
node --import tsx scripts/benchmark-page-projection.ts
```

On Node 22.22.2, macOS arm64, four cold processes in ABBA order measured:

| Mode | Run 1 (ms) | Run 2 (ms) | Mean (ms) |
| --- | ---: | ---: | ---: |
| Default | 261.814 | 286.157 | 273.986 |
| Projection | 30.989 | 32.238 | 31.614 |

Both modes processed 5,000 synthetic one-minute bars with page size one and a
14-bar SMA plot. Complete result/plot hashes matched in all four runs:
`8ce0e07ee9814cff7874a8e21818f73fe62cc0ba4c1769a60c1854169241d6af`.
Timing includes transpilation and generator exhaustion, excluding data
initialization, process startup and final hash computation. This small indicator
deliberately exposes facade overhead. Its 88.46% reduction is specific to this
fixture; it does not establish gains for complex strategies, combined timezone
changes, long histories or complete optimizer workflows. No timing threshold is
used in correctness tests.

Build and declaration typecheck passed. Full-suite runs on upstream
`c5e6b0efee7e42d78b42d96f14173f38be082551` and this change had the same 139 failing
test names, with no new failures. Many existing tests require live Binance
access; the local comparison ran under the same network restrictions. Those
failures are not waived or represented as a green suite.
