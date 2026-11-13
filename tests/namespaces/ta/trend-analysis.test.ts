import { describe, expect, it } from 'vitest';
import { arrayPrecision, getKlines, runNSFunctionWithArgs } from '../../utils';

import { Context, PineTS, Provider } from 'index';

async function runTAFunctionWithArgs(taFunction: string, ...args) {
    // Use the same dataset as the original tests for consistency
    const klines = await getKlines('BTCUSDT', '1h', 500, 0, 1736071200000 - 1);

    const result = await runNSFunctionWithArgs(klines, 'ta', taFunction, ...args);

    return result;
}

describe('Technical Analysis - Trend Analysis', () => {
    it('SUPERTREND - SuperTrend Native Indicator', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            //const res = ta.wpr(14);
            const [supertrend, direction] = ta.supertrend(3, 10);
            plotchar(supertrend, '_plot');

            return { supertrend, direction };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-20').getTime();
        const endDate = new Date('2019-11-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = _plotdata[i].value;
            const direction = result.direction[i];
            plotdata_str += `[${str_time}]: ${res} ${direction}\n`;
        }

        const expected_plot = `[2019-07-22T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-07-29T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-05T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-12T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-19T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-26T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-02T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-09T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-16T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-23T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-30T00:00:00.000-00:00]: 12355.5963415974 1
[2019-10-07T00:00:00.000-00:00]: 12355.5963415974 1
[2019-10-14T00:00:00.000-00:00]: 12015.3009366939 1
[2019-10-21T00:00:00.000-00:00]: 12015.3009366939 1
[2019-10-28T00:00:00.000-00:00]: 12015.3009366939 1
[2019-11-04T00:00:00.000-00:00]: 12015.3009366939 1
[2019-11-11T00:00:00.000-00:00]: 12015.3009366939 1`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('CROSSOVER - Crossover Detection', async () => {
        // Crossover returns a boolean per bar, need to collect it over time
        //const klines = await getKlines('BTCUSDT', '1d', 50, 0, 1761350400000 - 1);
        //const pineTS = new PineTS(klines);
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', null, new Date('2025-10-29').getTime(), new Date('2025-11-20').getTime());

        const sourceCode = (context: Context) => {
            const { close, open } = context.data;
            const ta = context.ta;
            const { plot, plotchar } = context.core;
            const ema9 = ta.ema(close, 9);
            const ema18 = ta.ema(close, 18);

            const crossover = ta.crossover(close, open);
            plotchar(crossover, 'crossover');
            return { crossover };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const plotdata = plots['crossover'].data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-29T00:00:00.000-00:00]: false
[2025-10-30T00:00:00.000-00:00]: false
[2025-10-31T00:00:00.000-00:00]: true
[2025-11-01T00:00:00.000-00:00]: false
[2025-11-02T00:00:00.000-00:00]: false
[2025-11-03T00:00:00.000-00:00]: false
[2025-11-04T00:00:00.000-00:00]: false
[2025-11-05T00:00:00.000-00:00]: true
[2025-11-06T00:00:00.000-00:00]: false
[2025-11-07T00:00:00.000-00:00]: true
[2025-11-08T00:00:00.000-00:00]: false
[2025-11-09T00:00:00.000-00:00]: true
[2025-11-10T00:00:00.000-00:00]: false
[2025-11-11T00:00:00.000-00:00]: false
[2025-11-12T00:00:00.000-00:00]: false
[2025-11-13T00:00:00.000-00:00]: false
[2025-11-14T00:00:00.000-00:00]: false
[2025-11-15T00:00:00.000-00:00]: true
[2025-11-16T00:00:00.000-00:00]: false
[2025-11-17T00:00:00.000-00:00]: false
[2025-11-18T00:00:00.000-00:00]: true
[2025-11-19T00:00:00.000-00:00]: false
[2025-11-20T00:00:00.000-00:00]: false`;

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
        //const part = result.crossover ? result.crossover.reverse() : [];

        //console.log(' CROSSOVER ', part);
        //expect(part).toBeDefined();
        //expect(part.length).toBe(50);
        //expect(part.every((v) => typeof v === 'boolean')).toBe(true);
    });

    it('CROSSUNDER - Crossunder Detection', async () => {
        // Crossunder returns a boolean per bar, need to collect it over time

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', null, new Date('2025-10-29').getTime(), new Date('2025-11-20').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const ta = context.ta;
            const { plotchar } = context.core;
            const crossunder = ta.crossunder(close, open);
            plotchar(crossunder, 'crossunder');

            return { crossunder };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const plotdata = plots['crossunder']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-29T00:00:00.000-00:00]: false
[2025-10-30T00:00:00.000-00:00]: false
[2025-10-31T00:00:00.000-00:00]: false
[2025-11-01T00:00:00.000-00:00]: false
[2025-11-02T00:00:00.000-00:00]: false
[2025-11-03T00:00:00.000-00:00]: true
[2025-11-04T00:00:00.000-00:00]: false
[2025-11-05T00:00:00.000-00:00]: false
[2025-11-06T00:00:00.000-00:00]: true
[2025-11-07T00:00:00.000-00:00]: false
[2025-11-08T00:00:00.000-00:00]: true
[2025-11-09T00:00:00.000-00:00]: false
[2025-11-10T00:00:00.000-00:00]: false
[2025-11-11T00:00:00.000-00:00]: true
[2025-11-12T00:00:00.000-00:00]: false
[2025-11-13T00:00:00.000-00:00]: false
[2025-11-14T00:00:00.000-00:00]: false
[2025-11-15T00:00:00.000-00:00]: false
[2025-11-16T00:00:00.000-00:00]: true
[2025-11-17T00:00:00.000-00:00]: false
[2025-11-18T00:00:00.000-00:00]: false
[2025-11-19T00:00:00.000-00:00]: true
[2025-11-20T00:00:00.000-00:00]: false`;

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('CROSS - Cross Detection', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.cross(close, open);

            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-20').getTime();
        const endDate = new Date('2019-11-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = _plotdata[i].value;

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2019-07-22T00:00:00.000-00:00]: true
[2019-07-29T00:00:00.000-00:00]: true
[2019-08-05T00:00:00.000-00:00]: false
[2019-08-12T00:00:00.000-00:00]: true
[2019-08-19T00:00:00.000-00:00]: false
[2019-08-26T00:00:00.000-00:00]: false
[2019-09-02T00:00:00.000-00:00]: true
[2019-09-09T00:00:00.000-00:00]: true
[2019-09-16T00:00:00.000-00:00]: false
[2019-09-23T00:00:00.000-00:00]: false
[2019-09-30T00:00:00.000-00:00]: false
[2019-10-07T00:00:00.000-00:00]: true
[2019-10-14T00:00:00.000-00:00]: true
[2019-10-21T00:00:00.000-00:00]: true
[2019-10-28T00:00:00.000-00:00]: true
[2019-11-04T00:00:00.000-00:00]: false
[2019-11-11T00:00:00.000-00:00]: false`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('RISING - Rising Trend Detection', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.rising(close, 2);

            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-01-28').getTime();
        const endDate = new Date('2019-05-20').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = _plotdata[i].value;

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2019-01-28T00:00:00.000-00:00]: false
[2019-02-04T00:00:00.000-00:00]: false
[2019-02-11T00:00:00.000-00:00]: false
[2019-02-18T00:00:00.000-00:00]: false
[2019-02-25T00:00:00.000-00:00]: true
[2019-03-04T00:00:00.000-00:00]: true
[2019-03-11T00:00:00.000-00:00]: true
[2019-03-18T00:00:00.000-00:00]: true
[2019-03-25T00:00:00.000-00:00]: true
[2019-04-01T00:00:00.000-00:00]: true
[2019-04-08T00:00:00.000-00:00]: false
[2019-04-15T00:00:00.000-00:00]: false
[2019-04-22T00:00:00.000-00:00]: false
[2019-04-29T00:00:00.000-00:00]: false
[2019-05-06T00:00:00.000-00:00]: true
[2019-05-13T00:00:00.000-00:00]: true
[2019-05-20T00:00:00.000-00:00]: true`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('FALLING - Falling Trend Detection', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.falling(close, 2);

            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-29').getTime();
        const endDate = new Date('2019-11-20').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = _plotdata[i].value;

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2019-07-29T00:00:00.000-00:00]: false
[2019-08-05T00:00:00.000-00:00]: false
[2019-08-12T00:00:00.000-00:00]: false
[2019-08-19T00:00:00.000-00:00]: true
[2019-08-26T00:00:00.000-00:00]: true
[2019-09-02T00:00:00.000-00:00]: false
[2019-09-09T00:00:00.000-00:00]: false
[2019-09-16T00:00:00.000-00:00]: true
[2019-09-23T00:00:00.000-00:00]: true
[2019-09-30T00:00:00.000-00:00]: true
[2019-10-07T00:00:00.000-00:00]: false
[2019-10-14T00:00:00.000-00:00]: false
[2019-10-21T00:00:00.000-00:00]: false
[2019-10-28T00:00:00.000-00:00]: false
[2019-11-04T00:00:00.000-00:00]: true
[2019-11-11T00:00:00.000-00:00]: true
[2019-11-18T00:00:00.000-00:00]: true`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('DMI - Directional Movement Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { ta, plotchar, math } = context.pine;

            const [diplus, diminus, adx] = ta.dmi(17, 14);

            plotchar(diplus, '_plot');

            return { diplus, diminus, adx };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-29').getTime();
        const endDate = new Date('2019-11-20').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const diplus = _plotdata[i].value;
            const diminus = result.diminus[i];
            const adx = result.adx[i];

            plotdata_str += `[${str_time}]: ${diplus} ${diminus} ${adx}\n`;
        }

        const expected_plot = `[2019-07-29T00:00:00.000-00:00]: 35.3923035062 8.2060412373 79.0152808048
[2019-08-05T00:00:00.000-00:00]: 38.7513141824 7.7204994416 78.1408614762
[2019-08-12T00:00:00.000-00:00]: 35.7106176878 12.4648778525 76.0059575857
[2019-08-19T00:00:00.000-00:00]: 33.8494770624 11.815242196 74.0235468302
[2019-08-26T00:00:00.000-00:00]: 31.9013822276 13.0335157978 71.7353890912
[2019-09-02T00:00:00.000-00:00]: 31.494999225 12.3589839617 69.7282721428
[2019-09-09T00:00:00.000-00:00]: 30.5262272401 11.9788271838 67.8645206906
[2019-09-16T00:00:00.000-00:00]: 29.4224443074 12.7328816069 65.8449576786
[2019-09-23T00:00:00.000-00:00]: 26.408359327 19.6885093755 62.1830086442
[2019-09-30T00:00:00.000-00:00]: 25.4325991301 19.0689552544 58.762781157
[2019-10-07T00:00:00.000-00:00]: 25.5444236071 18.154690428 55.773331604
[2019-10-14T00:00:00.000-00:00]: 24.806500619 17.6302408019 52.9974141619
[2019-10-21T00:00:00.000-00:00]: 29.9829290814 15.2732378504 51.533539951
[2019-10-28T00:00:00.000-00:00]: 28.6709831167 14.6049354737 50.1742281837
[2019-11-04T00:00:00.000-00:00]: 27.4001160168 15.2263871018 48.6302876517
[2019-11-11T00:00:00.000-00:00]: 26.5157870782 16.1015961704 46.9021589651
[2019-11-18T00:00:00.000-00:00]: 24.462187337 22.0021656968 43.9301781701`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('SAR - Parabolic SAR', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.sar(0.02, 0.02, 0.2);

            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-29').getTime();
        const endDate = new Date('2019-11-20').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = _plotdata[i].value;

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2019-07-29T00:00:00.000-00:00]: 13674.838168
[2019-08-05T00:00:00.000-00:00]: 13582.88140464
[2019-08-12T00:00:00.000-00:00]: 13492.7637765472
[2019-08-19T00:00:00.000-00:00]: 13404.4485010163
[2019-08-26T00:00:00.000-00:00]: 13317.8995309959
[2019-09-02T00:00:00.000-00:00]: 13233.081540376
[2019-09-09T00:00:00.000-00:00]: 13149.9599095685
[2019-09-16T00:00:00.000-00:00]: 13068.5007113771
[2019-09-23T00:00:00.000-00:00]: 12988.6706971496
[2019-09-30T00:00:00.000-00:00]: 12778.1238692636
[2019-10-07T00:00:00.000-00:00]: 12473.5000371078
[2019-10-14T00:00:00.000-00:00]: 12187.1536348813
[2019-10-21T00:00:00.000-00:00]: 11917.9880167884
[2019-10-28T00:00:00.000-00:00]: 11547.7489754454
[2019-11-04T00:00:00.000-00:00]: 11207.1290574097
[2019-11-11T00:00:00.000-00:00]: 10893.758732817
[2019-11-18T00:00:00.000-00:00]: 10605.4580341916`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
