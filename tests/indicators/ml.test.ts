import { describe, expect, it } from 'vitest';

import { PineTS, Provider } from 'index';

describe('Indicators', () => {
    it.skip('COMP_TEST', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());
        const pineTSSourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;
            function normalize(src, min, max) {
                var historicMin = 10e10;
                var historicMax = -10e10;
                historicMin = math.min(nz(src, historicMin), historicMin);
                historicMax = math.max(nz(src, historicMax), historicMax);
                return min + (max - min) * (src - historicMin) / math.max(historicMax - historicMin, 10e-10);
            }

            function n_wt(src, n1, n2) {
                let ema1 = ta.ema(src, n1);
                let ema2 = ta.ema(math.abs(src - ema1), n1);
                let ci = (src - ema1) / (0.015 * ema2);
                let wt1 = ta.ema(ci, n2);
                let wt2 = ta.sma(wt1, 4);
                return normalize(wt1 - wt2, 0, 1);
            }

            function n_cci(src, n1, n2) {
                let ema = ta.ema(ta.cci(src, n1), n2);
                return normalize(ema, 0, 1);
            }    

            let src = close
            let n1 = 3
            let n2 = 6
            let ema1 = ta.ema(src, n1)
            plotchar(ema1, '_ema1');
            let ema2 = ta.ema(math.abs(src - ema1), n1)
            plotchar(ema2, '_ema2');
            let ci = (src - ema1) / (0.015 * ema2)
            plotchar(ci, '_ci');
            let wt1 = ta.ema(ci, n2)
            plotchar(wt1, '_wt1');
            let wt2 = ta.sma(wt1, 4)
            plotchar(wt2, '_wt2');
            //let res =  normalize(wt1 - wt2, 0, 1);
            
            let _src = wt1 - wt2
            plotchar(_src, '_src');

            let min = 0
            let max = 1
            var historicMin = 10e10
            var historicMax = -10e10
            historicMin = math.min(nz(_src, historicMin), historicMin)
            plotchar(historicMin, '_historicMin');
            historicMax = math.max(nz(_src, historicMax), historicMax)
            plotchar(historicMax, '_historicMax');
            //let wt = min + (max - min) * (_src - historicMin) / math.max(historicMax - historicMin, 10e-10)
            const wt = n_wt(close, 3, 6)
            plotchar(wt, '_wt');


            
            const res = _src;
            plotchar(res, '_res');
        }
    
        const { result, plots } = await pineTS.run(pineTSSourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
    
        let _plotdata_res = plots['_res']?.data;
        let _plotdata_src = plots['_src']?.data;
        let _plotdata_ema1 = plots['_ema1']?.data;
        let _plotdata_ema2 = plots['_ema2']?.data;
        let _plotdata_ci = plots['_ci']?.data;
        let _plotdata_wt1 = plots['_wt1']?.data;
        let _plotdata_wt2 = plots['_wt2']?.data;
        let _plotdata_historicMin = plots['_historicMin']?.data;
        let _plotdata_historicMax = plots['_historicMax']?.data;
        let _plotdata_wt = plots['_wt']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-16').getTime();
    
        let plotdata_str = '';
        for (let i = 0; i < _plotdata_res.length; i++) {
            const time = _plotdata_res[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }
    
            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const res_value = _plotdata_res[i].value.toFixed(3);
            const src_value = _plotdata_src[i].value.toFixed(3);
            const ema1_value = _plotdata_ema1[i].value.toFixed(3);
            const ema2_value = _plotdata_ema2[i].value.toFixed(3);
            const ci_value = _plotdata_ci[i].value.toFixed(3);
            const wt1_value = _plotdata_wt1[i].value.toFixed(3);
            const wt2_value = _plotdata_wt2[i].value.toFixed(3);
            const historicMin_value = _plotdata_historicMin[i].value.toFixed(3);
            const historicMax_value = _plotdata_historicMax[i].value.toFixed(3);
            const wt_value = _plotdata_wt[i].value.toFixed(3);
            plotdata_str += `[${str_time}]: ${wt1_value} ${wt2_value} ${src_value} ${historicMin_value} ${historicMax_value} ${wt_value}\n`;
        }
    
        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2018-12-17T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2018-12-24T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2018-12-31T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-01-07T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-01-14T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-01-21T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-01-28T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-02-04T00:00:00.000-00:00]: NaN NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-02-11T00:00:00.000-00:00]: -16.406 NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-02-18T00:00:00.000-00:00]: 8.443 NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-02-25T00:00:00.000-00:00]: 25.788 NaN NaN 100,000,000,000 -100,000,000,000 NaN
