// SPDX-License-Identifier: AGPL-3.0-only

/**
 * RC2b — Pine integer division (`int / int → int`) regression suite.
 *
 * Pine truncates `/` toward zero when BOTH operands are integers (`11 / 2 === 5`,
 * `-11 / 2 === -5`); JavaScript `/` is always float. The TypeInferencePass rewrites
 * a `/` to `$.pine.math.__idiv(...)` ONLY when both operands are provably int, and
 * MUST leave every other division as native `/` (fail-safe — a missed truncation is
 * acceptable, a wrong truncation of a float is a bug).
 *
 * These tests lock down both directions:
 *   - int-division IS applied for the provable-int cases, and
 *   - float / unknown divisions are NEVER truncated — including the two real
 *     over-truncation regressions this suite exists to prevent:
 *       (1) `ta.pivothigh` / `ta.pivotlow` return a float PRICE, not an int bar
 *           count (they were wrongly typed int, truncating pivot-range math);
 *       (2) a `var float x = na` reassigned from a float value must stay float
 *           (JOIN-on-reassignment: once notint, always notint).
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { transpile } from '../../src/transpiler/index';

/** Transpile a Pine v6 snippet and return the generated JS as a string. */
function tj(body: string): string {
    return transpile(`//@version=6\nindicator("t")\n${body}`).toString();
}

const IDIV = '__idiv';

describe('RC2b: Pine integer division (__idiv)', () => {
    describe('applies int-division (→ __idiv) when both operands are provably int', () => {
        it('int literal / int literal', () => {
            expect(tj('x = 11 / 2')).toContain(IDIV);
        });
        it('input.int-typed variable / int', () => {
            expect(tj('depth = input.int(11)\ny = depth / 2')).toContain(IDIV);
        });
        it('int-typed builtin (bar_index) / int', () => {
            expect(tj('y = bar_index / 2')).toContain(IDIV);
        });
        it('int-only arithmetic / int', () => {
            expect(tj('y = (3 + 4) / 2')).toContain(IDIV);
        });
        it('unary-minus int literal', () => {
            expect(tj('y = -11 / 2')).toContain(IDIV);
        });
        it('int variable (literal init) / int', () => {
            expect(tj('iv = 7\ny = iv / 2')).toContain(IDIV);
        });
        it('int variable reassigned only to ints stays int', () => {
            expect(tj('c = 0\nc := c + 1\ny = c / 2')).toContain(IDIV);
        });
    });

    describe('never truncates float / unknown divisions (stays native /)', () => {
        it('float builtin (close) / int', () => {
            expect(tj('y = close / 2')).not.toContain(IDIV);
        });
        it('int / float literal', () => {
            expect(tj('y = 11 / 2.0')).not.toContain(IDIV);
        });
        it('float variable / int', () => {
            expect(tj('fv = 2.5\ny = fv / 2')).not.toContain(IDIV);
        });
        it('float / float', () => {
            expect(tj('y = close / high')).not.toContain(IDIV);
        });

        // REGRESSION (1): ta.pivothigh / ta.pivotlow return the pivot PRICE (float),
        // not an int bar count. They must NOT trigger int-division.
        it('ta.pivothigh() / int stays float', () => {
            expect(tj('ph = ta.pivothigh(5, 5)\ny = ph / 2')).not.toContain(IDIV);
        });
        it('ta.pivotlow() / int stays float', () => {
            expect(tj('pl = ta.pivotlow(5, 5)\ny = pl / 2')).not.toContain(IDIV);
        });

        // REGRESSION (2, zigzag): a `var float x = na` reassigned from a float
        // pivot must stay float. JOIN semantics: once a variable holds a notint
        // value (its na initializer), it stays notint forever, so a mis-typed
        // signature can never upgrade it to int and truncate its range math.
        it('var float = na reassigned from a float pivot stays float', () => {
            const js = tj([
                'var float lastHigh = na',
                'var float lastLow = na',
                'ph = ta.pivothigh(5, 5)',
                'pl = ta.pivotlow(5, 5)',
                'if not na(ph)',
                '    lastHigh := ph',
                'if not na(pl)',
                '    lastLow := pl',
                'rng = (lastHigh - lastLow) / lastLow * 100',
            ].join('\n'));
            expect(js).not.toContain(IDIV);
        });
    });

    // pine2js must preserve float-ness through codegen, otherwise int/float
    // division is indistinguishable downstream (`2.0` flattened to `2`).
    describe('float-literal preservation (pine2js codegen)', () => {
        it('preserves an integer-valued float literal (2.0 stays 2.0)', () => {
            expect(tj('y = 2.0')).toContain('2.0');
        });
        it('normalizes a dot-prefix literal (.5 → 0.5)', () => {
            expect(tj('y = .5')).toContain('0.5');
        });
    });
});

describe('RC2b: integer division runtime values', () => {
    async function evalExprs(exprs: Record<string, string>): Promise<Record<string, any>> {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
        const lines = Object.entries(exprs).map(([name, e]) => `plotchar(${e}, '${name}');`).join('\n');
        const code = `const { plotchar } = context.pine;\n${lines}`;
        const { plots } = await pineTS.run(code);
        const out: Record<string, any> = {};
        for (const name of Object.keys(exprs)) out[name] = plots[name].data[0].value;
        return out;
    }

    it('truncates int/int toward zero', async () => {
        const r = await evalExprs({ a: '11 / 2', b: '10 / 2', c: '7 / 2', d: '-11 / 2', e: '-7 / 2' });
        expect(r.a).toBe(5);
        expect(r.b).toBe(5);
        expect(r.c).toBe(3);
        expect(r.d).toBe(-5); // toward zero, NOT floor (-6)
        expect(r.e).toBe(-3);
    });

    it('keeps float division exact', async () => {
        const r = await evalExprs({ a: '11 / 2.0', b: '2.5 / 2', c: '(1.0 * 5) / 2' });
        expect(r.a).toBe(5.5);
        expect(r.b).toBe(1.25);
        expect(r.c).toBe(2.5);
    });

    it('preserves div-by-zero semantics (Infinity / NaN), not na', async () => {
        const r = await evalExprs({ a: '1 / 0', b: '0 / 0' });
        expect(r.a).toBe(Infinity);
        expect(Number.isNaN(r.b)).toBe(true);
    });
});
