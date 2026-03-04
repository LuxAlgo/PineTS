import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { Provider } from '@pinets/marketData/Provider.class';

describe('Request ', () => {
    it('request.security higher timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const context = await pineTS.run((context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = request.security('BTCUSDC', 'W', close, false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });
        const { result, plots } = context;

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: 112224.95
[2025-10-02T00:00:00.000-00:00]: 112224.95
[2025-10-03T00:00:00.000-00:00]: 112224.95
[2025-10-04T00:00:00.000-00:00]: 112224.95
[2025-10-05T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 123529.91
[2025-10-07T00:00:00.000-00:00]: 123529.91
[2025-10-08T00:00:00.000-00:00]: 123529.91
[2025-10-09T00:00:00.000-00:00]: 123529.91
[2025-10-10T00:00:00.000-00:00]: 123529.91`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security expression higher timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2024-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            const res = await request.security('BTCUSDC', 'W', ta.sma(close, 14), false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        let plotdata = plots['_plotchar']?.data;
        const sDate = new Date('2025-10-01').getTime();
        const eDate = new Date('2025-10-10').getTime();
        plotdata = plotdata.filter((e) => new Date(e.time).getTime() >= sDate && new Date(e.time).getTime() <= eDate);
        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: 114312.2842857143
[2025-10-02T00:00:00.000-00:00]: 114312.2842857143
[2025-10-03T00:00:00.000-00:00]: 114312.2842857143
[2025-10-04T00:00:00.000-00:00]: 114312.2842857143
[2025-10-05T00:00:00.000-00:00]: 115394.2778571428
[2025-10-06T00:00:00.000-00:00]: 115394.2778571428
[2025-10-07T00:00:00.000-00:00]: 115394.2778571428
[2025-10-08T00:00:00.000-00:00]: 115394.2778571428
[2025-10-09T00:00:00.000-00:00]: 115394.2778571428
[2025-10-10T00:00:00.000-00:00]: 115394.2778571428`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('request.security higher timeframe lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, false, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: 123529.91
[2025-10-02T00:00:00.000-00:00]: 123529.91
[2025-10-03T00:00:00.000-00:00]: 123529.91
[2025-10-04T00:00:00.000-00:00]: 123529.91
[2025-10-05T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-07T00:00:00.000-00:00]: 115073.27
[2025-10-08T00:00:00.000-00:00]: 115073.27
[2025-10-09T00:00:00.000-00:00]: 115073.27
[2025-10-10T00:00:00.000-00:00]: 115073.27`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security higher timeframe gaps=true lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, true, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: NaN
[2025-10-02T00:00:00.000-00:00]: NaN
[2025-10-03T00:00:00.000-00:00]: NaN
[2025-10-04T00:00:00.000-00:00]: NaN
[2025-10-05T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: NaN
[2025-10-07T00:00:00.000-00:00]: NaN
[2025-10-08T00:00:00.000-00:00]: NaN
[2025-10-09T00:00:00.000-00:00]: NaN
[2025-10-10T00:00:00.000-00:00]: NaN`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('request.security higher timeframe gaps=true lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, true, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: NaN
[2025-10-02T00:00:00.000-00:00]: NaN
[2025-10-03T00:00:00.000-00:00]: NaN
[2025-10-04T00:00:00.000-00:00]: NaN
[2025-10-05T00:00:00.000-00:00]: NaN
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-07T00:00:00.000-00:00]: NaN
[2025-10-08T00:00:00.000-00:00]: NaN
[2025-10-09T00:00:00.000-00:00]: NaN
[2025-10-10T00:00:00.000-00:00]: NaN`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 119327.1
[2025-08-11T00:00:00.000-00:00]: 117490
[2025-08-18T00:00:00.000-00:00]: 113491.2
[2025-08-25T00:00:00.000-00:00]: 108270.38
[2025-09-01T00:00:00.000-00:00]: 111144.4
[2025-09-08T00:00:00.000-00:00]: 115343
[2025-09-15T00:00:00.000-00:00]: 115314.26
[2025-09-22T00:00:00.000-00:00]: 112224.95
[2025-09-29T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-13T00:00:00.000-00:00]: 108689.01
[2025-10-20T00:00:00.000-00:00]: 114574.42
[2025-10-27T00:00:00.000-00:00]: 110550.87
[2025-11-03T00:00:00.000-00:00]: 104710.22
[2025-11-10T00:00:00.000-00:00]: 94205.71`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, false, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 119327.1
[2025-08-11T00:00:00.000-00:00]: 117490
[2025-08-18T00:00:00.000-00:00]: 113491.2
[2025-08-25T00:00:00.000-00:00]: 108270.38
[2025-09-01T00:00:00.000-00:00]: 111144.4
[2025-09-08T00:00:00.000-00:00]: 115343
[2025-09-15T00:00:00.000-00:00]: 115314.26
[2025-09-22T00:00:00.000-00:00]: 112224.95
[2025-09-29T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-13T00:00:00.000-00:00]: 108689.01
[2025-10-20T00:00:00.000-00:00]: 114574.42
[2025-10-27T00:00:00.000-00:00]: 110550.87
[2025-11-03T00:00:00.000-00:00]: 104710.22
[2025-11-10T00:00:00.000-00:00]: 106036.45`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security expression lower timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2024-01-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            const res = await request.security('BTCUSDC', '240', ta.sma(close, 14), false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        let plotdata = plots['_plotchar']?.data;
        const sDate = new Date('2025-08-01').getTime();
        const eDate = new Date('2025-11-10').getTime();
        plotdata = plotdata.filter((e) => new Date(e.time).getTime() >= sDate && new Date(e.time).getTime() <= eDate);

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 117503.9371428573
[2025-08-11T00:00:00.000-00:00]: 117700.247857143
[2025-08-18T00:00:00.000-00:00]: 115035.0685714287
[2025-08-25T00:00:00.000-00:00]: 108663.1900000001
[2025-09-01T00:00:00.000-00:00]: 110879.487857143
[2025-09-08T00:00:00.000-00:00]: 115883.867857143
[2025-09-15T00:00:00.000-00:00]: 115704.3492857144
[2025-09-22T00:00:00.000-00:00]: 109812.3207142859
[2025-09-29T00:00:00.000-00:00]: 122824.1707142858
[2025-10-06T00:00:00.000-00:00]: 112576.9100000002
[2025-10-13T00:00:00.000-00:00]: 107396.0142857144
[2025-10-20T00:00:00.000-00:00]: 112058.2221428573
[2025-10-27T00:00:00.000-00:00]: 110233.457857143
[2025-11-03T00:00:00.000-00:00]: 102743.162857143
[2025-11-10T00:00:00.000-00:00]: 95456.6457142859`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security function lower timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2024-01-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open, high } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            function compute() {
                const a = open - close;
                const b = close - high;
                return [a, b];
            }

            const [res, data] = await request.security('BTCUSDC', '240', compute(), false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        let plotdata = plots['_plotchar']?.data;
        const sDate = new Date('2025-08-01').getTime();
        const eDate = new Date('2025-11-10').getTime();
        plotdata = plotdata.filter((e) => new Date(e.time).getTime() >= sDate && new Date(e.time).getTime() <= eDate);

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: -635.0600000000122
[2025-08-11T00:00:00.000-00:00]: 163.99000000000524
[2025-08-18T00:00:00.000-00:00]: -906.1699999999983
[2025-08-25T00:00:00.000-00:00]: 673.6199999999953
[2025-09-01T00:00:00.000-00:00]: 134.4200000000128
[2025-09-08T00:00:00.000-00:00]: 360.75999999999476
[2025-09-15T00:00:00.000-00:00]: 255.74000000000524
[2025-09-22T00:00:00.000-00:00]: -1849.4100000000035
[2025-09-29T00:00:00.000-00:00]: -884.5400000000081
[2025-10-06T00:00:00.000-00:00]: -650.6900000000023
[2025-10-13T00:00:00.000-00:00]: 266.09000000001106
[2025-10-20T00:00:00.000-00:00]: -964.3000000000029
[2025-10-27T00:00:00.000-00:00]: -369.2399999999907
[2025-11-03T00:00:00.000-00:00]: 89.69000000000233
[2025-11-10T00:00:00.000-00:00]: -217.9600000000064`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security tuple lower timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2024-01-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open, high } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            const c = close;
            const o = open;

            const [res, data] = await request.security('BTCUSDC', '240', [o, c], false, false); //<== working
            //const [res, data] = await request.security('BTCUSDC', '240', [open, close], false, false); //<== not working

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        let plotdata = plots['_plotchar']?.data;
        const sDate = new Date('2025-08-01').getTime();
        const eDate = new Date('2025-11-10').getTime();
        plotdata = plotdata.filter((e) => new Date(e.time).getTime() >= sDate && new Date(e.time).getTime() <= eDate);

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 118692.04
[2025-08-11T00:00:00.000-00:00]: 117653.99
[2025-08-18T00:00:00.000-00:00]: 112585.03
[2025-08-25T00:00:00.000-00:00]: 108944
[2025-09-01T00:00:00.000-00:00]: 111278.82
[2025-09-08T00:00:00.000-00:00]: 115703.76
[2025-09-15T00:00:00.000-00:00]: 115570
[2025-09-22T00:00:00.000-00:00]: 110375.54
[2025-09-29T00:00:00.000-00:00]: 122645.37
[2025-10-06T00:00:00.000-00:00]: 114422.58
[2025-10-13T00:00:00.000-00:00]: 108955.1
[2025-10-20T00:00:00.000-00:00]: 113610.12
[2025-10-27T00:00:00.000-00:00]: 110181.63
[2025-11-03T00:00:00.000-00:00]: 104799.91
[2025-11-10T00:00:00.000-00:00]: 93987.75`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe gaps=true lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, true, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 119327.1
[2025-08-11T00:00:00.000-00:00]: 117490
[2025-08-18T00:00:00.000-00:00]: 113491.2
[2025-08-25T00:00:00.000-00:00]: 108270.38
[2025-09-01T00:00:00.000-00:00]: 111144.4
[2025-09-08T00:00:00.000-00:00]: 115343
[2025-09-15T00:00:00.000-00:00]: 115314.26
[2025-09-22T00:00:00.000-00:00]: 112224.95
[2025-09-29T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-13T00:00:00.000-00:00]: 108689.01
[2025-10-20T00:00:00.000-00:00]: 114574.42
[2025-10-27T00:00:00.000-00:00]: 110550.87
[2025-11-03T00:00:00.000-00:00]: 104710.22
[2025-11-10T00:00:00.000-00:00]: 94205.71`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe gaps=true lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, true, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 114598.51
[2025-08-11T00:00:00.000-00:00]: 121731.99
[2025-08-18T00:00:00.000-00:00]: 115406.13
[2025-08-25T00:00:00.000-00:00]: 112902
[2025-09-01T00:00:00.000-00:00]: 107676.24
[2025-09-08T00:00:00.000-00:00]: 111055.99
[2025-09-15T00:00:00.000-00:00]: 115494.24
[2025-09-22T00:00:00.000-00:00]: 114740.51
[2025-09-29T00:00:00.000-00:00]: 111934.31
[2025-10-06T00:00:00.000-00:00]: 123916.17
[2025-10-13T00:00:00.000-00:00]: 114933.61
[2025-10-20T00:00:00.000-00:00]: 110171.78
[2025-10-27T00:00:00.000-00:00]: 114993.89
[2025-11-03T00:00:00.000-00:00]: 107952
[2025-11-10T00:00:00.000-00:00]: 106036.45`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security_lower_tf with data', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-05-06').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security_lower_tf('BTCUSDC', 'D', close);

            plotchar(res, '_plot');

            return {
                res,
            };
        });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-02-01').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = `[${_plotdata[i].value.join(', ')}]`;
            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [3183.47, 3199.27]
[2018-12-17T00:00:00.000-00:00]: [3494.65, 3670.11, 3676.32, 4074.68, 3842.2, 3981.71, 3953.49]
[2018-12-24T00:00:00.000-00:00]: [4032.5, 3780, 3814.07, 3591.91, 3885.33, 3730.62, 3821.66]
[2018-12-31T00:00:00.000-00:00]: [3692, 3827.72, 3887.77, 3783.23, 3817.75, 3805.01, 4039.13]
[2019-01-07T00:00:00.000-00:00]: [4008.23, 3989.01, 3996.75, 3626.85, 3631.15, 3616.15, 3509.21]
[2019-01-14T00:00:00.000-00:00]: [3668.88, 3584.22, 3610.24, 3648.46, 3610.08, 3682.09, 3535.79]
[2019-01-21T00:00:00.000-00:00]: [3526.19, 3576, 3552, 3569.25, 3562.19, 3552.93, 3531.36]
[2019-01-28T00:00:00.000-00:00]: [3427.21, 3395.47, 3436.51, 3409.39, 3432.26, 3465.05, 3413.46]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security_lower_tf with expression', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-05-06').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            const res = await request.security_lower_tf('BTCUSDC', 'D', ta.sma(close, 6));

            plotchar(res, '_plot');

            return {
                res,
            };
        });

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-02-01').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = `[${_plotdata[i].value.join(', ')}]`;
            plotdata_str += `[${str_time}]: ${res}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: [NaN, NaN]
[2018-12-17T00:00:00.000-00:00]: [NaN, NaN, NaN, 3549.75, 3659.5383333333, 3789.945, 3866.4183333333]
[2018-12-24T00:00:00.000-00:00]: [3926.8166666667, 3944.0966666667, 3900.6616666667, 3858.9466666667, 3842.8833333333, 3805.7383333333, 3770.5983333333]
[2018-12-31T00:00:00.000-00:00]: [3755.9316666667, 3758.2066666667, 3807.5166666667, 3790.5, 3805.0216666667, 3802.2466666667, 3860.1016666667]
[2019-01-07T00:00:00.000-00:00]: [3890.1866666667, 3907.06, 3942.6466666667, 3910.83, 3881.8533333333, 3811.3566666667, 3728.1866666667]
[2019-01-14T00:00:00.000-00:00]: [3674.8316666667, 3606.0766666667, 3603.3083333333, 3606.1933333333, 3605.1816666667, 3633.995, 3611.8133333333]
[2019-01-21T00:00:00.000-00:00]: [3602.1416666667, 3596.435, 3580.3583333333, 3573.5533333333, 3553.57, 3556.4266666667, 3557.2883333333]
[2019-01-28T00:00:00.000-00:00]: [3532.49, 3506.4016666667, 3484.2783333333, 3458.8116666667, 3438.7, 3427.6483333333, 3425.3566666667]`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});

