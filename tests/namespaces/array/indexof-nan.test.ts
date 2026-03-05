import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('Array indexOf with NaN/na Values', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('indexof finds na values in array', async () => {
        const { result } = await pineTS.run(($) => {
            const { na, array } = $.pine;

            let a = array.new_float(3, na);
            let idx = a.indexof(na);
            return { idx };
        });

        // indexOf should find NaN at index 0
        expect(result.idx[0]).toBe(0);
    });

    it('indexof finds na among mixed values', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na, array } = $.pine;

            let a = array.new_float(0);
            a.push(1.0);
            a.push(2.0);
            a.push(na);
            a.push(4.0);
            let idx = a.indexof(na);
            return { idx };
        });

        // na is at index 2
        expect(result.idx[0]).toBe(2);
    });

    it('indexof returns -1 when na not present', async () => {
        const { result } = await pineTS.run(($) => {
            const { na, array } = $.pine;

            let a = array.new_float(0);
            a.push(1.0);
            a.push(2.0);
            a.push(3.0);
            let idx = a.indexof(na);
            return { idx };
        });

        // No NaN in array, should return -1
        expect(result.idx[0]).toBe(-1);
    });

    it('indexof still works for regular values', async () => {
        const { result } = await pineTS.run(($) => {
            const { array } = $.pine;

            let a = array.new_float(0);
            a.push(10.0);
            a.push(20.0);
            a.push(30.0);
            let idx = a.indexof(20.0);
            return { idx };
        });

        // 20.0 is at index 1
        expect(result.idx[0]).toBe(1);
    });

    it('min/indexof pattern works with na values', async () => {
        const { result } = await pineTS.run(($) => {
            const { na, array, math } = $.pine;

            // Simulate the SuperTrend AI pattern: dist array with potential NaN
            let dist = array.new_float(0);
            dist.push(math.abs(0.5 - 0.1));
            dist.push(math.abs(0.5 - 0.5));
            dist.push(math.abs(0.5 - 0.9));
            let minVal = dist.min();
            let idx = dist.indexof(minVal);
            return { idx, minVal };
        });

        // min is 0 (|0.5 - 0.5|), at index 1
        expect(result.idx[0]).toBe(1);
        expect(result.minVal[0]).toBe(0);
    });
});
