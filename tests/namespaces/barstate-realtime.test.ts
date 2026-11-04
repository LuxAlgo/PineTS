// SPDX-License-Identifier: AGPL-3.0-only

/**
 * barstate.isrealtime / barstate.ishistory, as on TradingView (Nov 2026, last two bars of each chart):
 *
 *   TVC:NI225 60 / 1D, market closed, last bar closed         → isrealtime false, ishistory true
 *   TVC:NI225 1W, market closed, last bar in progress          → isrealtime false (isconfirmed false)
 *   BINANCE:BTCUSDT 60 / 1D, market open, last bar in progress → isrealtime true on the last bar
 *
 * A bar is realtime when it receives live data: not closed yet, and the market open. The bars that arrive
 * with live updates are realtime too.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { isMarketOpenAt } from '../../src/namespaces/marketHours';

const H = 3_600_000;
const SRC = `//@version=6
indicator("t")
plot(barstate.isrealtime ? 1 : 0, "rt")
plot(barstate.ishistory ? 1 : 0, "hist")
`;

// `HHmm` in UTC.
const hhmm = (ms: number) => {
    const d = new Date(ms);
    return String(d.getUTCHours()).padStart(2, '0') + String(d.getUTCMinutes()).padStart(2, '0');
};

/**
 * Ten closed hourly bars, then (when `inProgress`) an eleventh still in progress: its close is in the future,
 * as for a weekly bar mid-week. `session` is the symbol's trading hours in UTC (undefined: no hours known).
 * Each live update makes one more bar arrive.
 */
function provider(inProgress: boolean, session?: string) {
    const t0 = Math.floor(Date.now() / H) * H - 10 * H;
    const bar = (i: number, closed: boolean) => ({
        open: 100 + i,
        high: 101 + i,
        low: 99 + i,
        close: 100.5 + i,
        volume: 1,
        openTime: t0 + i * H,
        closeTime: closed ? t0 + (i + 1) * H - 1 : Date.now() + 48 * H,
    });
    let count = inProgress ? 11 : 10;
    let updates = 0;
    return {
        getMarketData: async (_t: string, _tf: string, _l?: number, sDate?: number) => {
            if (sDate === undefined) return Array.from({ length: count }, (_, i) => bar(i, i < 10));
            updates++;
            count++;
            // The bar in progress at load gets a tick, and a new bar (in progress) arrives.
            return [bar(count - 2, count - 2 < 10), bar(count - 1, false)];
        },
        getSymbolInfo: async () => (session === undefined ? null : { ticker: 'T', tickerid: 'X:T', session, timezone: 'UTC' }),
        get updates() {
            return updates;
        },
    };
}

async function load(p: any) {
    const pine = new PineTS(p, 'X:T', '60');
    await pine.ready();
    const ctx: any = await pine.run(SRC);
    // Live updates append a plot point per execution; the bar's value is the last one with its time.
    const perBar = (t: string) => [...new Map(ctx.plots[t].data.map((d: any) => [d.time, d.value])).values()];
    return { pine, ctx, perBar };
}

describe('isMarketOpenAt', () => {
    // Wed 2026-11-04 and Sat 2026-11-07; New York is UTC-5 then, Chicago UTC-6.
    const at = (iso: string) => Date.parse(iso);

    it('stock hours without days trade on weekdays only', () => {
        expect(isMarketOpenAt('0930-1600', 'America/New_York', at('2026-11-04T16:00:00Z'))).toBe(true); // Wed 11:00
        expect(isMarketOpenAt('0930-1600', 'America/New_York', at('2026-11-04T22:00:00Z'))).toBe(false); // Wed 17:00
        expect(isMarketOpenAt('0930-1600', 'America/New_York', at('2026-11-07T16:00:00Z'))).toBe(false); // Sat 11:00
        expect(isMarketOpenAt('0000-0000', 'UTC', at('2026-11-08T12:00:00Z'))).toBe(false); // Sun
    });

    it('explicit days and 24x7 are kept', () => {
        expect(isMarketOpenAt('0930-1600:1234567', 'America/New_York', at('2026-11-07T16:00:00Z'))).toBe(true);
        expect(isMarketOpenAt('24x7', 'UTC', at('2026-11-07T16:00:00Z'))).toBe(true);
    });

    it('an overnight session opens on Sunday evening and closes on Friday evening', () => {
        expect(isMarketOpenAt('1700-1600', 'America/Chicago', at('2026-11-09T00:00:00Z'))).toBe(true); // Sun 18:00
        expect(isMarketOpenAt('1700-1600', 'America/Chicago', at('2026-11-07T00:00:00Z'))).toBe(false); // Fri 18:00
        expect(isMarketOpenAt('1700-1600', 'America/Chicago', at('2026-11-04T22:30:00Z'))).toBe(false); // Wed 16:30 break
    });

    it('a session without hours is unknown', () => {
        expect(isMarketOpenAt('regular', 'UTC', Date.now())).toBeNull();
        expect(isMarketOpenAt(undefined, undefined, Date.now())).toBeNull();
    });
});

describe('barstate.isrealtime', () => {
    const now = Date.now();
    const closedNow = `${hhmm(now - 4 * H)}-${hhmm(now - 2 * H)}:1234567`;
    const openNow = `${hhmm(now - H)}-${hhmm(now + H)}:1234567`;

    it('no bar is realtime when every bar is closed (historical range, market closed)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
        const { plots } = await pineTS.run(SRC);
        expect(plots['rt'].data.length).toBeGreaterThan(10);
        expect(plots['rt'].data.every((d: any) => d.value === 0)).toBe(true);
        expect(plots['hist'].data.every((d: any) => d.value === 1)).toBe(true);
    });

    it('the bar in progress is realtime when the market is open', async () => {
        for (const session of [undefined, '24x7', openNow]) {
            const { perBar } = await load(provider(true, session));
            expect(perBar('rt'), String(session)).toEqual([...Array(10).fill(0), 1]);
            expect(perBar('hist'), String(session)).toEqual([...Array(10).fill(1), 0]);
        }
    });

    it('a bar still in progress is not realtime while the market is closed', async () => {
        const { perBar } = await load(provider(true, closedNow));
        expect(perBar('rt')).toEqual(Array(11).fill(0));
        expect(perBar('hist')).toEqual(Array(11).fill(1));
    });

    it('with live updates, the bars that arrive are realtime', async () => {
        // Market closed at load: the bar in progress stays historical, the new bar is realtime.
        const closed = await load(provider(true, closedNow));
        await closed.pine.updateTail(closed.ctx);
        expect(closed.perBar('rt')).toEqual([...Array(11).fill(0), 1]);

        // Market open: the bar in progress at load and the new bar are realtime.
        const open = await load(provider(true, openNow));
        await open.pine.updateTail(open.ctx);
        expect(open.perBar('rt')).toEqual([...Array(10).fill(0), 1, 1]);

        // Every loaded bar closed: only the bar that arrives is realtime.
        const history = await load(provider(false));
        await history.pine.updateTail(history.ctx);
        expect(history.perBar('rt')).toEqual([...Array(10).fill(0), 1]);
    });
});
