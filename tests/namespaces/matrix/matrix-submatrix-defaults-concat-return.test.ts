import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Expected values are TradingView's output for the same script.
describe('matrix.submatrix defaults and matrix.concat result', () => {
    it('defaults the submatrix bounds to the whole matrix and returns id1 from concat', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("submatrix / concat")
f = matrix.new<float>(4, 4, 0.0)
subd = matrix.submatrix(f, 2)
plot(matrix.rows(subd), "f9")
plot(matrix.columns(subd), "f9c")

c1 = matrix.new<float>(2, 2, 1.0)
c2 = matrix.new<float>(2, 2, 5.0)
matrix.set(c2, 1, 0, 7.0)
ret = matrix.concat(c1, c2)
plot(matrix.rows(c1), "g1")
plot(matrix.rows(ret), "g2")
plot(matrix.get(ret, 3, 0), "g3")
matrix.set(ret, 0, 0, 99.0)
plot(matrix.get(c1, 0, 0), "g4")
plot(matrix.rows(c2), "g5")
`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect([last('f9'), last('f9c')]).toEqual([2, 4]);
        expect([last('g1'), last('g2'), last('g3'), last('g4'), last('g5')]).toEqual([4, 4, 7, 99, 2]);
    });
});
