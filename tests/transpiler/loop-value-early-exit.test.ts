import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// A loop's value comes from the last iteration that reached the end of its body; an iteration cut
// short by break / continue keeps the previous value. Expected values are TradingView's.
describe('value of a trailing loop with an early exit', () => {
    it('keeps the value of the last completed iteration', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("loop early exit")
fBreakLead() =>
    for i = 0 to 10
        if i == 3
            break
        i * 100.0
fBreakTail() =>
    for i = 0 to 10
        if i == 2
            break
        i == 1 ? na : i * 10.0
fContFinal() =>
    for i = 0 to 3
        if i == 3
            continue
        i * 7.0
fWhileTail(int n) =>
    int j = 0
    while j < n
        j += 1
        if j == 1
            j * 1000.0
plot(nz(fBreakLead(), -1.0), "v1")
plot(nz(fBreakTail(), -3.0), "v2")
plot(nz(fContFinal(), -5.0), "v5")
plot(nz(fWhileTail(3), -9.0), "v6")
`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect([last('v1'), last('v2'), last('v5'), last('v6')]).toEqual([200, -3, 14, -9]);
    });
});