/**
 * Binance provider tests — exercise the full transpiler pipeline with syminfo.tickerid,
 * testing symbol prefix stripping, same-TF tuple returns, HTF boundary alignment,
 * and log suppression in secondary contexts.
 *
 * These use Pine Script strings (not JS callbacks) so the transpiler wraps arguments
 * correctly via request.param(), matching real-world usage.
 */
describe('Request (Binance - transpiled Pine Script)', () => {
    // Helper: extract plot data as { time, value }[] filtered to date range
    function extractPlot(
        plots: any,
        name: string,
        sDate: number,
        eDate: number,
    ): { time: string; value: any }[] {
        const plotdata = plots[name]?.data || [];
        return plotdata
            .filter((e: any) => e.time >= sDate && e.time <= eDate)
            .map((e: any) => ({
                time: new Date(e.time).toISOString().slice(0, 10),
                value: e.value,
            }));
    }

    it('request.security cross-timeframe with syminfo.tickerid (D close from W chart)', async () => {
        const sDate = new Date('2019-06-01').getTime();
        const eDate = new Date('2019-09-01').getTime();
        const warmup = 365 * 24 * 60 * 60 * 1000;

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate - warmup);

        const { plots } = await pineTS.run(
`//@version=5
indicator("Test")
_daily_close = request.security(syminfo.tickerid, "D", close)
plot(_daily_close, "_dc")
`);

        const data = extractPlot(plots, '_dc', sDate, eDate);

        // Verify we got 13 weekly bars
        expect(data.length).toBe(13);

        // Spot-check known TV-verified values (daily close, lookahead=false)
        expect(data[0].time).toBe('2019-06-03');
        expect(data[0].value).toBeCloseTo(7638.29, 1);

        expect(data[4].time).toBe('2019-07-01');
        expect(data[4].value).toBeCloseTo(11480.77, 1);

        expect(data[12].time).toBe('2019-08-26');
        expect(data[12].value).toBeCloseTo(9758.57, 1);
    }, 30000);

    it('request.security HTF monthly close with boundary straddling (M close from W chart)', async () => {
        const sDate = new Date('2019-06-01').getTime();
        const eDate = new Date('2019-09-01').getTime();
        const warmup = 365 * 24 * 60 * 60 * 1000;

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate - warmup);

        const { plots } = await pineTS.run(
`//@version=5
indicator("Test")
_monthly_close = request.security(syminfo.tickerid, "M", close)
plot(_monthly_close, "_mc")
`);

        const data = extractPlot(plots, '_mc', sDate, eDate);

        expect(data.length).toBe(13);

        // First 3 weeks of June: should show May's monthly close (lookahead=false)
        expect(data[0].value).toBeCloseTo(8561.8, 1);
        expect(data[1].value).toBeCloseTo(8561.8, 1);
        expect(data[2].value).toBeCloseTo(8561.8, 1);

        // Week of June 24 onward: June's monthly close
        expect(data[3].value).toBeCloseTo(10748.93, 1);

        // CRITICAL: Week of Jul 29 — straddles July/August boundary.
        // Must return July's close, NOT NaN.
        expect(data[8].time).toBe('2019-07-29');
        expect(data[8].value).toBeCloseTo(10100.84, 1);

        // CRITICAL: Week of Aug 26 — straddles August/September boundary.
        // Must return August's close, NOT NaN.
        expect(data[12].time).toBe('2019-08-26');
        expect(data[12].value).toBeCloseTo(9591.86, 1);
    }, 30000);

    it('request.security same-TF tuple return ([open, close] from W chart)', async () => {
        const sDate = new Date('2019-06-01').getTime();
        const eDate = new Date('2019-09-01').getTime();
        const warmup = 365 * 24 * 60 * 60 * 1000;

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate - warmup);

        const { plots } = await pineTS.run(
`//@version=5
indicator("Test")
[sec_open, sec_close] = request.security(syminfo.tickerid, "W", [open, close])
// Same TF: sec_open should equal open, sec_close should equal close
plot(sec_open, "_so")
plot(sec_close, "_sc")
plot(open, "_o")
plot(close, "_c")
`);

        const secOpen = extractPlot(plots, '_so', sDate, eDate);
        const secClose = extractPlot(plots, '_sc', sDate, eDate);
        const chartOpen = extractPlot(plots, '_o', sDate, eDate);
        const chartClose = extractPlot(plots, '_c', sDate, eDate);

        expect(secOpen.length).toBe(13);
        expect(secClose.length).toBe(13);

        // Same-TF: returned values must match the chart's own open/close
        for (let i = 0; i < secOpen.length; i++) {
            expect(secOpen[i].value).toBeCloseTo(chartOpen[i].value, 2);
            expect(secClose[i].value).toBeCloseTo(chartClose[i].value, 2);
        }

        // Spot-check specific TV-verified values
        expect(secOpen[0].time).toBe('2019-06-03');
        expect(secOpen[0].value).toBeCloseTo(8743.6, 1);
        expect(secClose[0].value).toBeCloseTo(7638.29, 1);
    }, 30000);

    it('request.security same-TF triple tuple return ([high, low, volume] from W chart)', async () => {
        const sDate = new Date('2019-06-01').getTime();
        const eDate = new Date('2019-09-01').getTime();
        const warmup = 365 * 24 * 60 * 60 * 1000;

        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, sDate - warmup);

        const { plots } = await pineTS.run(
`//@version=5
indicator("Test")
[sec_high, sec_low, sec_vol] = request.security(syminfo.tickerid, "W", [high, low, volume])
plot(sec_high, "_sh")
plot(sec_low, "_sl")
plot(sec_vol, "_sv")
plot(high, "_h")
plot(low, "_l")
plot(volume, "_v")
`);

        const secHigh = extractPlot(plots, '_sh', sDate, eDate);
        const secLow = extractPlot(plots, '_sl', sDate, eDate);
        const secVol = extractPlot(plots, '_sv', sDate, eDate);
        const chartHigh = extractPlot(plots, '_h', sDate, eDate);
        const chartLow = extractPlot(plots, '_l', sDate, eDate);
        const chartVol = extractPlot(plots, '_v', sDate, eDate);

        expect(secHigh.length).toBe(13);

        // Same-TF: returned values must match the chart's own high/low/volume
        for (let i = 0; i < secHigh.length; i++) {
            expect(secHigh[i].value).toBeCloseTo(chartHigh[i].value, 2);
            expect(secLow[i].value).toBeCloseTo(chartLow[i].value, 2);
            expect(secVol[i].value).toBeCloseTo(chartVol[i].value, 0);
        }

        // Spot-check specific TV-verified values
        expect(secHigh[0].time).toBe('2019-06-03');
        expect(secHigh[0].value).toBeCloseTo(8752.45, 1);
        expect(secLow[0].value).toBeCloseTo(7441.21, 1);
    }, 30000);
});
