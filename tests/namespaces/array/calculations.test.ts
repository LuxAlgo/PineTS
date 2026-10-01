import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from 'index';

describe('Array Calculations & Statistics', () => {
    it('AVG, VARIANCE', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);

        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(10, close);
            array.set(arr, 1, 99);

            const avg = array.avg(arr);
            const variance = array.variance(arr, false);
            const variance_biased = array.variance(arr);

            return {
                avg,
                variance,
                variance_biased,
            };
        });

        const part_avg = result.avg.reverse().slice(0, 5);
        const part_variance = result.variance.reverse().slice(0, 5);
        const part_variance_biased = result.variance_biased.reverse().slice(0, 5);

        const expected_avg = [91208.313, 85100.454, 88537.149, 84374.28, 85677.543];
        const expected_variance = [1024803322.8804907, 892005824.9523604, 965593357.8452101, 876829977.664, 904158891.6052902];
        const expected_variance_biased = [922322990.5924416, 802805242.4571244, 869034022.0606892, 789146979.8976, 813743002.4447612];

        expect(part_avg).toEqual(expected_avg);
        // Values around 1e9 carry float noise in their last digit; compare to 2 decimals (~5e-12 relative).
        part_variance.forEach((v, i) => expect(v).toBeCloseTo(expected_variance[i], 2));
        part_variance_biased.forEach((v, i) => expect(v).toBeCloseTo(expected_variance_biased[i], 2));
    });

    it('AVG, VARIANCE from Array Object', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);

        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(10, close);
            arr.set(1, 99);

            const avg = arr.avg();
            const variance = arr.variance(false);
            const variance_biased = arr.variance();

            return {
                avg,
                variance,
                variance_biased,
            };
        });

        const part_avg = result.avg.reverse().slice(0, 5);
        const part_variance = result.variance.reverse().slice(0, 5);
        const part_variance_biased = result.variance_biased.reverse().slice(0, 5);

        const expected_avg = [91208.313, 85100.454, 88537.149, 84374.28, 85677.543];
        const expected_variance = [1024803322.8804907, 892005824.9523604, 965593357.8452101, 876829977.664, 904158891.6052902];
        const expected_variance_biased = [922322990.5924416, 802805242.4571244, 869034022.0606892, 789146979.8976, 813743002.4447612];

        expect(part_avg).toEqual(expected_avg);
        // Values around 1e9 carry float noise in their last digit; compare to 2 decimals (~5e-12 relative).
        part_variance.forEach((v, i) => expect(v).toBeCloseTo(expected_variance[i], 2));
        part_variance_biased.forEach((v, i) => expect(v).toBeCloseTo(expected_variance_biased[i], 2));
    });

    it('SUM, STDEV', async () => {
        //const pineTS = new PineTS(Provider.Mock, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());
        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(5, close);
            array.set(arr, 1, 99);

            const sum = array.sum(arr);
            const stdev = array.stdev(arr, false);
            const stdev_biased = array.stdev(arr);

            return {
                sum,
                stdev,
                stdev_biased,
            };
        });

        const part_sum = result.sum;
        const part_stdev = result.stdev;
        const part_stdev_biased = result.stdev_biased;

        const expected_sum = [
            12896.08, 15912.96, 15385.64, 16255.52, 14135.84, 14242.16, 14224.44, 13752.84, 14705.28, 14613.16, 14985.56, 15237.52, 15689.2, 15967.04,
            15991.24, 16471.48, 20868.2, 20745.24, 21287,
        ];
        const expected_stdev = [
            1386.4828937207, 1723.7803317186, 1664.8241634239, 1762.0797040372, 1525.0922755099, 1536.9792128783, 1534.9980566502, 1482.2715737408,
            1588.7576029653, 1578.4582738609, 1620.093859602, 1648.2638439825, 1698.7632031864, 1729.8266595298, 1732.5323017826, 1786.2247660583,
            2277.7930059599, 2264.0456600343, 2324.6162694088,
        ];
        const expected_stdev_biased = [
            1240.108, 1541.796, 1489.064, 1576.052, 1364.084, 1374.716, 1372.944, 1325.784, 1421.028, 1411.816, 1449.056, 1474.252, 1519.42, 1547.204,
            1549.624, 1597.648, 2037.32, 2025.024, 2079.2,
        ];

        expect(part_sum).toEqual(expected_sum);
        expect(part_stdev).toEqual(expected_stdev);
        expect(part_stdev_biased).toEqual(expected_stdev_biased);
    });

    it('SUM, STDEV from Array Object', async () => {
        //const pineTS = new PineTS(Provider.Mock, 'BTCUSDT', 'W', 500, 0, new Date('Jan 20 2025').getTime() - 1);
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());
        const { result } = await pineTS.run((context) => {
            const array = context.array;
            const { close } = context.data;

            const arr = array.new(5, close);
            arr.set(1, 99);

            const sum = arr.sum();
            const stdev = arr.stdev(false);
            const stdev_biased = arr.stdev();

            return {
                sum,
                stdev,
                stdev_biased,
            };
        });

        const part_sum = result.sum;
        const part_stdev = result.stdev;
        const part_stdev_biased = result.stdev_biased;

        const expected_sum = [
            12896.08, 15912.96, 15385.64, 16255.52, 14135.84, 14242.16, 14224.44, 13752.84, 14705.28, 14613.16, 14985.56, 15237.52, 15689.2, 15967.04,
            15991.24, 16471.48, 20868.2, 20745.24, 21287,
        ];
        const expected_stdev = [
            1386.4828937207, 1723.7803317186, 1664.8241634239, 1762.0797040372, 1525.0922755099, 1536.9792128783, 1534.9980566502, 1482.2715737408,
            1588.7576029653, 1578.4582738609, 1620.093859602, 1648.2638439825, 1698.7632031864, 1729.8266595298, 1732.5323017826, 1786.2247660583,
            2277.7930059599, 2264.0456600343, 2324.6162694088,
        ];
        const expected_stdev_biased = [
            1240.108, 1541.796, 1489.064, 1576.052, 1364.084, 1374.716, 1372.944, 1325.784, 1421.028, 1411.816, 1449.056, 1474.252, 1519.42, 1547.204,
            1549.624, 1597.648, 2037.32, 2025.024, 2079.2,
        ];

        expect(part_sum).toEqual(expected_sum);
        expect(part_stdev).toEqual(expected_stdev);
        expect(part_stdev_biased).toEqual(expected_stdev_biased);
    });

    it('MEDIAN, MODE, STANDARDIZE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math, array, na } = context.pine;

            //let val = na;
            //val = na(val[1]) ? 1 : val[1] + 0.1;

            let arr = array.new(5, close);

            let median = array.median(arr);
            let mode = array.mode(arr);
            let standardize = array.standardize(arr);
            return { median, mode, standardize };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const median = result.median[i];
            const mode = result.mode[i];
            const standardize = JSON.stringify(result.standardize[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            plotdata_str += `[${str_time}]: ${median} ${mode} ${standardize}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 3199.27 [1, 1, 1, 1, 1]
[2018-12-17T00:00:00.000-00:00]: 3953.49 3953.49 [0, 0, 0, 0, 0]
[2018-12-24T00:00:00.000-00:00]: 3821.66 3821.66 [0, 0, 0, 0, 0]
[2018-12-31T00:00:00.000-00:00]: 4039.13 4039.13 [NaN, NaN, NaN, NaN, NaN]
[2019-01-07T00:00:00.000-00:00]: 3509.21 3509.21 [1, 1, 1, 1, 1]
[2019-01-14T00:00:00.000-00:00]: 3535.79 3535.79 [1, 1, 1, 1, 1]
[2019-01-21T00:00:00.000-00:00]: 3531.36 3531.36 [0, 0, 0, 0, 0]
[2019-01-28T00:00:00.000-00:00]: 3413.46 3413.46 [1, 1, 1, 1, 1]
[2019-02-04T00:00:00.000-00:00]: 3651.57 3651.57 [NaN, NaN, NaN, NaN, NaN]
[2019-02-11T00:00:00.000-00:00]: 3628.54 3628.54 [1, 1, 1, 1, 1]
[2019-02-18T00:00:00.000-00:00]: 3721.64 3721.64 [NaN, NaN, NaN, NaN, NaN]
[2019-02-25T00:00:00.000-00:00]: 3784.63 3784.63 [NaN, NaN, NaN, NaN, NaN]
[2019-03-04T00:00:00.000-00:00]: 3897.55 3897.55 [1, 1, 1, 1, 1]
[2019-03-11T00:00:00.000-00:00]: 3967.01 3967.01 [NaN, NaN, NaN, NaN, NaN]
[2019-03-18T00:00:00.000-00:00]: 3973.06 3973.06 [NaN, NaN, NaN, NaN, NaN]
[2019-03-25T00:00:00.000-00:00]: 4093.12 4093.12 [1, 1, 1, 1, 1]
[2019-04-01T00:00:00.000-00:00]: 5192.3 5192.3 [1, 1, 1, 1, 1]
[2019-04-08T00:00:00.000-00:00]: 5161.56 5161.56 [1, 1, 1, 1, 1]
[2019-04-15T00:00:00.000-00:00]: 5297 5297 [1, 1, 1, 1, 1]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('STDEV', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 3; i++) {
                array.push(a, close[i]);
            }
            let stdev = array.stdev(a);

            return { a, stdev };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const stdev = result.stdev[i];

            plotdata_str += `[${str_time}]: ${a} ${stdev}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN] 0
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN] 377.11
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN] 328.9032734204
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27] 329.1645199877
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49] 201.2199491073
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66] 218.1617402726
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13] 222.6563325368
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21] 49.5289342203
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79] 84.2008344674
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36] 93.9684009056
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46] 115.1190923294
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57] 61.3109837223
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54] 97.8075510889
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64] 95.5106628537
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63] 75.8626678199
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55] 70.3246110903
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01] 513.9572679404
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06] 573.5960297108
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12] 489.2174102329`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('AVG', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 3; i++) {
                array.push(a, close[i]);
            }
            let avg = array.avg(a);

            return { a, avg };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const avg = result.avg[i];

            plotdata_str += `[${str_time}]: ${a} ${avg}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN] 3199.27
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN] 3576.38
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN] 3658.14
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27] 3753.3875
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49] 3830.8725
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66] 3726.4475
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13] 3653.8725
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21] 3497.455
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79] 3533.045
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36] 3556.2325
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46] 3603.8025
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57] 3696.595
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54] 3758.09
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64] 3842.7075
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63] 3905.5625
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55] 3982.685
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01] 4306.3725
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06] 4605.01
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12] 4935.995`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('VARIANCE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 3; i++) {
                array.push(a, close[i] * 0.0001);
            }
            let variance = array.variance(a);
            let variance_unbiased = array.variance(a, false);

            return { a, variance, variance_unbiased };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const variance = result.variance[i];
            const variance_unbiased = result.variance_unbiased[i];

            plotdata_str += `[${str_time}]: ${variance} ${variance_unbiased}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 0 NaN
