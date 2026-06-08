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
