import { describe, expect, it } from 'vitest';
import { arrayPrecision, getKlines, runNSFunctionWithArgs } from '../../utils';

import { Context, PineTS, Provider } from 'index';

async function runTAFunctionWithArgs(taFunction: string, ...args) {
    // Use the same dataset as the original tests for consistency
    const klines = await getKlines('BTCUSDT', '1h', 500, 0, 1736071200000 - 1);

    const result = await runNSFunctionWithArgs(klines, 'ta', taFunction, ...args);

    return result;
}

describe('Technical Analysis - Oscillators & Momentum', () => {
    it('CHANGE - Price Change', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context: Context) => {
            const { close, high, low } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.change(close, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: NaN
[2019-06-17T00:00:00.000-00:00]: NaN
[2019-06-24T00:00:00.000-00:00]: 7549.66
[2019-07-01T00:00:00.000-00:00]: 7527.28
[2019-07-08T00:00:00.000-00:00]: 6358.34
[2019-07-15T00:00:00.000-00:00]: 6550.19
[2019-07-22T00:00:00.000-00:00]: 6025.78
[2019-07-29T00:00:00.000-00:00]: 7438.36
[2019-08-05T00:00:00.000-00:00]: 8008.04
[2019-08-12T00:00:00.000-00:00]: 6903.1
[2019-08-19T00:00:00.000-00:00]: 6484.82
[2019-08-26T00:00:00.000-00:00]: 6130.03
[2019-09-02T00:00:00.000-00:00]: 6676.63
[2019-09-09T00:00:00.000-00:00]: 6530.36
[2019-09-16T00:00:00.000-00:00]: 6128.27`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('RSI - Relative Strength Index', async () => {
        const result = await runTAFunctionWithArgs('rsi', 'close', 14);

        const part = result.values.reverse().slice(0, 10);
        const expected = [
            40.42051518, 44.4602605765, 54.2984140824, 59.8046908557, 57.7926804941, 57.7604149786, 54.1294122804, 55.1559185358, 52.9779441078,
            55.1281063588,
        ];
        console.log(' RSI ', part);

        expect(part).toEqual(arrayPrecision(expected));
    });

    it('MOM - Momentum', async () => {
        const result = await runTAFunctionWithArgs('mom', 'close', 14);

        const part = result.values.reverse().slice(0, 10);
        const expected = [-514.06, -100.52, 252.51, 746.87, 701.04, 322.42, 214.91, 339.36, 234.14, 424.11];
        console.log(' MOM ', part);
        expect(part).toEqual(arrayPrecision(expected));
    });

    it('ROC - Rate of Change', async () => {
        const result = await runTAFunctionWithArgs('roc', 'close', 14);

        const part = result.values.reverse().slice(0, 10);
        const expected = [
            -0.5236626108, -0.1026116775, 0.2576205213, 0.7644164144, 0.7178525371, 0.3288824078, 0.2193562413, 0.3466814972, 0.2391883329,
            0.4336976676,
        ];
        console.log(' ROC ', part);
        expect(part).toEqual(arrayPrecision(expected));
    });

    it('MACD - Moving Average Convergence Divergence', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;

            const [macdLine, signalLine, histLine] = ta.macd(close, 12, 26, 9);
            plotchar(macdLine, 'macdLine');
            plotchar(signalLine, 'signalLine');
            plotchar(histLine, 'histLine');

            return { macdLine, signalLine, histLine };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let macdLine_plotdata = plots['macdLine']?.data;
        let signalLine_plotdata = plots['signalLine']?.data;
        let histLine_plotdata = plots['histLine']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();
        //macdLine_plotdata = macdLine_plotdata.filter((e) => e.time >= startDate && e.time <= endDate);
        //signalLine_plotdata = signalLine_plotdata.filter((e) => e.time >= startDate && e.time <= endDate);
        //histLine_plotdata = histLine_plotdata.filter((e) => e.time >= startDate && e.time <= endDate);

        let plotdata_str = '';
        for (let i = 0; i < macdLine_plotdata.length; i++) {
            const time = macdLine_plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const macdLine = macdLine_plotdata[i].value;
            const signalLine = signalLine_plotdata[i]?.value;
            const histLine = histLine_plotdata[i]?.value;
            plotdata_str += `[${str_time}]: ${macdLine} ${signalLine} ${histLine}\n`;
        }

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN NaN NaN
[2019-05-27T00:00:00.000-00:00]: NaN NaN NaN
[2019-06-03T00:00:00.000-00:00]: 1752.0169161203 NaN NaN
[2019-06-10T00:00:00.000-00:00]: 1811.3480940478 NaN NaN
[2019-06-17T00:00:00.000-00:00]: 1985.5011469079 NaN NaN
[2019-06-24T00:00:00.000-00:00]: 2091.4758618621 NaN NaN
[2019-07-01T00:00:00.000-00:00]: 2209.0504007935 NaN NaN
[2019-07-08T00:00:00.000-00:00]: 2172.2277130526 NaN NaN
[2019-07-15T00:00:00.000-00:00]: 2151.2756048449 NaN NaN
[2019-07-22T00:00:00.000-00:00]: 2026.2380772765 NaN NaN
[2019-07-29T00:00:00.000-00:00]: 2019.987956506 2024.3468634902 -4.3589069842
[2019-08-05T00:00:00.000-00:00]: 2037.1625005576 2026.9099909037 10.2525096539
[2019-08-12T00:00:00.000-00:00]: 1929.8543228139 2007.4988572857 -77.6445344718
[2019-08-19T00:00:00.000-00:00]: 1809.4157867148 1967.8822431715 -158.4664564567
[2019-08-26T00:00:00.000-00:00]: 1664.2955001788 1907.164894573 -242.8693943942
[2019-09-02T00:00:00.000-00:00]: 1582.6611389307 1842.2641434445 -259.6030045138
[2019-09-09T00:00:00.000-00:00]: 1494.0231506146 1772.6159448785 -278.5927942639
[2019-09-16T00:00:00.000-00:00]: 1384.4838361149 1694.9895231258 -310.5056870109`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('STOCH - Stochastic Oscillator', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.stoch(close, high, low, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: NaN
[2019-06-17T00:00:00.000-00:00]: 94.6592279855
[2019-06-24T00:00:00.000-00:00]: 70.8210134333
[2019-07-01T00:00:00.000-00:00]: 77.4370008008
[2019-07-08T00:00:00.000-00:00]: 65.1242567032
[2019-07-15T00:00:00.000-00:00]: 68.9987713476
[2019-07-22T00:00:00.000-00:00]: 59.0187629799
[2019-07-29T00:00:00.000-00:00]: 72.6414701422
[2019-08-05T00:00:00.000-00:00]: 77.991976843
[2019-08-12T00:00:00.000-00:00]: 66.4168974728
[2019-08-19T00:00:00.000-00:00]: 63.9606083338
[2019-08-26T00:00:00.000-00:00]: 59.9450761179
[2019-09-02T00:00:00.000-00:00]: 66.0486601751
[2019-09-09T00:00:00.000-00:00]: 65.1962755015
[2019-09-16T00:00:00.000-00:00]: 61.9126807575`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('CCI - Commodity Channel Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { open, high, low } = context.data;
            const { ta, plotchar } = context.pine;

            const res = ta.cci(close, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: NaN
[2019-06-17T00:00:00.000-00:00]: 217.9355132601
[2019-06-24T00:00:00.000-00:00]: 180.9311277383
[2019-07-01T00:00:00.000-00:00]: 175.2318123043
[2019-07-08T00:00:00.000-00:00]: 119.9451023475
[2019-07-15T00:00:00.000-00:00]: 117.6598979424
[2019-07-22T00:00:00.000-00:00]: 81.7121354013
[2019-07-29T00:00:00.000-00:00]: 109.3631391863
[2019-08-05T00:00:00.000-00:00]: 113.7902019475
[2019-08-12T00:00:00.000-00:00]: 77.2810280884
[2019-08-19T00:00:00.000-00:00]: 67.9956593021
[2019-08-26T00:00:00.000-00:00]: 54.5069973666
[2019-09-02T00:00:00.000-00:00]: 67.1770031672
[2019-09-09T00:00:00.000-00:00]: 61.3921938148
[2019-09-16T00:00:00.000-00:00]: 49.7914604329`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('MFI - Money Flow Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.mfi(close, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: NaN
[2019-06-17T00:00:00.000-00:00]: 78.6068702018
[2019-06-24T00:00:00.000-00:00]: 66.0634134155
[2019-07-01T00:00:00.000-00:00]: 69.0580680323
[2019-07-08T00:00:00.000-00:00]: 63.5411497242
[2019-07-15T00:00:00.000-00:00]: 66.5693463113
[2019-07-22T00:00:00.000-00:00]: 65.0696876138
[2019-07-29T00:00:00.000-00:00]: 66.429194205
[2019-08-05T00:00:00.000-00:00]: 69.7161316028
[2019-08-12T00:00:00.000-00:00]: 66.1599680125
[2019-08-19T00:00:00.000-00:00]: 62.6583568225
[2019-08-26T00:00:00.000-00:00]: 60.6195705525
[2019-09-02T00:00:00.000-00:00]: 61.9923889059
[2019-09-09T00:00:00.000-00:00]: 59.7938250296
[2019-09-16T00:00:00.000-00:00]: 57.5958647918`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('CMO - Chande Momentum Oscillator', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.cmo(close, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: NaN
[2019-06-17T00:00:00.000-00:00]: NaN
[2019-06-24T00:00:00.000-00:00]: 63.3317171134
[2019-07-01T00:00:00.000-00:00]: 63.2627470492
[2019-07-08T00:00:00.000-00:00]: 48.6581089706
[2019-07-15T00:00:00.000-00:00]: 49.400983315
[2019-07-22T00:00:00.000-00:00]: 43.7168991645
[2019-07-29T00:00:00.000-00:00]: 48.948751729
[2019-08-05T00:00:00.000-00:00]: 50.8219817935
[2019-08-12T00:00:00.000-00:00]: 40.9388458532
[2019-08-19T00:00:00.000-00:00]: 38.5908388697
[2019-08-26T00:00:00.000-00:00]: 35.7252213583
[2019-09-02T00:00:00.000-00:00]: 37.7095049372
[2019-09-09T00:00:00.000-00:00]: 36.8411551125
[2019-09-16T00:00:00.000-00:00]: 34.2323777774`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('COG - Center of Gravity', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.cog(close, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: NaN
[2019-06-17T00:00:00.000-00:00]: -11.67132368
[2019-06-24T00:00:00.000-00:00]: -11.5166107443
[2019-07-01T00:00:00.000-00:00]: -11.2937463858
[2019-07-08T00:00:00.000-00:00]: -11.2279164001
[2019-07-15T00:00:00.000-00:00]: -11.1572489377
[2019-07-22T00:00:00.000-00:00]: -11.239637216
[2019-07-29T00:00:00.000-00:00]: -11.2672181067
[2019-08-05T00:00:00.000-00:00]: -11.3013740007
[2019-08-12T00:00:00.000-00:00]: -11.4449658192
[2019-08-19T00:00:00.000-00:00]: -11.6013816208
[2019-08-26T00:00:00.000-00:00]: -11.7992153057
[2019-09-02T00:00:00.000-00:00]: -11.9749162693
[2019-09-09T00:00:00.000-00:00]: -12.1689865261
[2019-09-16T00:00:00.000-00:00]: -12.3860823107`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('TSI - True Strength Index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.tsi(close, 9, 18);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: NaN
[2019-05-27T00:00:00.000-00:00]: NaN
[2019-06-03T00:00:00.000-00:00]: NaN
[2019-06-10T00:00:00.000-00:00]: 0.6496654844
[2019-06-17T00:00:00.000-00:00]: 0.6561238889
[2019-06-24T00:00:00.000-00:00]: 0.6525462641
[2019-07-01T00:00:00.000-00:00]: 0.6607935498
[2019-07-08T00:00:00.000-00:00]: 0.5838493495
[2019-07-15T00:00:00.000-00:00]: 0.541369031
[2019-07-22T00:00:00.000-00:00]: 0.4576142002
[2019-07-29T00:00:00.000-00:00]: 0.4292336162
[2019-08-05T00:00:00.000-00:00]: 0.420926635
[2019-08-12T00:00:00.000-00:00]: 0.3634406995
[2019-08-19T00:00:00.000-00:00]: 0.3173667252
[2019-08-26T00:00:00.000-00:00]: 0.2702080502
[2019-09-02T00:00:00.000-00:00]: 0.2501959257
[2019-09-09T00:00:00.000-00:00]: 0.2324156416
[2019-09-16T00:00:00.000-00:00]: 0.2080344498`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('WPR - Williams %R', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            const res = ta.wpr(14);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-05-20').getTime();
        const endDate = new Date('2019-09-16').getTime();

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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: -1.041535782
[2019-05-27T00:00:00.000-00:00]: -6.3393309098
[2019-06-03T00:00:00.000-00:00]: -26.7375507193
[2019-06-10T00:00:00.000-00:00]: -7.112030098
[2019-06-17T00:00:00.000-00:00]: -5.9599528857
[2019-06-24T00:00:00.000-00:00]: -31.1450270264
[2019-07-01T00:00:00.000-00:00]: -24.2872222709
[2019-07-08T00:00:00.000-00:00]: -40.6728132576
[2019-07-15T00:00:00.000-00:00]: -36.1542741327
[2019-07-22T00:00:00.000-00:00]: -47.7931663333
[2019-07-29T00:00:00.000-00:00]: -32.803494778
[2019-08-05T00:00:00.000-00:00]: -28.0105680253
[2019-08-12T00:00:00.000-00:00]: -50.5148503574
[2019-08-19T00:00:00.000-00:00]: -58.0399831237
[2019-08-26T00:00:00.000-00:00]: -63.9220887998
[2019-09-02T00:00:00.000-00:00]: -53.9628939424
[2019-09-09T00:00:00.000-00:00]: -55.9840821947
[2019-09-16T00:00:00.000-00:00]: -77.9276673062`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('MOM - Momentum', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            const _close = close;
            const res = ta.mom(_close, 9);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-18').getTime();

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
[2019-01-21T00:00:00.000-00:00]: NaN
[2019-01-28T00:00:00.000-00:00]: NaN
[2019-02-04T00:00:00.000-00:00]: NaN
[2019-02-11T00:00:00.000-00:00]: 429.27
[2019-02-18T00:00:00.000-00:00]: -231.85
[2019-02-25T00:00:00.000-00:00]: -37.03
[2019-03-04T00:00:00.000-00:00]: -141.58
[2019-03-11T00:00:00.000-00:00]: 457.8
[2019-03-18T00:00:00.000-00:00]: 437.27
[2019-03-25T00:00:00.000-00:00]: 561.76
[2019-04-01T00:00:00.000-00:00]: 1778.84
[2019-04-08T00:00:00.000-00:00]: 1509.99
[2019-04-15T00:00:00.000-00:00]: 1668.46`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });


       
});
