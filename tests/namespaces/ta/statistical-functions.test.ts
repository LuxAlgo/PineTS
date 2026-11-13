import { describe, expect, it } from 'vitest';
import { arrayPrecision, getKlines, runNSFunctionWithArgs } from '../../utils';

import { Context, PineTS, Provider } from 'index';

async function runTAFunctionWithArgs(taFunction: string, ...args) {
    // Use the same dataset as the original tests for consistency
    const klines = await getKlines('BTCUSDT', '1h', 500, 0, 1736071200000 - 1);

    const result = await runNSFunctionWithArgs(klines, 'ta', taFunction, ...args);

    return result;
}

describe('Technical Analysis - Statistical Functions', () => {
    it('HIGHEST - Highest Value', async () => {
        const result = await runTAFunctionWithArgs('highest', 'close', 14);

        const part = result.values.reverse().slice(0, 10);
        const expected = [98599.02, 98599.02, 98599.02, 98599.02, 98599.02, 98599.02, 98599.02, 98599.02, 98599.02, 98599.02];
        console.log(' HIGHEST ', part);
        expect(part).toEqual(arrayPrecision(expected));
    });

    it('LOWEST - Lowest Value', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'D', null, new Date('2025-09-29').getTime(), new Date('2025-11-20').getTime());

        const sourceCode = (context: Context) => {
            const { low, open } = context.data;
            const ta = context.ta;
            const { plot, plotchar } = context.core;
            const ta_lowest = ta.lowest(low, 14);
            plotchar(ta_lowest, 'result');
            const _low = low[0];
            const _open = open[0];

            return { ta_lowest, _low, _open };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata = plots['result'].data;

        for (let i = 0; i < plotdata.length; i++) {
            plotdata[i].strtime = new Date(plotdata[i].time).toISOString().slice(0, -1) + '-00:00';
            plotdata[i]._low = result._low[i];
            plotdata[i]._open = result._open[i];
            delete plotdata[i].options;
        }
        //remove everything before 2025-10-29
        plotdata = plotdata.filter((e) => e.time >= new Date('2025-10-29').getTime());
        // plotdata.forEach((e) => {
        //     e.strtime = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

        //     delete e.options;
        // });

        const plotdata_str = plotdata.map((e) => `[${e.strtime}]: ${e.value} | Low=${e._low} | Open=${e._open}`).join('\n');

        const expected_plot = `[2025-10-29T00:00:00.000-00:00]: 103529.01 | Low=109284.24 | Open=112925.5
[2025-10-30T00:00:00.000-00:00]: 103529.01 | Low=106301.44 | Open=110049.03
[2025-10-31T00:00:00.000-00:00]: 106136.22 | Low=108277.3 | Open=108317.02
[2025-11-01T00:00:00.000-00:00]: 106136.22 | Low=109359.87 | Open=109576.61
[2025-11-02T00:00:00.000-00:00]: 106301.44 | Low=109475.11 | Open=110065.22
[2025-11-03T00:00:00.000-00:00]: 105316.11 | Low=105316.11 | Open=110550.87
[2025-11-04T00:00:00.000-00:00]: 98894.48 | Low=98894.48 | Open=106577.47
[2025-11-05T00:00:00.000-00:00]: 98894.48 | Low=98961.66 | Open=101496.26
[2025-11-06T00:00:00.000-00:00]: 98894.48 | Low=100258.57 | Open=103890.38
[2025-11-07T00:00:00.000-00:00]: 98894.48 | Low=99203.41 | Open=101318.02
[2025-11-08T00:00:00.000-00:00]: 98894.48 | Low=101433.47 | Open=103300.01
[2025-11-09T00:00:00.000-00:00]: 98894.48 | Low=101371.35 | Open=102294.69
[2025-11-10T00:00:00.000-00:00]: 98894.48 | Low=104266.68 | Open=104710.21
[2025-11-11T00:00:00.000-00:00]: 98894.48 | Low=102459.93 | Open=105993.66
[2025-11-12T00:00:00.000-00:00]: 98894.48 | Low=100801.16 | Open=103035.66
[2025-11-13T00:00:00.000-00:00]: 97957.49 | Low=97957.49 | Open=101652.68
[2025-11-14T00:00:00.000-00:00]: 93948.96 | Low=93948.96 | Open=99644.01
[2025-11-15T00:00:00.000-00:00]: 93948.96 | Low=94508.28 | Open=94526.87
[2025-11-16T00:00:00.000-00:00]: 92920 | Low=92920 | Open=95562.68
[2025-11-17T00:00:00.000-00:00]: 91203.56 | Low=91203.56 | Open=94205.7
[2025-11-18T00:00:00.000-00:00]: 89205.78 | Low=89205.78 | Open=92123.22
[2025-11-19T00:00:00.000-00:00]: 88530.87 | Low=88530.87 | Open=92935.93
[2025-11-20T00:00:00.000-00:00]: 86000 | Low=86000 | Open=91489.59`;

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('MEDIAN - Median Value', async () => {
        const result = await runTAFunctionWithArgs('median', 'close', 14);

        const part = result.values.reverse().slice(0, 10);
        const expected = [98248.125, 98248.125, 98248.125, 98223.99, 98216.965, 98200.695, 98177.11, 98144.895, 98079.285, 98025.65];
        console.log(' MEDIAN ', part);
        expect(part).toEqual(arrayPrecision(expected));
    });

    it('STDEV - Standard Deviation (biased)', async () => {
        const result = await runTAFunctionWithArgs('stdev', 'close', 14);

        const part = result.values.reverse().slice(0, 10);
        const expected = [
            232.2550973892, 169.1452939617, 152.8762609273, 167.3178600641, 211.5276349872, 249.5073477712, 244.8955856928, 247.8274134548,
            252.6669577634, 257.961053433,
        ];
        console.log(' STDEV (biased) ', part);
        expect(part).toEqual(arrayPrecision(expected));
    });

    it('STDEV - Standard Deviation (unbiased)', async () => {
        const result = await runTAFunctionWithArgs('stdev', 'close', 14, false);

        const part = result.values.reverse().slice(0, 10);
        const expected = [
            241.0225051231, 175.5303669918, 158.6471935245, 173.6339492128, 219.5126008448, 258.9260114523, 254.1401597674, 257.1826612226,
            262.2048936989, 267.6988364153,
        ];
        console.log(' STDEV (unbiased) ', part);
        expect(part).toEqual(arrayPrecision(expected));
    });

    it('HIGHESTBARS - Bars Since Highest', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.highestbars(close, 6);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: NaN
[2018-12-31T00:00:00.000-00:00]: NaN
[2019-01-07T00:00:00.000-00:00]: NaN
[2019-01-14T00:00:00.000-00:00]: -2
[2019-01-21T00:00:00.000-00:00]: -3
[2019-01-28T00:00:00.000-00:00]: -4
[2019-02-04T00:00:00.000-00:00]: -5
[2019-02-11T00:00:00.000-00:00]: -1
[2019-02-18T00:00:00.000-00:00]: 0
[2019-02-25T00:00:00.000-00:00]: 0
[2019-03-04T00:00:00.000-00:00]: 0
[2019-03-11T00:00:00.000-00:00]: 0
[2019-03-18T00:00:00.000-00:00]: 0
[2019-03-25T00:00:00.000-00:00]: 0
[2019-04-01T00:00:00.000-00:00]: 0
[2019-04-08T00:00:00.000-00:00]: -1
[2019-04-15T00:00:00.000-00:00]: 0`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('MODE - Mode Value', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.mode(close, 6);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: NaN
[2018-12-31T00:00:00.000-00:00]: NaN
[2019-01-07T00:00:00.000-00:00]: NaN
[2019-01-14T00:00:00.000-00:00]: 3199.27
[2019-01-21T00:00:00.000-00:00]: 3509.21
[2019-01-28T00:00:00.000-00:00]: 3413.46
[2019-02-04T00:00:00.000-00:00]: 3413.46
[2019-02-11T00:00:00.000-00:00]: 3413.46
[2019-02-18T00:00:00.000-00:00]: 3413.46
[2019-02-25T00:00:00.000-00:00]: 3413.46
[2019-03-04T00:00:00.000-00:00]: 3413.46
[2019-03-11T00:00:00.000-00:00]: 3628.54
[2019-03-18T00:00:00.000-00:00]: 3628.54
[2019-03-25T00:00:00.000-00:00]: 3721.64
[2019-04-01T00:00:00.000-00:00]: 3784.63
[2019-04-08T00:00:00.000-00:00]: 3897.55
[2019-04-15T00:00:00.000-00:00]: 3967.01`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('LOWESTBARS - Bars Since Lowest', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.lowestbars(close, 6);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: NaN
[2018-12-31T00:00:00.000-00:00]: NaN
[2019-01-07T00:00:00.000-00:00]: NaN
[2019-01-14T00:00:00.000-00:00]: -5
[2019-01-21T00:00:00.000-00:00]: -2
[2019-01-28T00:00:00.000-00:00]: 0
[2019-02-04T00:00:00.000-00:00]: -1
[2019-02-11T00:00:00.000-00:00]: -2
[2019-02-18T00:00:00.000-00:00]: -3
[2019-02-25T00:00:00.000-00:00]: -4
[2019-03-04T00:00:00.000-00:00]: -5
[2019-03-11T00:00:00.000-00:00]: -4
[2019-03-18T00:00:00.000-00:00]: -5
[2019-03-25T00:00:00.000-00:00]: -5
[2019-04-01T00:00:00.000-00:00]: -5
[2019-04-08T00:00:00.000-00:00]: -5
[2019-04-15T00:00:00.000-00:00]: -5`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('PERCENTRANK - Percentile Rank', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.percentrank(close, 6);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: NaN
[2018-12-31T00:00:00.000-00:00]: NaN
[2019-01-07T00:00:00.000-00:00]: NaN
[2019-01-14T00:00:00.000-00:00]: NaN
[2019-01-21T00:00:00.000-00:00]: 33.3333333333
[2019-01-28T00:00:00.000-00:00]: 0
[2019-02-04T00:00:00.000-00:00]: 66.6666666667
[2019-02-11T00:00:00.000-00:00]: 66.6666666667
[2019-02-18T00:00:00.000-00:00]: 100
[2019-02-25T00:00:00.000-00:00]: 100
[2019-03-04T00:00:00.000-00:00]: 100
[2019-03-11T00:00:00.000-00:00]: 100
[2019-03-18T00:00:00.000-00:00]: 100
[2019-03-25T00:00:00.000-00:00]: 100
[2019-04-01T00:00:00.000-00:00]: 100
[2019-04-08T00:00:00.000-00:00]: 83.3333333333
[2019-04-15T00:00:00.000-00:00]: 100`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('percentile_linear_interpolation - Percentile (Linear)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.percentile_linear_interpolation(close, 3, 42.1);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: 3674.15357
[2018-12-31T00:00:00.000-00:00]: 3922.24629
[2019-01-07T00:00:00.000-00:00]: 3747.60935
[2019-01-14T00:00:00.000-00:00]: 3529.49054
[2019-01-21T00:00:00.000-00:00]: 3526.11045
[2019-01-28T00:00:00.000-00:00]: 3503.4177
[2019-02-04T00:00:00.000-00:00]: 3503.4177
[2019-02-11T00:00:00.000-00:00]: 3577.56604
[2019-02-18T00:00:00.000-00:00]: 3646.11189
[2019-02-25T00:00:00.000-00:00]: 3699.5753
[2019-03-04T00:00:00.000-00:00]: 3769.70137
[2019-03-11T00:00:00.000-00:00]: 3870.78796
[2019-03-18T00:00:00.000-00:00]: 3950.54798
[2019-03-25T00:00:00.000-00:00]: 3971.62615
[2019-04-01T00:00:00.000-00:00]: 4064.66578
[2019-04-08T00:00:00.000-00:00]: 4908.33972
[2019-04-15T00:00:00.000-00:00]: 5185.01462`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('percentile_nearest_rank - Percentile (Nearest Rank)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.percentile_nearest_rank(close, 6, 30);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: NaN
[2018-12-31T00:00:00.000-00:00]: NaN
[2019-01-07T00:00:00.000-00:00]: NaN
[2019-01-14T00:00:00.000-00:00]: 3509.21
[2019-01-21T00:00:00.000-00:00]: 3531.36
[2019-01-28T00:00:00.000-00:00]: 3509.21
[2019-02-04T00:00:00.000-00:00]: 3509.21
[2019-02-11T00:00:00.000-00:00]: 3509.21
[2019-02-18T00:00:00.000-00:00]: 3531.36
[2019-02-25T00:00:00.000-00:00]: 3531.36
[2019-03-04T00:00:00.000-00:00]: 3628.54
[2019-03-11T00:00:00.000-00:00]: 3651.57
[2019-03-18T00:00:00.000-00:00]: 3721.64
[2019-03-25T00:00:00.000-00:00]: 3784.63
[2019-04-01T00:00:00.000-00:00]: 3897.55
[2019-04-08T00:00:00.000-00:00]: 3967.01
[2019-04-15T00:00:00.000-00:00]: 3973.06`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('correlation - Correlation Coefficient', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume, high, low } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.correlation(close, low, 6);
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-20').getTime();

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

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN
[2018-12-17T00:00:00.000-00:00]: NaN
[2018-12-24T00:00:00.000-00:00]: NaN
[2018-12-31T00:00:00.000-00:00]: NaN
[2019-01-07T00:00:00.000-00:00]: NaN
[2019-01-14T00:00:00.000-00:00]: 0.5782893392
[2019-01-21T00:00:00.000-00:00]: 0.019891278
[2019-01-28T00:00:00.000-00:00]: 0.9543756814
[2019-02-04T00:00:00.000-00:00]: 0.7185400569
[2019-02-11T00:00:00.000-00:00]: 0.1211169002
[2019-02-18T00:00:00.000-00:00]: 0.5220449671
[2019-02-25T00:00:00.000-00:00]: 0.7203047067
[2019-03-04T00:00:00.000-00:00]: 0.785390748
[2019-03-11T00:00:00.000-00:00]: 0.8216331801
[2019-03-18T00:00:00.000-00:00]: 0.9328191299
[2019-03-25T00:00:00.000-00:00]: 0.9091316696
[2019-04-01T00:00:00.000-00:00]: 0.8754026899
[2019-04-08T00:00:00.000-00:00]: 0.7828922169
[2019-04-15T00:00:00.000-00:00]: 0.8171521982`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
