// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Pine Script `input.*` typing classification. Mirrors TradingView's input
 * widget types 1:1. The bare `input()` wrapper auto-detects from `defval`
 * and dispatches to one of these — there is no `'auto'` member.
 *
 * v6 adds `'enum'`. Everything else exists in both v5 and v6.
 */
export type PineInputType =
    | 'int'
    | 'float'
    | 'bool'
    | 'string'
    | 'source'
    | 'color'
    | 'enum'
    | 'price'
    | 'time'
    | 'session'
    | 'symbol'
    | 'timeframe'
    | 'text_area';

/**
 * Value of an input's `display=` argument. Stored as the suffix (without the
 * `display.` prefix), matching what the existing runtime parses into
 * `InputOptions.display` at the call site.
 */
export type PineInputDisplay = 'none' | 'data_window' | 'status_line' | 'all';

/**
 * Parsed metadata for a single `input.*` declaration in a Pine script.
 *
 * Field presence matches the Pine reference (v6 superset):
 *   - title, tooltip, group, display, active        — universal (all 14 fns)
 *   - inline                                         — universal except text_area
 *   - confirm                                        — universal except bare input()
 *   - options                                        — enum, float, int, session, string, timeframe
 *   - minval / maxval / step                         — float, int only
 *
 * `defval` is fully resolved at scan time — for enum inputs we resolve
 * `tz.utc` → "UTC" (the field title) so JS callers see what TradingView's
 * `str.tostring()` would print, never the AST path.
 */
export interface IPineInput {
    // Always present
    type: PineInputType;
    defval: unknown;

    // Variable the input is assigned to (`len = input.int(…)` → "len"). Present
    // for every scanned input (the scanner only captures `var = input.*()`
    // forms). It is the PRIMARY, stable key for `.input[...]` overrides — title
    // is a secondary alias (titles can be empty or duplicated; varId can't).
    varId?: string;

    // Universal optional
    title?: string;
    tooltip?: string;
    group?: string;
    display?: PineInputDisplay;
    active?: boolean; // v6+ only

    // Almost-universal — accepted by everything except bare input()
    confirm?: boolean;

    // Universal except input.text_area
    inline?: string;

    // Subset
    options?: unknown[]; // enum/float/int/session/string/timeframe
    minval?: number; // float/int
    maxval?: number; // float/int
    step?: number; // float/int
}

/**
 * Pine Script declaration-arg typing classification (used by `IPineProp`).
 *
 * `enum` covers every Pine-namespace constant used as a declaration arg
 * (e.g. `format.percent`, `currency.USD`, `strategy.percent_of_equity`).
 * The scanner resolves these to bare strings via the rightmost-identifier
 * rule, matching what the runtime sees.
 */
export type PinePropType = 'string' | 'int' | 'float' | 'bool' | 'enum';

/**
 * Schema entry for a single `indicator()` / `strategy()` declaration argument.
 *
 * The full set of entries is curated from the Pine v6 reference:
 *   - https://www.tradingview.com/pine-script-reference/v6/#fun_indicator
 *   - https://www.tradingview.com/pine-script-reference/v6/#fun_strategy
 *
 * `title` and `shorttitle` are present in the schema with `mutable: false`
 * so UI consumers can render them, but are filtered out of `.prop` writes.
 *
 * For enum-typed entries, `options` enumerates the accepted runtime strings.
 * The schema source file points to the corresponding exported Pine enum
 * (e.g. `enum format` in Types.ts) so JS callers can import the same source.
 */
export interface IPineProp {
    name:        string;                      // 'initial_capital', 'pyramiding', ...
    type:        PinePropType;
    defval:      unknown;                     // Pine-spec default
    options?:    unknown[];                   // enum: accepted runtime values
    minval?:     number;
    maxval?:     number;
    mutable:     boolean;                     // false for title/shorttitle
    appliesTo:   'indicator' | 'strategy' | 'both';
    version?:    5 | 6;                       // 6 = v6-only (behind_chart, dynamic_requests)
}

/**
 * Result of `Indicator.prepare()`. The single artifact handed to the engine.
 *
 * `inputs` is the title-keyed map the runtime already expects — built by
 * merging each `IPineInput`'s current value (post-user-override) into a
 * flat `{ [title]: value }` object that `input.utils.resolveInput()` reads.
 */
export interface PreparedScript {
    fn: Function;
    inputs: Record<string, unknown>;
    usesVisibleRange: boolean;
    ltfSlices?: any[]; // request.security_lower_tf transpile-time slices
}
