// SPDX-License-Identifier: AGPL-3.0-only

/**
 * `isArrayPatternElement` is a set of NAMES across the whole program — the audit flagged it (26): a
 * plain local that happens to share a name with a tuple element anywhere is still routed to the
 * standard lowering by the walkers (patches 6 and 7). The routing is inert, because the lowering
 * re-checks the SHAPE before treating a name as a split element (`init` must be the AnalysisPass's
 * `_tmp_N[i]` computed member), and a name set cannot manufacture that shape:
 *
 *   - a plain local whose init is a literal → `$.let.glb1_p = $.init($.let.glb1_p, 10)`: the arm
 *     reassigns the same store Pine says it reassigns, and the global read follows;
 *   - a plain local whose init is a history read → `$.get($.let.close, 0)[1]` is a CallExpression,
 *     not the split's member shape, so it initialises normally.
 *
 * This pins the OUTCOME for both shapes — emitted code and runtime values — so a future widening of
 * the name set (or of the walkers' predicate) cannot silently start mangling same-named locals.
 *
 * The reference is the Pine source, not the engine: `p` is the tuple's first element (1), the arm
 * reassigns it to 10, so `p + 1` is 11 and the global `p` reads 10 afterwards; the function's own
 * `p` stays a function local (Pine scopes a function body), so `u` is 14.
 */
import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const LITERAL_SRC = `//@version=6
indicator("name collision: a tuple element name reused as a plain local")

split() =>
    x = 1
    y = 2
    [x, y]

[p, q] = split()

w = switch
    p > 0 =>
        p = 10
        p + 1
    => 0

f() =>
    p = 7
    p * 2

u = f()

plot(w, "w")
plot(u, "u")
plot(p, "p")
`;

const HISTORY_SRC = `//@version=6
indicator("name collision: a history read as the arm local's init")

split() =>
    x = 1
    y = 2
    [x, y]

[p, q] = split()

w = switch
    p > 0 =>
        p = close[1]
        p + 1
    => 0

plot(w, "w")
plot(p, "p")
plot(close, "close")
`;

const values = (res: any, key: string) => (res?.plots?.[key]?.data ?? []).map((d: any) => d.value);

async function run(src: string) {
    const engine = new PineTS(
        Provider.Mock, 'BTCUSDC', '1h', null,
        new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime()
    );
    return engine.run(src);
}

describe('a plain local sharing a name with a tuple element', () => {
    it('reassigns the global store, not a fresh function local (emitted code)', () => {
        const js = transpile(LITERAL_SRC, { debug: false }).toString();
        // The arm's `p = 10` is the same store the tuple element wrote …
        expect(js).toMatch(/\.let\.\w+_p = \$\.init\(\$\.let\.\w+_p, 10\)/);
        // … and it must NOT be given a function-scoped name of its own.
        expect(js).not.toMatch(/\.let\.fn\d+_p = \$\.init\([^,]*, 10\)/);
        // The function body's own `p = 7` IS a function local (Pine scopes the body) — the same
        // name, two different stores, which is exactly what the name-based set has to get right.
        expect(js).toMatch(/\$\$\.let\.fn\d+_p = \$\.init\(\$\$\.let\.fn\d+_p, 7\)/);
    });

    it('runs: the arm mutates p (10), its value is 11, the function local stays 14', async () => {
        const res: any = await run(LITERAL_SRC);
        const w = values(res, 'w');
        const u = values(res, 'u');
        const p = values(res, 'p');
        expect(w.length).toBeGreaterThan(0);
        expect(w[w.length - 1]).toBeCloseTo(11, 6);
        expect(u[u.length - 1]).toBeCloseTo(14, 6);
        // Pre-patch-7 (e9671d0) this read 1: the arm's declaration kept its plain JS local inside
        // the IIFE, so the store the plot reads was never written.
        expect(p[p.length - 1]).toBeCloseTo(10, 6);
    });

    it('a history read as the init is not mistaken for the split shape (emitted code)', () => {
        const js = transpile(HISTORY_SRC, { debug: false }).toString();
        // `close[1]` stays a history read of the built-in …
        expect(js).toMatch(/\.let\.\w+_p = \$\.init\(\$\.let\.\w+_p, \$\.get\(close, 1\)\)/);
        // … and never becomes the tuple-element shape — pre-fix this was
        // `$.get($.let.close, 0)[1]`, which read the close SERIES' bar-0 value as a tuple and threw
        // `TypeError: Cannot read properties of undefined (reading '1')` at runtime.
        expect(js).not.toMatch(/\.let\.\w+_p = \$\.init\(\$\.let\.\w+_p, \$\.get\([^)]*close[^)]*\)\[1\]\)/);
    });

    it('runs: p is the previous close and w is one above it', async () => {
        const res: any = await run(HISTORY_SRC);
        const w = values(res, 'w');
        const p = values(res, 'p');
        const close = values(res, 'close');
        expect(w.length).toBeGreaterThan(1);
        const n = w.length;
        expect(p[n - 1]).toBeCloseTo(close[n - 2], 6);
        expect(w[n - 1]).toBeCloseTo(close[n - 2] + 1, 6);
    });
});
