import { Indicator, PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('Indicators', () => {
    // An omitted start date asks Binance for the last 100 bars before the end date.
    // A literal 0 instead requests the first 100 historical bars (from 2017).
    it('Institutional Bias', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1d', 100, undefined, new Date('Dec 25 2024').getTime() - 1);

        const context = await pineTS.run((context) => {
            const { ta } = context.pine;
            const { close } = context.data;

            const ema9 = ta.ema(close, 9);
            const ema18 = ta.ema(close, 18);

            const bull_bias = ema9 > ema18;
            const bear_bias = ema9 < ema18;

            return {
                bull_bias,
                bear_bias,
            };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        const { result } = context;

        const part_bull_bias = result.bull_bias.reverse().slice(0, 10);
        const part_bear_bias = result.bear_bias.reverse().slice(0, 10);

        const expected_bull_bias = [false, false, true, true, true, true, true, true, true, true];
        const expected_bear_bias = [true, true, false, false, false, false, false, false, false, false];

        expect(part_bull_bias).toEqual(expected_bull_bias);
        expect(part_bear_bias).toEqual(expected_bear_bias);
    });

    it('Institutional Bias from Pine Script source', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1d', 100, undefined, new Date('Dec 25 2024').getTime() - 1);

        const code = `
//@version=6
indicator(title="Institutional Bias", shorttitle="IB", timeframe="", timeframe_gaps=true)
fast_len = input.int(title="Fast Length", defval=9)
slow_len = input.int(title="Slow Length", defval=18)
ema_fast = ta.ema(close, fast_len)
ema_slow = ta.ema(close, slow_len)
bull_bias = ema_fast > ema_slow
bear_bias = ema_fast < ema_slow
plotchar(bull_bias, title="bull_bias", color=color.green)
plotchar(bear_bias, title="bear_bias", color=color.red)
        `;

        const { result, plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const part_bull_bias = plots.bull_bias.data
            .map((item: any) => item.value)
            .reverse()
            .slice(0, 10);
        const part_bear_bias = plots.bear_bias.data
            .map((item: any) => item.value)
            .reverse()
            .slice(0, 10);

        const expected_bull_bias = [false, false, true, true, true, true, true, true, true, true];
        const expected_bear_bias = [true, true, false, false, false, false, false, false, false, false];

        expect(part_bull_bias).toEqual(expected_bull_bias);
        expect(part_bear_bias).toEqual(expected_bear_bias);
    });

    it('Institutional Bias from Pine Script source with inputs', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1d', 100, undefined, new Date('Dec 25 2024').getTime() - 1);

        const code = `
//@version=6
indicator(title="Institutional Bias", shorttitle="IB", timeframe="", timeframe_gaps=true)
fast_len = input.int(title="Fast Length", defval=9)
slow_len = input.int(title="Slow Length", defval=18)
ema_fast = ta.ema(close, fast_len)
ema_slow = ta.ema(close, slow_len)
bull_bias = ema_fast > ema_slow
bear_bias = ema_fast < ema_slow
plotchar(bull_bias, title="bull_bias", color=color.green)
plotchar(bear_bias, title="bear_bias", color=color.red)
        `;

        const indicator = new Indicator(code, { 'Fast Length': 3, 'Slow Length': 6 });
        const { result, plots } = await pineTS.run(indicator, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const part_bull_bias = plots.bull_bias.data
            .map((item: any) => item.value)
            .reverse()
            .slice(0, 10);
        const part_bear_bias = plots.bear_bias.data
            .map((item: any) => item.value)
            .reverse()
            .slice(0, 10);

        const expected_bull_bias = [false, false, false, false, false, false, false, true, true, true];
        const expected_bear_bias = [true, true, true, true, true, true, true, false, false, false];

        expect(part_bull_bias).toEqual(expected_bull_bias);
        expect(part_bear_bias).toEqual(expected_bear_bias);
    });
});
