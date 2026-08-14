// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { transpile } from '../../src/transpiler/index';

/**
 * Tests for optional chaining on method calls after $.get().
 *
 * In Pine Script, calling methods on `na` is a silent no-op. In PineTS, `na`
 * is NaN at runtime. Since NaN is not null/undefined, `NaN?.method` still
 * accesses `.method` → `undefined`, and `undefined()` throws. Double optional
 * chaining (`obj?.method?.()`) is needed so the call short-circuits safely.
 *
 * The transpiler adds this optional chaining to method calls on values
 * retrieved via `$.get()`. Two patterns exist:
 *
 *   Direct:  $.get(X, N).method()        → $.get(X, N)?.method?.()
 *   Chained: $.get(X, N).field.method()  → $.get(X, N).field?.method?.()
 *
 * REGRESSION HISTORY:
 *   Commit 239c6fa (2026-03-10) broadened the condition to
 *   `hasGetCallInChain(node.callee)`, which matched intermediate `.get(0)`
 *   calls (e.g. in `arr.get(0).field.method()`) instead of the leaf method.
 *   Wrapping the intermediate call in ChainExpression blocked the leaf call
 *   from finding `$.get()` in its chain, so the leaf method lost its optional
 *   chaining entirely. Fixed by separating into isDirect and isChained cases
 *   and adding ChainExpression traversal to `hasGetCallInChain()`.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePineTS = () =>
    new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

/** Transpile Pine Script source and return the generated code string */
function transpileToString(pineCode: string): string {
    const fn = transpile(pineCode);
    return fn.toString();
}

// ===========================================================================
// A) Transpiler output tests — verify the generated code has correct patterns
// ===========================================================================

