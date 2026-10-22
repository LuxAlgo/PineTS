import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from 'index';

describe('Math - Constants', () => {
    it('math.e, math.phi, math.pi, math.rphi', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-01-01').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume, open } = context.data;
            const { na, plotchar, math, array } = context.pine;
            let pi = math.pi;
            let phi = math.phi;
            let e = math.e;
            let rphi = math.rphi;

            return { e, pi, phi, rphi };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];

            const e = result.e[i];
            const pi = result.pi[i];
            const phi = result.phi[i];
            const rphi = result.rphi[i];

            plotdata_str += `[${str_time}]: ${e} ${pi} ${phi} ${rphi}\n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: 2.718281828459045 3.141592653589793 1.618033988749895 0.6180339887498948
[2018-12-17T00:00:00.000-00:00]: 2.718281828459045 3.141592653589793 1.618033988749895 0.6180339887498948
[2018-12-24T00:00:00.000-00:00]: 2.718281828459045 3.141592653589793 1.618033988749895 0.6180339887498948
[2018-12-31T00:00:00.000-00:00]: 2.718281828459045 3.141592653589793 1.618033988749895 0.6180339887498948`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
