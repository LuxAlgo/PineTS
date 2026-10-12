import { describe, expect, it } from 'vitest';
import { PineTS } from 'index';
import { Provider } from '@pinets/marketData/Provider.class';

// transformFunctionArgument resolved a bare identifier argument through
// getVariable(), which only holds GLOBAL registrations - a function parameter
// of the same name (localSeriesVars) lost the precedence and the call
// argument became $.var.glb1_htf (the global UDT). Pine semantics: the
// parameter shadows the global.
describe('function parameter shadowing a global var', () => {
    it('the parameter wins when passed as a nested user-function call argument', async () => {
        const src = `//@version=6
indicator("shadow-arg")
type T
    int v
var T htf = T.new()
htf.v := 99
inner(string s) =>
    "got:" + s
outer(string htf) =>
    inner(htf)
plot(outer("PARAM"))
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
        const { plots } = await pineTS.run(src);

        const data = plots[Object.keys(plots)[0]].data;
        expect(data.length).toBeGreaterThan(0);
        expect(data[data.length - 1].value).toBe('got:PARAM');
    });
});