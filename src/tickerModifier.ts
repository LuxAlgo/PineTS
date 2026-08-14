// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * EXTENDED-TICKER chart-type modifiers.
 *
 * A ticker id may carry a chart-type modifier as a `";modifier"` suffix —
 * `"BINANCE:BTCUSDT;heikinashi"`. THE CHART TYPE IS THE TICKER — the single
 * source of truth: a host runs a non-standard chart by constructing PineTS
 * with the extended ticker (`new PineTS(source, "SYM;heikinashi", …)`), and
 * everything derives from it — `chart.is_heikinashi`, the `syminfo.tickerid`
 * suffix, and `request.security` routing. In scripts, `ticker.heikinashi()`
 * appends the modifier and `ticker.standard()` strips it.
 *
 * Division of labor: PineTS only ROUTES these strings — a `request.security`
 * call passes the extended ticker through to the data source untouched, so an
 * embedding host that owns the transform (e.g. a charting library serving
 * Heikin-Ashi views) can honor it. PineTS' own bundled providers serve standard
 * candles only and strip the modifier at their boundary (see BaseProvider /
 * provider getSymbolInfo) — for them the modifier is a documented no-op.
 */

/** The modifier suffixes recognized as chart-type markers. */
const KNOWN_MODIFIERS = new Set(['heikinashi', 'standard']);

/** Split `"SYM;modifier"` into its parts. Plain symbols yield `modifier: null`. */
export function splitTickerModifier(tickerId: string): { symbol: string; modifier: string | null } {
    if (typeof tickerId !== 'string') return { symbol: tickerId, modifier: null };
    const at = tickerId.lastIndexOf(';');
    if (at <= 0 || at === tickerId.length - 1) return { symbol: tickerId, modifier: null };
    const modifier = tickerId.slice(at + 1).toLowerCase();
    if (!KNOWN_MODIFIERS.has(modifier)) return { symbol: tickerId, modifier: null };
    return { symbol: tickerId.slice(0, at), modifier };
}

/** The plain symbol with any chart-type modifier removed. */
export function stripTickerModifier(tickerId: string): string {
    return splitTickerModifier(tickerId).symbol;
}

/** Append a chart-type modifier (replacing any existing one; idempotent). */
export function withTickerModifier(tickerId: string, modifier: string): string {
    return `${stripTickerModifier(tickerId)};${modifier}`;
}
