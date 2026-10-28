import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { transpile } from '../../src/transpiler/index';
import ScopeManager from '../../src/transpiler/analysis/ScopeManager';
import { preProcessUdtRegistry } from '../../src/transpiler/analysis/AnalysisPass';
import * as acorn from 'acorn';

/**
 * Regression suite for the two-bug "subscript on UDT field" issue.
 *
 * Pine semantics: when `bar` is a UDT instance reassigned every bar
 * (`bar = SomeUDT.new()`), `bar.field[N]` reads the field's value from N
 * bars ago — i.e. the same as `low[N]` if the field captures `low` at
 * construction. The transpiler must:
 *   1. Recognize `bar` as a UDT instance (not a built-in / array / namespace).
 *   2. Apply the lookback to the leaf base (Series of UDT instances),
 *      NOT to the field-access tail.
 *
 * The discrimination is non-trivial because `bar.field[N]` and
 * `arr[N]` (on a JS array) have identical AST shapes. The fix uses a
 * UDT registry populated from `const X = Type({...})` declarations
 * (pine2js output) and `<X>.new(...)` / `<X>.copy(...)` initializers.
 */

// ── Helpers ────────────────────────────────────────────────────────────

/** Pre-process raw JS source into an AST and run only the UDT pre-pass.
 *  Returns the populated ScopeManager so tests can introspect the registry. */
function buildUdtRegistry(jsSource: string): ScopeManager {
    const ast: any = acorn.parse(jsSource, { ecmaVersion: 'latest', sourceType: 'module' });
    const sm = new ScopeManager();
    preProcessUdtRegistry(ast, sm);
    return sm;
}

// ── 1. UDT registry pre-pass ───────────────────────────────────────────

