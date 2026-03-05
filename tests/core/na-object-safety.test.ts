import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('na() with Object Types', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('na() returns false for UDT instances', async () => {
        const code = `
//@version=5
indicator("na UDT Test")

type Trade
    float entry
    float stop

obj = Trade.new(100.0, 90.0)
plot(na(obj) ? 1 : 0, "is_na")
`;
        const { plots } = await pineTS.run(code);

        // A valid UDT instance should not be na
        expect(plots['is_na'].data[0].value).toBe(0);
    });

    it('na() returns true for uninitialized variable', async () => {
        const code = `
//@version=5
indicator("na Uninit Test")

type Trade
    float entry
    float stop

var Trade obj = na
plot(na(obj) ? 1 : 0, "is_na")
`;
        const { plots } = await pineTS.run(code);

        // An uninitialized (na) variable should be na
        expect(plots['is_na'].data[0].value).toBe(1);
    });

    it('na() handles UDT arrays without crashing', async () => {
        const code = `
//@version=5
indicator("na UDT Array Test")

type Item
    float value = 0
    int count = 0

var holder = array.new<Item>(0)

if barstate.isfirst
    holder.push(Item.new())
    holder.push(Item.new(42.0, 3))

plot(holder.size(), "size")
plot(na(holder.get(0)) ? 1 : 0, "first_na")
`;
        const { plots } = await pineTS.run(code);

        expect(plots['size'].data[0].value).toBe(2);
        // The first item is a valid UDT instance, not na
        expect(plots['first_na'].data[0].value).toBe(0);
    });
});