[2018-12-17T00:00:00.000-00:00]: 0.0014221195 0.002844239
[2018-12-24T00:00:00.000-00:00]: 0.0010817736 0.0016226604
[2018-12-31T00:00:00.000-00:00]: 0.0010834928 0.0014446571
[2019-01-07T00:00:00.000-00:00]: 0.0004048947 0.0005398596
[2019-01-14T00:00:00.000-00:00]: 0.0004759454 0.0006345939
[2019-01-21T00:00:00.000-00:00]: 0.0004957584 0.0006610112
[2019-01-28T00:00:00.000-00:00]: 0.0000245312 0.0000327082
[2019-02-04T00:00:00.000-00:00]: 0.0000708978 0.0000945304
[2019-02-11T00:00:00.000-00:00]: 0.0000883006 0.0001177341
[2019-02-18T00:00:00.000-00:00]: 0.0001325241 0.0001766987
[2019-02-25T00:00:00.000-00:00]: 0.0000375904 0.0000501205
[2019-03-04T00:00:00.000-00:00]: 0.0000956632 0.0001275509
[2019-03-11T00:00:00.000-00:00]: 0.0000912229 0.0001216305
[2019-03-18T00:00:00.000-00:00]: 0.0000575514 0.0000767353
[2019-03-25T00:00:00.000-00:00]: 0.0000494555 0.0000659407
[2019-04-01T00:00:00.000-00:00]: 0.0026415207 0.0035220276
[2019-04-08T00:00:00.000-00:00]: 0.0032901241 0.0043868321
[2019-04-15T00:00:00.000-00:00]: 0.0023933367 0.0031911157`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('COVARIANCE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            let b = array.new_float(0);
            for (let i = 0; i <= 3; i++) {
                array.push(a, close[i]);
                array.push(b, open[i]);
            }
            let covariance = array.covariance(a, b);
            let covariance_unbiased = array.covariance(a, b, false);

            return { a, b, covariance, covariance_unbiased };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const b = JSON.stringify(result.b[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const covariance = result.covariance[i];
            const covariance_unbiased = result.covariance_unbiased[i];

            plotdata_str += `[${str_time}]: ${covariance} ${covariance_unbiased}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 0 NaN
