import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { Provider } from '@pinets/marketData/Provider.class';
import { deserialize, deepEqual } from '../lib/serializer.js';

describe('MISC Namespace', () => {
    it('SQZMOM regression test', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            // This is a PineTS port of "Squeeze Momentum Indicator" indicator by LazyBear
                // List of all his indicators: https://www.tradingview.com/v/4IneGo8h/
                const { close, high, low } = context.data;
            
                const ta = context.ta;
                const math = context.math;
            
                const input = context.input;
                const { plot, plotchar, nz, color } = context.core;
            
                const length = input.int(20, 'BB Length');
                const mult = input.float(2.0, 'BB MultFactor');
                const lengthKC = input.int(20, 'KC Length');
                const multKC = input.float(1.5, 'KC MultFactor');
            
                const useTrueRange = input.bool(true, 'Use TrueRange (KC)');
            
                // Calculate BB
                let source = close;
                const basis = ta.sma(source, length);
                const dev = multKC * ta.stdev(source, length);
                const upperBB = basis + dev;
                const lowerBB = basis - dev;
            
                // Calculate KC
                const ma = ta.sma(source, lengthKC);
                const range_1 = useTrueRange ? ta.tr : high - low;
                const rangema = ta.sma(range_1, lengthKC);
                const upperKC = ma + rangema * multKC;
                const lowerKC = ma - rangema * multKC;
            
                const sqzOn = lowerBB > lowerKC && upperBB < upperKC;
                const sqzOff = lowerBB < lowerKC && upperBB > upperKC;
                const noSqz = sqzOn == false && sqzOff == false;
            
                const val = ta.linreg(source - math.avg(math.avg(ta.highest(high, lengthKC), ta.lowest(low, lengthKC)), ta.sma(close, lengthKC)), lengthKC, 0);
            
                const iff_1 = val > nz(val[1]) ? color.lime : color.green;
                const iff_2 = val < nz(val[1]) ? color.red : color.maroon;
                const bcolor = val > 0 ? iff_1 : iff_2;
                const scolor = noSqz ? color.blue : sqzOn ? color.black : color.gray;
                //plot(val, 'Momentum', { color: bcolor, style: 'histogram', linewidth: 4 });
                //plot(0, 'Cross', { color: scolor, style: 'cross', linewidth: 2 });
            
                plotchar(noSqz, '_plotchar');
                plot(val, '_plot');
            
                return {
                    sqzOn,
                    sqzOff,
                    noSqz,
                    iff_1,
                    iff_2,
                    bcolor,
                    scolor,
                };
        });

        // Filter results for the date range 2025-10-01 to 2025-11-20
        const sDate = new Date('2025-10-01').getTime();
        const eDate = new Date('2025-11-20').getTime();

        const plotchar_data = plots['_plotchar'].data;
        const plot_data = plots['_plot'].data;

        // Extract results for the date range (same logic as expect-gen.ts)
        const filtered_results: any = {};
        let plotchar_data_str = '';
        let plot_data_str = '';

        if (plotchar_data.length != plot_data.length) {
            throw new Error('Plotchar and plot data lengths do not match');
        }

        for (let i = 0; i < plotchar_data.length; i++) {
            if (plotchar_data[i].time >= sDate && plotchar_data[i].time <= eDate) {
                plotchar_data_str += `[${plotchar_data[i].time}]: ${plotchar_data[i].value}\n`;
                plot_data_str += `[${plot_data[i].time}]: ${plot_data[i].value}\n`;
                for (let key in result) {
                    if (!filtered_results[key]) filtered_results[key] = [];
                    filtered_results[key].push(result[key][i]);
                }
            }
        }

        // Load expected data from JSON file using custom deserializer
        const expectFilePath = path.join(__dirname, 'data/SQZMOM.expect.json');
        const expectedData = deserialize(fs.readFileSync(expectFilePath, 'utf-8'));

        // Assert results using custom deep equality (handles NaN correctly)
        expect(deepEqual(filtered_results, expectedData.results)).toBe(true);
        expect(plotchar_data_str.trim()).toEqual(expectedData.plotchar_data);
        expect(plot_data_str.trim()).toEqual(expectedData.plot_data);
    });

    it('WILLVIXFIX regression test', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            // This is a PineTS port of "Squeeze Momentum Indicator" indicator by LazyBear
                // List of all his indicators: https://www.tradingview.com/v/4IneGo8h/
                const { close, high, low } = context.data;
            
                const ta = context.ta;
                const math = context.math;
            
                const input = context.input;
                const { plot, plotchar, nz, color } = context.core;
            
                const pd = input.int(22, 'LookBack Period Standard Deviation High');
                const bbl = input.int(20, 'Bolinger Band Length');
                const mult = input.float(2.0, 'Bollinger Band Standard Devaition Up');
                const lb = input.int(50, 'Look Back Period Percentile High');
                const ph = input.float(0.85, 'Highest Percentile - 0.90=90%, 0.95=95%, 0.99=99%');
                const pl = input.float(1.01, 'Lowest Percentile - 1.10=90%, 1.05=95%, 1.01=99%');
                const hp = input.bool(true, 'Show High Range - Based on Percentile and LookBack Period?');
                const sd = input.bool(true, 'Show Standard Deviation Line?');
            
                const wvf = ((ta.highest(close, pd) - low) / ta.highest(close, pd)) * 100;
            
                const sDev = mult * ta.stdev(wvf, bbl);
                const midLine = ta.sma(wvf, bbl);
                const lowerBand = midLine - sDev;
                const upperBand = midLine + sDev;
            
                const rangeHigh = ta.highest(wvf, lb) * ph;
                const rangeLow = ta.lowest(wvf, lb) * pl;
            
                const col = wvf >= upperBand || wvf >= rangeHigh ? color.lime : color.gray;
            
                const RangeHigh = hp && rangeHigh ? rangeHigh : NaN;
                const RangeLow = hp && rangeLow ? rangeLow : NaN;
                const UpperBand = sd && upperBand ? upperBand : NaN;
            
                plot(RangeHigh, 'RangeHigh', { style: 'line', linewidth: 1, color: 'lime' });
                plot(RangeLow, 'RangeLow', { style: 'line', linewidth: 1, color: 'orange' });
                plot(UpperBand, 'UpperBand', { style: 'line', linewidth: 2, color: 'aqua' });
                plot(wvf, 'WilliamsVixFix', { style: 'histogram', linewidth: 4, color: col });
            
                plotchar(UpperBand, '_plotchar');
                plot(wvf, '_plot');
            
                return {
                    RangeHigh,
                    RangeLow,
                    UpperBand,
                    wvf,
                    col,
                };
        });

        // Filter results for the date range 2025-10-01 to 2025-11-20
        const sDate = new Date('2025-10-01').getTime();
        const eDate = new Date('2025-11-20').getTime();

        const plotchar_data = plots['_plotchar'].data;
        const plot_data = plots['_plot'].data;

        // Extract results for the date range (same logic as expect-gen.ts)
        const filtered_results: any = {};
        let plotchar_data_str = '';
        let plot_data_str = '';

        if (plotchar_data.length != plot_data.length) {
            throw new Error('Plotchar and plot data lengths do not match');
        }

        for (let i = 0; i < plotchar_data.length; i++) {
            if (plotchar_data[i].time >= sDate && plotchar_data[i].time <= eDate) {
                plotchar_data_str += `[${plotchar_data[i].time}]: ${plotchar_data[i].value}\n`;
                plot_data_str += `[${plot_data[i].time}]: ${plot_data[i].value}\n`;
                for (let key in result) {
                    if (!filtered_results[key]) filtered_results[key] = [];
                    filtered_results[key].push(result[key][i]);
                }
            }
        }

        // Load expected data from JSON file using custom deserializer
        const expectFilePath = path.join(__dirname, 'data/WillVixFix.expect.json');
        const expectedData = deserialize(fs.readFileSync(expectFilePath, 'utf-8'));

        // Assert results using custom deep equality (handles NaN correctly)
        expect(deepEqual(filtered_results, expectedData.results)).toBe(true);
        expect(plotchar_data_str.trim()).toEqual(expectedData.plotchar_data);
        expect(plot_data_str.trim()).toEqual(expectedData.plot_data);
    });

    it('SIMPLE-ARITHMETICS regression test', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            const { close, open } = context.data;
                const { plot, plotchar } = context.core;
            
                const close_minus_open = close - open;
                const close_plus_open = close + open;
            
                const oo = open;
                const cc = close;
            
                const cc_minus_oo = cc - oo;
                const cc_plus_oo = cc + oo;
            
                plotchar(cc_minus_oo, '_plotchar');
                plot(cc_plus_oo, '_plot');
            
                return {
                    close_minus_open,
                    close_plus_open,
                    cc_minus_oo,
                    cc_plus_oo,
                };
        });

        // Filter results for the date range 2025-10-01 to 2025-11-20
        const sDate = new Date('2025-10-01').getTime();
        const eDate = new Date('2025-11-20').getTime();

        const plotchar_data = plots['_plotchar'].data;
        const plot_data = plots['_plot'].data;

        // Extract results for the date range (same logic as expect-gen.ts)
        const filtered_results: any = {};
        let plotchar_data_str = '';
        let plot_data_str = '';

        if (plotchar_data.length != plot_data.length) {
            throw new Error('Plotchar and plot data lengths do not match');
        }

        for (let i = 0; i < plotchar_data.length; i++) {
            if (plotchar_data[i].time >= sDate && plotchar_data[i].time <= eDate) {
                plotchar_data_str += `[${plotchar_data[i].time}]: ${plotchar_data[i].value}\n`;
                plot_data_str += `[${plot_data[i].time}]: ${plot_data[i].value}\n`;
                for (let key in result) {
                    if (!filtered_results[key]) filtered_results[key] = [];
                    filtered_results[key].push(result[key][i]);
                }
            }
        }

        // Load expected data from JSON file using custom deserializer
        const expectFilePath = path.join(__dirname, 'data/simple-arithmetics.expect.json');
        const expectedData = deserialize(fs.readFileSync(expectFilePath, 'utf-8'));

        // Assert results using custom deep equality (handles NaN correctly)
        expect(deepEqual(filtered_results, expectedData.results)).toBe(true);
        expect(plotchar_data_str.trim()).toEqual(expectedData.plotchar_data);
        expect(plot_data_str.trim()).toEqual(expectedData.plot_data);
    });
});
