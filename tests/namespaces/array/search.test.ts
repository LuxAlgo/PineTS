import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from 'index';

describe('Array Search & Lookup', () => {
    it('INCLUDES, INDEXOF, LASTINDEXOF', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume, open } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(5, high);
            let p = close;
            if (array.includes(a, high)) {
                p = open;
            }
            let i = a.indexof(high);
            let li = array.lastindexof(a, high);
            let res = p;

            return { a, i, li, res };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];

            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const _i = result.i[i];
            const li = result.li[i];
            const res = result.res[i];

            plotdata_str += `[${str_time}]: ${a} ${_i} ${li} ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3312.32, 3312.32, 3312.32, 3312.32, 3312.32] 0 4 3200
[2018-12-17T00:00:00.000-00:00]: [4170, 4170, 4170, 4170, 4170] 0 4 3192.69
[2018-12-24T00:00:00.000-00:00]: [4299, 4299, 4299, 4299, 4299] 0 4 3948.01
[2018-12-31T00:00:00.000-00:00]: [4080, 4080, 4080, 4080, 4080] 0 4 3832.27
[2019-01-07T00:00:00.000-00:00]: [4110.5, 4110.5, 4110.5, 4110.5, 4110.5] 0 4 4039
[2019-01-14T00:00:00.000-00:00]: [3748, 3748, 3748, 3748, 3748] 0 4 3511.94
[2019-01-21T00:00:00.000-00:00]: [3660.86, 3660.86, 3660.86, 3660.86, 3660.86] 0 4 3535.89
[2019-01-28T00:00:00.000-00:00]: [3648.89, 3648.89, 3648.89, 3648.89, 3648.89] 0 4 3527.66
[2019-02-04T00:00:00.000-00:00]: [3721.3, 3721.3, 3721.3, 3721.3, 3721.3] 0 4 3413.24
[2019-02-11T00:00:00.000-00:00]: [3652.61, 3652.61, 3652.61, 3652.61, 3652.61] 0 4 3651.57
[2019-02-18T00:00:00.000-00:00]: [4184.27, 4184.27, 4184.27, 4184.27, 4184.27] 0 4 3628.54
[2019-02-25T00:00:00.000-00:00]: [3880, 3880, 3880, 3880, 3880] 0 4 3730.78
[2019-03-04T00:00:00.000-00:00]: [3949.99, 3949.99, 3949.99, 3949.99, 3949.99] 0 4 3784.63
[2019-03-11T00:00:00.000-00:00]: [4046.34, 4046.34, 4046.34, 4046.34, 4046.34] 0 4 3900.31
[2019-03-18T00:00:00.000-00:00]: [4053.15, 4053.15, 4053.15, 4053.15, 4053.15] 0 4 3964.97
[2019-03-25T00:00:00.000-00:00]: [4130, 4130, 4130, 4130, 4130] 0 4 3970.64
[2019-04-01T00:00:00.000-00:00]: [5377.98, 5377.98, 5377.98, 5377.98, 5377.98] 0 4 4095.99
[2019-04-08T00:00:00.000-00:00]: [5469, 5469, 5469, 5469, 5469] 0 4 5197.14
[2019-04-15T00:00:00.000-00:00]: [5360, 5360, 5360, 5360, 5360] 0 4 5163.52`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('BINARY_SEARCH, BINARY_SEARCH_LEFTMOST, BINARY_SEARCH_RIGHTMOST', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume, open } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.from(5, -2, 0, 9, 1, -5, 6, 8, 4);
            array.sort(a); // [-2, 0, 1, 5, 9]
            let p = array.binary_search(a, 0); // 1
            let plm = array.binary_search_leftmost(a, 3);
            let prm = array.binary_search_rightmost(a, 3);
            let res = [p, plm, prm];

            return { a, res, p, plm, prm };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];

            const res = result.res[i];
            const p = result.p[i];
            const plm = result.plm[i];
            const prm = result.prm[i];

            plotdata_str += `[${str_time}]: ${p} ${plm} ${prm}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 2 3 4
[2018-12-17T00:00:00.000-00:00]: 2 3 4
[2018-12-24T00:00:00.000-00:00]: 2 3 4
[2018-12-31T00:00:00.000-00:00]: 2 3 4
[2019-01-07T00:00:00.000-00:00]: 2 3 4
[2019-01-14T00:00:00.000-00:00]: 2 3 4
[2019-01-21T00:00:00.000-00:00]: 2 3 4
[2019-01-28T00:00:00.000-00:00]: 2 3 4
[2019-02-04T00:00:00.000-00:00]: 2 3 4
[2019-02-11T00:00:00.000-00:00]: 2 3 4
[2019-02-18T00:00:00.000-00:00]: 2 3 4
[2019-02-25T00:00:00.000-00:00]: 2 3 4
[2019-03-04T00:00:00.000-00:00]: 2 3 4
[2019-03-11T00:00:00.000-00:00]: 2 3 4
[2019-03-18T00:00:00.000-00:00]: 2 3 4
[2019-03-25T00:00:00.000-00:00]: 2 3 4
[2019-04-01T00:00:00.000-00:00]: 2 3 4
[2019-04-08T00:00:00.000-00:00]: 2 3 4
[2019-04-15T00:00:00.000-00:00]: 2 3 4`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
