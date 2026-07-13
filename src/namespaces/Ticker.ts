// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Alaa-eddine KADDOURI

import { Series } from '../Series';
import { splitTickerModifier, stripTickerModifier, withTickerModifier } from '../tickerModifier';

/**
 * Pine Script `ticker.*` namespace.
 *
 * The methods here construct "ticker ID" strings that are passed to
 * `request.security` / `request.security_lower_tf` to fetch data for a
 * specific symbol — potentially with extra modifiers (session,
 * adjustment, non-standard chart type).
 *
 * CHART-TYPE modifiers travel as an EXTENDED-TICKER suffix
 * (`"BINANCE:BTCUSDT;heikinashi"` — see `tickerModifier.ts`):
 * `ticker.heikinashi()` appends it, `ticker.standard()` strips it, and
 * `request.security` passes it through to the data source untouched. An
 * embedding host that owns the transform honors it; PineTS' own bundled
 * providers serve standard candles only and strip it at their boundary
 * (documented no-op for standalone use). The other non-standard types
 * (Renko, Kagi, Line Break, Point & Figure) remain plain-symbol stubs —
 * no data source we route to can construct those bars.
 *
 * For the plain "no-modifier" cases — which cover virtually every
 * real-world Pine script — the returned tickerid strings match
 * TradingView's exact log output, so automation tests pass strictly.
 * Non-default `adjustment` values trigger TV's encoded
 * `={"adjustment":"…","symbol":"…"}` form; PineTS only emits the
 * plain symbol there (since `request.security` doesn't honor
 * adjustment either). Document as a known divergence.
 */
export class Ticker {
    constructor(private context: any) {}

    /**
     * Type B param wrapper — extract scalar from series/primitive.
     * Used by the transpiler to wrap ticker.* arguments.
     */
    param(source: any, index: number = 0, _name?: string): any {
        if (typeof source === 'string') return source;
        return Series.from(source).get(index);
    }

    /**
     * ticker.inherit(from_tickerid, symbol) → string
     *
     * Returns a ticker ID that uses `symbol` and inherits modifier settings from
     * `from_tickerid`. The CHART-TYPE modifier is honored: inheriting from a
     * `";heikinashi"` ticker (e.g. `syminfo.tickerid` on a Heikin-Ashi chart)
     * yields `"symbol;heikinashi"`, so the derived request keeps the chart type.
     * The other modifier kinds (session, currency, adjustment) can't be honored
     * without a TV datafeed and are dropped, as before.
     */
    inherit(_from_tickerid: any, symbol: any): string {
        const from = this._coerce(_from_tickerid);
        const sym = stripTickerModifier(this._coerce(symbol));
        const { modifier } = splitTickerModifier(from);
        return modifier && modifier !== 'standard' ? withTickerModifier(sym, modifier) : sym;
    }

    /**
     * ticker.new(prefix, ticker, session?, adjustment?, ...) → simple string
     *
     * Returns "prefix:ticker". Modifier arguments are accepted but
     * ignored — see class-level note. Returns an empty string if
     * either prefix or ticker is empty (matches TV).
     */
    new(prefix: any, ticker: any, _session?: any, _adjustment?: any,
        _backadjustment?: any, _settlement_as_close?: any): string {
        const p = this._coerce(prefix);
        const t = this._coerce(ticker);
        if (!p) return t;
        if (!t) return p;
        return `${p}:${t}`;
    }

    /**
     * ticker.modify(tickerid, session?, adjustment?, ...) → simple string
     *
     * Returns the tickerid unchanged — modifier args are accepted but
     * ignored.
     */
    modify(tickerid: any, _session?: any, _adjustment?: any,
        _backadjustment?: any, _settlement_as_close?: any): string {
        return this._coerce(tickerid);
    }

    /**
     * ticker.standard(symbol?) → simple string
     *
     * Returns the symbol stripped of any chart-type modifier suffix —
     * on a Heikin-Ashi chart, `ticker.standard(syminfo.tickerid)` turns
     * `"BINANCE:BTCUSDT;heikinashi"` back into `"BINANCE:BTCUSDT"`, so a
     * `request.security` call on the result fetches STANDARD candles.
     * If `symbol` is undefined, falls back to `syminfo.tickerid`.
     */
    standard(symbol?: any): string {
        if (symbol === undefined || symbol === null) {
            return stripTickerModifier(this.context?.pine?.syminfo?.tickerid || this.context?.tickerId || '');
        }
        return stripTickerModifier(this._coerce(symbol));
    }

    /**
     * ticker.heikinashi(symbol) → extended-ticker string
     *
     * Returns the symbol with the Heikin-Ashi chart-type modifier
     * appended (`"BINANCE:BTCUSDT;heikinashi"`). `request.security`
     * passes it through to the data source: an embedding host that owns
     * the Heikin-Ashi transform serves derived bars; PineTS' own bundled
     * providers strip the modifier and serve standard candles (documented
     * standalone limitation). Idempotent on already-modified tickers.
     */
    heikinashi(symbol: any): string {
        return withTickerModifier(this._coerce(symbol), 'heikinashi');
    }

    /**
     * ticker.renko(symbol, style?, param?, request_wicks?, source?) → simple string
     *
     * Stub: returns the plain symbol. See heikinashi() note.
     */
    renko(symbol: any, _style?: any, _param?: any,
        _request_wicks?: any, _source?: any): string {
        return this._coerce(symbol);
    }

    /**
     * ticker.kagi(symbol, reversal) → simple string
     *
     * Stub: returns the plain symbol. See heikinashi() note.
     */
    kagi(symbol: any, _reversal?: any): string {
        return this._coerce(symbol);
    }

    /**
     * ticker.linebreak(symbol, number_of_lines) → simple string
     *
     * Stub: returns the plain symbol. See heikinashi() note.
     */
    linebreak(symbol: any, _number_of_lines?: any): string {
        return this._coerce(symbol);
    }

    /**
     * ticker.pointfigure(symbol, source, style, param, reversal) → simple string
     *
     * Stub: returns the plain symbol. See heikinashi() note.
     */
    pointfigure(symbol: any, _source?: any, _style?: any,
        _param?: any, _reversal?: any): string {
        return this._coerce(symbol);
    }

    /**
     * Coerce a runtime value to a plain string. Handles Series wrappers
     * (used by the transpiler), `na`/null/undefined, and primitives.
     */
    private _coerce(v: any): string {
        if (v === null || v === undefined) return '';
        if (v instanceof Series) {
            const inner = v.get(0);
            return inner === null || inner === undefined ? '' : String(inner);
        }
        if (typeof v === 'number' && isNaN(v)) return '';
        return String(v);
    }
}
