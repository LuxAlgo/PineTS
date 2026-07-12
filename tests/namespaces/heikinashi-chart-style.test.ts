import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';
import { splitTickerModifier, stripTickerModifier, withTickerModifier } from '../../src/tickerModifier';

const RANGE = [new Date('2025-01-01').getTime(), new Date('2025-03-01').getTime()] as const;

describe('Heikin-Ashi chart style (extended tickers + chartStyle)', () => {
    it('tickerModifier helpers split/strip/append the chart-type suffix', () => {
        expect(splitTickerModifier('BINANCE:BTCUSDT;heikinashi')).toEqual({ symbol: 'BINANCE:BTCUSDT', modifier: 'heikinashi' });
        expect(splitTickerModifier('BINANCE:BTCUSDT')).toEqual({ symbol: 'BINANCE:BTCUSDT', modifier: null });
        expect(splitTickerModifier('BTCUSDT;unknownthing')).toEqual({ symbol: 'BTCUSDT;unknownthing', modifier: null }); // unknown suffixes stay part of the symbol
        expect(stripTickerModifier('BTCUSDT;heikinashi')).toBe('BTCUSDT');
        expect(withTickerModifier('BTCUSDT', 'heikinashi')).toBe('BTCUSDT;heikinashi');
        expect(withTickerModifier('BTCUSDT;heikinashi', 'heikinashi')).toBe('BTCUSDT;heikinashi'); // idempotent
    });

    it('ticker.heikinashi() appends the modifier; ticker.standard() strips it; ticker.inherit() propagates it', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, RANGE[0], RANGE[1]);
        const { result } = await pineTS.run((context) => {
            const ha = ticker.heikinashi(syminfo.tickerid);
            const std = ticker.standard(ha);
            const stdNoArg = ticker.standard();
            const inheritHa = ticker.inherit(ha, 'BINANCE:ETHUSDT');
            const inheritStd = ticker.inherit(std, 'BINANCE:ETHUSDT');
            return { ha, std, stdNoArg, inheritHa, inheritStd };
        });
        expect(result.ha[0]).toBe('BINANCE:BTCUSDC;heikinashi');
        expect(result.std[0]).toBe('BINANCE:BTCUSDC');
        expect(result.stdNoArg[0]).toBe('BINANCE:BTCUSDC');
        expect(result.inheritHa[0]).toBe('BINANCE:ETHUSDT;heikinashi'); // chart type inherited
        expect(result.inheritStd[0]).toBe('BINANCE:ETHUSDT');
    });

    it('default chart: is_standard true, is_heikinashi false, tickerid clean', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, RANGE[0], RANGE[1]);
        const { result } = await pineTS.run((context) => {
            const isStd = chart.is_standard; // Pine variables — bare member access
            const isHa = chart.is_heikinashi;
            const tid = syminfo.tickerid;
            return { isStd, isHa, tid };
        });
        expect(result.isStd[0]).toBe(true);
        expect(result.isHa[0]).toBe(false);
        expect(result.tid[0]).toBe('BINANCE:BTCUSDC');
    });

    it('an extended constructor ticker IS the chart type: predicates flip and syminfo.tickerid gains the suffix', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC;heikinashi', 'D', null, RANGE[0], RANGE[1]);
        const { result } = await pineTS.run((context) => {
            const isStd = chart.is_standard; // Pine variables — bare member access
            const isHa = chart.is_heikinashi;
            const tid = syminfo.tickerid;
            const std = ticker.standard(); // strips the modifier back off
            return { isStd, isHa, tid, std };
        });
        expect(result.isStd[0]).toBe(false);
        expect(result.isHa[0]).toBe(true);
        expect(result.tid[0]).toBe('BINANCE:BTCUSDC;heikinashi');
        expect(result.std[0]).toBe('BINANCE:BTCUSDC');
    });

    it('REAL Pine source: bare chart.is_* member access resolves as a VARIABLE through the transpiler', async () => {
        // Locks the transpiler contract the getters rely on: non-computed `chart.*` member
        // access is a plain property read (like syminfo.tickerid / barstate.islast), NOT
        // auto-converted to a call (the ta.tr / math.pi constant treatment).
        const src = `//@version=5
indicator("probe")
v1 = chart.is_heikinashi ? 1 : 0
v2 = chart.is_standard ? 1 : 0
plot(v1, "v1")
plot(v2, "v2")
`;
        const onHa = new PineTS(Provider.Mock, 'BTCUSDC;heikinashi', 'D', null, RANGE[0], RANGE[1]);
        const haCtx: any = await onHa.run(src);
        const last = (ctx: any, k: string): number => {
            const d = ctx.plots[k].data;
            return d[d.length - 1].value;
        };
        expect(last(haCtx, 'v1')).toBe(1);
        expect(last(haCtx, 'v2')).toBe(0);

        const onStd = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, RANGE[0], RANGE[1]);
        const stdCtx: any = await onStd.run(src);
        expect(last(stdCtx, 'v1')).toBe(0);
        expect(last(stdCtx, 'v2')).toBe(1);
    });

    it('a bundled provider strips the modifier: security on an extended ticker still serves data', async () => {
        // The Mock provider must never see ";heikinashi" — the strip at the provider
        // boundary means the request degrades to standard candles instead of failing.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, RANGE[0], RANGE[1]);
        const { result } = await pineTS.run((context) => {
            const haClose = request.security(ticker.heikinashi(syminfo.tickerid), 'W', close);
            const stdClose = request.security(ticker.standard(syminfo.tickerid), 'W', close);
            return { haClose, stdClose };
        });
        // Standalone: both resolve to the SAME standard weekly closes (documented no-op).
        expect(result.haClose[0]).toBe(result.stdClose[0]);
        expect(Number.isFinite(result.haClose[0])).toBe(true);
    });

    it('same-tf shortcut is chart-type aware: standard request on a heikinashi chart builds a secondary', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC;heikinashi', 'D', null, RANGE[0], RANGE[1]);
        const { result } = await pineTS.run((context) => {
            // Same timeframe as the chart, EXPLICITLY standard: must not shortcut to the
            // chart's own (chart-typed) series. With the Mock provider both end up serving
            // the same standard data, so equality here just proves the call resolves.
            const viaStd = request.security(ticker.standard(syminfo.tickerid), 'D', close);
            // Same timeframe, chart's own tickerid (modifier included): shortcut path.
            const viaSelf = request.security(syminfo.tickerid, 'D', close);
            return { viaStd, viaSelf };
        });
        expect(Number.isFinite(result.viaStd[0])).toBe(true);
        expect(Number.isFinite(result.viaSelf[0])).toBe(true);
    });
});
