// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { PineRuntimeError } from '../errors/PineRuntimeError';

/**
 * TradingView caps collection sizes: a script that asks for more is stopped with
 * a runtime error rather than allowed to exhaust host memory. 100,000 is
 * TradingView's documented element limit for arrays and matrices; the same bound
 * is applied to the other size-driven built-ins (`str.repeat`, `table.new`) so a
 * single call cannot trigger an unbounded allocation on the host.
 *
 * `footprint` keeps its own, lower cap (`MAX_ROWS`); this is the general ceiling
 * for the collection built-ins that previously had none.
 */
export const MAX_COLLECTION_ELEMENTS = 100_000;

/** Maximum UTF-16 code units in one Pine string (at most 2 MiB of string data). */
export const MAX_STRING_CODE_UNITS = 1_000_000;

export function assertStringLength(length: number, method: string): void {
    if (!Number.isSafeInteger(length) || length < 0 || length > MAX_STRING_CODE_UNITS) {
        throw new PineRuntimeError(`The requested string exceeds the ${MAX_STRING_CODE_UNITS} character limit.`, method,
            Number.isSafeInteger(length) && length > MAX_STRING_CODE_UNITS ? 'RESOURCE_LIMIT' : 'INVALID_ARGUMENT');
    }
}

/**
 * Throw a Pine runtime error when a requested element count exceeds the cap.
 * `method` names the Pine built-in (`array.new`, `matrix.new`, …) so a host can
 * attribute the error. A non-finite count (e.g. Infinity) is also rejected.
 */
export function assertElementCount(count: number, method: string): void {
    if (!Number.isFinite(count) || count > MAX_COLLECTION_ELEMENTS) {
        throw new PineRuntimeError(
            `The requested size exceeds the ${MAX_COLLECTION_ELEMENTS} element limit.`,
            method,
            Number.isFinite(count) ? 'RESOURCE_LIMIT' : 'INVALID_ARGUMENT'
        );
    }
}

/**
 * Maximum number of distinct secondary contexts (one per unique
 * symbol/timeframe/expression) a single run may create through `request.*()`.
 * Each one is a real data-provider fetch on the host's API key, so an uncapped
 * fan-out — e.g. a `request.security()` whose symbol varies every bar — would
 * drain the host operator's provider quota. TradingView limits a script to 40
 * `request.*()` calls; the same ceiling bounds the fetches here.
 */
export const MAX_REQUEST_CONTEXTS = 40;

/**
 * Count one newly created `request.*()` secondary context against the per-run
 * budget and stop the script once it is exceeded. Mirrors the single-call guard
 * on `request.footprint`. Only the primary context creates secondaries (a
 * secondary returns early), so the counter it carries is the run-wide total.
 */
export function trackRequestContext(context: any, method: string): void {
    const nextCount = (context.secondaryContextCount || 0) + 1;
    if (nextCount > MAX_REQUEST_CONTEXTS) {
        throw new PineRuntimeError('The script executes too many request.*() function calls.', method, 'RESOURCE_LIMIT');
    }
    context.secondaryContextCount = nextCount;
}

/**
 * Upper bound for `calc_bars_count`. The value is the secondary's historical
 * depth; on a paginating provider an unbounded value amplifies one call into
 * many fetches. Clamp it to a generous but finite ceiling.
 */
export const MAX_CALC_BARS = 100_000;
