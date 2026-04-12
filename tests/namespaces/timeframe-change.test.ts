import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('timeframe.change() — daily chart', () => {
    const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-04-01').getTime());

    it('timeframe.change("W") fires on first bar of each week', async () => {
        const code = `
//@version=5
indicator("tf.change W test")
chg = timeframe.change("W") ? 1 : 0
plot(chg, "weekly_change")
plot(dayofweek, "dow")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const chgData = plots['weekly_change'].data.filter((d: any) => d.value != null);
        expect(chgData.length).toBeGreaterThan(0);

        // Count changes — should be roughly one per week over ~90 days = ~12-13 weeks
        const changeCount = chgData.filter((d: any) => d.value === 1).length;
        expect(changeCount).toBeGreaterThanOrEqual(10);
        expect(changeCount).toBeLessThanOrEqual(15);

        // Non-change bars should far outnumber change bars (6:1 ratio for weekly on daily)
        const noChangeCount = chgData.filter((d: any) => d.value === 0).length;
        expect(noChangeCount).toBeGreaterThan(changeCount * 4);
    });

    it('timeframe.change("M") fires on first bar of each month', async () => {
        const code = `
//@version=5
indicator("tf.change M test")
chg = timeframe.change("M") ? 1 : 0
plot(chg, "monthly_change")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const chgData = plots['monthly_change'].data.filter((d: any) => d.value != null);
        expect(chgData.length).toBeGreaterThan(0);

        // Jan-Mar = 3 months, so 2-3 change events (first bar might not trigger if it's Jan 1st with no prior bar)
        const changeCount = chgData.filter((d: any) => d.value === 1).length;
        expect(changeCount).toBeGreaterThanOrEqual(2);
        expect(changeCount).toBeLessThanOrEqual(4);
    });

    it('timeframe.change("D") always returns true on daily chart (every bar is a new day)', async () => {
        const code = `
//@version=5
indicator("tf.change D on D test")
chg = timeframe.change("D") ? 1 : 0
plot(chg, "daily_change")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const chgData = plots['daily_change'].data.filter((d: any) => d.value != null);
        // On a daily chart, every bar is a new day (except possibly bar 0 where prev is NaN)
        const changes = chgData.filter((d: any) => d.value === 1).length;
        const total = chgData.length;
        // Nearly all bars should trigger (except first bar)
        expect(changes).toBeGreaterThanOrEqual(total - 2);
    });
});

describe('timeframe.change() — intraday chart (Binance)', () => {
    const makePineTS = () => new PineTS(Provider.Binance, 'BTCUSDC', '15', 200);

    it('timeframe.change("D") fires once per day on 15min chart', async () => {
        const code = `
//@version=5
indicator("tf.change D on 15m")
chg = timeframe.change("D") ? 1 : 0
plot(chg, "daily_change")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const chgData = plots['daily_change'].data.filter((d: any) => d.value != null);

        // 200 bars of 15min = ~50 hours = ~2 days → expect 1-3 daily changes
        const changeCount = chgData.filter((d: any) => d.value === 1).length;
        expect(changeCount).toBeGreaterThanOrEqual(1);
        expect(changeCount).toBeLessThanOrEqual(4);

        // Most bars should NOT be changes (96 bars per day, only 1 triggers)
        const noChangeCount = chgData.filter((d: any) => d.value === 0).length;
        expect(noChangeCount).toBeGreaterThan(changeCount * 10);
    });

    it('timeframe.change("60") fires every 4 bars on 15min chart', async () => {
        const code = `
//@version=5
indicator("tf.change 60 on 15m")
chg = timeframe.change("60") ? 1 : 0
plot(chg, "hourly_change")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const chgData = plots['hourly_change'].data.filter((d: any) => d.value != null);

        // 200 bars of 15min = ~50 hours → ~50 hourly changes
        const changeCount = chgData.filter((d: any) => d.value === 1).length;
        expect(changeCount).toBeGreaterThanOrEqual(40);
        expect(changeCount).toBeLessThanOrEqual(55);

        // Ratio should be roughly 1:3 (1 change per 4 bars)
        const noChangeCount = chgData.filter((d: any) => d.value === 0).length;
        expect(noChangeCount).toBeGreaterThan(changeCount * 2);
        expect(noChangeCount).toBeLessThan(changeCount * 4);
    });

    it('timeframe.change("240") fires every 16 bars on 15min chart', async () => {
        const code = `
//@version=5
indicator("tf.change 240 on 15m")
chg = timeframe.change("240") ? 1 : 0
plot(chg, "4h_change")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const chgData = plots['4h_change'].data.filter((d: any) => d.value != null);

        // 200 bars of 15min = ~50 hours → ~12 four-hour changes
        const changeCount = chgData.filter((d: any) => d.value === 1).length;
        expect(changeCount).toBeGreaterThanOrEqual(10);
        expect(changeCount).toBeLessThanOrEqual(15);
    });
});

describe('timeframe.change() — consistency with time()', () => {
    it('timeframe.change fires exactly when time() value changes', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', '15', 100);
        const code = `
//@version=5
indicator("tf.change vs time consistency")
t_d = time("D")
chg_d = timeframe.change("D") ? 1 : 0
// Detect when time("D") changes manually
manual_chg = ta.change(t_d) != 0 ? 1 : 0
plot(chg_d, "tf_change")
plot(manual_chg, "manual_change")
`;
        const { plots } = await pineTS.run(code);

        const tfChg = plots['tf_change'].data;
        const manualChg = plots['manual_change'].data;

        // timeframe.change("D") should agree with ta.change(time("D")) != 0
        let checked = 0;
        for (let i = 0; i < tfChg.length; i++) {
            if (tfChg[i].value != null && manualChg[i].value != null) {
                expect(tfChg[i].value).toBe(manualChg[i].value);
                checked++;
            }
        }
        expect(checked).toBeGreaterThan(50);
    });
});