describe('Optional chaining on $.get() — transpiler output', () => {

    // -----------------------------------------------------------------------
    // Case 1 — Direct: var drawing = na → $.get(X, N).delete() needs ?.
    // -----------------------------------------------------------------------

    it('direct pattern: var polyline = na → method gets optional chaining', () => {
        const code = `
//@version=6
indicator("direct na var", overlay=true)
var polyline profilePoly = na
profilePoly.delete()
plot(close)
`;
        const output = transpileToString(code);
        // Should contain ?.delete?.() — double optional chaining
        expect(output).toMatch(/\?\.\s*delete\s*\?\.\s*\(/);
    });

    it('direct pattern: var line = na → set_xy1 gets optional chaining', () => {
        const code = `
//@version=6
indicator("direct na line", overlay=true)
var line myLine = na
myLine.set_xy1(bar_index, close)
plot(close)
`;
        const output = transpileToString(code);
        expect(output).toMatch(/\?\.\s*set_xy1\s*\?\.\s*\(/);
    });

    it('direct pattern: var label = na → get_text gets optional chaining', () => {
        const code = `
//@version=6
indicator("direct na label", overlay=true)
var label myLabel = na
plot(myLabel.get_text() == "hi" ? 1 : 0)
`;
        const output = transpileToString(code);
        expect(output).toMatch(/\?\.\s*get_text\s*\?\.\s*\(/);
    });

    // -----------------------------------------------------------------------
    // Case 2 — Chained: UDT.field.method() where field could be na
    // -----------------------------------------------------------------------

    it('chained pattern: UDT.field.method() gets optional chaining on field', () => {
        const code = `
//@version=6
indicator("chained UDT field", overlay=true)
type MyObj
    box bx
var MyObj obj = MyObj.new()
obj.bx.delete()
plot(close)
`;
        const output = transpileToString(code);
        // The .delete() call on the field should have optional chaining
        expect(output).toMatch(/\?\.\s*delete\s*\?\.\s*\(/);
    });

    it('chained pattern: UDT.lineField.get_x1() gets optional chaining', () => {
        const code = `
//@version=6
indicator("chained get_x1", overlay=true)
type MyObj
    line ln
var MyObj obj = MyObj.new()
plot(obj.ln.get_x1())
`;
        const output = transpileToString(code);
        expect(output).toMatch(/\?\.\s*get_x1\s*\?\.\s*\(/);
    });

    // -----------------------------------------------------------------------
    // REGRESSION: array.get(N).field.method() — intermediate .get(N)
    // must NOT steal optional chaining from the leaf method
    // -----------------------------------------------------------------------

    it('regression: arr.get(0).field.method() — leaf method gets optional chaining', () => {
        const code = `
//@version=6
indicator("arr get field method", overlay=true)
type Ewave
    box b5
var Ewave[] aEW = array.new<Ewave>(0)
if barstate.isfirst
    aEW.push(Ewave.new())
aEW.get(0).b5.get_left()
plot(close)
`;
        const output = transpileToString(code);
        // The leaf .get_left() must have optional chaining
        expect(output).toMatch(/\?\.\s*get_left\s*\?\.\s*\(/);
    });

    it('regression: arr.get(0).field.set_xy1() — leaf set method gets optional chaining', () => {
        const code = `
//@version=6
indicator("arr get field set", overlay=true)
type MyWave
    line l1
var MyWave[] waves = array.new<MyWave>(0)
if barstate.isfirst
    waves.push(MyWave.new())
waves.get(0).l1.set_xy1(bar_index, close)
plot(close)
`;
        const output = transpileToString(code);
        // The leaf .set_xy1() must have optional chaining
        expect(output).toMatch(/\?\.\s*set_xy1\s*\?\.\s*\(/);
    });

    it('regression: arr.get(0).field.delete() — leaf delete gets optional chaining', () => {
        const code = `
//@version=6
indicator("arr get field delete", overlay=true)
type MyObj
    label lb
var MyObj[] objs = array.new<MyObj>(0)
if barstate.isfirst
    objs.push(MyObj.new())
objs.get(0).lb.delete()
plot(close)
`;
        const output = transpileToString(code);
        expect(output).toMatch(/\?\.\s*delete\s*\?\.\s*\(/);
    });

    // -----------------------------------------------------------------------
    // Deep chain: arr.get(0).udtField.drawingField.method()
    // -----------------------------------------------------------------------

    it('deep chain: nested UDT field access still gets optional chaining on leaf', () => {
        const code = `
//@version=6
indicator("deep chain", overlay=true)
type Inner
    line ln
type Outer
    Inner child
var Outer[] arr = array.new<Outer>(0)
if barstate.isfirst
    arr.push(Outer.new(Inner.new()))
arr.get(0).child.ln.get_x1()
plot(close)
`;
        const output = transpileToString(code);
        // The deep leaf .get_x1() must still have optional chaining
        expect(output).toMatch(/\?\.\s*get_x1\s*\?\.\s*\(/);
    });

    // -----------------------------------------------------------------------
    // Negative cases — method calls that should NOT get optional chaining
    // -----------------------------------------------------------------------

    it('regular method calls (no $.get in chain) do NOT get optional chaining', () => {
        const code = `
//@version=6
indicator("no optional", overlay=true)
sma = ta.sma(close, 20)
plot(sma)
`;
        const output = transpileToString(code);
        // ta.sma should NOT have optional chaining
        expect(output).not.toMatch(/ta\s*\?\.\s*sma/);
    });

    it('math operations do NOT get optional chaining', () => {
        const code = `
//@version=6
indicator("math no optional")
x = math.abs(-5)
plot(x)
`;
        const output = transpileToString(code);
        expect(output).not.toMatch(/math\s*\?\.\s*abs/);
    });
});


// ===========================================================================
// B) Runtime tests — verify no crashes when UDT drawing fields are na
// ===========================================================================

describe('Optional chaining on $.get() — runtime behavior', () => {

    // -----------------------------------------------------------------------
    // Direct pattern: var drawing = na → method calls silently return na
    // -----------------------------------------------------------------------

    it('var line = na → set_xy1 is a no-op (no crash)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("direct na line rt", overlay=true)
var line myLine = na
myLine.set_xy1(bar_index, close)
myLine.set_xy2(bar_index, low)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('var label = na → set_text is a no-op (no crash)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("direct na label rt", overlay=true)
var label myLabel = na
myLabel.set_text("test")
myLabel.set_xy(bar_index, close)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('var box = na → delete is a no-op (no crash)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("direct na box rt", overlay=true)
var box myBox = na
myBox.delete()
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // Chained pattern: UDT.uninitializedField.method() → silent no-op
    // -----------------------------------------------------------------------

    it('UDT with uninitialized line field — set methods are no-ops', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("chained na line rt", overlay=true)
type MyObj
    line ln
var MyObj obj = MyObj.new()
obj.ln.set_xy1(bar_index, close)
obj.ln.set_xy2(bar_index, low)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('UDT with uninitialized box field — get methods return na', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("chained na box get rt", overlay=true)
type MyObj
    box bx
var MyObj obj = MyObj.new()
val = obj.bx.get_top()
plot(na(val) ? 0 : val, "result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        // val should be na → plot shows 0
        const lastVal = plots['result'].data[plots['result'].data.length - 1].value;
        expect(lastVal).toBe(0);
    });

    // -----------------------------------------------------------------------
    // REGRESSION: array.get(N).field.method() with uninitialized field
    // This is the exact pattern that broke Elliott Wave (commit 239c6fa)
    // -----------------------------------------------------------------------

    it('regression: arr.get(0).uninitField.get_x() does not crash', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("arr get uninit field rt", overlay=true)
type Ewave
    box b5
    line l1
var Ewave[] waves = array.new<Ewave>(0)
if barstate.isfirst
    waves.push(Ewave.new())
x = waves.get(0).b5.get_left()
y = waves.get(0).l1.get_x1()
plot(na(x) ? 0 : x)
plot(na(y) ? 0 : y)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('regression: arr.get(0).uninitField.set_xy1() does not crash', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("arr get uninit set rt", overlay=true)
type MyWave
    line l1
    label lb
var MyWave[] waves = array.new<MyWave>(0)
if barstate.isfirst
    waves.push(MyWave.new())
waves.get(0).l1.set_xy1(bar_index, close)
waves.get(0).lb.set_text("test")
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('regression: arr.get(0).uninitField.delete() does not crash', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("arr get uninit delete rt", overlay=true)
type MyObj
    box bx
    line ln
    label lb
var MyObj[] objs = array.new<MyObj>(0)
if barstate.isfirst
    objs.push(MyObj.new())
objs.get(0).bx.delete()
objs.get(0).ln.delete()
objs.get(0).lb.delete()
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // Full Elliott-Wave-like pattern: UDT with multiple drawing fields,
    // array access, and method calls on uninitialized fields
    // -----------------------------------------------------------------------

    it('Elliott Wave pattern: UDT array with mixed init/uninit drawing fields', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("EW pattern", overlay=true)
type Ewave
    box b5
    line l1
    label lb
    float price = na

var Ewave[] waves = array.new<Ewave>(0)
if barstate.isfirst
    waves.push(Ewave.new(
        b5 = na,
        l1 = line.new(na, na, na, na, color=#ff0000),
        lb = na,
        price = close
    ))

ew = waves.get(0)

// Mix of initialized (l1) and uninitialized (b5, lb) fields
ew.l1.set_xy1(bar_index - 5, close)
ew.l1.set_xy2(bar_index, close)
ew.b5.get_left()
ew.lb.delete()
ew.price := close

plot(ew.price)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        // The initialized line should exist
        expect(plots['__lines__']).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // UDT method (Pine `method`) calling drawing methods on fields
    // -----------------------------------------------------------------------

    it('UDT method calling drawing methods on uninitialized field — no crash', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("UDT method uninit", overlay=true)
type MyFib
    line ln1
    line ln2

method setLines(MyFib f, int x1, int x2, float y) =>
    f.ln1.set_xy1(x1, y)
    f.ln1.set_xy2(x2, y)
    f.ln2.set_xy1(x1, y + 10)
    f.ln2.set_xy2(x2, y + 10)

var MyFib fib = MyFib.new()
fib.setLines(bar_index - 5, bar_index, close)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        // Should not crash even though ln1 and ln2 are both na
        expect(plots).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // Conditional initialization: field is na on some bars, valid on others
    // -----------------------------------------------------------------------

    it('field conditionally initialized — methods work on both na and valid', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("conditional init", overlay=true)
type MyObj
    line ln

var MyObj obj = MyObj.new()
if barstate.isfirst
    obj.ln := line.new(na, na, na, na, color=#ff0000)

// On bar 0, ln is valid; before initialization it was na
obj.ln.set_xy1(bar_index, close)
obj.ln.set_xy2(bar_index, low)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['__lines__']).toBeDefined();
        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        expect(lines.length).toBe(1);
    });

    // -----------------------------------------------------------------------
    // Initialized drawing fields should still work correctly
    // (optional chaining should be transparent for non-na values)
    // -----------------------------------------------------------------------

    it('initialized UDT drawing fields work correctly with optional chaining', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("init fields work", overlay=true)
type MyObj
    line ln
    label lb

var MyObj obj = MyObj.new(
    ln = line.new(0, 100, 10, 200, color=#ff0000),
    lb = label.new(0, 100, "test", color=#0000ff)
)
obj.ln.set_xy1(bar_index, high)
obj.ln.set_xy2(bar_index, low)
obj.lb.set_xy(bar_index, high)
obj.lb.set_text("Bar " + str.tostring(bar_index))

x1 = obj.ln.get_x1()
plot(x1, "x1_val")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();

        // Line should exist and have valid coordinates
        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        expect(lines.length).toBe(1);
        expect(lines[0].x1).not.toBeNaN();
        expect(lines[0].color).toBe('#ff0000');

        // Label should exist with updated text
        const labels = plots['__labels__'].data[0].value.filter((l: any) => !l._deleted);
        expect(labels.length).toBe(1);
        expect(labels[0].text).toContain('Bar');

        // get_x1() should return a valid number via plot
        const plotData = plots['x1_val'].data;
        const lastVal = plotData[plotData.length - 1].value;
        expect(typeof lastVal).toBe('number');
        expect(lastVal).not.toBeNaN();
    });

    it('arr.get(N) with initialized drawing field — methods produce correct results', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("arr init field", overlay=true)
type MyWave
    line l1

var MyWave[] waves = array.new<MyWave>(0)
if barstate.isfirst
    waves.push(MyWave.new(l1 = line.new(0, 100, 10, 200, color=#00ff00)))

waves.get(0).l1.set_xy1(bar_index - 3, close)
waves.get(0).l1.set_xy2(bar_index, close)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['__lines__']).toBeDefined();
        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        expect(lines.length).toBe(1);
        expect(lines[0].color).toBe('#00ff00');
        expect(lines[0].x1).not.toBeNaN();
    });
});
