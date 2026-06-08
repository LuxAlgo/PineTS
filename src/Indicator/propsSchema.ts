// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { IPineProp } from './types';

/**
 * Schema for `indicator()` / `strategy()` declaration arguments.
 *
 * Curated from the Pine v6 reference. Each entry includes a one-line comment
 * enumerating the accepted runtime values and (where applicable) a pointer
 * to the corresponding exported TypeScript enum so UI builders can import
 * the same source of truth.
 *
 * `title` and `shorttitle` are included with `mutable: false` — they appear
 * in `getPropsMeta()` for completeness but are filtered out of `.prop` writes.
 */

// ── Shared between indicator() and strategy() ─────────────────────────
const SHARED_PROPS: IPineProp[] = [
    // any const string — script title
    { name: 'title', type: 'string', defval: '', mutable: false, appliesTo: 'both' },

    // any const string — display name (overrides title in chart UI)
    { name: 'shorttitle', type: 'string', defval: '', mutable: false, appliesTo: 'both' },

    // true | false
    { name: 'overlay', type: 'bool', defval: false, mutable: true, appliesTo: 'both' },

    // 'inherit' | 'price' | 'volume' | 'percent' | 'mintick' — see `enum format` in src/namespaces/Types.ts
    { name: 'format', type: 'enum', defval: 'inherit',
      options: ['inherit', 'price', 'volume', 'percent', 'mintick'],
      mutable: true, appliesTo: 'both' },

    // 0..16 — number of fractional digits shown for plotted values
    { name: 'precision', type: 'int', defval: 10, minval: 0, maxval: 16, mutable: true, appliesTo: 'both' },

    // 'right' | 'left' | 'none' — see `enum scale` in src/namespaces/Types.ts
    { name: 'scale', type: 'enum', defval: 'right',
      options: ['right', 'left', 'none'],
      mutable: true, appliesTo: 'both' },

    // 0..5000 — minimum historical buffer length
    { name: 'max_bars_back', type: 'int', defval: 0, minval: 0, maxval: 5000, mutable: true, appliesTo: 'both' },

    // true | false — draw plots in script declaration order
    { name: 'explicit_plot_zorder', type: 'bool', defval: false, mutable: true, appliesTo: 'both' },

    // 1..500 — max line drawings retained
    { name: 'max_lines_count', type: 'int', defval: 50, minval: 1, maxval: 500, mutable: true, appliesTo: 'both' },

    // 1..500 — max label drawings retained
    { name: 'max_labels_count', type: 'int', defval: 50, minval: 1, maxval: 500, mutable: true, appliesTo: 'both' },

    // 1..500 — max box drawings retained
    { name: 'max_boxes_count', type: 'int', defval: 50, minval: 1, maxval: 500, mutable: true, appliesTo: 'both' },

    // 0..N — initial calculation limited to the last N historical bars (0 = all)
    { name: 'calc_bars_count', type: 'int', defval: 0, minval: 0, mutable: true, appliesTo: 'both' },

    // 1..100 — max polyline drawings retained
    { name: 'max_polylines_count', type: 'int', defval: 50, minval: 1, maxval: 100, mutable: true, appliesTo: 'both' },

    // true | false — allow request.*() calls in conditional/loop scopes (v6+)
    { name: 'dynamic_requests', type: 'bool', defval: true, mutable: true, appliesTo: 'both', version: 6 },

    // true | false — draw script behind the chart (requires overlay=true; v6+)
    { name: 'behind_chart', type: 'bool', defval: true, mutable: true, appliesTo: 'both', version: 6 },
];

// ── indicator()-only ─────────────────────────────────────────────────
export const INDICATOR_PROPS: IPineProp[] = [
    ...SHARED_PROPS.filter(p => p.appliesTo === 'both').map(p => ({ ...p, appliesTo: 'indicator' as const })),

    // any valid Pine timeframe string — e.g. "1", "5", "60", "1D", "1W", "1M", or "" for chart timeframe
    { name: 'timeframe', type: 'string', defval: '', mutable: true, appliesTo: 'indicator' },

    // true | false — show plots only when new HTF data is available
    { name: 'timeframe_gaps', type: 'bool', defval: true, mutable: true, appliesTo: 'indicator' },
];

