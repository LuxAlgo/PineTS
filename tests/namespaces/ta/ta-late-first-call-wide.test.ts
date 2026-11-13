// SPDX-License-Identifier: AGPL-3.0-only
// Window functions first called on a later bar (bar 9, inside an if) see only their own calls, as on
// TradingView: no history before the first call. Every expected value was read on TradingView
// (BINANCE:BTCUSDC, 1W, chart starting 2018-12-10) from the same script.

import { describe, expect, it } from 'vitest';
import { PineTS, Provider } from 'index';

const N = NaN;
const BARS = [9, 10, 11, 12, 13, 14, 15, 20, 40];

describe('ta.* first called on a later bar (TradingView parity)', () => {
    const FUNCS: Record<string, { call: string; tv: number[] }> = {
        sma: { call: 'ta.sma(close, 5)', tv: [N, N, N, N, 3799.874, 3868.778, 3943.074, 5303.52, 10126.808] },
        ema: { call: 'ta.ema(close, 5)', tv: [N, N, N, N, 3799.874, 3857.603, 3936.108, 5204.442, 10203.55] },
        rma: { call: 'ta.rma(close, 5)', tv: [N, N, N, N, 3799.874, 3834.511, 3886.233, 4872.586, 10171.739] },
        wma: { call: 'ta.wma(close, 5)', tv: [N, N, N, N, 3856.731, 3914.459, 3989.24, 5372.481, 10149.16] },
        hma: { call: 'ta.hma(close, 5)', tv: [N, N, N, N, N, 4028.746, 4087.182, 5545.561, 10224.605] },
        alma: { call: 'ta.alma(close, 5, 0.85, 6)', tv: [N, N, N, N, 3909.626, 3959.098, 4019.832, 5396.376, 10204.901] },
        swma: { call: 'ta.swma(close)', tv: [N, N, N, 3756.438, 3842.168, 3914.468, 3978.468, 5295.867, 10201.818] },
        vwma: { call: 'ta.vwma(close, 5)', tv: [N, N, N, N, 3795.598, 3856.533, 3937.75, 5321.921, 10127.694] },
        linreg: { call: 'ta.linreg(close, 5, 0)', tv: [2177.124, 3684.4, 4485.142, 4596.71, 3970.444, 4005.822, 4081.572, 5510.404, 10193.864] },
        stdev: { call: 'ta.stdev(close, 5)', tv: [N, N, N, N, 120.982, 100.083, 101.156, 211.478, 225.829] },
        variance: { call: 'ta.variance(close, 5)', tv: [N, N, N, N, 14636.664, 10016.513, 10232.566, 44722.785, 50998.74] },
        dev: { call: 'ta.dev(close, 5)', tv: [N, N, N, N, 105.925, 92.514, 81.587, 164.128, 187.69] },
        median: { call: 'ta.median(close, 5)', tv: [N, N, N, N, 3784.63, 3897.55, 3967.01, 5192.3, 10136.39] },
        pli: { call: 'ta.percentile_linear_interpolation(close, 5, 50)', tv: [N, N, N, N, 3784.63, 3897.55, 3967.01, 5192.3, 10136.39] },
        pnr: { call: 'ta.percentile_nearest_rank(close, 5, 50)', tv: [N, N, N, N, 3784.63, 3897.55, 3967.01, 5192.3, 10136.39] },
        prank: { call: 'ta.percentrank(close, 5)', tv: [0, 20, 40, 60, 80, 100, 100, 100, 20] },
        highest: { call: 'ta.highest(high, 5)', tv: [3652.61, 4184.27, 4184.27, 4184.27, 4184.27, 4184.27, 4130, 5825, 10952.1] },
        lowest: { call: 'ta.lowest(low, 5)', tv: [3520.1, 3520.1, 3520.1, 3520.1, 3520.1, 3613.87, 3655.25, 4050, 9315.07] },
        hbars: { call: 'ta.highestbars(high, 5)', tv: [0, 0, -1, -2, -3, -4, 0, 0, -4] },
        lbars: { call: 'ta.lowestbars(low, 5)', tv: [0, -1, -2, -3, -4, -4, -4, -4, -3] },
        change: { call: 'ta.change(close, 3)', tv: [N, N, N, 269.01, 245.37, 188.43, 195.57, 552.28, 267.25] },
        mom: { call: 'ta.mom(close, 3)', tv: [N, N, N, 269.01, 245.37, 188.43, 195.57, 552.28, 267.25] },
        roc: { call: 'ta.roc(close, 3)', tv: [N, N, N, 7.414, 6.593, 4.979, 5.018, 10.7, 2.739] },
        rsi: { call: 'ta.rsi(close, 5)', tv: [N, N, N, N, N, 100, 100, 90.356, 46.493] },
        cmo: { call: 'ta.cmo(close, 5)', tv: [N, N, N, N, N, 100, 100, 82.253, -18.517] },
        mfi: { call: 'ta.mfi(hlc3, 5)', tv: [N, N, N, N, 68.441, 80.249, 79.175, 100, 21.51] },
        cci: { call: 'ta.cci(close, 5)', tv: [N, N, N, N, 105.192, 75.146, 122.606, 166.667, -35.87] },
        stoch: { call: 'ta.stoch(close, high, low, 5)', tv: [81.835, 30.345, 39.829, 56.83, 67.288, 62.972, 92.232, 93.737, 43.417] },
        rci: { call: 'ta.rci(close, 5)', tv: [70.711, 89.443, 97.468, 100, 100, 100, 100, 30, 10] },
        cog: { call: 'ta.cog(close, 5)', tv: [N, N, N, N, -2.955, -2.965, -2.965, -2.961, -2.993] },
        corr: { call: 'ta.correlation(close, open, 5)', tv: [N, N, N, N, 0.931, 0.962, 0.912, 0.188, -0.268] },
        range: { call: 'ta.range(close, 5)', tv: [N, N, N, N, 338.47, 251.42, 308.49, 560.94, 639.7] },
        msum: { call: 'math.sum(close, 5)', tv: [N, N, N, N, 18999.37, 19343.89, 19715.37, 26517.6, 50634.04] },
        atr: { call: 'ta.atr(5)', tv: [N, N, N, N, 294.398, 273.358, 272.437, 598.948, 1257.278] },
        mode: { call: 'ta.mode(close, 5)', tv: [N, N, N, N, 3628.54, 3721.64, 3784.63, 5152.9, 9758.57] },
    };

    it('matches TradingView for every window function, warm-up included', async () => {
        const names = Object.keys(FUNCS);
        let code = '//@version=6\nindicator("late")\n';
        for (const n of names) code += `float v_${n} = na\n`;
        code += 'if bar_index >= 9\n';
        for (const n of names) code += `    v_${n} := ${FUNCS[n].call}\n`;
        for (const n of names) code += `plot(v_${n}, "${n}")\n`;

        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-12-30').getTime());
        const { plots } = await pineTS.run(code);
        for (const n of names) {
            const data = plots[n].data;
            BARS.forEach((bar, i) => {
                const want = FUNCS[n].tv[i];
                const got = data[bar].value;
                if (Number.isNaN(want)) expect(Number.isNaN(got), `${n} at bar ${bar}: ${got}`).toBe(true);
                else expect(Math.abs(got - want), `${n} at bar ${bar}: ${got} vs ${want}`).toBeLessThanOrEqual(1e-3 * Math.max(1, Math.abs(want)));
            });
        }
    }, 60000);
});
