import { describe, expect, it } from 'vitest';
import { arrayPrecision, getKlines, runNSFunctionWithArgs } from '../../utils';
import PineTS from 'PineTS.class';
import { Provider } from '@pinets/index';

async function runMathFunctionWithArgs(mathFunction: string, ...args) {
    const klines = await getKlines('BTCUSDT', '1h', 500, 0, 1736071200000 - 1);

    const result = await runNSFunctionWithArgs(klines, 'math', mathFunction, ...args);

    return result;
}

describe('Math - Basic Operations', () => {
    it('math.abs, math.floor, math.ceil, math.round, math.sign', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-01-01').getTime());

        const sourceCode = (context) => {
            const { close, high, low, volume, open } = context.data;
            const { na, plotchar, math, array, syminfo } = context.pine;
            let res = low - high;
            let abs = math.abs(low - high);
            let floor = math.floor(low - high);
            let ceil = math.ceil(low - high);
            let round = math.round(low - high);
            let round_to_mintick = math.round_to_mintick(low - high);
            let sign = math.sign(low - high);

            return { res, abs, floor, ceil, round, round_to_mintick, sign };
        };

        const { result, data } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        let plotdata_str = '';
        for (let i = 0; i < data.openTime.data.length; i++) {
            const time = data.openTime.data[i];

            const str_time = new Date(time).toISOString().slice(0, -1) + '-00:00';
            //const val = result.val[i];
            const res = result.res[i];
            const abs = result.abs[i];
            const floor = result.floor[i];
            const ceil = result.ceil[i];
            const round = result.round[i];
            const round_to_mintick = result.round_to_mintick[i];
            const sign = result.sign[i];

            plotdata_str += `[${str_time}]: ${res} ${abs} ${floor} ${ceil} ${round} ${round_to_mintick} ${sign} \n`;
        }

        const expected_plot = `[2018-12-10T00:00:00.000-00:00]: -312.32000000000016 312.32000000000016 -313 -312 -312 -312.32 -1 
[2018-12-17T00:00:00.000-00:00]: -982.75 982.75 -983 -982 -983 -982.75 -1 
[2018-12-24T00:00:00.000-00:00]: -771 771 -771 -771 -771 -771 -1 
[2018-12-31T00:00:00.000-00:00]: -456.7600000000002 456.7600000000002 -457 -456 -457 -456.76 -1`;

        console.log('expected_plot', expected_plot);
        console.log('plotdata_str', plotdata_str);
        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