[2018-12-17T00:00:00.000-00:00]: -1378.33705 -2756.6741
[2018-12-24T00:00:00.000-00:00]: 40051.8622333333 60077.79335
[2018-12-31T00:00:00.000-00:00]: 57568.04348125 76757.3913083334
[2019-01-07T00:00:00.000-00:00]: -36496.81100625 -48662.414675
[2019-01-14T00:00:00.000-00:00]: 6795.9258375 9061.23445
[2019-01-21T00:00:00.000-00:00]: 11057.3858375 14743.1811166667
[2019-01-28T00:00:00.000-00:00]: 1421.8034125 1895.7378833333
[2019-02-04T00:00:00.000-00:00]: -3404.6623625 -4539.5498166667
[2019-02-11T00:00:00.000-00:00]: -538.398775 -717.8650333333
[2019-02-18T00:00:00.000-00:00]: 2371.77831875 3162.3710916667
[2019-02-25T00:00:00.000-00:00]: 4281.8185625 5709.0914166667
[2019-03-04T00:00:00.000-00:00]: 5374.556125 7166.0748333333
[2019-03-11T00:00:00.000-00:00]: 9101.0531625 12134.73755
[2019-03-18T00:00:00.000-00:00]: 6448.24026875 8597.6536916666
[2019-03-25T00:00:00.000-00:00]: 4248.2394625 5664.3192833333
[2019-04-01T00:00:00.000-00:00]: 34202.06465625 45602.752875
[2019-04-08T00:00:00.000-00:00]: 189952.1332500002 253269.5110000002
[2019-04-15T00:00:00.000-00:00]: 184854.7371625001 246472.9828833335`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('RANGE', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 3; i++) {
                array.push(a, close[i]);
            }
            let range = array.range(a);

            return { a, range };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const range = result.range[i];

            plotdata_str += `[${str_time}]: ${range}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 0
