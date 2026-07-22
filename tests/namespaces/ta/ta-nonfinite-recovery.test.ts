import { describe, expect, it } from 'vitest';
import { Series } from '../../../src/Series';
import { cci } from '../../../src/namespaces/ta/methods/cci';
import { highest } from '../../../src/namespaces/ta/methods/highest';
import { lowest } from '../../../src/namespaces/ta/methods/lowest';
import { stdev } from '../../../src/namespaces/ta/methods/stdev';

type TaContext = {
    idx: number;
    readonly precision: (value: number) => number;
    readonly taState: Record<string, object>;
};

function makeContext(): TaContext {
    return {
        idx: 0,
        precision: (value) => Math.round(value * 1e10) / 1e10,
        taState: {},
    };
}

describe('TA exact-window non-finite recovery', () => {
    it('recovers stdev when Infinity leaves the lookback window', () => {
        const context = makeContext();
        const calculate = stdev(context);
        const values = [1, 2, Infinity, 4, 5, 6];

        let result = NaN;
        for (let index = 0; index < values.length; index += 1) {
            context.idx = index;
            result = calculate(new Series(values.slice(0, index + 1)), 3, true, 'stdev_nonfinite');
        }

        expect(result).toBe(0.8164965809);
    });

    it('recovers CCI when Infinity leaves the lookback window', () => {
        const context = makeContext();
        const calculate = cci(context);
        const values = [1, 2, Infinity, 4, 5, 6];

        let result = NaN;
        for (let index = 0; index < values.length; index += 1) {
            context.idx = index;
            result = calculate(new Series(values.slice(0, index + 1)), 3, 'cci_nonfinite');
        }

        expect(result).toBe(100);
    });

    it('rejects non-finite and non-integer extrema lengths before updating state', () => {
        const highestContext = makeContext();
        const lowestContext = makeContext();
        const source = new Series([1, 2]);

        expect(highest(highestContext)(source, Infinity, 'highest_infinite_length')).toBeNaN();
        expect(lowest(lowestContext)(source, Infinity, 'lowest_infinite_length')).toBeNaN();
        expect(highest(highestContext)(source, 1.5, 'highest_fractional_length')).toBeNaN();
        expect(lowest(lowestContext)(source, 1.5, 'lowest_fractional_length')).toBeNaN();
    });
});
