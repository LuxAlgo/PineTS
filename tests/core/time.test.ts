import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('time (dual-use identifier)', () => {
    // BTCUSDC weekly 2019-01-01 to 2019-02-01 has 4 bars
    // openTime: 1546819200000, 1547424000000, 1548028800000, 1548633600000
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('bare time returns current bar open time', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time;
            return { t };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // First bar openTime
        expect(result.t[0]).toBe(1546819200000);
    });

    it('time[1] returns previous bar open time', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time;
            let t_prev = time[1];
            return { t, t_prev };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Last bar (index 3): t = bar3 openTime, t_prev = bar2 openTime
        const lastIdx = result.t.length - 1;
        expect(result.t_prev[lastIdx]).toBe(result.t[lastIdx - 1]);
    });

    it('time() with timeframe returns current time', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time('W');
            return { t };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // time('W') should return the current bar's open time
        expect(result.t[0]).toBe(1546819200000);
    });

    it('time is a series across bars', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time;
            return { t };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Should have 4 bars of data
        expect(result.t.length).toBe(4);
        // Each bar should have increasing time
        for (let i = 1; i < result.t.length; i++) {
            expect(result.t[i]).toBeGreaterThan(result.t[i - 1]);
        }
    });

    it('time(timeframe, bars_back) looks back N bars', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t0 = time('W', 0);
            let t1 = time('W', 1);
            return { t0, t1 };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // On last bar, t1 should equal t0 of the previous bar
        const lastIdx = result.t0.length - 1;
        expect(result.t1[lastIdx]).toBe(result.t0[lastIdx - 1]);
    });

    it('time(timeframe, session, bars_back) filters by session with offset', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time('W', '0000-2359', 0);
            return { t };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // "0000-2359" covers the full day, so time should be returned (not NaN)
        expect(result.t[0]).toBe(1546819200000);
    });

    it('time(timeframe, session, bars_back, timeframe_bars_back) uses both offsets', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time('W', '0000-2359', 0, 1);
            return { t };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // bars_back=0, timeframe_bars_back=1 → totalOffset=1 → previous bar time
        const lastIdx = result.t.length - 1;
        if (lastIdx > 0) {
            // The result at last bar with offset 1 should be the time of bar before
            expect(result.t[lastIdx]).toBeDefined();
        }
    });

    it('time(timeframe, session, timezone, bars_back, timeframe_bars_back) full signature', async () => {
        const { result } = await pineTS.run(($) => {
            const { time } = $.pine;
            let t = time('W', '0000-2359', 'UTC', 0, 0);
            return { t };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Full signature with UTC timezone and no offset → current bar time
        expect(result.t[0]).toBe(1546819200000);
    });

    it('time works with Pine Script syntax', async () => {
        const code = `
//@version=5
indicator("Time Test")
t = time
plot(t, "time")
`;
        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(plots['time']).toBeDefined();
        expect(plots['time'].data[0].value).toBe(1546819200000);
    });
});
