import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Pine has no switch-level break: `break` / `continue` in a switch arm act on the enclosing loop.
// Expected values are TradingView's output for the same script.
describe('break and continue inside switch arms', () => {
    it('exit or skip the enclosing loop', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("switch loop jumps")
int c1 = 0
int e1 = 0
int d1 = 0
for i = 0 to 9
    c1 += 1
    switch i % 3
        2 =>
            e1 += 1
            break
        =>
            d1 += 1

int w2 = 0
int c2 = 0
int o2 = 0
while w2 < 8
    w2 += 1
    switch w2 % 2
        0 => continue
        =>
            o2 += w2
    c2 += 1

_a4 = array.from(1, 2, 3, 4, 5)
int s4 = 0
for x in _a4
    switch x
        4 => break
        =>
            s4 += x

plot(c1, "c1")
plot(e1, "e1")
plot(d1, "d1")
plot(c2, "c2")
plot(o2, "o2")
plot(s4, "s4")
`);
        const last = (k: string) => plots[k].data.at(-1).value;
        expect([last('c1'), last('e1'), last('d1')]).toEqual([3, 1, 2]);
        expect([last('c2'), last('o2')]).toEqual([4, 16]);
        expect(last('s4')).toBe(6);
    });
});