describe('UDT registry pre-pass (preProcessUdtRegistry)', () => {
    it('registers UDT type names from `const X = Type({...})` declarations', () => {
        // pine2js output shape — what `type BAR { float low_v = low }` becomes
        const sm = buildUdtRegistry(`const BAR = Type({ low_v: ['float', 0] });`);
        expect(sm.isUdtTypeName('BAR')).toBe(true);
        expect(sm.isUdtTypeName('SOMETHING_ELSE')).toBe(false);
    });

    it('captures field type metadata (V2 data model)', () => {
        const sm = buildUdtRegistry(`const FOO = Type({ a: ['float', 0], b: ['int', 0], c: ['bool', false] });`);
        const fields = sm.getUdtTypeFields('FOO');
        expect(fields).toEqual({ a: 'float', b: 'int', c: 'bool' });
    });

    it('registers variables initialized via `<UDT>.new(...)` as UDT instances', () => {
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            let bar = BAR.new();
        `);
        expect(sm.isUdtInstance('bar')).toBe(true);
        expect(sm.getVariableUdtType('bar')).toBe('BAR');
    });

    it('registers variables initialized via `<UDT>.copy(...)` as UDT instances', () => {
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            let original = BAR.new();
            let copy = BAR.copy(original);
        `);
        expect(sm.isUdtInstance('copy')).toBe(true);
        expect(sm.getVariableUdtType('copy')).toBe('BAR');
    });

    it('registers UDT instances initialized via a conditional / ternary expression', () => {
        // Case 3 fix: when both branches of a ternary resolve to the same UDT,
        // the variable is registered with that UDT type.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            let seed = BAR.new();
            let bar = (1 > 0) ? BAR.new() : BAR.copy(seed);
        `);
        expect(sm.isUdtInstance('bar')).toBe(true);
        expect(sm.getVariableUdtType('bar')).toBe('BAR');
    });

    it('handles nested ternaries — recursion through both branches', () => {
        // c1 ? BAR.new() : (c2 ? BAR.copy(seed) : BAR.new())
        // The recursive helper walks both branches at every level.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            let seed = BAR.new();
            let bar = (1 > 0) ? BAR.new() : ((2 > 0) ? BAR.copy(seed) : BAR.new());
        `);
        expect(sm.isUdtInstance('bar')).toBe(true);
        expect(sm.getVariableUdtType('bar')).toBe('BAR');
    });

    it('does NOT register a ternary whose branches have DIFFERENT UDT types', () => {
        // Safety check: if the branches resolve to different types, we can't
        // unambiguously assign one — skip rather than misclassify.
        const sm = buildUdtRegistry(`
            const FOO = Type({ a: ['float', 0] });
            const BAR = Type({ b: ['float', 0] });
            let either = (1 > 0) ? FOO.new() : BAR.new();
        `);
        expect(sm.isUdtInstance('either')).toBe(false);
    });

    it('does NOT register a ternary whose branches mix UDT and non-UDT', () => {
        const sm = buildUdtRegistry(`
            const BAR = Type({ b: ['float', 0] });
            let arr = array.from(1, 2);
            let mixed = (1 > 0) ? BAR.new() : arr;
        `);
        expect(sm.isUdtInstance('mixed')).toBe(false);
    });

    it('infers UDT return type of a user function whose body returns `<UDT>.new(...)`', () => {
        // `function makeBar() { return BAR.new(); }` — the function's return
        // type is recorded so callers can flow the type through.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function makeBar() { return BAR.new(); }
        `);
        expect(sm.getFunctionReturnType('makeBar')).toBe('BAR');
    });

    it('registers `bar = userFunc()` as a UDT instance when the function returns one', () => {
        // The Case 1 fix in action — `bar` initialized via a user-function
        // call gets registered with the function's inferred return type.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function makeBar() { return BAR.new(); }
            let bar = makeBar();
        `);
        expect(sm.isUdtInstance('bar')).toBe(true);
        expect(sm.getVariableUdtType('bar')).toBe('BAR');
    });

    it('iteratively resolves chained user-function returns (helper → wrapper)', () => {
        // makeBar() calls makeBarHelper() — the inference loop must run
        // multiple passes to register both functions, then `bar`.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function makeBarHelper() { return BAR.new(); }
            function makeBar() { return makeBarHelper(); }
            let bar = makeBar();
        `);
        expect(sm.getFunctionReturnType('makeBarHelper')).toBe('BAR');
        expect(sm.getFunctionReturnType('makeBar')).toBe('BAR');
        expect(sm.isUdtInstance('bar')).toBe(true);
    });

    it('does NOT register a function whose return paths produce DIFFERENT UDT types', () => {
        // Safety: if some return paths produce FOO and others BAR, the
        // function is not unambiguously typed — skip rather than misclassify.
        const sm = buildUdtRegistry(`
            const FOO = Type({ a: ['float', 0] });
            const BAR = Type({ b: ['float', 0] });
            function ambiguous(c) { if (c) { return FOO.new(); } else { return BAR.new(); } }
        `);
        expect(sm.getFunctionReturnType('ambiguous')).toBeUndefined();
    });

    it('does NOT register a function with a non-UDT return path', () => {
        // If even one return produces a non-UDT (or unrecognized) value,
        // the function's return type stays unknown.
        const sm = buildUdtRegistry(`
            const BAR = Type({ b: ['float', 0] });
            function maybe(c) { if (c) { return BAR.new(); } else { return 0; } }
        `);
        expect(sm.getFunctionReturnType('maybe')).toBeUndefined();
    });

    it('does NOT descend into nested function bodies when collecting returns', () => {
        // The outer function's `return` paths must not be polluted by an
        // inner closure's `return BAR.new()`. Outer returns 1 (a number),
        // so it shouldn't be registered as a UDT-returning function.
        const sm = buildUdtRegistry(`
            const BAR = Type({ b: ['float', 0] });
            function outer() {
                function inner() { return BAR.new(); }
                return 1;
            }
        `);
        expect(sm.getFunctionReturnType('outer')).toBeUndefined();
        expect(sm.getFunctionReturnType('inner')).toBe('BAR');
    });

    it('infers tuple return type when a function returns `[<UDT>.new(), <UDT>.new()]`', () => {
        // Case 4 — `makeBars() => [BAR.new(), BAR.new()]` is recorded so that
        // tuple-destructuring at the call site can register each binding.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function makeBars() { return [BAR.new(), BAR.new()]; }
        `);
        expect(sm.getFunctionReturnTupleType('makeBars')).toEqual(['BAR', 'BAR']);
        // Scalar-return registry must remain empty for tuple-returning fns.
        expect(sm.getFunctionReturnType('makeBars')).toBeUndefined();
    });

    it('infers heterogeneous tuple return types (mixed UDT slots)', () => {
        // Distinct UDT types per slot should be preserved verbatim.
        const sm = buildUdtRegistry(`
            const FOO = Type({ a: ['float', 0] });
            const BAR = Type({ b: ['float', 0] });
            function makePair() { return [FOO.new(), BAR.new()]; }
        `);
        expect(sm.getFunctionReturnTupleType('makePair')).toEqual(['FOO', 'BAR']);
    });

    it('registers ArrayPattern destructuring elements as UDT instances per slot', () => {
        // The Case 4 fix in action — `[a, b] = makeBars()` registers each
        // element with its tuple slot's UDT type.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function makeBars() { return [BAR.new(), BAR.new()]; }
            let [a, b] = makeBars();
        `);
        expect(sm.isUdtInstance('a')).toBe(true);
        expect(sm.isUdtInstance('b')).toBe(true);
        expect(sm.getVariableUdtType('a')).toBe('BAR');
        expect(sm.getVariableUdtType('b')).toBe('BAR');
    });

    it('skips non-UDT slots when destructuring a partially-typed tuple', () => {
        // If only some slots are UDT instances, only those positions register.
        const sm = buildUdtRegistry(`
            const BAR = Type({ b: ['float', 0] });
            function makeMixed() { return [BAR.new(), 0]; }
            let [u, n] = makeMixed();
        `);
        expect(sm.isUdtInstance('u')).toBe(true);
        expect(sm.getVariableUdtType('u')).toBe('BAR');
        expect(sm.isUdtInstance('n')).toBe(false);
    });

    it('does NOT register destructuring when tuple lengths differ across return paths', () => {
        // Safety: if return paths produce tuples of different lengths the
        // function's tuple shape is ambiguous → no registration.
        const sm = buildUdtRegistry(`
            const BAR = Type({ b: ['float', 0] });
            function inconsistent(c) {
                if (c) { return [BAR.new(), BAR.new()]; }
                else   { return [BAR.new()]; }
            }
            let [a, b] = inconsistent(true);
        `);
        expect(sm.getFunctionReturnTupleType('inconsistent')).toBeUndefined();
        expect(sm.isUdtInstance('a')).toBe(false);
        expect(sm.isUdtInstance('b')).toBe(false);
    });

    it('does NOT register destructuring when a slot type disagrees across return paths', () => {
        // Safety: slot 0 is FOO in one path and BAR in another → ambiguous.
        const sm = buildUdtRegistry(`
            const FOO = Type({ a: ['float', 0] });
            const BAR = Type({ b: ['float', 0] });
            function ambig(c) {
                if (c) { return [FOO.new(), BAR.new()]; }
                else   { return [BAR.new(), BAR.new()]; }
            }
            let [x, y] = ambig(true);
        `);
        expect(sm.getFunctionReturnTupleType('ambig')).toBeUndefined();
        expect(sm.isUdtInstance('x')).toBe(false);
        expect(sm.isUdtInstance('y')).toBe(false);
    });

    it('reads `__pineParamTypes__` markers and registers UDT-typed function parameters', () => {
        // Case 2 — pine2js codegen emits a marker for each function whose
        // parameters carry a Pine type annotation (e.g. `readField(BAR b)`).
        // The pre-pass reads it and stores `funcName → { paramName: TypeName }`
        // for `transformFunctionDeclaration` to consume scope-locally.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function readField(b) { return b.low_v[1]; }
            readField.__pineParamTypes__ = { "b": "BAR" };
        `);
        expect(sm.getFunctionParamUdtTypes('readField')).toEqual({ b: 'BAR' });
    });

    it('strips Pine type qualifiers (`series BAR`) when resolving the type name', () => {
        // Pine annotations can include qualifiers: `series BAR b`, `simple int x`.
        // The pre-pass keeps only the trailing token and matches it against
        // the UDT registry.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function readField(b) { return b.low_v[1]; }
            readField.__pineParamTypes__ = { "b": "series BAR" };
        `);
        expect(sm.getFunctionParamUdtTypes('readField')).toEqual({ b: 'BAR' });
    });

    it('drops non-UDT parameter type annotations from the marker', () => {
        // `int`, `float`, `string` etc. are never UDT type names. The marker
        // emits them too, but the pre-pass filters them out.
        const sm = buildUdtRegistry(`
            const BAR = Type({ low_v: ['float', 0] });
            function mixed(a, b, c) { return 0; }
            mixed.__pineParamTypes__ = { "a": "int", "b": "BAR", "c": "float" };
        `);
        // Only `b: BAR` survives — primitives are filtered.
        expect(sm.getFunctionParamUdtTypes('mixed')).toEqual({ b: 'BAR' });
    });

    it('skips marker registration entirely when no params resolve to a UDT', () => {
        // Avoid polluting the registry with an empty entry for fully-untyped
        // (or all-primitive) function signatures.
        const sm = buildUdtRegistry(`
            function plain(x, y) { return x + y; }
            plain.__pineParamTypes__ = { "x": "int", "y": "float" };
        `);
        expect(sm.getFunctionParamUdtTypes('plain')).toBeUndefined();
    });

    it('does NOT register built-in factory calls as UDT instances', () => {
        // These are critical: built-in factory methods like polyline.new(),
        // array.from(), chart.point.from_index() must NOT enter the UDT
        // registry — otherwise their `field[N]` patterns get incorrectly
        // rewritten as series lookback (regression on the polyline test).
        const sm = buildUdtRegistry(`
            let arr = array.from(1, 2, 3);
            let pl = polyline.new(arr);
            let pt = chart.point.from_index(0, 100);
            let lbl = label.new(0, 0, "x");
            let bx = box.new(0, 0, 1, 1);
        `);
        expect(sm.isUdtInstance('arr')).toBe(false);
        expect(sm.isUdtInstance('pl')).toBe(false);
        expect(sm.isUdtInstance('pt')).toBe(false);
        expect(sm.isUdtInstance('lbl')).toBe(false);
        expect(sm.isUdtInstance('bx')).toBe(false);
    });
});

// ── 2. Codegen shape ───────────────────────────────────────────────────

describe('UDT field subscript — transpiler codegen shape', () => {
    it('rewrites `bar.field[N]` (top-level RHS) to `$.get(<scoped-bar>, N).field`', () => {
        // Bug 1: previously emitted `$.init(target, $.get(bar, 0).field, N)`
        // — the lookback as a stray third arg that `$.init` silently ignored
        // for scalars. The correct shape applies the lookback at the leaf base.
        const code = `
//@version=6
indicator("udt subscript top-level")
type BAR
    float low_v = low
bar = BAR.new()
b = bar.low_v[1]
plot(close)
        `;
        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('$.get($.let.glb1_bar, 1).low_v');
        // Must NOT regress to the broken stray-third-arg form
        expect(jsCode).not.toMatch(/\$\.init\([^,]+,\s*\$\.get\(\$\.let\.glb1_bar,\s*0\)\.low_v,\s*1\)/);
    });

    it('rewrites `bar.field[N]` inside a function-call arg to `$.get(<scoped-bar>, N).field` (no $.param wrap)', () => {
        // Bug 2 (original fix): previously emitted `$.param(bar.field, N, ...)`
        // with bare `bar`, throwing "bar is not defined".
        // Bug 4 (newer fix): even after scoping the leaf, wrapping the SCALAR
        // result in `$.param(scalar, N, name)` produced wrong values when the
        // call site was inside a conditional block — `$.param`'s history is
        // per-call, not per-bar, so lookback returned values from the previous
        // firing instead of from N bars earlier in time.
        // Correct shape: bypass `$.param` and lookback directly on the bar
        // series, which IS populated every bar. The arg becomes a raw
        // `$.get(<scoped-bar>, N).field` MemberExpression.
        const code = `
//@version=6
indicator("udt subscript function arg")
type BAR
    float low_v = low
bar = BAR.new()
identity(x) => x
b = identity(bar.low_v[1])
plot(close)
        `;
        const result = transpile(code);
        const jsCode = result.toString();

        // The arg passed to `identity` (via `$.call(...)`) must be the direct
        // lookback expression with `N` baked into `$.get(...)` itself.
        expect(jsCode).toMatch(/\$\.get\(\$\.let\.glb1_bar,\s*1\)\.low_v/);
        // The buggy `$.param(scalar, N, ...)` wrapper must NOT appear.
        expect(jsCode).not.toMatch(/\$\.param\(\$\.get\(\$\.let\.glb1_bar,\s*0\)\.low_v,\s*1\b/);
        // Must NOT regress to bare `bar.low_v` either.
        expect(jsCode).not.toMatch(/\$\.param\(bar\.low_v,/);
    });

    it('does NOT rewrite `<member>[N]` when the leaf base is NOT a UDT instance', () => {
        // Critical guard — JS-style `pl.points[0]` where `pl = polyline.new(...)`
        // must remain a plain array index, not become `$.get(pl, 0).points`.
        const code = `
//@version=6
indicator("not a UDT instance", overlay=true)
plot(close)
        `;
        // The UDT registry is empty for this script (no `type X`).
        // Even if we synthesize the AST shape that LOOKS like UDT subscript,
        // the rewrite should not fire. Demonstrate via direct registry check:
        const sm = buildUdtRegistry(`
            let pts = array.from(1, 2, 3);
            let pl = polyline.new(pts);
        `);
        expect(sm.isUdtInstance('pl')).toBe(false);
        expect(sm.isUdtInstance('pts')).toBe(false);
        // Smoke check transpile completes
        expect(transpile(code).toString()).toBeDefined();
    });

    it('rewrites nested UDT field chains correctly (`outer.inner.field[N]`)', () => {
        // The walker descends to the leaf identifier; rewrite anchors there.
        const code = `
//@version=6
indicator("nested UDT chain")
type INNER
    float v = low
type OUTER
    INNER inner = INNER.new()
bar = OUTER.new()
b = bar.inner.v[1]
plot(close)
        `;
        const result = transpile(code);
        const jsCode = result.toString();
        // Lookback applied to `bar` (the leaf), then `.inner.v` chain follows; before the first bar the
        // instance is na, so the nested hop is optional and the read is na
        expect(jsCode).toContain('$.get($.let.glb1_bar, 1).inner?.v ?? NaN');
    });
});

// ── 3. Smoke tests — does-not-crash and output-shape integrity ────────

// Note: full TV-vs-PineTS value equivalence is covered end-to-end by the
// automated test at:
//   Automations/PineTS/pinescripts/lang/udt_field_subscript.pine
// The smoke tests below verify that the transpile + run pipeline doesn't
// throw on the bug-triggering shapes — protecting against regressions in
// the surrounding wiring (preProcessUdtRegistry registration, walker
// short-circuits, etc.) that would silently re-break the behavior.

describe('UDT field subscript — pipeline smoke tests', () => {
    const mkPts = () =>
        new PineTS(
            Provider.Mock,
            'BTCUSDC',
            'D',
            null,
            new Date('2019-04-01').getTime(),
            new Date('2019-04-15').getTime(),
        );

    it('Bug 2 smoke — function-arg `f(bar.field[N])` does not crash', async () => {
        // Before the surgical fix in transformFunctionArgument's isArrayAccess
        // branch, this exact shape threw `ReferenceError: bar is not defined`
        // because the leaf `bar` Identifier was never scoped to `glb1_bar`.
        await expect(
            mkPts().run(`
//@version=5
indicator("bug2smoke")
type BAR
    float low_v = low
bar = BAR.new()
f(x) => x
plot(f(bar.low_v[1]), "out")
            `),
        ).resolves.toBeDefined();
    });

    it('Bug 1 smoke — top-level `b = bar.field[N]` does not crash', async () => {
        // Before the rewrite in transformMemberExpression, this shape compiled
        // but emitted `$.init(t, value, 1)` with the lookback as a stray third
        // arg silently ignored. Verifies the script still runs end-to-end.
        await expect(
            mkPts().run(`
//@version=5
indicator("bug1smoke")
type BAR
    float low_v = low
bar = BAR.new()
b = bar.low_v[1]
plot(b, "out")
            `),
        ).resolves.toBeDefined();
    });

    it('Case 1 smoke — `bar = makeBar()` then `bar.field[N]` runs without error', async () => {
        // Verifies that user-function-return type inference enables the rewrite
        // for the indirect initialization pattern.
        await expect(
            mkPts().run(`
//@version=5
indicator("case1smoke")
type BAR
    float low_v = low
makeBar() =>
    BAR.new()
bar = makeBar()
b = bar.low_v[1]
plot(b, "out")
            `),
        ).resolves.toBeDefined();
    });

    it('Case 2 smoke — `readField(BAR b) => b.field[N]` runs without "b is not defined"', async () => {
        // Verifies the typed-parameter path: pine2js emits __pineParamTypes__,
        // AnalysisPass populates the per-function registry, and
        // transformFunctionDeclaration scope-locally registers `b` as a UDT
        // instance for the duration of the body. Before the fix, `b.low_v[N]`
        // inside the body either crashed or silently returned the wrong value.
        await expect(
            mkPts().run(`
//@version=5
indicator("case2smoke")
type BAR
    float low_v = low
readField(BAR b) =>
    b.low_v[1]
bar = BAR.new()
plot(readField(bar), "out")
            `),
        ).resolves.toBeDefined();
    });

    it('Case 4 smoke — `[a, b] = makeBars()` then `a.field[N]` runs without error', async () => {
        // Verifies that tuple-return inference + ArrayPattern slot registration
        // enable the rewrite for the destructuring pattern.
        await expect(
            mkPts().run(`
//@version=5
indicator("case4smoke")
type BAR
    float low_v = low
makeBars() =>
    [BAR.new(), BAR.new()]
[a, b] = makeBars()
plot(a.low_v[1], "outA")
plot(b.low_v[2], "outB")
            `),
        ).resolves.toBeDefined();
    });

    it('UDT-instance discrimination — script using polyline.new() does not crash', async () => {
        // Sanity check that built-in factory calls (polyline.new, array.from,
        // chart.point.from_index) are NOT registered as UDT instances. Before
        // the discrimination check was added, an over-eager rewrite would
        // misinterpret `pl.points[0]` as series lookback and crash.
        await expect(
            mkPts().run(`
//@version=5
indicator("polyline-discrim")
var pt1 = chart.point.from_index(0, 50000)
var pt2 = chart.point.from_index(5, 60000)
var pts = array.from(pt1, pt2)
var pl = polyline.new(pts)
plot(close)
            `),
        ).resolves.toBeDefined();
    });
});
