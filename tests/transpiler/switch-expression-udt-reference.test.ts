import { describe, expect, it } from 'vitest';
import { PineTS } from 'index';
import { Provider } from '@pinets/marketData/Provider.class';

// The switch expression rewrites into an IIFE on the RHS of a PLAIN
// assignment. The AssignmentExpression handler only traversed IIFEs for
// rewritten compound assignments ($.set CallExpression), so the branch
// bodies kept the bare Pine name and threw
// "ReferenceError: t is not defined" at runtime.
describe('switch-expression IIFE inside a plain assignment', () => {
    it('renames the UDT variable inside the switch branches', async () => {
        const src = `//@version=6
indicator("switch-udt-ref")
type T
    int x
    string label
var T t = T.new()
t.x := 5
if bar_index == 0
    t.label := switch
        t.x > 3 =>
            'big'
        =>
            ''
plot(t.x)
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
        const { plots } = await pineTS.run(src);

        const data = plots[Object.keys(plots)[0]].data;
        expect(data.length).toBeGreaterThan(0);
        // t.x = 5 everywhere; the switch branch must evaluate t.x > 3 -> 'big'
        for (const d of data) expect(d.value).toBe(5);
    });
});