[2018-12-17T00:00:00.000-00:00]: 754.22
[2018-12-24T00:00:00.000-00:00]: 754.22
[2018-12-31T00:00:00.000-00:00]: 839.86
[2019-01-07T00:00:00.000-00:00]: 529.92
[2019-01-14T00:00:00.000-00:00]: 529.92
[2019-01-21T00:00:00.000-00:00]: 529.92
[2019-01-28T00:00:00.000-00:00]: 122.33
[2019-02-04T00:00:00.000-00:00]: 238.11
[2019-02-11T00:00:00.000-00:00]: 238.11
[2019-02-18T00:00:00.000-00:00]: 308.18
[2019-02-25T00:00:00.000-00:00]: 156.09
[2019-03-04T00:00:00.000-00:00]: 269.01
[2019-03-11T00:00:00.000-00:00]: 245.37
[2019-03-18T00:00:00.000-00:00]: 188.43
[2019-03-25T00:00:00.000-00:00]: 195.57
[2019-04-01T00:00:00.000-00:00]: 1225.29
[2019-04-08T00:00:00.000-00:00]: 1219.24
[2019-04-15T00:00:00.000-00:00]: 1203.88`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('percentrank', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 10; i++) {
                array.push(a, close[i]);
            }
            let percentrank = array.percentrank(a, 3);

            return { a, percentrank };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const percentrank = result.percentrank[i];

            plotdata_str += `[${str_time}]: ${a} ${percentrank}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN] 0
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN] 30
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN] 30
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN] 60
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN] 20
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN] 40
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN] 30
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27] 10
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49] 50
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66] 40
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13] 60
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21] 70
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79] 70
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36] 70
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46] 70
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57] 70`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('percentile_linear_interpolation', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 10; i++) {
                array.push(a, close[i]);
            }
            let percentile_linear_interpolation = array.percentile_linear_interpolation(a, 30);

            return { a, percentile_linear_interpolation };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const percentile_linear_interpolation = result.percentile_linear_interpolation[i];

            plotdata_str += `[${str_time}]: ${a} ${percentile_linear_interpolation}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN] NaN
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN] NaN
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN] NaN
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN] NaN
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN] NaN
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27] 3526.93
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49] 3534.904
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66] 3534.904
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13] 3534.904
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21] 3534.904
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79] 3609.99
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36] 3646.964
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46] 3707.626
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57] 3772.032`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('percentile_nearest_rank', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-04-20').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { na, plotchar, math, array } = context.pine;

            let a = array.new_float(0);
            for (let i = 0; i <= 10; i++) {
                array.push(a, close[i]);
            }
            let percentile_nearest_rank = array.percentile_nearest_rank(a, 30);

            return { a, percentile_nearest_rank };
        };

        const { result, data } = await pineTS.run(sourceCode);

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const a = JSON.stringify(result.a[i].array).replace(/null/g, 'NaN').replace(/,/g, ', ');
            const percentile_nearest_rank = result.percentile_nearest_rank[i];

            plotdata_str += `[${str_time}]: ${a} ${percentile_nearest_rank}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-17T00:00:00.000-00:00]: [3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-24T00:00:00.000-00:00]: [3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN] NaN
