import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Issue #257: a built-in *variable* (ta.obv, ta.tr, ta.vwap) as the request.security expression
// reached the secondary context without its request.param wrapper and the script threw.
// On TradingView the bare variable and an expression over it give the same series
// (ta.obv and ta.obv * 1.0 both read 119037.064 on BINANCE:BTCUSDC, monthly from weekly).
describe('request.security with a built-in variable expression', () => {
    it('matches the expression form on a higher timeframe', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2019-01-01').getTime(), new Date('2019-05-01').getTime());
        const { plots } = await pineTS.run(`//@version=5
indicator("security builtin variable")
plot(request.security(syminfo.tickerid, "W", ta.obv), "obv")
plot(request.security(syminfo.tickerid, "W", ta.obv * 1.0), "obvExpr")
plot(request.security(syminfo.tickerid, "W", ta.tr), "tr")
plot(request.security(syminfo.tickerid, "W", ta.tr(true)), "trCall")
`);
        const values = (k: string) => plots[k].data.map((p: any) => p.value);
        expect(values('obv')).toEqual(values('obvExpr'));
        expect(values('tr').slice(14)).toEqual(values('trCall').slice(14));
        expect(values('obv').some((v: number) => Number.isFinite(v) && v !== 0)).toBe(true);
    });
});
