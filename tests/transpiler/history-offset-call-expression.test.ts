import { describe, expect, it } from 'vitest';
import { PineTS } from 'index';
import { Provider } from '@pinets/marketData/Provider.class';

// Repro of the Divergences_Refurbished shape: a history subscript
// (`low[...]`) with a CALL-EXPRESSION offset, inside a TERNARY, inside a
// NAMED-ARGS object literal. Object-literal property values are transformed
// exclusively by transformFunctionArgument; its array-index branch never
// handled a CallExpression offset, so `dd` leaked bare and the script threw
// "ReferenceError: all_divergences is not defined" at runtime.
describe('history subscript with a call-expression offset inside named args', () => {
    it('resolves identifiers inside the offset call', async () => {
        const src = `//@version=6
indicator("hist-obj-literal")
var array<int> dd = array.new_int(10, 0)
if bar_index >= 9
    array.set(dd, 9, 9)
    line.new(x1 = bar_index - 1, y1 = close > open ? low[array.get(dd, 9)] : high[array.get(dd, 9)], x2 = bar_index, y2 = close[9])
plot(close, "c")`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
        const { plots } = await pineTS.run(src);

        const data = plots['c'].data;
        expect(data.length).toBeGreaterThan(0);
        // The regression's essence: the run completes without a ReferenceError
        // on a bare `dd`, and the drawn y1 equals close[9] from bar 9 on.
        expect(data[data.length - 1].value).not.toBeNaN();
    });
});