// SPDX-License-Identifier: AGPL-3.0-only
// Daily, weekly and monthly periods follow the symbol's trading calendar: its timezone and the
// open of its session. A CME future (`America/Chicago`, session `1700-1600`) trades Sunday to
// Friday from 17:00 to 16:00 CT, and each trading day is named after the date it closes on, so
// the day, the week and the month change at a 17:00 CT open — not at 00:00 UTC (19:00 CT).

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';

const HOUR = 3_600_000;
// CDT is UTC-5 for the whole window below.
const ct = (iso: string) => Date.parse(`${iso}:00-05:00`);

// Hourly CME bars from Wednesday 2024-09-25 17:00 CT to Thursday 2024-10-03 16:00 CT: no bar in
// the 16:00 CT break, none from Friday 16:00 to Sunday 17:00.
function cmeBars() {
    const rows: any[] = [];
    for (let t = ct('2024-09-25T17:00'); t < ct('2024-10-03T16:00'); t += HOUR) {
        const local = new Date(t - 5 * HOUR);
        const hour = local.getUTCHours();
        const dow = local.getUTCDay();
        if (hour === 16) continue;
        if ((dow === 5 && hour >= 16) || dow === 6 || (dow === 0 && hour < 17)) continue;
        rows.push({ openTime: t, closeTime: t + HOUR, open: 1, high: 1, low: 1, close: 1, volume: 1 });
    }
    return rows;
}

function provider(rows: any[], symbol: Record<string, any>) {
    return {
        async getMarketData() {
            return rows.map((r) => ({ ...r }));
        },
        async getSymbolInfo() {
            return { ticker: 'T', tickerid: 'X:T', type: 'futures', mintick: 0.25, pricescale: 4, minmove: 1, ...symbol };
        },
    };
}

const code = `//@version=6
indicator("periods")
plot(timeframe.change("D") ? 1 : 0, "chgD")
plot(timeframe.change("W") ? 1 : 0, "chgW")
plot(timeframe.change("M") ? 1 : 0, "chgM")
plot(time("D"), "tD")
plot(time("W"), "tW")
plot(time("M"), "tM")
`;

async function run(rows: any[], symbol: Record<string, any>) {
    const pine = new PineTS(provider(rows, symbol) as any, 'T', '60', undefined, rows[0].openTime);
    const { plots } = await pine.run(code);
    const at = (name: string, t: number) => plots[name].data.find((d: any) => d.time === t)?.value;
    const changes = (name: string) => plots[name].data.filter((d: any) => d.value === 1).map((d: any) => d.time);
    return { at, changes };
}

describe('trading calendar periods on a session market', () => {
    const rows = cmeBars();
    const cme = { timezone: 'America/Chicago', session: '1700-1600' };

    it('timeframe.change("D") is true at each 17:00 CT open', async () => {
        const { changes } = await run(rows, cme);
        // The first bar has no previous bar to compare with.
        expect(changes('chgD')).toEqual(['2024-09-26', '2024-09-29', '2024-09-30', '2024-10-01', '2024-10-02'].map((d) => ct(`${d}T17:00`)));
    });

    it('timeframe.change("W") is true at the Sunday 17:00 CT open', async () => {
        const { changes } = await run(rows, cme);
        expect(changes('chgW')).toEqual([ct('2024-09-29T17:00')]);
    });

    it('timeframe.change("M") is true at the open of the first trading day of the month', async () => {
        const { changes } = await run(rows, cme);
        // Trading day Tuesday 2024-10-01 opens on Monday 2024-09-30 at 17:00 CT.
        expect(changes('chgM')).toEqual([ct('2024-09-30T17:00')]);
    });

    it('time("D" / "W" / "M") is the open of the trading period', async () => {
        const { at } = await run(rows, cme);
        // Tuesday 20:00 CT belongs to trading day Wednesday 2024-10-02.
        const bar = ct('2024-10-01T20:00');
        expect(at('tD', bar)).toBe(ct('2024-10-01T17:00'));
        expect(at('tW', bar)).toBe(ct('2024-09-29T17:00'));
        expect(at('tM', bar)).toBe(ct('2024-09-30T17:00'));
        // Monday 10:00 CT belongs to trading day Monday 2024-09-30, which opened on Sunday.
        expect(at('tD', ct('2024-09-30T10:00'))).toBe(ct('2024-09-29T17:00'));
    });

    it('keeps the UTC calendar for a 24x7 UTC symbol', async () => {
        const utcRows = Array.from({ length: 72 }, (_, i) => {
            const t = Date.UTC(2024, 8, 30, 12) + i * HOUR;
            return { openTime: t, closeTime: t + HOUR, open: 1, high: 1, low: 1, close: 1, volume: 1 };
        });
        const { changes, at } = await run(utcRows, { timezone: 'Etc/UTC', session: '24x7', type: 'crypto' });
        expect(changes('chgD')).toEqual([Date.UTC(2024, 9, 1), Date.UTC(2024, 9, 2), Date.UTC(2024, 9, 3)]);
        expect(changes('chgM')).toEqual([Date.UTC(2024, 9, 1)]);
        expect(at('tD', Date.UTC(2024, 9, 1, 15))).toBe(Date.UTC(2024, 9, 1));
    });
});
