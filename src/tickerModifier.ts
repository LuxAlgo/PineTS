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

/**
 * Session / adjustment modifiers of a ticker id, keyed as in TradingView's encoded form
 * `={"adjustment":"splits","session":"extended","symbol":"BINANCE:BTCUSDT"}`.
 */
export type TickerModifiers = Record<string, string | boolean>;

/** Split TradingView's encoded ticker id into its symbol and modifiers. Plain ids have no modifiers. */
export function decodeTickerId(tickerId: string): { symbol: string; modifiers: TickerModifiers } {
    if (typeof tickerId === 'string' && tickerId.startsWith('={')) {
        try {
            const { symbol, ...modifiers } = JSON.parse(tickerId.slice(1));
            if (typeof symbol === 'string') return { symbol, modifiers };
        } catch {
            // not an encoded id: fall through
        }
    }
    return { symbol: tickerId, modifiers: {} };
}

/** TradingView's ticker id for `symbol` with `modifiers`: the plain symbol, or `={...}` with sorted keys. */
export function encodeTickerId(symbol: string, modifiers: TickerModifiers): string {
    const keys = Object.keys(modifiers).filter((k) => modifiers[k] !== undefined);
    if (keys.length === 0) return symbol;
    const entries: [string, string | boolean][] = keys.map((k) => [k, modifiers[k]]);
    entries.push(['symbol', symbol]);
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return '=' + JSON.stringify(Object.fromEntries(entries));
}

/**
 * Split `"SYM;modifier"` into its parts. Plain symbols yield `modifier: null`. The symbol is always
 * plain: session / adjustment modifiers of an encoded id (`={"session":…,"symbol":"SYM"}`) are dropped.
 */
export function splitTickerModifier(tickerId: string): { symbol: string; modifier: string | null } {
    if (typeof tickerId !== 'string') return { symbol: tickerId, modifier: null };
    const at = tickerId.lastIndexOf(';');
    if (at <= 0 || at === tickerId.length - 1) return { symbol: decodeTickerId(tickerId).symbol, modifier: null };
    const modifier = tickerId.slice(at + 1).toLowerCase();
    if (!KNOWN_MODIFIERS.has(modifier)) return { symbol: decodeTickerId(tickerId).symbol, modifier: null };
    return { symbol: decodeTickerId(tickerId.slice(0, at)).symbol, modifier };
}

/**
 * The ticker id a data source can serve: an encoded id's symbol, keeping a chart-type suffix
 * (`={"session":"extended","symbol":"SYM"};heikinashi` → `SYM;heikinashi`). Session and
 * adjustment modifiers are dropped: no bundled provider serves them.
 */
export function plainTickerId(tickerId: string): string {
    if (typeof tickerId !== 'string') return tickerId;
    const { symbol, modifier } = splitTickerModifier(tickerId);
    return modifier ? `${symbol};${modifier}` : symbol;
}

/** The plain symbol with any chart-type modifier removed. */
export function stripTickerModifier(tickerId: string): string {
    return splitTickerModifier(tickerId).symbol;
}

/**
 * Append a chart-type modifier (replacing any existing one; idempotent). Session / adjustment
 * modifiers of an encoded id are kept, so the order of `ticker.heikinashi` / `ticker.modify` does not matter.
 */
export function withTickerModifier(tickerId: string, modifier: string): string {
    const { modifier: current } = splitTickerModifier(tickerId);
    const base = current ? tickerId.slice(0, tickerId.lastIndexOf(';')) : tickerId;
    return `${base};${modifier}`;
}
