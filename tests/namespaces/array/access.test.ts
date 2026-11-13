import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from 'index';

describe('Array Access & Information', () => {
    it('SET, GET, FIRST', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);

        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(10, close);

            array.set(arr, 1, 99);

            const arr_val = array.get(arr, 1);
            const first = array.first(arr);

            return {
                arr_val,
                first,
            };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const part_arr_val = result.arr_val.reverse().slice(0, 5);
        const part_first = result.first.reverse().slice(0, 5);

        const expected_arr_val = [99, 99, 99, 99, 99];
        const expected_first = [101331.57, 94545.06, 98363.61, 93738.2, 95186.27];

        expect(part_arr_val).toEqual(expected_arr_val);
        expect(part_first).toEqual(expected_first);
    });

    it('SET, GET, FIRST from Array Object', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);

        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(10, close);

            arr.set(1, 99);

            const arr_val = arr.get(1);
            const first = arr.first();

            return {
                arr_val,
                first,
            };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const part_arr_val = result.arr_val.reverse().slice(0, 5);
        const part_first = result.first.reverse().slice(0, 5);

        const expected_arr_val = [99, 99, 99, 99, 99];
        const expected_first = [101331.57, 94545.06, 98363.61, 93738.2, 95186.27];

        expect(part_arr_val).toEqual(expected_arr_val);
        expect(part_first).toEqual(expected_first);
    });

    it('GET, SET, LAST, SIZE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i] - open[i]);
            }
            a.set(9, a.get(9) + 10);
            let res = array.get(a, 9);
            let last = a.last();
            let size = a.size();

            return { a, res, last, size };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const res = result.res[i];
            const last = result.last[i];
            const size = result.size[i];

            plotdata_str += `[${str_time}]: ${last} ${res} ${size}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN NaN 10
[2018-12-17T00:00:00.000-00:00]: NaN NaN 10
[2018-12-24T00:00:00.000-00:00]: NaN NaN 10
[2018-12-31T00:00:00.000-00:00]: NaN NaN 10
[2019-01-07T00:00:00.000-00:00]: NaN NaN 10
[2019-01-14T00:00:00.000-00:00]: NaN NaN 10
[2019-01-21T00:00:00.000-00:00]: NaN NaN 10
[2019-01-28T00:00:00.000-00:00]: NaN NaN 10
[2019-02-04T00:00:00.000-00:00]: NaN NaN 10
[2019-02-11T00:00:00.000-00:00]: 9.27 9.27 10
[2019-02-18T00:00:00.000-00:00]: 770.8 770.8 10
[2019-02-25T00:00:00.000-00:00]: -116.35 -116.35 10
[2019-03-04T00:00:00.000-00:00]: 216.86 216.86 10
[2019-03-11T00:00:00.000-00:00]: -519.79 -519.79 10
[2019-03-18T00:00:00.000-00:00]: 33.85 33.85 10
[2019-03-25T00:00:00.000-00:00]: 5.47 5.47 10
[2019-04-01T00:00:00.000-00:00]: -104.2 -104.2 10
[2019-04-08T00:00:00.000-00:00]: 248.33 248.33 10
[2019-04-15T00:00:00.000-00:00]: -13.03 -13.03 10`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('FILL', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(5);
            a.fill(close - open);
            let res = a;

            return { a, res };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];

            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const res = JSON.stringify(result.res[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [-0.73, -0.73, -0.73, -0.73, -0.73]
[2018-12-17T00:00:00.000-00:00]: [760.8, 760.8, 760.8, 760.8, 760.8]
[2018-12-24T00:00:00.000-00:00]: [-126.35, -126.35, -126.35, -126.35, -126.35]
[2018-12-31T00:00:00.000-00:00]: [206.86, 206.86, 206.86, 206.86, 206.86]
[2019-01-07T00:00:00.000-00:00]: [-529.79, -529.79, -529.79, -529.79, -529.79]
[2019-01-14T00:00:00.000-00:00]: [23.85, 23.85, 23.85, 23.85, 23.85]
[2019-01-21T00:00:00.000-00:00]: [-4.53, -4.53, -4.53, -4.53, -4.53]
[2019-01-28T00:00:00.000-00:00]: [-114.2, -114.2, -114.2, -114.2, -114.2]
[2019-02-04T00:00:00.000-00:00]: [238.33, 238.33, 238.33, 238.33, 238.33]
[2019-02-11T00:00:00.000-00:00]: [-23.03, -23.03, -23.03, -23.03, -23.03]
[2019-02-18T00:00:00.000-00:00]: [93.1, 93.1, 93.1, 93.1, 93.1]
[2019-02-25T00:00:00.000-00:00]: [53.85, 53.85, 53.85, 53.85, 53.85]
[2019-03-04T00:00:00.000-00:00]: [112.92, 112.92, 112.92, 112.92, 112.92]
[2019-03-11T00:00:00.000-00:00]: [66.7, 66.7, 66.7, 66.7, 66.7]
[2019-03-18T00:00:00.000-00:00]: [8.09, 8.09, 8.09, 8.09, 8.09]
[2019-03-25T00:00:00.000-00:00]: [122.48, 122.48, 122.48, 122.48, 122.48]
[2019-04-01T00:00:00.000-00:00]: [1096.31, 1096.31, 1096.31, 1096.31, 1096.31]
[2019-04-08T00:00:00.000-00:00]: [-35.58, -35.58, -35.58, -35.58, -35.58]
[2019-04-15T00:00:00.000-00:00]: [133.48, 133.48, 133.48, 133.48, 133.48]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
