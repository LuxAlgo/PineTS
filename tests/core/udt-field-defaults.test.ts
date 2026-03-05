import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('UDT Field Defaults', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('scalar defaults are applied', async () => {
        const code = `
//@version=5
indicator("UDT Scalar Defaults")

type mytype
    float perf = 0
    int trend = 0
    float output

obj = mytype.new()
plot(obj.perf, "perf")
plot(obj.trend, "trend")
plot(na(obj.output) ? 1 : 0, "output_is_na")
`;
        const { plots } = await pineTS.run(code);

        // perf should be 0 (the default), not NaN
        expect(plots['perf'].data[0].value).toBe(0);
        // trend should be 0 (the default), not NaN
        expect(plots['trend'].data[0].value).toBe(0);
        // output has no default, so it should be na
        expect(plots['output_is_na'].data[0].value).toBe(1);
    });

    it('series defaults are applied', async () => {
        const code = `
//@version=5
indicator("UDT Series Defaults")

type mytype
    float upper = hl2
    float lower = hl2

obj = mytype.new()
plot(obj.upper, "upper")
plot(hl2, "hl2")
`;
        const { plots } = await pineTS.run(code);

        // upper should default to hl2 on each bar
        const upperData = plots['upper'].data;
        const hl2Data = plots['hl2'].data;
        for (let i = 0; i < upperData.length; i++) {
            expect(upperData[i].value).toBe(hl2Data[i].value);
        }
    });

    it('positional args override defaults', async () => {
        const code = `
//@version=5
indicator("UDT Override Defaults")

type mytype
    float perf = 0
    int trend = 0

obj = mytype.new(42.5, 7)
plot(obj.perf, "perf")
plot(obj.trend, "trend")
`;
        const { plots } = await pineTS.run(code);

        // Positional args should override the defaults
        expect(plots['perf'].data[0].value).toBe(42.5);
        expect(plots['trend'].data[0].value).toBe(7);
    });

    it('defaults persist across bars with var', async () => {
        const code = `
//@version=5
indicator("UDT Var Defaults")

type mytype
    float perf = 0
    int trend = 0

var obj = mytype.new()
obj.perf := obj.perf + 1
plot(obj.perf, "perf")
`;
        const { plots } = await pineTS.run(code);

        // First bar: perf starts at 0 (default), incremented to 1
        expect(plots['perf'].data[0].value).toBe(1);
        // Second bar: perf was 1, incremented to 2
        expect(plots['perf'].data[1].value).toBe(2);
    });
});
