import { describe, expect, it } from 'vitest';
import { arrayPrecision, getKlines, runNSFunctionWithArgs } from '../../utils';

import { Context, PineTS, Provider } from 'index';

describe('Technical Analysis - Edge Cases', () => {
    it('ta.lowest dynamic length ', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = `
//@version=6
indicator("ta.lowest dynamic length")       
len_series = bar_index % 2 == 0 ? 1 : 3

// Built-in ta.lowest with dynamic length
builtin_lowest = ta.lowest(close, len_series)

// Custom lowest implementation for comparison
custom_lowest(src, len) =>
    float min_val = na
    for i = 0 to math.max(1, len) - 1
        if na(min_val) or (not na(src[i]) and src[i] < min_val)
            min_val := src[i]
    min_val

custom_lowest_val = custom_lowest(close, len_series)

plot(close, "close")
plot(len_series, "length")
plot(builtin_lowest, "builtin")
plot(custom_lowest_val, "custom")        
`;

        const { result, plots } = await pineTS.run(sourceCode);

        let _close = plots['close']?.data;
        let _len_series = plots['length']?.data;
        let _builtin_lowest = plots['builtin']?.data;
        let _custom_lowest = plots['custom']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-03-10').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _close.length; i++) {
            const time = _close[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const _close_val = _close[i].value;
            const _len_series_val = _len_series[i].value;
            const _builtin_lowest_val = _builtin_lowest[i].value;
            const _custom_lowest_val = _custom_lowest[i].value;

            plotdata_str += `[${str_time}]: ${_close_val} ${_len_series_val} ${_builtin_lowest_val} ${_custom_lowest_val}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 1 3199.27 3199.27
[2018-12-17T00:00:00.000-00:00]: 3953.49 3 NaN 3199.27
[2018-12-24T00:00:00.000-00:00]: 3821.66 1 3821.66 3821.66
[2018-12-31T00:00:00.000-00:00]: 4039.13 3 3821.66 3821.66
[2019-01-07T00:00:00.000-00:00]: 3509.21 1 3509.21 3509.21
[2019-01-14T00:00:00.000-00:00]: 3535.79 3 3509.21 3509.21
[2019-01-21T00:00:00.000-00:00]: 3531.36 1 3531.36 3531.36
[2019-01-28T00:00:00.000-00:00]: 3413.46 3 3413.46 3413.46
[2019-02-04T00:00:00.000-00:00]: 3651.57 1 3651.57 3651.57
[2019-02-11T00:00:00.000-00:00]: 3628.54 3 3413.46 3413.46
[2019-02-18T00:00:00.000-00:00]: 3721.64 1 3721.64 3721.64
[2019-02-25T00:00:00.000-00:00]: 3784.63 3 3628.54 3628.54
[2019-03-04T00:00:00.000-00:00]: 3897.55 1 3897.55 3897.55`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('passing series as argument', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = `
//@version=6
indicator('nz() parser bug reproduction')

a = close
b = 1

// Option 1: Using intermediate variable to hold a[b] (Works correctly)
c1 = a[b]
c_inter = nz(c1, a)

// Option 2: Inline indexing a[b] directly inside nz() (Fails to parse correct index)
c_direct = nz(a[b], a)

plot(c_inter, "inter")
plot(c_direct, "direct")
     
`;

        const { result, plots } = await pineTS.run(sourceCode);

        let _inter = plots['inter']?.data;
        let _direct = plots['direct']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-03-10').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _inter.length; i++) {
            const time = _inter[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const _inter_val = _inter[i].value;
            const _direct_val = _direct[i].value;

            plotdata_str += `[${str_time}]: ${_inter_val} ${_direct_val}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 3199.27 3199.27
[2018-12-17T00:00:00.000-00:00]: 3199.27 3199.27
[2018-12-24T00:00:00.000-00:00]: 3953.49 3953.49
[2018-12-31T00:00:00.000-00:00]: 3821.66 3821.66
[2019-01-07T00:00:00.000-00:00]: 4039.13 4039.13
[2019-01-14T00:00:00.000-00:00]: 3509.21 3509.21
[2019-01-21T00:00:00.000-00:00]: 3535.79 3535.79
[2019-01-28T00:00:00.000-00:00]: 3531.36 3531.36
[2019-02-04T00:00:00.000-00:00]: 3413.46 3413.46
[2019-02-11T00:00:00.000-00:00]: 3651.57 3651.57
[2019-02-18T00:00:00.000-00:00]: 3628.54 3628.54
[2019-02-25T00:00:00.000-00:00]: 3721.64 3721.64
[2019-03-04T00:00:00.000-00:00]: 3784.63 3784.63`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
