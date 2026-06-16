import { describe, expect, it } from 'vitest';
import { Context } from '../../../src/Context.class';
import { finalizeStrategyBar, initializeStrategy } from '../../../src/namespaces/strategy/utils';
import { Series } from '../../../src/Series';

/**
 * Regression for the equity-peak basis used by max_drawdown.
 *
 * TV latches the equity high-water on the funds state right after a close
 * settles — BEFORE the entry commission of a trade opened on the same bar
 * (reversal) is charged. PineTS nets the reversal close+open atomically, so
 * `updateEquityPeaks` adds the open trades' entry commissions back into the
 * PEAK basis. The TROUGH basis keeps the commission deducted, and the
 * drawdown formula has NO separate commission term.
 *
 * The two-latch scenario below is the minimal case that DISAMBIGUATES the
 * correct model (peak excludes open entry comm) from the historical wrong
 * one (+openCommission added to the drawdown at the trough side). With a
 * single latch the two models coincide whenever the open commission at the
 * peak equals the one at the trough — exactly the constant-commission
 * degeneracy that hid this bug on cash_per_contract QA data. Here the two
 * open trades carry DIFFERENT commissions (2,000 vs 500):
 *
 *   correct model:  dd = (1,100,000 − 1,049,500) + 20,000        = 70,500
 *   wrong model:    dd = (1,098,000 − 1,049,500) + 20,000 + 500  = 69,000
 *
 * Ground truth: QA margin_calls xlsx (BTCUSDT 1D, 1% percent commission)
 * where TV's peak was exactly the closed-trades cumulative (+148,279.33)
 * while the reversal trade opened on the peak bar had already cost
 * 2,483.81 in entry commission. Max drawdown matches TV to the cent only
 * under the peak-basis model.
 */

function makeContext(config: any = {}) {
    const context: any = new Context({
        marketData: [],
        source: [],
        tickerId: 'BTCUSDC',
        timeframe: 'D',
    } as any);
    context.pine = { syminfo: { mintick: 0.01, pointvalue: 1 } } as any;
    initializeStrategy(context, config);
    return context;
}

function setBar(context: any, idx: number, bar: { open: number; high: number; low: number; close: number }) {
    context.idx = idx;
    context.data.open = new Series([bar.open]);
    context.data.high = new Series([bar.high]);
    context.data.low = new Series([bar.low]);
    context.data.close = new Series([bar.close]);
    context.data.openTime = new Series([idx * 1000]);
}

function setOpenLong(context: any, entryPrice: number, commission: number) {
    context.strategy.opentrades = [{
        id: `trade_${context.idx}`,
        entry_id: 'L',
        entry_price: entryPrice,
        entry_bar_index: context.idx,
        entry_time: context.idx * 1000,
        size: 1,
        commission,
        max_drawdown: 0,
        max_runup: 0,
        status: 'open',
    }];
    context.strategy.position_size = 1;
    context.strategy.position_avg_price = entryPrice;
}

describe('equity peak basis — open entry commissions excluded from the peak', () => {
    it('latches the peak on realized + openCommission, not on netprofit alone', () => {
        const context = makeContext({ initial_capital: 1000000 });
        const s = context.strategy;

        // Bar 1: a prior trade closed +100,000; a reversal long opened the
        // same bar with 2,000 entry commission (already deducted at fill).
        s.netprofit = 98000;
        setOpenLong(context, 100000, 2000);
        setBar(context, 1, { open: 100000, high: 100000, low: 100000, close: 100000 });
        finalizeStrategyBar(context);

        // TV's peak: funds after the close settled, before the new entry's
        // commission → 1,000,000 + 100,000 = 1,100,000.
        expect(s.equity_peak).toBe(1100000);
    });

    it('two-latch scenario: drawdown measured from the commission-free peak (disambiguates the wrong model)', () => {
        const context = makeContext({ initial_capital: 1000000 });
        const s = context.strategy;

        // Bar 1 — peak latch: closed +100,000 cumulative, open trade carries
        // 2,000 entry commission. Flat bar, no excursion.
        s.netprofit = 98000;
        setOpenLong(context, 100000, 2000);
        setBar(context, 1, { open: 100000, high: 100000, low: 100000, close: 100000 });
        finalizeStrategyBar(context);
        expect(s.equity_peak).toBe(1100000);

        // Bar 2 — trough: that trade closed at a loss (cum +50,000), a NEW
        // long opened with a DIFFERENT entry commission (500). The bar dips
        // to 80,000 → 20,000 adverse excursion on the open trade.
        s.netprofit = 49500;
        setOpenLong(context, 100000, 500);
        setBar(context, 2, { open: 100000, high: 100000, low: 80000, close: 90000 });
        finalizeStrategyBar(context);

        // dd = (peak 1,100,000 − realized 1,049,500) + excursion 20,000.
        // The wrong (+openCommission-at-trough) model would yield 69,000.
        expect(s.max_drawdown).toBe(70500);
    });

    it('run-up keeps the commission-deducted trough basis (matches TV exactly on all QA datasets)', () => {
        const context = makeContext({ initial_capital: 1000000 });
        const s = context.strategy;

        // Bar 1 — trough latch: cumulative −50,000 with an open trade
        // carrying 1,000 entry commission. Flat bar.
        s.netprofit = -51000;
        setOpenLong(context, 100000, 1000);
        setBar(context, 1, { open: 100000, high: 100000, low: 100000, close: 100000 });
        finalizeStrategyBar(context);
        // Trough INCLUDES the open commission deduction.
        expect(s.equity_trough).toBe(949000);

        // Bar 2 — favorable excursion: netprofit recovers to +20,000 with a
        // fresh open trade (commission 1,000), bar rallies to 120,000.
        s.netprofit = 19000;
        setOpenLong(context, 100000, 1000);
        setBar(context, 2, { open: 100000, high: 120000, low: 100000, close: 115000 });
        finalizeStrategyBar(context);

        // runup = (realized 1,019,000 − trough 949,000) + excursion 20,000.
        expect(s.max_runup).toBe(90000);
    });
});
