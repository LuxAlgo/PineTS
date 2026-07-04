import { describe, expect, it } from 'vitest';
import { finalizeStrategyRun } from '../../../src/namespaces/strategy/utils';

/**
 * Risk-adjusted performance ratios (Sharpe / Sortino).
 *
 * TV broker-emulator formula (confirmed against TV's Help Center docs and
 * reverse-engineered to ~3 decimals across 7 QA datasets, 2026-06-15):
 *   - monthly simple returns rᵢ = Eᵢ/Eᵢ₋₁ − 1, anchored at initial capital
 *   - RFR = risk_free_rate / 100 / 12   (annual % → monthly)
 *   - Sharpe  = (mean(r) − RFR) / SD,  SD = √(Σ(rᵢ − mean)² / N)   (population)
 *   - Sortino = (mean(r) − RFR) / DD,  DD = √(Σ min(0, rᵢ − RFR)² / N)
 *   - no annualization
 *
 * finalizeStrategyRun reads strategy.{config.risk_free_rate, initial_capital,
 * _monthly_equity} and writes strategy.{sharpe_ratio, sortino_ratio}. These
 * tests drive it directly with crafted monthly-equity series and assert
 * against independently hand-computed values.
 */
function run(initial_capital: number, monthly: number[], risk_free_rate = 2) {
    const context: any = { strategy: { config: { risk_free_rate }, initial_capital, _monthly_equity: monthly } };
    finalizeStrategyRun(context);
    return context.strategy;
}

describe('finalizeStrategyRun — Sharpe / Sortino', () => {
    // equities [1000, 1100, 1045, 1149.5] → returns [+0.10, −0.05, +0.10]
    //   mean 0.05, RFR 2/1200, SD (pop) 0.0707107, DD (target RFR) 0.0298298
    it('computes Sharpe and Sortino with the documented formula (rfr = 2%)', () => {
        const s = run(1000, [1100, 1045, 1149.5], 2);
        expect(s.sharpe_ratio).toBeCloseTo(0.6835366, 6);
        expect(s.sortino_ratio).toBeCloseTo(1.6203056, 6);
    });

    it('applies the risk-free rate as annual/1200 (rfr = 0 ⇒ no drag)', () => {
        const s = run(1000, [1100, 1045, 1149.5], 0);
        // mean/SD and mean/DD with no risk-free subtraction
        expect(s.sharpe_ratio).toBeCloseTo(0.7071068, 6);
        expect(s.sortino_ratio).toBeCloseTo(1.7320508, 6);
        // sanity: removing the +rfr drag raises both ratios vs the rfr=2 case
        const s2 = run(1000, [1100, 1045, 1149.5], 2);
        expect(s.sharpe_ratio).toBeGreaterThan(s2.sharpe_ratio);
        expect(s.sortino_ratio).toBeGreaterThan(s2.sortino_ratio);
    });

    it('anchors the first return at initial capital', () => {
        // First return is 1100/1000−1 = +0.10, not skipped. Drop the anchor
        // and the series would have only 2 returns from a different base.
        const s = run(1000, [1100, 1045, 1149.5], 2);
        // Independent recompute WITH the anchor must match.
        const eq = [1000, 1100, 1045, 1149.5];
        const r = eq.slice(1).map((e, i) => e / eq[i] - 1);
        const rfr = 2 / 1200, mean = r.reduce((a, b) => a + b, 0) / r.length;
        const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length);
        expect(s.sharpe_ratio).toBeCloseTo((mean - rfr) / sd, 10);
    });

    it('returns Sortino 0 when there is no downside (all returns above RFR)', () => {
        // equities [1000,1050,1160,1300] → returns all > 0 ⇒ DD = 0 ⇒ Sortino 0
        const s = run(1000, [1050, 1160, 1300], 2);
        expect(s.sortino_ratio).toBe(0);
        expect(s.sharpe_ratio).toBeCloseTo(2.9776482, 6);
    });

    it('returns Sharpe 0 on a flat equity curve (zero variance)', () => {
        const s = run(1000, [1000, 1000, 1000], 2);
        expect(s.sharpe_ratio).toBe(0);
        // every return (0) sits below RFR ⇒ downside exists ⇒ Sortino = −1
        expect(s.sortino_ratio).toBeCloseTo(-1, 10);
    });

    it('leaves both ratios at 0 with fewer than two monthly returns', () => {
        expect(run(1000, [1100], 2).sharpe_ratio).toBe(0);
        expect(run(1000, [1100], 2).sortino_ratio).toBe(0);
        expect(run(1000, [], 2).sharpe_ratio).toBe(0);
        expect(run(1000, [], 2).sortino_ratio).toBe(0);
    });

    it('defaults the risk-free rate to 2% when config omits it', () => {
        const context: any = { strategy: { config: {}, initial_capital: 1000, _monthly_equity: [1100, 1045, 1149.5] } };
        finalizeStrategyRun(context);
        expect(context.strategy.sharpe_ratio).toBeCloseTo(0.6835366, 6);
    });

    it('handles a negative-performance curve (negative ratios)', () => {
        // equities [1000, 950, 1000, 900] → returns [−0.05, +0.0526, −0.10]
        const s = run(1000, [950, 1000, 900], 2);
        const eq = [1000, 950, 1000, 900];
        const r = eq.slice(1).map((e, i) => e / eq[i] - 1);
        const rfr = 2 / 1200, mean = r.reduce((a, b) => a + b, 0) / r.length;
        const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length);
        const dd = Math.sqrt(r.reduce((a, b) => a + Math.min(0, b - rfr) ** 2, 0) / r.length);
        expect(s.sharpe_ratio).toBeCloseTo((mean - rfr) / sd, 10);
        expect(s.sortino_ratio).toBeCloseTo((mean - rfr) / dd, 10);
        expect(s.sharpe_ratio).toBeLessThan(0);
    });
});
