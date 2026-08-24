import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('timenow built-in variable', () => {
    const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-02-01').getTime());

    it('timenow is usable from Pine Script and returns current wall-clock time', async () => {
        const code = `
//@version=5
indicator("timenow test")
plot(timenow, "now")
`;
        const before = Date.now();
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);
        const after = Date.now();

        const data = plots['now'].data.filter((d: any) => d.value != null && !isNaN(d.value));
        expect(data.length).toBeGreaterThan(0);

        // Every bar should see the same "current time" concept: a wall-clock
        // timestamp captured during this test run (independent reference: Date.now()).
        for (const d of data) {
            expect(d.value).toBeGreaterThanOrEqual(before);
            expect(d.value).toBeLessThanOrEqual(after);
        }
    });

    it('timenow is usable from PineTS syntax', async () => {
        const before = Date.now();
        const pineTS = makePineTS();
        const { result } = await pineTS.run(($: any) => {
            const now = timenow;
            return { now };
        });
        const after = Date.now();

        expect(result.now[0]).toBeGreaterThanOrEqual(before);
        expect(result.now[0]).toBeLessThanOrEqual(after);
    });
});