// ── strategy()-only ──────────────────────────────────────────────────
export const STRATEGY_PROPS: IPineProp[] = [
    ...SHARED_PROPS.filter(p => p.appliesTo === 'both').map(p => ({ ...p, appliesTo: 'strategy' as const })),

    // 0..N — max same-direction entries allowed (0 = single entry per direction)
    { name: 'pyramiding', type: 'int', defval: 0, minval: 0, mutable: true, appliesTo: 'strategy' },

    // true | false — recalculate after each order fill
    { name: 'calc_on_order_fills', type: 'bool', defval: false, mutable: true, appliesTo: 'strategy' },

    // true | false — recalculate on every realtime tick (causes repainting)
    { name: 'calc_on_every_tick', type: 'bool', defval: false, mutable: true, appliesTo: 'strategy' },

    // 0..N (ticks) — minimum tick excursion before limit orders fill
    { name: 'backtest_fill_limits_assumption', type: 'int', defval: 0, minval: 0, mutable: true, appliesTo: 'strategy' },

    // 'fixed' | 'cash' | 'percent_of_equity' — corresponds to strategy.fixed / .cash / .percent_of_equity
    { name: 'default_qty_type', type: 'enum', defval: 'fixed',
      options: ['fixed', 'cash', 'percent_of_equity'],
      mutable: true, appliesTo: 'strategy' },

    // >= 0 — default trade quantity in units determined by default_qty_type
    { name: 'default_qty_value', type: 'float', defval: 1, minval: 0, mutable: true, appliesTo: 'strategy' },

    // >= 0 — starting capital in `currency` units
    { name: 'initial_capital', type: 'float', defval: 1000000, minval: 0, mutable: true, appliesTo: 'strategy' },

    // any of currency.* — see `enum currency` in src/namespaces/Types.ts (40+ codes incl. 'USD', 'USDT', 'EUR', 'BTC', 'NONE', ...)
    { name: 'currency', type: 'enum', defval: 'USD',
      options: ['AED','ARS','AUD','BDT','BHD','BRL','BTC','CAD','CHF','CLP','CNY','COP','CZK','DKK','EGP','ETH','EUR','GBP','HKD','HUF','IDR','ILS','INR','ISK','JPY','KES','KRW','KWD','LKR','MAD','MXN','MYR','NGN','NOK','NONE','NZD','PEN','PHP','PKR','PLN','QAR','RON','RSD','RUB','SAR','SEK','SGD','THB','TND','TRY','TWD','USD','USDT','VES','VND','ZAR'],
      mutable: true, appliesTo: 'strategy' },

    // 0..N — slippage in ticks applied against fill direction
    { name: 'slippage', type: 'int', defval: 0, minval: 0, mutable: true, appliesTo: 'strategy' },

    // 'percent' | 'cash_per_contract' | 'cash_per_order' — corresponds to strategy.commission.percent / .cash_per_contract / .cash_per_order
    { name: 'commission_type', type: 'enum', defval: 'percent',
      options: ['percent', 'cash_per_contract', 'cash_per_order'],
      mutable: true, appliesTo: 'strategy' },

    // >= 0 — commission per leg in units determined by commission_type
    { name: 'commission_value', type: 'float', defval: 0, minval: 0, mutable: true, appliesTo: 'strategy' },

    // true | false — execute orders after each bar closes
    { name: 'process_orders_on_close', type: 'bool', defval: false, mutable: true, appliesTo: 'strategy' },

    // 'FIFO' | 'ANY' — order in which trades are closed (bare strings, NOT a namespace constant)
    { name: 'close_entries_rule', type: 'enum', defval: 'FIFO',
      options: ['FIFO', 'ANY'],
      mutable: true, appliesTo: 'strategy' },

    // 0..100 — % of long position covered by collateral (0 = unlimited, 100 = no leverage)
    { name: 'margin_long', type: 'float', defval: 100, minval: 0, maxval: 100, mutable: true, appliesTo: 'strategy' },

    // 0..100 — % of short position covered by collateral (0 = unlimited, 100 = no leverage)
    { name: 'margin_short', type: 'float', defval: 100, minval: 0, maxval: 100, mutable: true, appliesTo: 'strategy' },

    // any number — annual % return of zero-risk investment (Sharpe / Sortino denominator)
    { name: 'risk_free_rate', type: 'float', defval: 2, mutable: true, appliesTo: 'strategy' },

    // true | false — use lower-timeframe bars for more realistic fills (Premium+ only)
    { name: 'use_bar_magnifier', type: 'bool', defval: false, mutable: true, appliesTo: 'strategy' },

    // true | false — force standard OHLC fills on Heikin Ashi charts
    { name: 'fill_orders_on_standard_ohlc', type: 'bool', defval: false, mutable: true, appliesTo: 'strategy' },
];

/**
 * Pick the right schema for a detected declaration type. Returns the
 * indicator schema when type is unknown (sensible fallback per spec).
 */
export function propsForDeclaration(type: 'indicator' | 'strategy' | null): IPineProp[] {
    return type === 'strategy' ? STRATEGY_PROPS : INDICATOR_PROPS;
}
