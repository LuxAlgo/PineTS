import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// time() / time_close() with `session` passed by name, e.g. LuxAlgo Power Hour Trendlines:
// `time(timeframe.period, session = sessionInput, timezone = 'America/New_York')`.
// The named value is the series of an input.session, which reached the session parser
// unwrapped and failed with `Invalid session specification: "[object Object]"`.

async function run(body: string) {
    const src = `//@version=6
indicator("named session")
s = input.session("1500-1600", "Session")
${body}
plot(bar_index, "bi")`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-04').getTime());
    const { plots } = await pineTS.run(src);
    const bars = plots['bi'].data.map((d: any) => d.time);
    return (title: string) => {
        const byTime = new Map(plots[title].data.map((d: any) => [d.time, d.value]));
        return bars.map((t: number) => (byTime.has(t) ? byTime.get(t) : NaN));
    };
}

describe('time() with a named session argument', () => {
    it('matches the positional form', async () => {
        const get = await run(`
plot(time(timeframe.period, session = s, timezone = "America/New_York"), "named")
plot(time(timeframe.period, s, "America/New_York"), "positional")
plot(time_close(timeframe.period, session = s, timezone = "America/New_York"), "closeNamed")
plot(time_close(timeframe.period, s, "America/New_York"), "closePositional")`);
        const named = get('named');
        const positional = get('positional');
        const inSession = positional.filter((v: number) => !Number.isNaN(v)).length;
        // 1500-1600 New York on hourly bars: one bar per day, na elsewhere
        expect(inSession).toBeGreaterThanOrEqual(3);
        expect(inSession).toBeLessThan(positional.length / 10);
        expect(named).toEqual(positional);
        expect(get('closeNamed')).toEqual(get('closePositional'));
    });
});
