import { describe, expect, it } from 'vitest';

import { PineTS, Provider } from 'index';

describe('Core - UDT', () => {
    it('UDT', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math, Type } = context.pine;

            const Trade = Type({ entry: 'float', stop: 'float', target: 'float', active: 'bool' });
            let trade = Trade.new(close, open, high, close > open);

            const res = trade;

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
            const res = result.res[i];
            plotdata_str += `[${str_time}]: ${res.entry} ${res.stop} ${res.target} ${res.active}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 3200 3312.32 false
[2018-12-17T00:00:00.000-00:00]: 3953.49 3192.69 4170 true
[2018-12-24T00:00:00.000-00:00]: 3821.66 3948.01 4299 false
[2018-12-31T00:00:00.000-00:00]: 4039.13 3832.27 4080 true
[2019-01-07T00:00:00.000-00:00]: 3509.21 4039 4110.5 false
[2019-01-14T00:00:00.000-00:00]: 3535.79 3511.94 3748 true
[2019-01-21T00:00:00.000-00:00]: 3531.36 3535.89 3660.86 false
[2019-01-28T00:00:00.000-00:00]: 3413.46 3527.66 3648.89 false
[2019-02-04T00:00:00.000-00:00]: 3651.57 3413.24 3721.3 true
[2019-02-11T00:00:00.000-00:00]: 3628.54 3651.57 3652.61 false
[2019-02-18T00:00:00.000-00:00]: 3721.64 3628.54 4184.27 true
[2019-02-25T00:00:00.000-00:00]: 3784.63 3730.78 3880 true
[2019-03-04T00:00:00.000-00:00]: 3897.55 3784.63 3949.99 true
[2019-03-11T00:00:00.000-00:00]: 3967.01 3900.31 4046.34 true
[2019-03-18T00:00:00.000-00:00]: 3973.06 3964.97 4053.15 true
[2019-03-25T00:00:00.000-00:00]: 4093.12 3970.64 4130 true
[2019-04-01T00:00:00.000-00:00]: 5192.3 4095.99 5377.98 true
[2019-04-08T00:00:00.000-00:00]: 5161.56 5197.14 5469 false
[2019-04-15T00:00:00.000-00:00]: 5297 5163.52 5360 true`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('UDT Pine Script source', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const code = `
// @Version=5
indicator('Test Indicator')
type Trade
    float entry
    float stop
    float target
    bool active

let trade = Trade.new(close, open, high, close > open)
res = trade
plotchar(res, '_plot')
`;

        const { result, plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

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
            plotdata_str += `[${str_time}]: ${res.entry} ${res.stop} ${res.target} ${res.active}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 3200 3312.32 false
[2018-12-17T00:00:00.000-00:00]: 3953.49 3192.69 4170 true
[2018-12-24T00:00:00.000-00:00]: 3821.66 3948.01 4299 false
[2018-12-31T00:00:00.000-00:00]: 4039.13 3832.27 4080 true
[2019-01-07T00:00:00.000-00:00]: 3509.21 4039 4110.5 false
[2019-01-14T00:00:00.000-00:00]: 3535.79 3511.94 3748 true
[2019-01-21T00:00:00.000-00:00]: 3531.36 3535.89 3660.86 false
[2019-01-28T00:00:00.000-00:00]: 3413.46 3527.66 3648.89 false
[2019-02-04T00:00:00.000-00:00]: 3651.57 3413.24 3721.3 true
[2019-02-11T00:00:00.000-00:00]: 3628.54 3651.57 3652.61 false
[2019-02-18T00:00:00.000-00:00]: 3721.64 3628.54 4184.27 true
[2019-02-25T00:00:00.000-00:00]: 3784.63 3730.78 3880 true
[2019-03-04T00:00:00.000-00:00]: 3897.55 3784.63 3949.99 true
[2019-03-11T00:00:00.000-00:00]: 3967.01 3900.31 4046.34 true
[2019-03-18T00:00:00.000-00:00]: 3973.06 3964.97 4053.15 true
[2019-03-25T00:00:00.000-00:00]: 4093.12 3970.64 4130 true
[2019-04-01T00:00:00.000-00:00]: 5192.3 4095.99 5377.98 true
[2019-04-08T00:00:00.000-00:00]: 5161.56 5197.14 5469 false
[2019-04-15T00:00:00.000-00:00]: 5297 5163.52 5360 true`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('UDT - copy', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high } = context.data;
            const { plotchar, Type } = context.pine;

            const Trade = Type({ entry: 'float', stop: 'float', target: 'float', active: 'bool' });
            let trade = Trade.new(close, open, high, close > open);
            let trade2 = Trade.copy(trade);
            trade2.active = false;

            const res = trade2;

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
            const res = result.res[i];
            plotdata_str += `[${str_time}]: ${res.entry} ${res.stop} ${res.target} ${res.active}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 3200 3312.32 false
[2018-12-17T00:00:00.000-00:00]: 3953.49 3192.69 4170 false
[2018-12-24T00:00:00.000-00:00]: 3821.66 3948.01 4299 false
[2018-12-31T00:00:00.000-00:00]: 4039.13 3832.27 4080 false
[2019-01-07T00:00:00.000-00:00]: 3509.21 4039 4110.5 false
[2019-01-14T00:00:00.000-00:00]: 3535.79 3511.94 3748 false
[2019-01-21T00:00:00.000-00:00]: 3531.36 3535.89 3660.86 false
[2019-01-28T00:00:00.000-00:00]: 3413.46 3527.66 3648.89 false
[2019-02-04T00:00:00.000-00:00]: 3651.57 3413.24 3721.3 false
[2019-02-11T00:00:00.000-00:00]: 3628.54 3651.57 3652.61 false
[2019-02-18T00:00:00.000-00:00]: 3721.64 3628.54 4184.27 false
[2019-02-25T00:00:00.000-00:00]: 3784.63 3730.78 3880 false
[2019-03-04T00:00:00.000-00:00]: 3897.55 3784.63 3949.99 false
[2019-03-11T00:00:00.000-00:00]: 3967.01 3900.31 4046.34 false
[2019-03-18T00:00:00.000-00:00]: 3973.06 3964.97 4053.15 false
[2019-03-25T00:00:00.000-00:00]: 4093.12 3970.64 4130 false
[2019-04-01T00:00:00.000-00:00]: 5192.3 4095.99 5377.98 false
[2019-04-08T00:00:00.000-00:00]: 5161.56 5197.14 5469 false
[2019-04-15T00:00:00.000-00:00]: 5297 5163.52 5360 false`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('UDT - instance copy', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high } = context.data;
            const { plotchar, Type } = context.pine;

            const Trade = Type({ entry: 'float', stop: 'float', target: 'float', active: 'bool' });
            let trade = Trade.new(close, open, high, close > open);
            let trade2 = trade.copy();
            trade2.active = false;

            const res = trade2;

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
            const res = result.res[i];
            plotdata_str += `[${str_time}]: ${res.entry} ${res.stop} ${res.target} ${res.active}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 3200 3312.32 false
[2018-12-17T00:00:00.000-00:00]: 3953.49 3192.69 4170 false
[2018-12-24T00:00:00.000-00:00]: 3821.66 3948.01 4299 false
[2018-12-31T00:00:00.000-00:00]: 4039.13 3832.27 4080 false
[2019-01-07T00:00:00.000-00:00]: 3509.21 4039 4110.5 false
[2019-01-14T00:00:00.000-00:00]: 3535.79 3511.94 3748 false
[2019-01-21T00:00:00.000-00:00]: 3531.36 3535.89 3660.86 false
[2019-01-28T00:00:00.000-00:00]: 3413.46 3527.66 3648.89 false
[2019-02-04T00:00:00.000-00:00]: 3651.57 3413.24 3721.3 false
[2019-02-11T00:00:00.000-00:00]: 3628.54 3651.57 3652.61 false
[2019-02-18T00:00:00.000-00:00]: 3721.64 3628.54 4184.27 false
[2019-02-25T00:00:00.000-00:00]: 3784.63 3730.78 3880 false
[2019-03-04T00:00:00.000-00:00]: 3897.55 3784.63 3949.99 false
[2019-03-11T00:00:00.000-00:00]: 3967.01 3900.31 4046.34 false
[2019-03-18T00:00:00.000-00:00]: 3973.06 3964.97 4053.15 false
[2019-03-25T00:00:00.000-00:00]: 4093.12 3970.64 4130 false
[2019-04-01T00:00:00.000-00:00]: 5192.3 4095.99 5377.98 false
[2019-04-08T00:00:00.000-00:00]: 5161.56 5197.14 5469 false
[2019-04-15T00:00:00.000-00:00]: 5297 5163.52 5360 false`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('UDT - used in TA function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math, Type } = context.pine;

            const Trade = Type({ entry: 'float', stop: 'float', target: 'float', active: 'bool' });
            let trade = Trade.new(close, open, high, close > open);

            const res = ta.sma(trade.entry, 14);

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
            const res = result.res[i];
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
[2019-02-11T00:00:00.000-00:00]: NaN
[2019-02-18T00:00:00.000-00:00]: NaN
[2019-02-25T00:00:00.000-00:00]: NaN
[2019-03-04T00:00:00.000-00:00]: NaN
[2019-03-11T00:00:00.000-00:00]: 3689.5935714286
[2019-03-18T00:00:00.000-00:00]: 3744.8642857143
[2019-03-25T00:00:00.000-00:00]: 3754.8378571429
[2019-04-01T00:00:00.000-00:00]: 3852.7407142857
[2019-04-08T00:00:00.000-00:00]: 3932.9142857143
[2019-04-15T00:00:00.000-00:00]: 4060.6135714286`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