[2018-12-31T00:00:00.000-00:00]: [4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN, NaN] 4039.13
[2019-01-07T00:00:00.000-00:00]: [3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN, NaN] 3953.49
[2019-01-14T00:00:00.000-00:00]: [3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN, NaN] 3821.66
[2019-01-21T00:00:00.000-00:00]: [3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN, NaN] 3535.79
[2019-01-28T00:00:00.000-00:00]: [3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN, NaN] 3531.36
[2019-02-04T00:00:00.000-00:00]: [3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN, NaN] 3531.36
[2019-02-11T00:00:00.000-00:00]: [3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27, NaN] 3531.36
[2019-02-18T00:00:00.000-00:00]: [3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49, 3199.27] 3531.36
[2019-02-25T00:00:00.000-00:00]: [3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66, 3953.49] 3535.79
[2019-03-04T00:00:00.000-00:00]: [3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13, 3821.66] 3535.79
[2019-03-11T00:00:00.000-00:00]: [3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21, 4039.13] 3535.79
[2019-03-18T00:00:00.000-00:00]: [3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79, 3509.21] 3535.79
[2019-03-25T00:00:00.000-00:00]: [4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36, 3535.79] 3628.54
[2019-04-01T00:00:00.000-00:00]: [5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46, 3531.36] 3651.57
[2019-04-08T00:00:00.000-00:00]: [5161.56, 5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57, 3413.46] 3721.64
[2019-04-15T00:00:00.000-00:00]: [5297, 5161.56, 5192.3, 4093.12, 3973.06, 3967.01, 3897.55, 3784.63, 3721.64, 3628.54, 3651.57] 3784.63`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
