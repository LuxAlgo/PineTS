import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Hourly mock data (UTC timezone, 24x7 crypto symbol): each trading day/session
// is a calendar day in the exchange timezone, so on a 1h chart the first bar of
// a session opens at 00:00 and the last bar opens at 23:00.
describe('session namespace', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01T00:00:00Z').getTime(), new Date('2024-01-08T00:00:00Z').getTime());

    it('exposes session.regular and session.extended constants', async () => {
        const pineTS = makePineTS();
        const { result } = await pineTS.run(($: any) => {
            const reg = session.regular;
            const ext = session.extended;
            return { reg, ext };
        });

        expect(result.reg[0]).toBe('regular');
        expect(result.ext[0]).toBe('extended');
    });

    it('session.isfirstbar is true only on the first bar of each trading day', async () => {
        const code = `
//@version=5
indicator("session isfirstbar")
plot(session.isfirstbar ? 1 : 0, "first")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['first'].data;
        expect(data.length).toBeGreaterThan(24);

        for (const d of data) {
            const date = new Date(d.time);
            if (d.value === 1) {
                expect(date.getUTCHours()).toBe(0);
            } else {
                expect(date.getUTCHours()).not.toBe(0);
            }
        }

        const firstBars = data.filter((d: any) => d.value === 1);
        expect(firstBars.length).toBeGreaterThanOrEqual(6);
    });

    it('session.islastbar is true only on the last bar of each trading day', async () => {
        const code = `
//@version=5
indicator("session islastbar")
plot(session.islastbar ? 1 : 0, "last")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const data = plots['last'].data;
        expect(data.length).toBeGreaterThan(24);

        for (let i = 0; i < data.length - 1; i++) {
            const date = new Date(data[i].time);
            if (data[i].value === 1) {
                expect(date.getUTCHours()).toBe(23);
            } else {
                expect(date.getUTCHours()).not.toBe(23);
            }
        }

        const lastBars = data.filter((d: any) => d.value === 1);
        expect(lastBars.length).toBeGreaterThanOrEqual(6);
    });

    it('session.ismarket is true and pre/post market are false on 24x7 symbols', async () => {
        const code = `
//@version=5
indicator("session market flags")
plot(session.ismarket ? 1 : 0, "market")
plot(session.ispremarket ? 1 : 0, "pre")
plot(session.ispostmarket ? 1 : 0, "post")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        for (const d of plots['market'].data) expect(d.value).toBe(1);
        for (const d of plots['pre'].data) expect(d.value).toBe(0);
        for (const d of plots['post'].data) expect(d.value).toBe(0);
    });

    it('session.isfirstbar_regular / islastbar_regular mirror the regular-session flags', async () => {
        const code = `
//@version=5
indicator("session regular flags")
plot(session.isfirstbar_regular == session.isfirstbar ? 1 : 0, "first_eq")
plot(session.islastbar_regular == session.islastbar ? 1 : 0, "last_eq")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        for (const d of plots['first_eq'].data) expect(d.value).toBe(1);
        for (const d of plots['last_eq'].data) expect(d.value).toBe(1);
    });
});
