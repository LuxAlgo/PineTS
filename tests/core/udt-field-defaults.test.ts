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

    // ---- Explicit `= na` defaults ------------------------------------------
    // `float x = na` used to store the runtime `na` helper object in the field
    // instead of NaN. `na(obj.x)` masked it, but `nz(obj.x, v)` returned the
    // helper untouched, and pushing it into a typed array then threw
    // "An argument of 'literal object' type was used but a 'float' is expected".
    it('explicit `= na` defaults resolve to a real na (NaN), not the na helper object', async () => {
        const code = `
//@version=6
indicator("UDT na Defaults")

type mytype
    float x = na
    int   i = na

var mytype obj = mytype.new()
var array<float> arr = array.new<float>()
arr.unshift(nz(obj.x, 50))
plot(arr.get(0), "nz_x")
plot(na(obj.x) ? 1 : 0, "x_is_na")
plot(nz(obj.i, 7), "nz_i")
plot(obj.x + 1, "x_plus_1")
`;
        const { plots } = await pineTS.run(code);

        // nz() must see the field as na and return the replacement.
        expect(plots['nz_x'].data[0].value).toBe(50);
        expect(plots['nz_i'].data[0].value).toBe(7);
        expect(plots['x_is_na'].data[0].value).toBe(1);
        // Arithmetic on the field must yield NaN, not "[object Object]1".
        expect(plots['x_plus_1'].data[0].value).toBeNaN();
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

    // ---- Named-args regression baseline ------------------------------------
    // These tests cover the WORKING shapes of UDT.new() so that any future
    // change to the named-args detection in Core.ts does not silently regress
    // the cases that already work. The mixed-positional+named shape is not
    // covered here on purpose — that case is broken today and is tracked
    // separately.
    it('all-named args fill all fields', async () => {
        const code = `
//@version=5
indicator("UDT All Named")

type mytype
    float perf = 0
    int trend = 0

obj = mytype.new(perf = 42.5, trend = 7)
plot(obj.perf, "perf")
plot(obj.trend, "trend")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['perf'].data[0].value).toBe(42.5);
        expect(plots['trend'].data[0].value).toBe(7);
    });

    it('all-named args in non-declaration order fill correctly', async () => {
        const code = `
//@version=5
indicator("UDT Named Reordered")

type mytype
    float perf = 0
    int trend = 0
    bool active = false

// Names in reverse order vs the type declaration
obj = mytype.new(active = true, trend = 5, perf = 1.5)
plot(obj.perf, "perf")
plot(obj.trend, "trend")
plot(obj.active ? 1 : 0, "active")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['perf'].data[0].value).toBe(1.5);
        expect(plots['trend'].data[0].value).toBe(5);
        expect(plots['active'].data[0].value).toBe(1);
    });

    it('partial named args fall back to defaults', async () => {
        const code = `
//@version=5
indicator("UDT Partial Named")

type mytype
    float perf = 9.9
    int trend = 3
    bool active = true

// Override only one field — the others should keep their declared defaults
obj = mytype.new(perf = 1.0)
plot(obj.perf, "perf")
plot(obj.trend, "trend")
plot(obj.active ? 1 : 0, "active")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['perf'].data[0].value).toBe(1.0);
        expect(plots['trend'].data[0].value).toBe(3);
        expect(plots['active'].data[0].value).toBe(1);
    });

    it('all-positional args (existing behavior baseline)', async () => {
        const code = `
//@version=5
indicator("UDT All Positional")

type mytype
    float perf = 0
    int trend = 0
    bool active = false

obj = mytype.new(2.5, 8, true)
plot(obj.perf, "perf")
plot(obj.trend, "trend")
plot(obj.active ? 1 : 0, "active")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['perf'].data[0].value).toBe(2.5);
        expect(plots['trend'].data[0].value).toBe(8);
        expect(plots['active'].data[0].value).toBe(1);
    });

    it('mixed positional + named args (Range-Average-Retest pattern)', async () => {
        // This is the exact shape that motivated the fix:
        //   trade.new(p1, p2, ..., tradeColor = ..., dir = -1)
        // Two positional args, then one or more named args. The trailing
        // named-args object must NOT be assigned to the third field — it
        // should be split out and applied by name.
        const code = `
//@version=5
indicator("UDT Mixed Positional Named")

type mytype
    float perf = 0
    int trend = 0
    bool active = false
    int dir

obj = mytype.new(2.5, 8, dir = -1)
plot(obj.perf, "perf")
plot(obj.trend, "trend")
plot(obj.active ? 1 : 0, "active")
plot(obj.dir, "dir")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['perf'].data[0].value).toBe(2.5);
        expect(plots['trend'].data[0].value).toBe(8);
        // active was skipped — falls back to declared default `false`
        expect(plots['active'].data[0].value).toBe(0);
        // dir was passed as a named arg AFTER positionals — must be -1, not undefined
        expect(plots['dir'].data[0].value).toBe(-1);
    });

    it('mixed positional + multiple named args', async () => {
        // 8 positional + 2 named args (the actual shape from
        // Range-Average-Retest's trade.new call).
        const code = `
//@version=5
indicator("UDT Mixed 8+2")

type trade
    float entry
    float top
    float bottom
    int   topColor
    int   bottomColor
    int   startTime
    int   endTime
    int   startLineTime
    int   tradeColor
    bool  openTrade = true
    int   dir

t = trade.new(100.0, 110.0, 90.0, 1, 2, 1000, 1000, 500, tradeColor = 99, dir = -1)
plot(t.entry, "entry")
plot(t.top, "top")
plot(t.bottom, "bottom")
plot(t.startLineTime, "startLineTime")
plot(t.tradeColor, "tradeColor")
plot(t.openTrade ? 1 : 0, "openTrade")
plot(t.dir, "dir")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['entry'].data[0].value).toBe(100);
        expect(plots['top'].data[0].value).toBe(110);
        expect(plots['bottom'].data[0].value).toBe(90);
        expect(plots['startLineTime'].data[0].value).toBe(500);
        // tradeColor must be the named value 99, NOT a {tradeColor:..., dir:...} object
        expect(plots['tradeColor'].data[0].value).toBe(99);
        // openTrade was skipped — falls back to declared default `true`
        expect(plots['openTrade'].data[0].value).toBe(1);
        // dir must be -1
        expect(plots['dir'].data[0].value).toBe(-1);
    });
});
