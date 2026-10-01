// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Series } from '../Series';
import { decodeTickerId, encodeTickerId, splitTickerModifier, stripTickerModifier, withTickerModifier, TickerModifiers } from '../tickerModifier';

const MODIFIER_PARAMS = ['session', 'adjustment', 'backadjustment', 'settlement_as_close'];

const isNamedArgs = (a: any) => a !== null && typeof a === 'object' && Object.getPrototypeOf(a) === Object.prototype;

/** Positional arguments by parameter name, merged with the trailing named-arguments object if any. */
function argsByName(args: any[], names: string[]): Record<string, any> {
    const out: Record<string, any> = {};
    args.forEach((a, i) => {
        if (isNamedArgs(a)) Object.assign(out, a);
        else if (i < names.length && a !== undefined) out[names[i]] = a;
    });
    return out;
}

/** A tickerid split into its chart-type suffix (`;heikinashi`) and the rest (plain or encoded). */
function splitChartType(tickerId: string): { base: string; chartType: string | null } {
    const { modifier } = splitTickerModifier(tickerId);
    return modifier ? { base: tickerId.slice(0, tickerId.lastIndexOf(';')), chartType: modifier } : { base: tickerId, chartType: null };
}

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
 * SESSION / ADJUSTMENT modifiers (`ticker.new` / `ticker.modify` / `ticker.inherit`)
 * produce TradingView's encoded form `={"adjustment":"…","session":"…","symbol":"…"}`,
 * so the strings match TradingView's. The data sources don't honor them:
 * `request.security` and the providers decode the symbol and serve the
 * standard session. Combined with a chart-type modifier, the chart type
 * stays a `;heikinashi` suffix after the encoded id (TradingView nests both
 * in one encoded object).
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
        const { base, chartType } = splitChartType(this._coerce(_from_tickerid));
        const sym = stripTickerModifier(this._coerce(symbol));
        const id = encodeTickerId(sym, decodeTickerId(base).modifiers);
        return chartType && chartType !== 'standard' ? `${id};${chartType}` : id;
    }

    /**
     * ticker.new(prefix, ticker, session?, adjustment?, backadjustment?, settlement_as_close?) → simple string
     *
     * Returns "prefix:ticker", or TradingView's encoded form
     * `={"session":"extended","symbol":"prefix:ticker"}` when a modifier is set. Returns
     * the other part if either prefix or ticker is empty.
     */
    new(prefix: any, ticker: any, ...rest: any[]): string {
        const a = argsByName([prefix, ticker, ...rest], ['prefix', 'ticker', ...MODIFIER_PARAMS]);
        const p = this._coerce(a.prefix);
        const t = this._coerce(a.ticker);
        const symbol = !p ? t : !t ? p : `${p}:${t}`;
        return encodeTickerId(symbol, this._applyModifiers({}, a));
    }

    /**
     * ticker.modify(tickerid, session?, adjustment?, backadjustment?, settlement_as_close?) → simple string
     *
     * Sets the given modifiers on `tickerid` (plain or encoded), keeping the others.
     */
    modify(tickerid: any, ...rest: any[]): string {
        const a = argsByName([tickerid, ...rest], ['tickerid', ...MODIFIER_PARAMS]);
        const { base, chartType } = splitChartType(this._coerce(a.tickerid));
        const { symbol, modifiers } = decodeTickerId(base);
        const id = encodeTickerId(symbol, this._applyModifiers(modifiers, a));
        return chartType ? `${id};${chartType}` : id;
    }

    /**
     * Apply session / adjustment arguments to `modifiers` as TradingView encodes them:
     * `session.regular` and `backadjustment.off` remove the key, `backadjustment.on` is
     * `"default"`, `settlement_as_close.on/off` are `true` / `false`, and `inherit` or an
     * omitted argument keeps the current value.
     */
    private _applyModifiers(modifiers: TickerModifiers, a: Record<string, any>): TickerModifiers {
        const m: TickerModifiers = { ...modifiers };
        const opt = (v: any) => {
            const s = v === undefined ? '' : this._coerce(v);
            return s === '' ? undefined : s;
        };
        const session = opt(a.session);
        if (session === 'regular') delete m.session;
        else if (session !== undefined) m.session = session;
        const adjustment = opt(a.adjustment);
        if (adjustment !== undefined) m.adjustment = adjustment;
        const back = opt(a.backadjustment);
        if (back === 'on') m.backadjustment = 'default';
        else if (back === 'off') delete m.backadjustment;
        const settlement = opt(a.settlement_as_close);
        if (settlement === 'on') m['settlement-as-close'] = true;
        else if (settlement === 'off') m['settlement-as-close'] = false;
        return m;
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
