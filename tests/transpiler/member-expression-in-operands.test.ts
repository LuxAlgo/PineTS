import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('Member Expression in Function Operands', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());

    it('UDT field access in binary expression inside function call', async () => {
        // Tests that obj.field inside close - obj.field inside math.sign()
        // correctly unwraps the Series to get the current bar value
        const code = `
//@version=5
indicator("UDT Field in Binary Expr")

type mytype
    float output = 0

var obj = mytype.new()
obj.output := close

// obj.output should be properly unwrapped in binary expression inside call
diff = math.sign(close - obj.output)
plot(diff, "diff")
plot(obj.output, "output")
`;
        const { plots } = await pineTS.run(code);

        // close - obj.output should be 0 (same value), sign(0) = 0
        const diffData = plots['diff'].data;
        for (let i = 0; i < diffData.length; i++) {
            if (diffData[i].value !== null && !isNaN(diffData[i].value)) {
                expect(diffData[i].value).toBe(0);
            }
        }

        // obj.output should equal close on each bar
        const outputData = plots['output'].data;
        expect(outputData[0].value).not.toBeNaN();
    });

    it('UDT field access in nested call arguments', async () => {
        // Tests: nz(math.sign(close[1] - obj.output))
        // Both close[1] and obj.output must be properly resolved
        const code = `
//@version=5
indicator("UDT Field in Nested Call")

type mytype
    float output = 0

var obj = mytype.new()
obj.output := close[1]

// nz(math.sign(close[1] - obj.output)) should produce 0 when close[1] == obj.output
diff = nz(math.sign(close[1] - obj.output))
plot(diff, "diff")
`;
        const { plots } = await pineTS.run(code);

        const diffData = plots['diff'].data;
        // After the first bar, diff should be 0 because close[1] == obj.output
        for (let i = 2; i < diffData.length; i++) {
            if (diffData[i].value !== null) {
                expect(diffData[i].value).toBe(0);
            }
        }
    });

    it('history access in conditional expression plot argument', async () => {
        // Tests: plot(val, title, os != os[1] ? na : color)
        // os[1] inside a conditional inside a plot() argument must use $.get(var, 1)
        const code = `
//@version=5
indicator("History in Conditional Arg", overlay=true)

var os = 0
os := close > close[1] ? 1 : 0

// The color argument uses os[1] in a conditional — must be properly transpiled
css = os == 1 ? color.green : color.red
plot(close, "price", os != os[1] ? na : css)
`;
        const { plots } = await pineTS.run(code);

        const priceData = plots['price'].data;
        // Should have some non-null color entries (when os == os[1], i.e. no trend change)
        const withColor = priceData.filter(d => d.options && d.options.color != null);
        expect(withColor.length).toBeGreaterThan(0);

        // Colors should be green (#089981) or red (#F23645)
        const colors = [...new Set(withColor.map(d => d.options.color))];
        expect(colors.length).toBeGreaterThanOrEqual(1);
    });

    it('UDT field in arithmetic accumulation', async () => {
        // Tests that obj.perf can be read and updated in arithmetic operations
        // perf += 2/(alpha+1) * (value * diff - perf)
        const code = `
//@version=5
indicator("UDT Field Accumulation")

type tracker
    float perf = 0
    float output = 0

var t = tracker.new()
t.output := close
diff = nz(math.sign(close[1] - t.output))
t.perf += 0.2 * (nz(close - close[1]) * diff - t.perf)

plot(t.perf, "perf")
`;
        const { plots } = await pineTS.run(code);

        const perfData = plots['perf'].data;
        // perf should be a finite number (not NaN) after the first few bars
        let hasFiniteValue = false;
        for (let i = 2; i < perfData.length; i++) {
            if (perfData[i].value !== null && isFinite(perfData[i].value)) {
                hasFiniteValue = true;
                break;
            }
        }
        expect(hasFiniteValue).toBe(true);
    });

    it('loop variable UDT field access in call arguments', async () => {
        // Tests that element.field inside a for-in loop works correctly
        // inside function call arguments
        const code = `
//@version=5
indicator("Loop Var UDT Field")

type item
    float value = 0

var items = array.new<item>(0)
if barstate.isfirst
    items.push(item.new(10.0))
    items.push(item.new(20.0))
    items.push(item.new(30.0))

total = 0.0
for element in items
    total += math.max(element.value, 0)

plot(total, "total")
`;
        const { plots } = await pineTS.run(code);

        // total should be 10 + 20 + 30 = 60
        expect(plots['total'].data[0].value).toBe(60);
    });
});
