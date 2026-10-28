import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from 'index';

describe('Array Creation', () => {
    it('NEW', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);

        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(10, close);
            const size = array.size(arr);

            return {
                size,
            };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const part_size = result.size.reverse().slice(0, 5);
        const expected_size = [10, 10, 10, 10, 10];

        expect(part_size).toEqual(expected_size);
    });

    it('FROM, COPY', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume, open } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(3, close);
            let b = array.copy(a);
            a = array.new_float(3, open);

            return { a, b };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];

            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const b = JSON.stringify(result.b[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');

            plotdata_str += `[${str_time}]: ${a} ${b}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3200, 3200, 3200] [3199.27, 3199.27, 3199.27]
[2018-12-17T00:00:00.000-00:00]: [3192.69, 3192.69, 3192.69] [3953.49, 3953.49, 3953.49]
[2018-12-24T00:00:00.000-00:00]: [3948.01, 3948.01, 3948.01] [3821.66, 3821.66, 3821.66]
[2018-12-31T00:00:00.000-00:00]: [3832.27, 3832.27, 3832.27] [4039.13, 4039.13, 4039.13]
[2019-01-07T00:00:00.000-00:00]: [4039, 4039, 4039] [3509.21, 3509.21, 3509.21]
[2019-01-14T00:00:00.000-00:00]: [3511.94, 3511.94, 3511.94] [3535.79, 3535.79, 3535.79]
[2019-01-21T00:00:00.000-00:00]: [3535.89, 3535.89, 3535.89] [3531.36, 3531.36, 3531.36]
[2019-01-28T00:00:00.000-00:00]: [3527.66, 3527.66, 3527.66] [3413.46, 3413.46, 3413.46]
[2019-02-04T00:00:00.000-00:00]: [3413.24, 3413.24, 3413.24] [3651.57, 3651.57, 3651.57]
[2019-02-11T00:00:00.000-00:00]: [3651.57, 3651.57, 3651.57] [3628.54, 3628.54, 3628.54]
[2019-02-18T00:00:00.000-00:00]: [3628.54, 3628.54, 3628.54] [3721.64, 3721.64, 3721.64]
[2019-02-25T00:00:00.000-00:00]: [3730.78, 3730.78, 3730.78] [3784.63, 3784.63, 3784.63]
[2019-03-04T00:00:00.000-00:00]: [3784.63, 3784.63, 3784.63] [3897.55, 3897.55, 3897.55]
[2019-03-11T00:00:00.000-00:00]: [3900.31, 3900.31, 3900.31] [3967.01, 3967.01, 3967.01]
[2019-03-18T00:00:00.000-00:00]: [3964.97, 3964.97, 3964.97] [3973.06, 3973.06, 3973.06]
[2019-03-25T00:00:00.000-00:00]: [3970.64, 3970.64, 3970.64] [4093.12, 4093.12, 4093.12]
[2019-04-01T00:00:00.000-00:00]: [4095.99, 4095.99, 4095.99] [5192.3, 5192.3, 5192.3]
[2019-04-08T00:00:00.000-00:00]: [5197.14, 5197.14, 5197.14] [5161.56, 5161.56, 5161.56]
[2019-04-15T00:00:00.000-00:00]: [5163.52, 5163.52, 5163.52] [5297, 5297, 5297]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
