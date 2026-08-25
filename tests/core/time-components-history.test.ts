import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

// Regression guard: calendar builtins (hour, dayofweek, month, ...) are SERIES.
// History indexing (`hour[1]`, `dayofweek[1]`) must return the previous bar's
// value, exactly like `time[1]`. Before the fix, TimeComponentHelper.__value
// was a scalar, so `x[1]` was na on every bar and `x != x[1]` never fired.
//
// Expected values are derived independently from the bar openTime timestamps
// via JS Date UTC accessors (Mock provider data is UTC-aligned) — never from
// PineTS component output itself.

// Hourly bars across a UTC midnight boundary: 2024-01-01 (Monday) → 2024-01-03
const pineTS = new PineTS(
    Provider.Mock,
    'BTCUSDC',
    '60',
    null,
    new Date('2024-01-01T00:00:00Z').getTime(),
    new Date('2024-01-03T00:00:00Z').getTime(),
);

// Pine dayofweek: Sun=1 .. Sat=7 (JS getUTCDay: Sun=0 .. Sat=6)
const pineDow = (t: number) => new Date(t).getUTCDay() + 1;

describe('time component history access (hour[1], dayofweek[1], ...)', () => {
    it('hour[1] equals previous bar hour, na on bar 0 only', async () => {
        const { result } = await pineTS.run(($) => {
            const { time, hour } = $.pine;
            let t = time;
            let h = hour;
            let h1 = hour[1];
            return { t, h, h1 };
        });

        expect(result.t.length).toBeGreaterThan(24);
        expect(result.h1[0]).toBeNaN();
        for (let i = 0; i < result.t.length; i++) {
            const expected = new Date(result.t[i]).getUTCHours();
            expect(result.h[i]).toBe(expected);
            if (i > 0) {
                const expectedPrev = new Date(result.t[i - 1]).getUTCHours();
                expect(result.h1[i]).toBe(expectedPrev);
            }
        }
    });

    it('hour != hour[1] is true on every bar after the first (hourly bars)', async () => {
        const { result } = await pineTS.run(($) => {
            const { hour } = $.pine;
            let changed = hour != hour[1] ? 1 : 0;
            return { changed };
        });

        // Bar 0: hour[1] is na → comparison is na → falsy
        expect(result.changed[0]).toBe(0);
        for (let i = 1; i < result.changed.length; i++) {
            expect(result.changed[i]).toBe(1);
        }
    });

    it('dayofweek[1] equals previous bar dayofweek', async () => {
        const { result } = await pineTS.run(($) => {
            const { time, dayofweek } = $.pine;
            let t = time;
            let d1 = dayofweek[1];
            return { t, d1 };
        });

        expect(result.d1[0]).toBeNaN();
        for (let i = 1; i < result.t.length; i++) {
            expect(result.d1[i]).toBe(pineDow(result.t[i - 1]));
        }
    });

    it('dayofweek != dayofweek[1] fires only on the first bar of a new weekday', async () => {
        const { result } = await pineTS.run(($) => {
            const { time, dayofweek } = $.pine;
            let t = time;
            let dayChanged = dayofweek != dayofweek[1] ? 1 : 0;
            return { t, dayChanged };
        });

        expect(result.dayChanged[0]).toBe(0); // na comparison on bar 0
        let fired = 0;
        for (let i = 1; i < result.t.length; i++) {
            const expected = pineDow(result.t[i]) !== pineDow(result.t[i - 1]) ? 1 : 0;
            expect(result.dayChanged[i]).toBe(expected);
            fired += result.dayChanged[i];
        }
        // The range spans at least one UTC midnight → at least one day change
        expect(fired).toBeGreaterThan(0);
    });

    it('day-change detection works in native Pine Script (LuxAlgo Sessions pattern)', async () => {
        const code = `
//@version=5
indicator("Day Change")
bool dayChanged = dayofweek != dayofweek[1]
plot(dayChanged ? 1 : 0, "dc")
plot(time, "t")
`;
        const { plots } = await pineTS.run(code);
        const dc = plots['dc'].data;
        const t = plots['t'].data;

        expect(dc[0].value).toBe(0);
        for (let i = 1; i < dc.length; i++) {
            const expected = pineDow(t[i].value) !== pineDow(t[i - 1].value) ? 1 : 0;
            expect(dc[i].value).toBe(expected);
        }
    });

    it('ta.change(hour) still works', async () => {
        const { result } = await pineTS.run(($) => {
            const { hour } = $.pine;
            const { ta } = $.pine;
            let c = ta.change(hour);
            return { c };
        });

        // On hourly bars, hour changes by 1 every bar (or -23 at midnight)
        for (let i = 1; i < result.c.length; i++) {
            expect(result.c[i] === 1 || result.c[i] === -23).toBe(true);
        }
    });

    it('dayofweek enum constants and function form still work', async () => {
        const { result } = await pineTS.run(($) => {
            const { dayofweek } = $.pine;
            let mon = dayofweek.monday;
            // 2024-01-01 00:00 UTC is a Monday; in New York it's still Sunday evening
            let dNY = dayofweek(1704067200000, 'America/New_York');
            return { mon, dNY };
        });

        expect(result.mon[0]).toBe(2);
        expect(result.dNY[0]).toBe(1); // Sunday in New York
    });
});

describe('time component history on daily bars (month/year/dayofmonth)', () => {
    // Daily bars across a year boundary: 2024-12-28 → 2025-01-05
    // (Mock daily data starts at 2024-01-01, so use the 2024→2025 boundary)
    const daily = new PineTS(
        Provider.Mock,
        'BTCUSDC',
        'D',
        null,
        new Date('2024-12-28T00:00:00Z').getTime(),
        new Date('2025-01-05T00:00:00Z').getTime(),
    );

    it('month[1], year[1] and dayofmonth[1] return previous bar values', async () => {
        const { result } = await daily.run(($) => {
            const { time, month, year, dayofmonth } = $.pine;
            let t = time;
            let m1 = month[1];
            let y1 = year[1];
            let dom1 = dayofmonth[1];
            return { t, m1, y1, dom1 };
        });

        expect(result.m1[0]).toBeNaN();
        expect(result.y1[0]).toBeNaN();
        expect(result.dom1[0]).toBeNaN();
        for (let i = 1; i < result.t.length; i++) {
            const prev = new Date(result.t[i - 1]);
            expect(result.m1[i]).toBe(prev.getUTCMonth() + 1);
            expect(result.y1[i]).toBe(prev.getUTCFullYear());
            expect(result.dom1[i]).toBe(prev.getUTCDate());
        }
    });

    it('year != year[1] fires exactly once across the year boundary', async () => {
        const { result } = await daily.run(($) => {
            const { time, year } = $.pine;
            let t = time;
            let yearChanged = year != year[1] ? 1 : 0;
            return { t, yearChanged };
        });

        // Sanity: the data must actually span two calendar years
        expect(new Date(result.t[0]).getUTCFullYear()).toBe(2024);
        expect(new Date(result.t[result.t.length - 1]).getUTCFullYear()).toBe(2025);

        let fired = 0;
        for (let i = 1; i < result.t.length; i++) {
            fired += result.yearChanged[i];
        }
        expect(fired).toBe(1);
    });
});
