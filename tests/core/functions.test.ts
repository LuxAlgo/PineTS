import { describe, expect, it } from 'vitest';

import { PineTS, Provider } from 'index';

describe('Functions', () => {
    it('PVT Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;
            function f_pvt() {
                return ta.cum((ta.change(close) / close[1]) * volume);
            }
            const res = f_pvt();
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
[2019-07-15T00:00:00.000-00:00]: 19061.8517623342
[2019-07-22T00:00:00.000-00:00]: 17977.9512087809
[2019-07-29T00:00:00.000-00:00]: 19906.9534139818
[2019-08-05T00:00:00.000-00:00]: 20953.594020523
[2019-08-12T00:00:00.000-00:00]: 19068.3291719978
[2019-08-19T00:00:00.000-00:00]: 18791.0890461204
[2019-08-26T00:00:00.000-00:00]: 18315.5573542303
[2019-09-02T00:00:00.000-00:00]: 19218.4585582482
[2019-09-09T00:00:00.000-00:00]: 19130.6768020241
[2019-09-16T00:00:00.000-00:00]: 18798.1310217967`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('WAD Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;
            function f_wad() {
                const trueHigh = math.max(high, close[1]);
                const trueLow = math.min(low, close[1]);
                const mom = ta.change(close);
                const gain = mom > 0 ? close - trueLow : mom < 0 ? close - trueHigh : 0;
                return ta.cum(gain);
            }
            const res = f_wad();
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

    it('NVI Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, volume } = context.data;
            const { ta, plotchar } = context.pine;
            function f_nvi() {
                let ta_nvi = 1.0;
                const prevNvi = nz(ta_nvi[1], 0.0) == 0.0 ? 1.0 : ta_nvi[1];
                if (nz(close, 0.0) == 0.0 || nz(close[1], 0.0) == 0.0) {
                    ta_nvi = prevNvi;
                } else {
                    ta_nvi = volume < nz(volume[1], 0.0) ? prevNvi + ((close - close[1]) / close[1]) * prevNvi : prevNvi;
                }
                return ta_nvi;
            }
            const res = f_nvi();
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

        const expected_plot = `[2019-05-20T00:00:00.000-00:00]: 1.2290324694
[2019-05-27T00:00:00.000-00:00]: 1.2305073444
[2019-06-03T00:00:00.000-00:00]: 1.0749544745
[2019-06-10T00:00:00.000-00:00]: 1.2649121811
[2019-06-17T00:00:00.000-00:00]: 1.2649121811
[2019-06-24T00:00:00.000-00:00]: 1.2649121811
[2019-07-01T00:00:00.000-00:00]: 1.3510336212
[2019-07-08T00:00:00.000-00:00]: 1.3510336212
[2019-07-15T00:00:00.000-00:00]: 1.3510336212
[2019-07-22T00:00:00.000-00:00]: 1.2165174032
[2019-07-29T00:00:00.000-00:00]: 1.2165174032
[2019-08-05T00:00:00.000-00:00]: 1.2165174032
[2019-08-12T00:00:00.000-00:00]: 1.0876020227
[2019-08-19T00:00:00.000-00:00]: 1.0686079727
[2019-08-26T00:00:00.000-00:00]: 1.0287770798
[2019-09-02T00:00:00.000-00:00]: 1.0287770798
[2019-09-09T00:00:00.000-00:00]: 1.0205375789
[2019-09-16T00:00:00.000-00:00]: 1.0205375789`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('MFI using pine function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            function pine_mfi(src, length) {
                const upper = math.sum(volume * (ta.change(src, 1) <= 0.0 ? 0.0 : src), length);
                const lower = math.sum(volume * (ta.change(src, 1) >= 0.0 ? 0.0 : src), length);
                const mfi = 100.0 - 100.0 / (1.0 + upper / lower);
                return mfi;
            }

            const res = pine_mfi(close, 28);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

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

    it('CMO Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            function f_cmo(src, length) {
                const mom = ta.change(src);
                const sm1 = math.sum(mom >= 0 ? mom : 0.0, length);
                const sm2 = math.sum(mom >= 0 ? 0.0 : -mom, length);
                return (100 * (sm1 - sm2)) / (sm1 + sm2);
            }
            const res = f_cmo(close, 2);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-02-16').getTime();

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
[2018-12-24T00:00:00.000-00:00]: 70.2432142656
[2018-12-31T00:00:00.000-00:00]: 24.5176066419
[2019-01-07T00:00:00.000-00:00]: -41.8054830811
[2019-01-14T00:00:00.000-00:00]: -90.4474393531
[2019-01-21T00:00:00.000-00:00]: 71.4285714286
[2019-01-28T00:00:00.000-00:00]: -100
[2019-02-04T00:00:00.000-00:00]: 33.7659054521
[2019-02-11T00:00:00.000-00:00]: 82.3619514437`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('COG Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            function pine_cog(source, length) {
                const sum = math.sum(source, length);
                let num = 0.0;
                for (let i = 0; i <= length - 1; i++) {
                    const price = source[i];
                    num = num + price * (i + 1);
                }
                return -num / sum;
            }
            const res = pine_cog(close, 2);
            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-02-16').getTime();

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
[2018-12-17T00:00:00.000-00:00]: -1.4472776942
[2018-12-24T00:00:00.000-00:00]: -1.5084776499
[2018-12-31T00:00:00.000-00:00]: -1.4861674208
[2019-01-07T00:00:00.000-00:00]: -1.5351017575
[2019-01-14T00:00:00.000-00:00]: -1.4981135557
[2019-01-21T00:00:00.000-00:00]: -1.500313422
[2019-01-28T00:00:00.000-00:00]: -1.508488341
[2019-02-04T00:00:00.000-00:00]: -1.4831486915
[2019-02-11T00:00:00.000-00:00]: -1.5015817069`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('SUPERTREND Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math, nz, na } = context.pine;

            function pine_supertrend(factor, atrPeriod) {
                const src = (high + low) / 2;
                const atr = ta.atr(atrPeriod);
                let upperBand = src + factor * atr;
                let lowerBand = src - factor * atr;
                const prevLowerBand = nz(lowerBand[1]);
                const prevUpperBand = nz(upperBand[1]);

                lowerBand = lowerBand > prevLowerBand || close[1] < prevLowerBand ? lowerBand : prevLowerBand;
                upperBand = upperBand < prevUpperBand || close[1] > prevUpperBand ? upperBand : prevUpperBand;
                let _direction = na;
                let superTrend = na;
                const prevSuperTrend = superTrend[1];
                if (na(atr[1])) {
                    _direction = 1;
                } else if (prevSuperTrend == prevUpperBand) {
                    _direction = close > upperBand ? -1 : 1;
                } else {
                    _direction = close < lowerBand ? 1 : -1;
                }
                superTrend = _direction == -1 ? lowerBand : upperBand;
                return [superTrend, _direction];
            }
            //const res = ta.wpr(14);
            const [supertrend, direction] = pine_supertrend(3, 10);
            plotchar(supertrend, '_plot');

            return { supertrend, direction };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-20').getTime();
        const endDate = new Date('2019-11-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata.length; i++) {
            const time = _plotdata[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const res = _plotdata[i].value;
            const direction = result.direction[i];
            plotdata_str += `[${str_time}]: ${res} ${direction}\n`;
        }

        const expected_plot = `[2019-07-22T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-07-29T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-05T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-12T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-19T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-08-26T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-02T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-09T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-16T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-23T00:00:00.000-00:00]: 7963.3152640294 -1
[2019-09-30T00:00:00.000-00:00]: 12355.5963415975 1
[2019-10-07T00:00:00.000-00:00]: 12355.5963415975 1
[2019-10-14T00:00:00.000-00:00]: 12015.3009366939 1
[2019-10-21T00:00:00.000-00:00]: 12015.3009366939 1
[2019-10-28T00:00:00.000-00:00]: 12015.3009366939 1
[2019-11-04T00:00:00.000-00:00]: 12015.3009366939 1
[2019-11-11T00:00:00.000-00:00]: 12015.3009366939 1`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('SAR Function', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close, open } = context.data;
            const { ta, plotchar, math, bar_index } = context.pine;

            function pine_sar(start, inc, max) {
                var result = na;
                var maxMin = na;
                var acceleration = na;
                var isBelow = false;
                let isFirstTrendBar = false;

                if (bar_index == 1) {
                    if (close > close[1]) {
                        isBelow = true;
                        maxMin = high;
                        result = low[1];
                    } else {
                        isBelow = false;
                        maxMin = low;
                        result = high[1];
                    }
                    isFirstTrendBar = true;
                    acceleration = start;
                }
                result = result + acceleration * (maxMin - result);

                if (isBelow) {
                    if (result > low) {
                        isFirstTrendBar = true;
                        isBelow = false;
                        result = math.max(high, maxMin);
                        maxMin = low;
                        acceleration = start;
                    }
                } else {
                    if (result < high) {
                        isFirstTrendBar = true;
                        isBelow = true;
                        result = math.min(low, maxMin);
                        maxMin = high;
                        acceleration = start;
                    }
                }

                if (!isFirstTrendBar) {
                    if (isBelow) {
                        if (high > maxMin) {
                            maxMin = high;
                            acceleration = math.min(acceleration + inc, max);
                        }
                    } else {
                        if (low < maxMin) {
                            maxMin = low;
                            acceleration = math.min(acceleration + inc, max);
                        }
                    }
                }
                if (isBelow) {
                    result = math.min(result, low[1]);
                    if (bar_index > 1) {
                        result = math.min(result, low[2]);
                    }
                } else {
                    result = math.max(result, high[1]);
                    if (bar_index > 1) {
                        result = math.max(result, high[2]);
                    }
                }

                return result;
            }
            const res = pine_sar(0.02, 0.02, 0.2);

            plotchar(res, '_plot');

            return { res };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        let _plotdata = plots['_plot']?.data;
        const startDate = new Date('2019-07-29').getTime();
        const endDate = new Date('2019-11-20').getTime();

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

        const expected_plot = `[2019-07-29T00:00:00.000-00:00]: 13674.838168
[2019-08-05T00:00:00.000-00:00]: 13582.88140464
[2019-08-12T00:00:00.000-00:00]: 13492.7637765472
[2019-08-19T00:00:00.000-00:00]: 13404.4485010163
[2019-08-26T00:00:00.000-00:00]: 13317.899530996
[2019-09-02T00:00:00.000-00:00]: 13233.0815403761
[2019-09-09T00:00:00.000-00:00]: 13149.9599095686
[2019-09-16T00:00:00.000-00:00]: 13068.5007113772
[2019-09-23T00:00:00.000-00:00]: 12988.6706971497
[2019-09-30T00:00:00.000-00:00]: 12778.1238692637
[2019-10-07T00:00:00.000-00:00]: 12473.5000371079
[2019-10-14T00:00:00.000-00:00]: 12187.1536348814
[2019-10-21T00:00:00.000-00:00]: 11917.9880167885
[2019-10-28T00:00:00.000-00:00]: 11547.7489754454
[2019-11-04T00:00:00.000-00:00]: 11207.1290574098
[2019-11-11T00:00:00.000-00:00]: 10893.758732817
[2019-11-18T00:00:00.000-00:00]: 10605.4580341916`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('Tuple Return with Complex Expressions (Bollinger-like Bands)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close } = context.data;
            const { ta, plotchar } = context.pine;

            function myBands(src, len, mult) {
                let _mid = ta.sma(src, len);
                let _dev = ta.stdev(src, len);
                return [_mid, _mid + _dev * mult, _mid - _dev * mult];
            }

            const [mid, upper, lower] = myBands(close, 20, 2);
            plotchar(mid, 'mid');
            plotchar(upper, 'upper');
            plotchar(lower, 'lower');

            return { mid, upper, lower };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        const midData = plots['mid']?.data;
        const upperData = plots['upper']?.data;
        const lowerData = plots['lower']?.data;

        expect(midData).toBeDefined();
        expect(upperData).toBeDefined();
        expect(lowerData).toBeDefined();
        expect(midData.length).toBeGreaterThan(0);

        // Verify structural invariants: upper > mid > lower (for all bars with valid data)
        let validBars = 0;
        for (let i = 0; i < midData.length; i++) {
            const m = midData[i]?.value;
            const u = upperData[i]?.value;
            const l = lowerData[i]?.value;
            if (typeof m === 'number' && !isNaN(m) && typeof u === 'number' && !isNaN(u) && typeof l === 'number' && !isNaN(l)) {
                validBars++;
                expect(u).toBeGreaterThan(m);
                expect(m).toBeGreaterThan(l);
                // upper - mid should equal mid - lower (symmetry from same stdev * mult)
                expect(Math.abs(u - m - (m - l))).toBeLessThan(1e-9);
            }
        }
        expect(validBars).toBeGreaterThan(0);

        // Verify specific values against known-good output
        const startDate = new Date('2019-06-03').getTime();
        const endDate = new Date('2019-08-26').getTime();

        let plotdata_str = '';
        for (let i = 0; i < midData.length; i++) {
            const time = midData[i].time;
            if (time < startDate || time > endDate) continue;

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const m = midData[i].value;
            const u = upperData[i].value;
            const l = lowerData[i].value;
            plotdata_str += `[${str_time}]: ${m} ${u} ${l}\n`;
        }

        const expected_plot = `[2019-06-03T00:00:00.000-00:00]: 5222.1205 8807.840866445 1636.4001335550001
[2019-06-10T00:00:00.000-00:00]: 5494.956 9345.1994494114 1644.7125505886002
[2019-06-17T00:00:00.000-00:00]: 5866.6455 10240.9622895088 1492.3287104911997
[2019-06-24T00:00:00.000-00:00]: 6221.5135 10956.167730134599 1486.8592698654002
[2019-07-01T00:00:00.000-00:00]: 6614.125 11711.931292065201 1516.3187079348
[2019-07-08T00:00:00.000-00:00]: 6937.043 12079.0585445704 1795.0274554295993
[2019-07-15T00:00:00.000-00:00]: 7277.2775 12440.3744110676 2114.1805889324005
[2019-07-22T00:00:00.000-00:00]: 7559.1495 12566.6143243616 2551.6846756384
[2019-07-29T00:00:00.000-00:00]: 7909.5065 12842.6045431096 2976.4084568904
[2019-08-05T00:00:00.000-00:00]: 8287.8235 13114.7339453854 3460.9130546146007
[2019-08-12T00:00:00.000-00:00]: 8598.9955 13095.193811923 4102.797188077001
[2019-08-19T00:00:00.000-00:00]: 8846.2 13103.3070605096 4589.092939490401
[2019-08-26T00:00:00.000-00:00]: 9076.0505 12995.5919186738 5156.5090813261995`;

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('Nested UDT Field Assignment and Read', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());

        const sourceCode = (context) => {
            const { close } = context.data;
            const { plotchar, Type } = context.pine;

            const Inner = Type({ value: 'float' });
            const Outer = Type({ inner: 'Inner', scale: 'float' });

            var _outer = Outer.new(Inner.new(close), 2);
            _outer = Outer.new(Inner.new(close), 2);

            // Read nested field
            let _inner_val = _outer.inner.value;

            // Write nested field: _outer.inner.value = close * scale
            _outer.inner.value = close * _outer.scale;
            let _modified = _outer.inner.value;

            plotchar(_inner_val, 'inner_val');
            plotchar(_modified, 'modified');

            return { _inner_val, _modified };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        const innerData = plots['inner_val']?.data;
        const modifiedData = plots['modified']?.data;

        expect(innerData).toBeDefined();
        expect(modifiedData).toBeDefined();
        expect(innerData.length).toBeGreaterThan(0);

        // Verify: _inner_val should equal close, _modified should equal close * 2
        for (let i = 0; i < innerData.length; i++) {
            const iv = innerData[i]?.value;
            const mv = modifiedData[i]?.value;
            if (typeof iv === 'number' && !isNaN(iv) && typeof mv === 'number' && !isNaN(mv)) {
                // _modified should be exactly 2 * _inner_val (scale=2, _inner_val=close)
                expect(Math.abs(mv - iv * 2)).toBeLessThan(1e-9);
            }
        }
    });
});
