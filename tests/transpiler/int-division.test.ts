// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Pine integer division (`int / int`) regression suite.
 *
 * Reference: TradingView's "To Pine Script version 6" migration guide, section
 * "Fractional division of constants":
 *
 *   - Pine v5: `int / int` truncates toward zero ONLY when BOTH operands are
 *     qualified as 'const' (e.g. `5 / 2 === 2`). If at least one operand is
 *     'input', 'simple', or 'series' (loop counters, mutable variables,
 *     `input.int(...)`, `bar_index`, ...), the fractional remainder is PRESERVED
 *     (`i / 4 === 0.75`).
 *   - Pine v6: `int / int` NEVER truncates, regardless of qualifiers
 *     (`5 / 2 === 2.5`).
 *
 * The TypeInferencePass therefore rewrites `/` to `$.pine.math.__idiv(...)` only
 * for v5 sources AND only when both operands are provably const int. Everything
 * else — v6 scripts, bare PineTS syntax (JS semantics), and any non-const int
 * operand — keeps native float `/`.
 *
 * This suite also guards two historical over-truncation regressions:
 *   (1) `ta.pivothigh` / `ta.pivotlow` return a float PRICE, not an int bar count;
 *   (2) a `var float x = na` reassigned from a float value must stay float.
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { transpile } from '../../src/transpiler/index';

/** Transpile a Pine snippet at the given version, return the generated JS. */
function tj(body: string, version: 5 | 6 = 5): string {
    return transpile(`//@version=${version}\nindicator("t")\n${body}`).toString();
}

const IDIV = '__idiv';

describe('Pine v5: __idiv applied ONLY for const int / const int', () => {
    it('int literal / int literal', () => {
        expect(tj('x = 11 / 2')).toContain(IDIV);
    });
    it('const-int arithmetic / int literal', () => {
        expect(tj('y = (3 + 4) / 2')).toContain(IDIV);
    });
    it('unary-minus int literal', () => {
        expect(tj('y = -11 / 2')).toContain(IDIV);
    });
    it('const int variable (literal init, never reassigned) / int', () => {
        expect(tj('iv = 7\ny = iv / 2')).toContain(IDIV);
    });

    describe('non-const int operands preserve the fractional remainder (no __idiv)', () => {
        it('input.int is input-qualified, not const', () => {
            expect(tj('depth = input.int(11)\ny = depth / 2')).not.toContain(IDIV);
        });
        it('bar_index is a series int, not const', () => {
            expect(tj('y = bar_index / 2')).not.toContain(IDIV);
        });
        it('loop counter is a series int, not const', () => {
            expect(tj('int gridSteps = 4\nfloat f = na\nfor i = 1 to 3\n    f := i / gridSteps')).not.toContain(IDIV);
        });
        it('reassigned int variable is series, not const', () => {
            expect(tj('c = 0\nc := c + 1\ny = c / 2')).not.toContain(IDIV);
        });
        it('var-declared int is not const', () => {
            expect(tj('var v = 8\ny = v / 2')).not.toContain(IDIV);
        });
        it('const var divided by a later-reassigned var', () => {
            expect(tj('k = 8\nm = 2\ny = k / m\nm := 4')).not.toContain(IDIV);
        });
    });

    describe('never truncates float / unknown divisions', () => {
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

        // REGRESSION (1): ta.pivothigh / ta.pivotlow return the pivot PRICE (float).
        it('ta.pivothigh() / int stays float', () => {
            expect(tj('ph = ta.pivothigh(5, 5)\ny = ph / 2')).not.toContain(IDIV);
        });
        it('ta.pivotlow() / int stays float', () => {
            expect(tj('pl = ta.pivotlow(5, 5)\ny = pl / 2')).not.toContain(IDIV);
        });

        // REGRESSION (2, zigzag): a `var float x = na` reassigned from a float
        // pivot must stay float (JOIN semantics: once notint, always notint).
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
});

describe('Pine v6: int division NEVER truncates (no __idiv, ever)', () => {
    it('int literal / int literal', () => {
        expect(tj('x = 11 / 2', 6)).not.toContain(IDIV);
    });
    it('const int variable / int', () => {
        expect(tj('iv = 7\ny = iv / 2', 6)).not.toContain(IDIV);
    });
    it('const-int arithmetic / int', () => {
        expect(tj('y = (3 + 4) / 2', 6)).not.toContain(IDIV);
    });
    it('loop counter / int variable', () => {
        expect(tj('int gridSteps = 4\nfloat f = na\nfor i = 1 to 3\n    f := i / gridSteps', 6)).not.toContain(IDIV);
    });
});

describe('bare PineTS syntax: JS float-division semantics (no __idiv)', () => {
    it('int literal / int literal stays native /', () => {
        const js = transpile(`($) => {\n    const { plot } = $.pine;\n    plot(11 / 2, 'y');\n}`).toString();
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

describe('integer division runtime values', () => {
    async function runPine(script: string): Promise<Record<string, any>> {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
        const { plots } = await pineTS.run(script);
        const out: Record<string, any> = {};
        for (const [name, plot] of Object.entries(plots) as any) {
            if (!name.startsWith('__')) out[name] = plot.data.at(-1).value;
        }
        return out;
    }

    // Expected values from TradingView's v6 migration guide ("Fractional
    // division of constants") and Pine v5 semantics.
    it('v5: truncates const/const toward zero, preserves fraction otherwise', async () => {
        const r = await runPine([
            '//@version=5',
            'indicator("t")',
            'int gridSteps = 4',
            'float fromLoop = na',
            'for i = 1 to 3',
            '    fromLoop := i / gridSteps',
            'plot(fromLoop, "loop")',
            'plot(11 / 2, "lit")',
            'plot(-11 / 2, "negLit")',
            'plot(5 / 2.0, "mixed")',
        ].join('\n'));
        expect(r.loop).toBe(0.75); // loop counter is series int → fractional even in v5
        expect(r.lit).toBe(5); // const/const → truncated
        expect(r.negLit).toBe(-5); // toward zero, NOT floor (-6)
        expect(r.mixed).toBe(2.5);
    });

    it('v6: always fractional', async () => {
        const r = await runPine([
            '//@version=6',
            'indicator("t")',
            'int gridSteps = 4',
            'float fromLoop = na',
            'for i = 1 to 3',
            '    fromLoop := i / gridSteps',
            'plot(fromLoop, "loop")',
            'plot(5 / 2, "lit")',
            'plot(5 / 2.0, "mixed")',
        ].join('\n'));
        expect(r.loop).toBe(0.75);
        expect(r.lit).toBe(2.5);
        expect(r.mixed).toBe(2.5);
    });

    it('v5: div-by-zero semantics preserved through __idiv (Infinity / NaN)', async () => {
        const r = await runPine(['//@version=5', 'indicator("t")', 'plot(1 / 0, "inf")', 'plot(0 / 0, "nan")'].join('\n'));
        expect(r.inf).toBe(Infinity);
        expect(Number.isNaN(r.nan)).toBe(true);
    });

    it('bare PineTS syntax: JS float division', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
        const { plots } = await pineTS.run(($: any) => {
            const { plotchar } = $.pine;
            plotchar(11 / 2, 'a');
        });
        expect(plots['a'].data[0].value).toBe(5.5);
    });
});
