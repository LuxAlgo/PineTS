import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from 'index';

describe('Array Manipulation & Logic', () => {
    it('CONCAT + new_float + push', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            let b = array.new_float(0, 0);
            for (let i = 0; i <= 4; i++) {
                array.push(a, high[i]);
                array.push(b, low[i]);
            }
            let res = array.concat(a, b);

            return { res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = JSON.stringify(result.res[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3312.32, NaN, NaN, NaN, NaN, 3000, NaN, NaN, NaN, NaN]
[2018-12-17T00:00:00.000-00:00]: [4170, 3312.32, NaN, NaN, NaN, 3187.25, 3000, NaN, NaN, NaN]
[2018-12-24T00:00:00.000-00:00]: [4299, 4170, 3312.32, NaN, NaN, 3528, 3187.25, 3000, NaN, NaN]
[2018-12-31T00:00:00.000-00:00]: [4080, 4299, 4170, 3312.32, NaN, 3623.24, 3528, 3187.25, 3000, NaN]
[2019-01-07T00:00:00.000-00:00]: [4110.5, 4080, 4299, 4170, 3312.32, 3431.15, 3623.24, 3528, 3187.25, 3000]
[2019-01-14T00:00:00.000-00:00]: [3748, 4110.5, 4080, 4299, 4170, 3477.82, 3431.15, 3623.24, 3528, 3187.25]
[2019-01-21T00:00:00.000-00:00]: [3660.86, 3748, 4110.5, 4080, 4299, 3436.59, 3477.82, 3431.15, 3623.24, 3528]
[2019-01-28T00:00:00.000-00:00]: [3648.89, 3660.86, 3748, 4110.5, 4080, 3344.91, 3436.59, 3477.82, 3431.15, 3623.24]
[2019-02-04T00:00:00.000-00:00]: [3721.3, 3648.89, 3660.86, 3748, 4110.5, 3300, 3344.91, 3436.59, 3477.82, 3431.15]
[2019-02-11T00:00:00.000-00:00]: [3652.61, 3721.3, 3648.89, 3660.86, 3748, 3520.1, 3300, 3344.91, 3436.59, 3477.82]
[2019-02-18T00:00:00.000-00:00]: [4184.27, 3652.61, 3721.3, 3648.89, 3660.86, 3613.87, 3520.1, 3300, 3344.91, 3436.59]
[2019-02-25T00:00:00.000-00:00]: [3880, 4184.27, 3652.61, 3721.3, 3648.89, 3655.25, 3613.87, 3520.1, 3300, 3344.91]
[2019-03-04T00:00:00.000-00:00]: [3949.99, 3880, 4184.27, 3652.61, 3721.3, 3666, 3655.25, 3613.87, 3520.1, 3300]
[2019-03-11T00:00:00.000-00:00]: [4046.34, 3949.99, 3880, 4184.27, 3652.61, 3786, 3666, 3655.25, 3613.87, 3520.1]
[2019-03-18T00:00:00.000-00:00]: [4053.15, 4046.34, 3949.99, 3880, 4184.27, 3863.95, 3786, 3666, 3655.25, 3613.87]
[2019-03-25T00:00:00.000-00:00]: [4130, 4053.15, 4046.34, 3949.99, 3880, 3861.25, 3863.95, 3786, 3666, 3655.25]
[2019-04-01T00:00:00.000-00:00]: [5377.98, 4130, 4053.15, 4046.34, 3949.99, 4050, 3861.25, 3863.95, 3786, 3666]
[2019-04-08T00:00:00.000-00:00]: [5469, 5377.98, 4130, 4053.15, 4046.34, 4903.54, 4050, 3861.25, 3863.95, 3786]
[2019-04-15T00:00:00.000-00:00]: [5360, 5469, 5377.98, 4130, 4053.15, 4941.13, 4903.54, 4050, 3861.25, 3863.95]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let res = array.slice(a, 0, 5);

            return { res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = JSON.stringify(result.res[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN]
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN, NaN]
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN, NaN]
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27, NaN]
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49, 3199.27]
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66, 3953.49]
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13, 3821.66]
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21, 4039.13]
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79, 3509.21]
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36, 3535.79]
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46, 3531.36]
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57, 3413.46]
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54, 3651.57]
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64, 3628.54]
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63, 3721.64]
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55, 3784.63]
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01, 3897.55]
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06, 3967.01]
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12, 3973.06]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE + REVERSE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let res = array.slice(a, 0, 5);
            res.reverse();

            return { res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = JSON.stringify(result.res[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [NaN, NaN, NaN, NaN, 3199.27]
[2018-12-17T00:00:00.000-00:00]: [NaN, NaN, NaN, 3199.27, 3953.49]
[2018-12-24T00:00:00.000-00:00]: [NaN, NaN, 3199.27, 3953.49, 3821.66]
[2018-12-31T00:00:00.000-00:00]: [NaN, 3199.27, 3953.49, 3821.66, 4039.13]
[2019-01-07T00:00:00.000-00:00]: [3199.27, 3953.49, 3821.66, 4039.13, 3509.21]
[2019-01-14T00:00:00.000-00:00]: [3953.49, 3821.66, 4039.13, 3509.21, 3535.79]
[2019-01-21T00:00:00.000-00:00]: [3821.66, 4039.13, 3509.21, 3535.79, 3531.36]
[2019-01-28T00:00:00.000-00:00]: [4039.13, 3509.21, 3535.79, 3531.36, 3413.46]
[2019-02-04T00:00:00.000-00:00]: [3509.21, 3535.79, 3531.36, 3413.46, 3651.57]
[2019-02-11T00:00:00.000-00:00]: [3535.79, 3531.36, 3413.46, 3651.57, 3628.54]
[2019-02-18T00:00:00.000-00:00]: [3531.36, 3413.46, 3651.57, 3628.54, 3721.64]
[2019-02-25T00:00:00.000-00:00]: [3413.46, 3651.57, 3628.54, 3721.64, 3784.63]
[2019-03-04T00:00:00.000-00:00]: [3651.57, 3628.54, 3721.64, 3784.63, 3897.55]
[2019-03-11T00:00:00.000-00:00]: [3628.54, 3721.64, 3784.63, 3897.55, 3967.01]
[2019-03-18T00:00:00.000-00:00]: [3721.64, 3784.63, 3897.55, 3967.01, 3973.06]
[2019-03-25T00:00:00.000-00:00]: [3784.63, 3897.55, 3967.01, 3973.06, 4093.12]
[2019-04-01T00:00:00.000-00:00]: [3897.55, 3967.01, 3973.06, 4093.12, 5192.3]
[2019-04-08T00:00:00.000-00:00]: [3967.01, 3973.06, 4093.12, 5192.3, 5161.56]
[2019-04-15T00:00:00.000-00:00]: [3973.06, 4093.12, 5192.3, 5161.56, 5297]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE + REVERSE + SORT', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array, order } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let res = array.slice(a, 0, 5);
            res.reverse();
            res.sort(order.ascending);

            return { res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = JSON.stringify(result.res[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN]
[2018-12-17T00:00:00.000-00:00]: [3199.27, 3953.49, NaN, NaN, NaN]
[2018-12-24T00:00:00.000-00:00]: [3199.27, 3821.66, 3953.49, NaN, NaN]
[2018-12-31T00:00:00.000-00:00]: [3199.27, 3821.66, 3953.49, 4039.13, NaN]
[2019-01-07T00:00:00.000-00:00]: [3199.27, 3509.21, 3821.66, 3953.49, 4039.13]
[2019-01-14T00:00:00.000-00:00]: [3509.21, 3535.79, 3821.66, 3953.49, 4039.13]
[2019-01-21T00:00:00.000-00:00]: [3509.21, 3531.36, 3535.79, 3821.66, 4039.13]
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3509.21, 3531.36, 3535.79, 4039.13]
[2019-02-04T00:00:00.000-00:00]: [3413.46, 3509.21, 3531.36, 3535.79, 3651.57]
[2019-02-11T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3628.54, 3651.57]
[2019-02-18T00:00:00.000-00:00]: [3413.46, 3531.36, 3628.54, 3651.57, 3721.64]
[2019-02-25T00:00:00.000-00:00]: [3413.46, 3628.54, 3651.57, 3721.64, 3784.63]
[2019-03-04T00:00:00.000-00:00]: [3628.54, 3651.57, 3721.64, 3784.63, 3897.55]
[2019-03-11T00:00:00.000-00:00]: [3628.54, 3721.64, 3784.63, 3897.55, 3967.01]
[2019-03-18T00:00:00.000-00:00]: [3721.64, 3784.63, 3897.55, 3967.01, 3973.06]
[2019-03-25T00:00:00.000-00:00]: [3784.63, 3897.55, 3967.01, 3973.06, 4093.12]
[2019-04-01T00:00:00.000-00:00]: [3897.55, 3967.01, 3973.06, 4093.12, 5192.3]
[2019-04-08T00:00:00.000-00:00]: [3967.01, 3973.06, 4093.12, 5161.56, 5192.3]
[2019-04-15T00:00:00.000-00:00]: [3973.06, 4093.12, 5161.56, 5192.3, 5297]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE + REVERSE + sort_indices', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let b = array.slice(a, 0, 5);
            b.reverse();

            let res = b.sort_indices();

            return { res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = JSON.stringify(result.res[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [4, 0, 1, 2, 3]
[2018-12-17T00:00:00.000-00:00]: [3, 4, 0, 1, 2]
[2018-12-24T00:00:00.000-00:00]: [2, 4, 3, 0, 1]
[2018-12-31T00:00:00.000-00:00]: [1, 3, 2, 4, 0]
[2019-01-07T00:00:00.000-00:00]: [0, 4, 2, 1, 3]
[2019-01-14T00:00:00.000-00:00]: [3, 4, 1, 0, 2]
[2019-01-21T00:00:00.000-00:00]: [2, 4, 3, 0, 1]
[2019-01-28T00:00:00.000-00:00]: [4, 1, 3, 2, 0]
[2019-02-04T00:00:00.000-00:00]: [3, 0, 2, 1, 4]
[2019-02-11T00:00:00.000-00:00]: [2, 1, 0, 4, 3]
[2019-02-18T00:00:00.000-00:00]: [1, 0, 3, 2, 4]
[2019-02-25T00:00:00.000-00:00]: [0, 2, 1, 3, 4]
[2019-03-04T00:00:00.000-00:00]: [1, 0, 2, 3, 4]
[2019-03-11T00:00:00.000-00:00]: [0, 1, 2, 3, 4]
[2019-03-18T00:00:00.000-00:00]: [0, 1, 2, 3, 4]
[2019-03-25T00:00:00.000-00:00]: [0, 1, 2, 3, 4]
[2019-04-01T00:00:00.000-00:00]: [0, 1, 2, 3, 4]
[2019-04-08T00:00:00.000-00:00]: [0, 1, 2, 4, 3]
[2019-04-15T00:00:00.000-00:00]: [0, 1, 3, 2, 4]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE + REVERSE + SORT + JOIN', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let b = array.slice(a, 0, 5);
            b.reverse();
            b.sort(false); //descending order

            let res = b.join(',');

            return { res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = result.res[i];

            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN,NaN,NaN,NaN,3199.27
[2018-12-17T00:00:00.000-00:00]: NaN,NaN,NaN,3953.49,3199.27
[2018-12-24T00:00:00.000-00:00]: NaN,NaN,3953.49,3821.66,3199.27
[2018-12-31T00:00:00.000-00:00]: NaN,4039.13,3953.49,3821.66,3199.27
[2019-01-07T00:00:00.000-00:00]: 4039.13,3953.49,3821.66,3509.21,3199.27
[2019-01-14T00:00:00.000-00:00]: 4039.13,3953.49,3821.66,3535.79,3509.21
[2019-01-21T00:00:00.000-00:00]: 4039.13,3821.66,3535.79,3531.36,3509.21
[2019-01-28T00:00:00.000-00:00]: 4039.13,3535.79,3531.36,3509.21,3413.46
[2019-02-04T00:00:00.000-00:00]: 3651.57,3535.79,3531.36,3509.21,3413.46
[2019-02-11T00:00:00.000-00:00]: 3651.57,3628.54,3535.79,3531.36,3413.46
[2019-02-18T00:00:00.000-00:00]: 3721.64,3651.57,3628.54,3531.36,3413.46
[2019-02-25T00:00:00.000-00:00]: 3784.63,3721.64,3651.57,3628.54,3413.46
[2019-03-04T00:00:00.000-00:00]: 3897.55,3784.63,3721.64,3651.57,3628.54
[2019-03-11T00:00:00.000-00:00]: 3967.01,3897.55,3784.63,3721.64,3628.54
[2019-03-18T00:00:00.000-00:00]: 3973.06,3967.01,3897.55,3784.63,3721.64
[2019-03-25T00:00:00.000-00:00]: 4093.12,3973.06,3967.01,3897.55,3784.63
[2019-04-01T00:00:00.000-00:00]: 5192.3,4093.12,3973.06,3967.01,3897.55
[2019-04-08T00:00:00.000-00:00]: 5192.3,5161.56,4093.12,3973.06,3967.01
[2019-04-15T00:00:00.000-00:00]: 5297.0,5192.3,5161.56,4093.12,3973.06`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE + EVERY', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let b = array.slice(a, 0, 5);

            let res = b.every();

            return { b, res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const b = JSON.stringify(result.b[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const res = result.res[i];

            plotdata_str += `[${str_time}]: ${b} ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN] false
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN, NaN] false
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN, NaN] false
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27, NaN] false
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49, 3199.27] true
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66, 3953.49] true
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13, 3821.66] true
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21, 4039.13] true
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79, 3509.21] true
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36, 3535.79] true
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46, 3531.36] true
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57, 3413.46] true
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54, 3651.57] true
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64, 3628.54] true
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63, 3721.64] true
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55, 3784.63] true
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01, 3897.55] true
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06, 3967.01] true
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12, 3973.06] true`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SLICE + SOME', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0, 0);
            for (let i = 0; i <= 9; i++) {
                array.push(a, close[i]);
            }
            let b = array.slice(a, 0, 5);

            let res = b.some();

            return { b, res };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const b = JSON.stringify(result.b[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const res = result.res[i];

            plotdata_str += `[${str_time}]: ${b} ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN] true
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN, NaN] true
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN, NaN] true
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27, NaN] true
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49, 3199.27] true
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66, 3953.49] true
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13, 3821.66] true
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21, 4039.13] true
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79, 3509.21] true
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36, 3535.79] true
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46, 3531.36] true
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57, 3413.46] true
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54, 3651.57] true
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64, 3628.54] true
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63, 3721.64] true
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55, 3784.63] true
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01, 3897.55] true
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06, 3967.01] true
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12, 3973.06] true`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
