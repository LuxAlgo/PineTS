// SPDX-License-Identifier: AGPL-3.0-only

import { getDatePartsInTimezone } from './Time';

/**
 * Pine Script `session` namespace.
 *
 * Constants:
 * - session.regular / session.extended — session-type strings for ticker.new()/ticker.modify().
 *
 * Variables:
 * - session.isfirstbar / session.islastbar — first/last bar of the trading session.
 * - session.isfirstbar_regular / session.islastbar_regular — same, for the regular session.
 * - session.ismarket / session.ispremarket / session.ispostmarket — intra-session location.
 *
 * PineTS providers serve continuous (regular-session) data, and the reference
 * providers are 24/7 crypto markets where a trading session is a calendar day
 * in the exchange timezone. Session boundaries are therefore detected as
 * trading-day changes between consecutive bars in `syminfo.timezone`. All bars
 * belong to the market session, so `ismarket` is always true and the
 * pre/post-market flags are always false.
 */
export class Session {
    public readonly regular = 'regular';
    public readonly extended = 'extended';

    constructor(private context: any) {}

    private get _timezone(): string {
        return this.context.pine?.syminfo?.timezone || 'UTC';
    }

    /** Calendar-day key ("Y-M-D" in exchange timezone) of a bar's open time. */
    private _dayKey(timestamp: number): string {
        const parts = getDatePartsInTimezone(timestamp, this._timezone);
        return `${parts.year}-${parts.month}-${parts.day}`;
    }

    public get isfirstbar(): boolean {
        const idx = this.context.idx;
        const md = this.context.marketData;
        if (!Array.isArray(md) || !md[idx]) return false;
        if (idx === 0) return true;
        return this._dayKey(md[idx].openTime) !== this._dayKey(md[idx - 1].openTime);
    }

    public get islastbar(): boolean {
        const idx = this.context.idx;
        const md = this.context.marketData;
        if (!Array.isArray(md) || !md[idx]) return false;
        if (idx === md.length - 1) return true;
        return this._dayKey(md[idx].openTime) !== this._dayKey(md[idx + 1].openTime);
    }

    public get isfirstbar_regular(): boolean {
        return this.isfirstbar;
    }

    public get islastbar_regular(): boolean {
        return this.islastbar;
    }

    public get ismarket(): boolean {
        return true;
    }

    public get ispremarket(): boolean {
        return false;
    }

    public get ispostmarket(): boolean {
        return false;
    }
}
