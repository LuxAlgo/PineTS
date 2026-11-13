import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Expected values are TradingView's output for the same script.
describe('a loop whose body ends with another loop', () => {
    it('takes the value of the nested loop', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("nested loop value")
r8 = for i = 0 to 1
    for j = 0 to 1
        i * 10.0 + j
plot(r8, "v8")
float r9 = if close > 0
    for i = 0 to 2
        i * 3.0
else
    -1.0
plot(r9, "v9")
`);
        expect(plots.v8.data.at(-1).value).toBe(11);
        expect(plots.v9.data.at(-1).value).toBe(6);
    });
});
