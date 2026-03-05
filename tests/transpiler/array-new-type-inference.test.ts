import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('Array Type Inference for UDTs', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('array.new with UDT type infers element type', async () => {
        const code = `
//@version=5
indicator("Array UDT Type Inference")

type mytype
    float value = 0
    int count = 0

var holder = array.new<mytype>(0)

if barstate.isfirst
    holder.push(mytype.new(10.0, 1))
    holder.push(mytype.new(20.0, 2))

first = holder.get(0)
second = holder.get(1)
plot(holder.size(), "size")
plot(first.value, "first_value")
plot(second.count, "second_count")
`;
        const { plots } = await pineTS.run(code);

        expect(plots['size'].data[0].value).toBe(2);
        expect(plots['first_value'].data[0].value).toBe(10);
        expect(plots['second_count'].data[0].value).toBe(2);
    });

    it('array.new with UDT supports push and get', async () => {
        const code = `
//@version=5
indicator("Array UDT Push/Get")

type item
    float factor = 1.0

var holder = array.new<item>(0)

if barstate.isfirst
    holder.push(item.new(10.0))
    holder.push(item.new(20.0))
    holder.push(item.new(30.0))

// Access elements via get and read field
first = holder.get(0)
second = holder.get(1)
third = holder.get(2)

plot(first.factor, "first")
plot(second.factor, "second")
plot(third.factor, "third")
`;
        const { plots } = await pineTS.run(code);

        expect(plots['first'].data[0].value).toBe(10);
        expect(plots['second'].data[0].value).toBe(20);
        expect(plots['third'].data[0].value).toBe(30);
    });

    it('array of UDTs with field iteration', async () => {
        const code = `
//@version=5
indicator("Array UDT Field Iteration")

type entry
    float perf = 0

var holder = array.new<entry>(0)

if barstate.isfirst
    holder.push(entry.new(10.0))
    holder.push(entry.new(20.0))
    holder.push(entry.new(30.0))

// Iterate and collect perf values
data = array.new<float>(0)
for element in holder
    data.push(element.perf)

plot(data.avg(), "avg_perf")
plot(data.size(), "count")
`;
        const { plots } = await pineTS.run(code);

        // avg of 10, 20, 30 = 20
        expect(plots['avg_perf'].data[0].value).toBe(20);
        expect(plots['count'].data[0].value).toBe(3);
    });
});
