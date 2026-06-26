import { describe, expect, it } from 'vitest';

import { PineTS, Provider } from 'index';
import { finalizeStrategyRun } from '../../../src/namespaces/strategy/utils';

/**
 * Compound Annual Growth Rate (%) of strategy equity over the backtest window.
 *
 * Mirrors the LuxAlgo `cagr()` Pine helper applied to the strategy leg:
 *   entry = (firstBarTime, initial_capital)
 *   exit  = (lastBarTime,  initial_capital + netprofit)
 *
 *   daysBetween = (lastBarTime − firstBarTime) / 86_400_000
 *   years       = daysBetween / 365
 *   CAGR%       = 100 × ((exit / entry) ^ (1 / years) − 1)
 *
 * finalizeStrategyRun reads context.marketData[0/last].openTime and
 * strategy.{initial_capital, netprofit}, then writes strategy.cagr (NaN when
 * the window is under a day or the figures are non-finite).
 */
function run(initial_capital: number, netprofit: number, firstTimeMs: number, lastTimeMs: number) {
    const context: any = {
        marketData: [{ openTime: firstTimeMs }, { openTime: lastTimeMs }],
        strategy: { config: {}, initial_capital, netprofit, _monthly_equity: [] },
    };
    finalizeStrategyRun(context);
    return context.strategy.cagr;
}

describe('finalizeStrategyRun — CAGR', () => {
    const DAY = 24 * 60 * 60 * 1000;

    it('computes the annualized growth rate with the documented formula', () => {
        // +20% over exactly 2 years → (1.2)^(1/(730/365)) − 1 = (1.2)^0.5 − 1
        const start = Date.UTC(2020, 0, 1);
        const end = start + 730 * DAY;
        const cagr = run(1000, 200, start, end);
        expect(cagr).toBeCloseTo(100 * (Math.pow(1.2, 365 / 730) - 1), 10);
    });

    it('handles a losing strategy (negative CAGR)', () => {
        const start = Date.UTC(2020, 0, 1);
        const end = start + 365 * DAY;
        const cagr = run(1000, -250, start, end); // exit 750 over 1 year → −25%
        expect(cagr).toBeCloseTo(-25, 6);
    });

    it('returns NaN when the window is shorter than one day', () => {
        const start = Date.UTC(2020, 0, 1);
        expect(run(1000, 200, start, start + 12 * 60 * 60 * 1000)).toBeNaN();
    });

    it('returns NaN with no market data', () => {
        const context: any = { strategy: { config: {}, initial_capital: 1000, netprofit: 200, _monthly_equity: [] } };
        finalizeStrategyRun(context);
        expect(context.strategy.cagr).toBeNaN();
    });
});

/**
 * Integration: the MACD strategy on BINANCE:BTCUSDT 1D
 * (2017-08-17 → 2026-04-24, 3235 daily bars). The strategy CAGR reported by
 * TradingView for this script/dataset is ≈ 2.12%.
 */
describe('Strategy CAGR — LuxAlgo MACD on BTCUSDT 1D', () => {
    it('reports a strategy CAGR of approximately 2.12%', async () => {
        const start = 1502928000000; // first bar openTime (ms)
        const end = 1782345600000; // last bar openTime (ms)
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDT', 'D', null, start, end);

        const source = `
//@version=6
strategy("MACD Strategy", "MACD Strategy", overlay = true)

fastLength = input.int(12, "Fast length")
slowlength = input.int(26, "Slow length")
MACDLength = input.int(9,  "MACD length")

MACD  = ta.ema(close, fastLength) - ta.ema(close, slowlength)
aMACD = ta.ema(MACD, MACDLength)
delta = MACD - aMACD

if ta.crossover(delta, 0) and bar_index > 1000
    strategy.entry("MacdLE", strategy.long, comment="MacdLE", qty = 5)
if ta.crossunder(delta, 0) and bar_index > 1000
    strategy.entry("MacdSE", strategy.short, comment="MacdSE", qty = 5)

plot(close)
`;

        const ctx: any = await pineTS.run(source);
        const s = ctx.strategy;

        // Sanity: the window spans ~8.86 years of daily bars.
        const days = (end - start) / (24 * 60 * 60 * 1000);
        expect(days).toBeCloseTo(3234, 0);

        // The reported strategy CAGR matches TradingView (~2.12%).
        // netprofit ≈ 204,682 on the 1,000,000 default capital over ~8.86
        // years → 100 × (1.204682 ^ (1/8.86) − 1) ≈ 2.124%.
        expect(s.cagr).toBeCloseTo(2.12, 2);
    });
});
