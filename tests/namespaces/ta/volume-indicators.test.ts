import { describe, expect, it } from 'vitest';
import { arrayPrecision, getKlines, runNSFunctionWithArgs } from '../../utils';

import { Context, PineTS, Provider } from 'index';

describe('Technical Analysis - Volume Indicators', () => {
    it('OBV - On-Balance Volume', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.obv;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 89446.284892
[2019-05-27T00:00:00.000-00:00]: 104957.474839
[2019-06-03T00:00:00.000-00:00]: 90871.2614
[2019-06-10T00:00:00.000-00:00]: 104957.190506
[2019-06-17T00:00:00.000-00:00]: 121253.136353
[2019-06-24T00:00:00.000-00:00]: 92141.776478
[2019-07-01T00:00:00.000-00:00]: 112223.38526
[2019-07-08T00:00:00.000-00:00]: 91276.4229
[2019-07-15T00:00:00.000-00:00]: 113561.791623
[2019-07-22T00:00:00.000-00:00]: 102675.475375
[2019-07-29T00:00:00.000-00:00]: 115455.858888
[2019-08-05T00:00:00.000-00:00]: 135776.055283
[2019-08-12T00:00:00.000-00:00]: 117985.645096
[2019-08-19T00:00:00.000-00:00]: 102110.835788
[2019-08-26T00:00:00.000-00:00]: 89352.975732
[2019-09-02T00:00:00.000-00:00]: 103126.658087
[2019-09-09T00:00:00.000-00:00]: 92166.302632
[2019-09-16T00:00:00.000-00:00]: 80304.054136`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('PVT - Price Volume Trend', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.pvt;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 15337.8023158432
[2019-05-27T00:00:00.000-00:00]: 15356.4161984698
[2019-06-03T00:00:00.000-00:00]: 13575.7271714945
[2019-06-10T00:00:00.000-00:00]: 16064.8844814025
[2019-06-17T00:00:00.000-00:00]: 19435.6967469751
[2019-06-24T00:00:00.000-00:00]: 19171.8299694131
[2019-07-01T00:00:00.000-00:00]: 20539.084623692
[2019-07-08T00:00:00.000-00:00]: 18165.7960525407
[2019-07-15T00:00:00.000-00:00]: 19061.8517623343
[2019-07-22T00:00:00.000-00:00]: 17977.9512087809
[2019-07-29T00:00:00.000-00:00]: 19906.9534139818
[2019-08-05T00:00:00.000-00:00]: 20953.594020523
[2019-08-12T00:00:00.000-00:00]: 19068.3291719979
[2019-08-19T00:00:00.000-00:00]: 18791.0890461204
[2019-08-26T00:00:00.000-00:00]: 18315.5573542303
[2019-09-02T00:00:00.000-00:00]: 19218.4585582482
[2019-09-09T00:00:00.000-00:00]: 19130.6768020241
[2019-09-16T00:00:00.000-00:00]: 18798.1310217967`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('WAD - Williams Accumulation/Distribution', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.wad;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 6479.75
[2019-05-27T00:00:00.000-00:00]: 7234.47
[2019-06-03T00:00:00.000-00:00]: 6120.31
[2019-06-10T00:00:00.000-00:00]: 7584.03
[2019-06-17T00:00:00.000-00:00]: 9492.71
[2019-06-24T00:00:00.000-00:00]: 6377.22
[2019-07-01T00:00:00.000-00:00]: 8189.66
[2019-07-08T00:00:00.000-00:00]: 5194.67
[2019-07-15T00:00:00.000-00:00]: 6706.99
[2019-07-22T00:00:00.000-00:00]: 5550.39
[2019-07-29T00:00:00.000-00:00]: 7168.26
[2019-08-05T00:00:00.000-00:00]: 7735.99
[2019-08-12T00:00:00.000-00:00]: 6501.77
[2019-08-19T00:00:00.000-00:00]: 5686.06
[2019-08-26T00:00:00.000-00:00]: 4805.78
[2019-09-02T00:00:00.000-00:00]: 5462.59
[2019-09-09T00:00:00.000-00:00]: 5238.67
[2019-09-16T00:00:00.000-00:00]: 4881.74`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('WVAD - Williams Variable Accumulation/Distribution', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.wvad;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 6372.5732130785
[2019-05-27T00:00:00.000-00:00]: 137.3133763232
[2019-06-03T00:00:00.000-00:00]: -11873.9762181302
[2019-06-10T00:00:00.000-00:00]: 10210.8272356933
[2019-06-17T00:00:00.000-00:00]: 12964.030865767
[2019-06-24T00:00:00.000-00:00]: -659.093693199
[2019-07-01T00:00:00.000-00:00]: 6196.6987696513
[2019-07-08T00:00:00.000-00:00]: -8835.2993751939
[2019-07-15T00:00:00.000-00:00]: 4467.6491049431
[2019-07-22T00:00:00.000-00:00]: -7365.3505070253
[2019-07-29T00:00:00.000-00:00]: 10748.410082409
[2019-08-05T00:00:00.000-00:00]: 8527.3818785339
[2019-08-12T00:00:00.000-00:00]: -11952.0185877611
[2019-08-19T00:00:00.000-00:00]: -2350.1435872415
[2019-08-26T00:00:00.000-00:00]: -3628.8844260272
[2019-09-02T00:00:00.000-00:00]: 7564.6023130686
[2019-09-09T00:00:00.000-00:00]: -1411.3721935498
[2019-09-16T00:00:00.000-00:00]: -4382.2502683977`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('ACCDIST - Accumulation/Distribution', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.accdist;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 58083.3852067432
[2019-05-27T00:00:00.000-00:00]: 63873.9735492836
[2019-06-03T00:00:00.000-00:00]: 54022.0893628356
[2019-06-10T00:00:00.000-00:00]: 62081.8473612
[2019-06-17T00:00:00.000-00:00]: 72241.0763816228
[2019-06-24T00:00:00.000-00:00]: 50462.7259660489
[2019-07-01T00:00:00.000-00:00]: 61074.0137681842
[2019-07-08T00:00:00.000-00:00]: 41203.7042446865
[2019-07-15T00:00:00.000-00:00]: 52237.7708426627
[2019-07-22T00:00:00.000-00:00]: 47100.6797484973
[2019-07-29T00:00:00.000-00:00]: 58353.2581051534
[2019-08-05T00:00:00.000-00:00]: 55201.8343674344
[2019-08-12T00:00:00.000-00:00]: 48865.7515031986
[2019-08-19T00:00:00.000-00:00]: 43165.6846022204
[2019-08-26T00:00:00.000-00:00]: 38956.240347692
[2019-09-02T00:00:00.000-00:00]: 40495.9495115361
[2019-09-09T00:00:00.000-00:00]: 44258.1621222206
[2019-09-16T00:00:00.000-00:00]: 45302.1612265188`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('NVI - Negative Volume Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.nvi;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 1.2290324697
[2019-05-27T00:00:00.000-00:00]: 1.2305073447
[2019-06-03T00:00:00.000-00:00]: 1.0749544748
[2019-06-10T00:00:00.000-00:00]: 1.2649121814
[2019-06-17T00:00:00.000-00:00]: 1.2649121814
[2019-06-24T00:00:00.000-00:00]: 1.2649121814
[2019-07-01T00:00:00.000-00:00]: 1.3510336215
[2019-07-08T00:00:00.000-00:00]: 1.3510336215
[2019-07-15T00:00:00.000-00:00]: 1.3510336215
[2019-07-22T00:00:00.000-00:00]: 1.2165174034
[2019-07-29T00:00:00.000-00:00]: 1.2165174034
[2019-08-05T00:00:00.000-00:00]: 1.2165174034
[2019-08-12T00:00:00.000-00:00]: 1.0876020229
[2019-08-19T00:00:00.000-00:00]: 1.0686079729
[2019-08-26T00:00:00.000-00:00]: 1.0287770801
[2019-09-02T00:00:00.000-00:00]: 1.0287770801
[2019-09-09T00:00:00.000-00:00]: 1.0205375791
[2019-09-16T00:00:00.000-00:00]: 1.0205375791`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('PVI - Positive Volume Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.pvi;
            plotchar(res, 'plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const data = _plotdata[i].value;
            plotdata_str += `[${str_time}]: ${data}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 2.2210338501
[2019-05-27T00:00:00.000-00:00]: 2.2210338501
[2019-06-03T00:00:00.000-00:00]: 2.2210338501
[2019-06-10T00:00:00.000-00:00]: 2.2210338501
[2019-06-17T00:00:00.000-00:00]: 2.6804541387
[2019-06-24T00:00:00.000-00:00]: 2.6561583724
[2019-07-01T00:00:00.000-00:00]: 2.6561583724
[2019-07-08T00:00:00.000-00:00]: 2.3552159159
[2019-07-15T00:00:00.000-00:00]: 2.4499150297
[2019-07-22T00:00:00.000-00:00]: 2.4499150297
[2019-07-29T00:00:00.000-00:00]: 2.819692
[2019-08-05T00:00:00.000-00:00]: 2.9649270208
[2019-08-12T00:00:00.000-00:00]: 2.9649270208
[2019-08-19T00:00:00.000-00:00]: 2.9649270208
[2019-08-26T00:00:00.000-00:00]: 2.9649270208
[2019-09-02T00:00:00.000-00:00]: 3.1592858065
[2019-09-09T00:00:00.000-00:00]: 3.1592858065
[2019-09-16T00:00:00.000-00:00]: 3.0707185198`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('III - Intraday Intensity Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar } = context.pine;

            plotchar(ta.iii, 'plot');
            plotchar(close, 'close');
            plotchar(high, 'high');
            plotchar(low, 'low');
            plotchar(volume, 'volume');
        };

        const { plots } = await pineTS.run(sourceCode);
        const values = (key: string) => plots[key].data.map((d) => d.value);
        const [iii, c, h, l, v] = ['plot', 'close', 'high', 'low', 'volume'].map(values);

        // TradingView computes (2 * close - high - low) / (high - low) * volume (its manual shows a
        // division by volume); checked on BINANCE:BTCUSDT 1h.
        expect(iii.length).toBeGreaterThan(50);
        iii.forEach((x, i) => expect(x).toBeCloseTo(((2 * c[i] - h[i] - l[i]) / (h[i] - l[i])) * v[i], 4));
    });
});
