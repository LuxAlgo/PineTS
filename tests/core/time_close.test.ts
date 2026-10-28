import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('time_close (dual-use identifier)', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('bare time_close returns current bar close time', async () => {
        const { result } = await pineTS.run(($) => {
            const { time_close } = $.pine;
            let tc = time_close;
            return { tc };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Should be a valid timestamp
        expect(result.tc[0]).toBeGreaterThan(0);
    });

    it('time_close differs from time', async () => {
        const { result } = await pineTS.run(($) => {
            const { time, time_close } = $.pine;
            let t = time;
            let tc = time_close;
            return { t, tc };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // close time should be after open time for the same bar
        expect(result.tc[0]).toBeGreaterThan(result.t[0]);
    });

    it('time_close(timeframe, bars_back) looks back N bars', async () => {
        const { result } = await pineTS.run(($) => {
            const { time_close } = $.pine;
            let tc0 = time_close('W', 0);
            let tc1 = time_close('W', 1);
            return { tc0, tc1 };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // On last bar, tc1 should equal tc0 of the previous bar
        const lastIdx = result.tc0.length - 1;
        expect(result.tc1[lastIdx]).toBe(result.tc0[lastIdx - 1]);
    });

    it('time_close works with Pine Script syntax', async () => {
        const code = `
//@version=5
indicator("Time Close Test")
tc = time_close
plot(tc, "time_close")
`;
        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(plots['time_close']).toBeDefined();
        expect(plots['time_close'].data[0].value).toBeGreaterThan(0);
    });
});