[2019-03-04T00:00:00.000-00:00]: 41.059 14.721 26.338 26.338 26.338 0
[2019-03-11T00:00:00.000-00:00]: 48.989 31.07 17.919 17.919 26.338 0
[2019-03-18T00:00:00.000-00:00]: 48.603 41.11 7.493 7.493 26.338 0
[2019-03-25T00:00:00.000-00:00]: 56.756 48.852 7.904 7.493 26.338 0.022
[2019-04-01T00:00:00.000-00:00]: 74.589 57.234 17.355 7.493 26.338 0.523
[2019-04-08T00:00:00.000-00:00]: 70.75 62.675 8.076 7.493 26.338 0.031
[2019-04-15T00:00:00.000-00:00]: 65.965 67.015 -1.05 -1.05 26.338 0`;
    
        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    }); 



    it('COMP_TEST VAR OK', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());
        const pineTSSourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;
            function normalize(src, min, max) {
                var historicMin = 10e10;
                var historicMax = -10e10;
                historicMin = math.min(nz(src, historicMin), historicMin);
                historicMax = math.max(nz(src, historicMax), historicMax);
                return min + (max - min) * (src - historicMin) / math.max(historicMax - historicMin, 10e-10);
            }

            function n_wt(src, n1, n2) {
                let ema1 = ta.ema(src, n1);
                let ema2 = ta.ema(math.abs(src - ema1), n1);
                let ci = (src - ema1) / (0.015 * ema2);
                let wt1 = ta.ema(ci, n2);
                let wt2 = ta.sma(wt1, 4);
                return normalize(wt1 - wt2, 0, 1);
            }

            function n_cci(src, n1, n2) {
                let ema = ta.ema(ta.cci(src, n1), n2);
                return normalize(ema, 0, 1);
            }                


            
            const wt = n_wt(close, 3, 6)
            plotchar(wt, '_wt');

            const cci = 0;//n_cci(close, 3, 6)
            plotchar(cci, '_cci');


            
        }
    
        const { result, plots } = await pineTS.run(pineTSSourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
    
        

        let _plotdata_wt = plots['_wt']?.data;
        let _plotdata_cci = plots['_cci']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-16').getTime();
    
        let plotdata_str = '';
        for (let i = 0; i < _plotdata_wt.length; i++) {
            const time = _plotdata_wt[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }
    
            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';

            const wt_value = _plotdata_wt[i].value.toFixed(3);
            const cci_value = _plotdata_cci[i].value.toFixed(3);
            plotdata_str += `[${str_time}]: ${wt_value}\n`;
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
[2019-03-04T00:00:00.000-00:00]: 0.000
[2019-03-11T00:00:00.000-00:00]: 0.000
[2019-03-18T00:00:00.000-00:00]: 0.000
[2019-03-25T00:00:00.000-00:00]: 0.022
[2019-04-01T00:00:00.000-00:00]: 0.523
[2019-04-08T00:00:00.000-00:00]: 0.031
[2019-04-15T00:00:00.000-00:00]: 0.000`;
    
        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });     

    it('COMP_TEST VAR Collide', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());
        const pineTSSourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;
            function normalize(src, min, max) {
                var historicMin = 10e10;
                var historicMax = -10e10;
                historicMin = math.min(nz(src, historicMin), historicMin);
                historicMax = math.max(nz(src, historicMax), historicMax);
                return min + (max - min) * (src - historicMin) / math.max(historicMax - historicMin, 10e-10);
            }

            function n_wt(src, n1, n2) {
                let ema1 = ta.ema(src, n1);
                let ema2 = ta.ema(math.abs(src - ema1), n1);
                let ci = (src - ema1) / (0.015 * ema2);
                let wt1 = ta.ema(ci, n2);
                let wt2 = ta.sma(wt1, 4);
                return normalize(wt1 - wt2, 0, 1);
            }

            function n_cci(src, n1, n2) {
                let ema = ta.ema(ta.cci(src, n1), n2);
                return normalize(ema, 0, 1);
            }                


            
            const wt = n_wt(close, 3, 6)
            plotchar(wt, '_wt');

            const cci = n_cci(close, 3, 6)
            plotchar(cci, '_cci');


            
        }
    
        const { result, plots } = await pineTS.run(pineTSSourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
    
        

        let _plotdata_wt = plots['_wt']?.data;
        let _plotdata_cci = plots['_cci']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-16').getTime();
    
        let plotdata_str = '';
        for (let i = 0; i < _plotdata_wt.length; i++) {
            const time = _plotdata_wt[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }
    
            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';

            const wt_value = _plotdata_wt[i].value.toFixed(3);
            const cci_value = _plotdata_cci[i].value.toFixed(3);
            plotdata_str += `[${str_time}]: ${wt_value}\n`;
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
[2019-03-04T00:00:00.000-00:00]: 0.000
[2019-03-11T00:00:00.000-00:00]: 0.000
[2019-03-18T00:00:00.000-00:00]: 0.000
[2019-03-25T00:00:00.000-00:00]: 0.022
[2019-04-01T00:00:00.000-00:00]: 0.523
[2019-04-08T00:00:00.000-00:00]: 0.031
[2019-04-15T00:00:00.000-00:00]: 0.000`;
    
        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });        
    it('MLExtensions - n_wt n_cci', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());
        const pineTSSourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            function normalize(src, min, max) {
                var historicMin = 10e10;
                var historicMax = -10e10;
                historicMin = math.min(nz(src, historicMin), historicMin);
                historicMax = math.max(nz(src, historicMax), historicMax);
                return min + (max - min) * (src - historicMin) / math.max(historicMax - historicMin, 10e-10);
            }

            function n_wt(src, n1, n2) {
                let ema1 = ta.ema(src, n1);
                let ema2 = ta.ema(math.abs(src - ema1), n1);
                let ci = (src - ema1) / (0.015 * ema2);
                let wt1 = ta.ema(ci, n2);
                let wt2 = ta.sma(wt1, 4);
                return normalize(wt1 - wt2, 0, 1);
            }

            function n_cci(src, n1, n2) {
                let ema = ta.ema(ta.cci(src, n1), n2);
                return normalize(ema, 0, 1);
            }

            const wt = n_wt(close, 3, 6);
            const cci = n_cci(close, 3, 6);
            plotchar(wt, '_wt');
            plotchar(cci, '_cci');
        }

        const { result, plots } = await pineTS.run(pineTSSourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata_wt = plots['_wt']?.data;
        let _plotdata_cci = plots['_cci']?.data;
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata_wt.length; i++) {
            const time = _plotdata_wt[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const wt_value = _plotdata_wt[i].value.toFixed(3);
            const cci_value = _plotdata_cci[i].value.toFixed(3);
            plotdata_str += `[${str_time}]: ${wt_value} ${cci_value}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN NaN
[2018-12-17T00:00:00.000-00:00]: NaN NaN
[2018-12-24T00:00:00.000-00:00]: NaN NaN
[2018-12-31T00:00:00.000-00:00]: NaN NaN
[2019-01-07T00:00:00.000-00:00]: NaN NaN
[2019-01-14T00:00:00.000-00:00]: NaN NaN
[2019-01-21T00:00:00.000-00:00]: NaN NaN
[2019-01-28T00:00:00.000-00:00]: NaN 0.000
[2019-02-04T00:00:00.000-00:00]: NaN 1.000
[2019-02-11T00:00:00.000-00:00]: NaN 1.000
[2019-02-18T00:00:00.000-00:00]: NaN 1.000
[2019-02-25T00:00:00.000-00:00]: NaN 1.000
[2019-03-04T00:00:00.000-00:00]: 0.000 1.000
[2019-03-11T00:00:00.000-00:00]: 0.000 1.000
[2019-03-18T00:00:00.000-00:00]: 0.000 0.941
[2019-03-25T00:00:00.000-00:00]: 0.022 1.000
[2019-04-01T00:00:00.000-00:00]: 0.523 1.000
[2019-04-08T00:00:00.000-00:00]: 0.031 0.895
[2019-04-15T00:00:00.000-00:00]: 0.000 0.970`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    }); 


    it('scope test', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2020-01-27').getTime());
        const pineTSSourceCode = (context) => {
            const { close, high, low, volume } = context.data;
            const { ta, plotchar, math } = context.pine;

            function foo(val) {
                let x = val
                let prev = x[1]
                return [x, prev]
            }

            let [c1_curr, c1_prev] = foo(100)
            let [c2_curr, c2_prev] = foo(200)
            plotchar(c1_curr, '_c1_curr')
            plotchar(c1_prev, '_c1_prev')
            plotchar(c2_curr, '_c2_curr')
            plotchar(c2_prev, '_c2_prev')
        }
// `
// //@version=5
// foo(val) =>
//     x = val
//     prev = x[1]
//     [x, prev]

// [c1_curr, c1_prev] = foo(100)

// [c2_curr, c2_prev] = foo(200)
// plotchar(c1_curr, '_c1_curr')
// plotchar(c1_prev, '_c1_prev')
// plotchar(c2_curr, '_c2_curr')
// plotchar(c2_prev, '_c2_prev')
// `

        const { result, plots } = await pineTS.run(pineTSSourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let _plotdata_c1_curr = plots['_c1_curr']?.data;
        let _plotdata_c1_prev = plots['_c1_prev']?.data;
        let _plotdata_c2_curr = plots['_c2_curr']?.data;
        let _plotdata_c2_prev = plots['_c2_prev']?.data;

        
        const startDate = new Date('2018-12-10').getTime();
        const endDate = new Date('2019-04-16').getTime();

        let plotdata_str = '';
        for (let i = 0; i < _plotdata_c1_curr.length; i++) {
            const time = _plotdata_c1_curr[i].time;
            if (time < startDate || time > endDate) {
                continue;
            }

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            const c1_curr_value = _plotdata_c1_curr[i].value;
            const c1_prev_value = _plotdata_c1_prev[i].value;
            const c2_curr_value = _plotdata_c2_curr[i].value;
            const c2_prev_value = _plotdata_c2_prev[i].value;
            plotdata_str += `[${str_time}]: ${c1_prev_value} ${c2_prev_value}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: NaN NaN
[2018-12-17T00:00:00.000-00:00]: 100 200
[2018-12-24T00:00:00.000-00:00]: 100 200
[2018-12-31T00:00:00.000-00:00]: 100 200
[2019-01-07T00:00:00.000-00:00]: 100 200
[2019-01-14T00:00:00.000-00:00]: 100 200
[2019-01-21T00:00:00.000-00:00]: 100 200
[2019-01-28T00:00:00.000-00:00]: 100 200
[2019-02-04T00:00:00.000-00:00]: 100 200
[2019-02-11T00:00:00.000-00:00]: 100 200
[2019-02-18T00:00:00.000-00:00]: 100 200
[2019-02-25T00:00:00.000-00:00]: 100 200
[2019-03-04T00:00:00.000-00:00]: 100 200
[2019-03-11T00:00:00.000-00:00]: 100 200
[2019-03-18T00:00:00.000-00:00]: 100 200
[2019-03-25T00:00:00.000-00:00]: 100 200
[2019-04-01T00:00:00.000-00:00]: 100 200
[2019-04-08T00:00:00.000-00:00]: 100 200
[2019-04-15T00:00:00.000-00:00]: 100 200`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });     
});