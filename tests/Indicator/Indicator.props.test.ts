// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { Indicator } from '../../src/Indicator';
import { PineTS } from '../../src/PineTS.class';

function makeData(n = 20) {
    const out: any[] = [];
    const t0 = new Date('2024-01-01T00:00:00Z').getTime();
    const DAY = 86_400_000;
    for (let i = 0; i < n; i++) {
        const base = 100 + i * 0.6;
        out.push({
            openTime: t0 + i * DAY,
            open: base, high: base + 1.5, low: base - 0.8, close: base + 0.4,
            volume: 1000, closeTime: t0 + (i + 1) * DAY - 1,
        });
    }
    return out;
}

describe('Indicator props', () => {

    // ── Declaration-type detection ────────────────────────────────────
    describe('detects declaration type', () => {
        it('detects indicator() from Pine source', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            expect(ind.getDeclarationType()).toBe('indicator');
        });

        it('detects strategy() from Pine source', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            expect(ind.getDeclarationType()).toBe('strategy');
        });

        it('falls back to indicator schema when neither call is found', () => {
            const ind = new Indicator(`//@version=6\nplot(close)`);
            expect(ind.getDeclarationType()).toBe(null);
            // schema fallback: indicator's mutable props are available
            expect(typeof (ind.prop as any)['overlay']).toBe('boolean');
        });

        it('detects from JS-function source via acorn', () => {
            const fn = ($: any) => {
                const { strategy } = $.pine;
                strategy('JS Strat', { initial_capital: 50000 });
            };
            const ind = new Indicator(fn);
            expect(ind.getDeclarationType()).toBe('strategy');
        });
    });

    // ── Source-code defaults flow into .prop ──────────────────────────
    describe('seeds defaults from source code', () => {
        it('reads positional + named args from strategy()', () => {
            const code = `
//@version=6
strategy("My Strat", overlay=true, initial_capital=50000, pyramiding=3,
         currency=currency.EUR, default_qty_type=strategy.percent_of_equity)
plot(close)
`;
            const ind = new Indicator(code);
            const view = ind.prop as any;
            expect(view['overlay']).toBe(true);                        // from source (spec default false)
            expect(view['initial_capital']).toBe(50000);               // from source
            expect(view['pyramiding']).toBe(3);                        // from source
            expect(view['currency']).toBe('EUR');                      // enum resolved via rightmost-identifier
            expect(view['default_qty_type']).toBe('percent_of_equity'); // ditto
            expect(view['slippage']).toBe(0);                          // spec default (source didn't set it)
        });

        it('resolves nested namespace constants (strategy.commission.percent)', () => {
            const code = `
//@version=6
strategy("X", commission_type=strategy.commission.cash_per_order, commission_value=5)
plot(close)
`;
            const view = new Indicator(code).prop as any;
            expect(view['commission_type']).toBe('cash_per_order');
            expect(view['commission_value']).toBe(5);
        });

        it('resolves format / scale namespace constants', () => {
            const code = `
//@version=6
indicator("X", format=format.percent, scale=scale.left)
plot(close)
`;
            const view = new Indicator(code).prop as any;
            expect(view['format']).toBe('percent');
            expect(view['scale']).toBe('left');
        });
    });

    // ── getPropsMeta() filtering ──────────────────────────────────────
    describe('getPropsMeta()', () => {
        it('returns only indicator-applicable props for indicators', () => {
            const meta = new Indicator(`//@version=6\nindicator("X")\nplot(close)`).getPropsMeta();
            const names = meta.map((m) => m.name);
            expect(names).toContain('overlay');
            expect(names).toContain('timeframe');                  // indicator-only
            expect(names).toContain('timeframe_gaps');
            expect(names).not.toContain('pyramiding');             // strategy-only
            expect(names).not.toContain('initial_capital');
        });

        it('returns only strategy-applicable props for strategies', () => {
            const meta = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`).getPropsMeta();
            const names = meta.map((m) => m.name);
            expect(names).toContain('pyramiding');
            expect(names).toContain('initial_capital');
            expect(names).toContain('commission_type');
            expect(names).not.toContain('timeframe');              // indicator-only
            expect(names).not.toContain('timeframe_gaps');
        });

        it('includes title / shorttitle as mutable: false', () => {
            const meta = new Indicator(`//@version=6\nindicator("X")\nplot(close)`).getPropsMeta();
            const title = meta.find((m) => m.name === 'title');
            expect(title?.mutable).toBe(false);
            const shorttitle = meta.find((m) => m.name === 'shorttitle');
            expect(shorttitle?.mutable).toBe(false);
        });
    });

    // ── .prop proxy — frozen container, validation ────────────────────
    describe('.prop proxy', () => {
        const code = `//@version=6\nstrategy("X", initial_capital=100000)\nplot(close)`;

        it('allows per-key mutation', () => {
            const ind = new Indicator(code);
            (ind.prop as any)['initial_capital'] = 50000;
            expect((ind.prop as any)['initial_capital']).toBe(50000);
        });

        it('rejects replacement of the .prop container', () => {
            const ind = new Indicator(code);
            expect(() => { (ind as any).prop = { foo: 1 }; }).toThrow(/cannot be replaced/i);
        });

        it('rejects unknown prop names', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.prop as any)['nope'] = 1; }).toThrow(/unknown key/i);
        });

        it('rejects writes to title / shorttitle (excluded from proxy)', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.prop as any)['title'] = 'X'; }).toThrow(/unknown key/i);
            expect(() => { (ind.prop as any)['shorttitle'] = 'X'; }).toThrow(/unknown key/i);
        });

        it('rejects values not in enum options (currency)', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.prop as any)['currency'] = 'XYZ'; }).toThrow(/not one of/i);
        });

        it('accepts valid enum value', () => {
            const ind = new Indicator(code);
            (ind.prop as any)['currency'] = 'EUR';
            expect((ind.prop as any)['currency']).toBe('EUR');
        });

        it('rejects bool when given a number', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.prop as any)['overlay'] = 1; }).toThrow(/expects a boolean/i);
        });

        it('rejects int below minval (precision)', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.prop as any)['precision'] = -1; }).toThrow(/below minval/i);
        });

        it('rejects int above maxval (precision)', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.prop as any)['precision'] = 20; }).toThrow(/above maxval/i);
        });
    });

    // ── Indicator-specific behavior ──────────────────────────────────
    describe('indicator() props', () => {
        it('seeds positional + named args from indicator() call', () => {
            const code = `
//@version=6
indicator("X", "S", overlay=true, precision=4, max_lines_count=120,
          timeframe="1D", timeframe_gaps=false,
          format=format.percent, scale=scale.left)
plot(close)
`;
            const v = new Indicator(code).prop as any;
            // positional (after title/shorttitle)
            expect(v['overlay']).toBe(true);
            // named ints
            expect(v['precision']).toBe(4);
            expect(v['max_lines_count']).toBe(120);
            // strings + bool
            expect(v['timeframe']).toBe('1D');
            expect(v['timeframe_gaps']).toBe(false);
            // enums resolved via rightmost-identifier
            expect(v['format']).toBe('percent');
            expect(v['scale']).toBe('left');
        });

        it('rejects strategy-only prop names on an indicator script', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            expect(() => { (ind.prop as any)['pyramiding'] = 3; }).toThrow(/unknown key/i);
            expect(() => { (ind.prop as any)['initial_capital'] = 50000; }).toThrow(/unknown key/i);
            expect(() => { (ind.prop as any)['commission_type'] = 'percent'; }).toThrow(/unknown key/i);
        });

        it('rejects values outside max_lines_count bounds (1..500)', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            expect(() => { (ind.prop as any)['max_lines_count'] = 0; }).toThrow(/below minval/i);
            expect(() => { (ind.prop as any)['max_lines_count'] = 501; }).toThrow(/above maxval/i);
        });

        it('rejects format value not in the enum', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            expect(() => { (ind.prop as any)['format'] = 'badformat'; }).toThrow(/not one of/i);
        });

        it('JS-function source detects indicator() and seeds defaults', () => {
            const fn = ($: any) => {
                const { indicator } = $.pine;
                indicator('JS Ind', { overlay: true, precision: 2, timeframe: '60' });
            };
            const ind = new Indicator(fn);
            expect(ind.getDeclarationType()).toBe('indicator');
            expect((ind.prop as any)['overlay']).toBe(true);
            expect((ind.prop as any)['precision']).toBe(2);
            expect((ind.prop as any)['timeframe']).toBe('60');
        });
    });

    // ── Strategy-only prop validations not covered above ─────────────
    describe('strategy() props', () => {
        it('rejects indicator-only prop names on a strategy script', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            expect(() => { (ind.prop as any)['timeframe'] = '1D'; }).toThrow(/unknown key/i);
            expect(() => { (ind.prop as any)['timeframe_gaps'] = false; }).toThrow(/unknown key/i);
        });

        it('accepts every valid currency code', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            for (const code of ['USD', 'EUR', 'BTC', 'JPY', 'USDT', 'NONE']) {
                (ind.prop as any)['currency'] = code;
                expect((ind.prop as any)['currency']).toBe(code);
            }
        });

        it('accepts each commission_type enum value', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            for (const v of ['percent', 'cash_per_order', 'cash_per_contract']) {
                (ind.prop as any)['commission_type'] = v;
                expect((ind.prop as any)['commission_type']).toBe(v);
            }
        });

        it('accepts each default_qty_type enum value', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            for (const v of ['fixed', 'cash', 'percent_of_equity']) {
                (ind.prop as any)['default_qty_type'] = v;
                expect((ind.prop as any)['default_qty_type']).toBe(v);
            }
        });

        it('accepts close_entries_rule "FIFO" / "ANY" (bare strings)', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            (ind.prop as any)['close_entries_rule'] = 'ANY';
            expect((ind.prop as any)['close_entries_rule']).toBe('ANY');
            expect(() => { (ind.prop as any)['close_entries_rule'] = 'LIFO'; }).toThrow(/not one of/i);
        });

        it('margin_long / margin_short bounds (0..100)', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            (ind.prop as any)['margin_long'] = 50;
            expect((ind.prop as any)['margin_long']).toBe(50);
            expect(() => { (ind.prop as any)['margin_long'] = 101; }).toThrow(/above maxval/i);
            expect(() => { (ind.prop as any)['margin_short'] = -1; }).toThrow(/below minval/i);
        });
    });

    // ── Cross-instance / reuse semantics ─────────────────────────────
    describe('reuse across runs', () => {
        it('same Indicator passed twice keeps prepare() cached', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X")\nplot(close)`);
            const a = ind.prepare();
            const b = ind.prepare();
            expect(a).toBe(b);
        });

        it('source-default reads do NOT count as user overrides', async () => {
            const code = `//@version=6\nstrategy("X", initial_capital=42000)\nplot(close)`;
            const ind = new Indicator(code);
            // Reading shouldn't trigger override tracking
            void (ind.prop as any)['initial_capital'];
            expect(ind.getRuntimePropOverrides()).toEqual({});
            const ctx = await new PineTS(makeData()).run(ind);
            expect(ctx.strategy.config.initial_capital).toBe(42000);   // from source
        });

        it('explicit override appears in getRuntimePropOverrides()', () => {
            const ind = new Indicator(`//@version=6\nstrategy("X", initial_capital=42000)\nplot(close)`);
            (ind.prop as any)['initial_capital'] = 99000;
            expect(ind.getRuntimePropOverrides()).toEqual({ initial_capital: 99000 });
        });
    });

    // ── End-to-end: override flows to runtime ─────────────────────────
    describe('end-to-end runtime override', () => {
        it('user-overridden initial_capital propagates to context.strategy.config', async () => {
            const code = `//@version=6\nstrategy("E2E", initial_capital=10000)\nplot(close)`;
            const ind = new Indicator(code);
            (ind.prop as any)['initial_capital'] = 75000;

            const ctx = await new PineTS(makeData()).run(ind);
            expect(ctx.strategy.config.initial_capital).toBe(75000);
            expect(ctx.strategy.initial_capital).toBe(75000);
        });

        it('user-overridden indicator pyramiding wins over source default', async () => {
            const code = `//@version=6\nstrategy("E2E", pyramiding=1)\nplot(close)`;
            const ind = new Indicator(code);
            (ind.prop as any)['pyramiding'] = 5;
            const ctx = await new PineTS(makeData()).run(ind);
            expect(ctx.strategy.config.pyramiding).toBe(5);
        });

        it('source-only values still apply when no override is set', async () => {
            const code = `//@version=6\nstrategy("E2E", initial_capital=42000)\nplot(close)`;
            const ctx = await new PineTS(makeData()).run(new Indicator(code));
            expect(ctx.strategy.config.initial_capital).toBe(42000);
        });

        it('indicator() prop overrides flow into context.indicator', async () => {
            const code = `//@version=6\nindicator("E2E", overlay=false)\nplot(close)`;
            const ind = new Indicator(code);
            (ind.prop as any)['overlay'] = true;
            const ctx = await new PineTS(makeData()).run(ind);
            expect(ctx.indicator.overlay).toBe(true);
        });
    });
});
