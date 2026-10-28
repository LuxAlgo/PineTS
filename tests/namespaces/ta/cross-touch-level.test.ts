import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const at = (plot: any, day: string) => plot.data.find((p: any) => new Date(p.time).toISOString().startsWith(day))?.value;

// TradingView's ta.cross is a change of `a > b`, not crossover or crossunder: a series that touches a
// level and falls back (3 -> 2 against 3) is a crossunder but not a cross. Values are TradingView's.
describe('ta.cross on a level touch', () => {
    it('crosses on 3 -> 4 but not on 3 -> 2 against 3', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("cross touch")
ramp = bar_index % 7
touch = bar_index % 4 == 2 ? 3 : 2
plot(ta.crossover(ramp, 3) ? 1 : 0, "rampOver")
plot(ta.cross(ramp, 3) ? 1 : 0, "rampCross")
plot(ta.crossunder(touch, 3) ? 1 : 0, "touchUnder")
plot(ta.cross(touch, 3) ? 1 : 0, "touchCross")
`);
        // 2019-06-03: ramp goes 3 -> 4 (crossover and cross).
        expect([at(plots.rampOver, '2019-06-03'), at(plots.rampCross, '2019-06-03')]).toEqual([1, 1]);
        // 2019-06-17: touch goes 3 -> 2 (crossunder, no cross).
        expect([at(plots.touchUnder, '2019-06-17'), at(plots.touchCross, '2019-06-17')]).toEqual([1, 0]);
    });
});
