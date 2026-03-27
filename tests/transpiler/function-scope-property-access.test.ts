// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';
import { transpile } from '../../src/transpiler/index';

/**
 * Tests for correct scope resolution when property access on function-scoped
 * variables is used as an argument to namespace methods.
 *
 * BUG: In `transformFunctionArgument()`, the `isPropertyAccess` branch used
 * `ASTFactory.createContextVariableReference(kind, varName)` which always
 * produces `$.let.varName` (global scope). For variables inside functions,
 * it should use `createScopedVariableReference(name, scopeManager)` which
 * checks `isVariableInFunctionScope()` and produces `$$.let.varName`
 * (function-local context via `$.peekCtx()`).
 *
 * PATTERN: This bug manifests when:
 *   1. A UDT variable is declared inside a function (or loop inside a function)
 *   2. A property of that variable is passed as an argument to a namespace
 *      method call (e.g., `line.delete(oldZone.zoneLine)`)
 *   3. The transpiler hoists the argument into a `line.param()` call
 *   4. The hoisted argument incorrectly references `$.let.varName` instead
 *      of `$$.let.varName`
 *
 * REGRESSION HISTORY:
 *   This was a pre-existing bug discovered via pressure-zone-analyzer.pine
 *   (2026-03-11). The `cleanupZones` function has a while loop that calls
 *   `line.delete(oldZone.zoneLine)` — the `oldZone` variable was resolved
 *   to global scope, causing "Cannot read properties of undefined" at runtime.
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
// A) Transpiler output tests — verify $$ is used for function-scoped vars
// ===========================================================================

describe('Function-scope property access in namespace args — transpiler output', () => {

    // -----------------------------------------------------------------------
    // Function parameters: stay as raw identifiers, property access uses
    // raw param name (not $.let or $$.let). The key check is that the
    // hoisted line.param() uses the raw parameter, NOT a $.let reference.
    // -----------------------------------------------------------------------

    it('function parameter property access is unwrapped via $.get()', () => {
        const code = `
//@version=5
indicator("fn param prop access")

type MyZone
    line zoneLine

deleteZoneLine(MyZone zone) =>
    line.delete(zone.zoneLine)

plot(close)
`;
        const output = transpileToString(code);
        // Function params need $.get(zone, 0).zoneLine to unwrap the Series wrapper
        // and access the UDT field correctly
        expect(output).toMatch(/\$\.get\(zone, 0\)\.zoneLine/);
        // Must NOT be wrapped in $.let or $$.let (params stay as plain identifiers)
        expect(output).not.toMatch(/\$\.let\.\w*zone/);
        expect(output).not.toMatch(/\$\$\.let\.\w*zone/);
    });

    // -----------------------------------------------------------------------
    // Locally declared variables inside loops within functions: these ARE
    // renamed (e.g., whl1_oldZone) and must use $$ (function-local context),
    // NOT $ (global context). This is the exact bug from pressure-zone-analyzer.
    // -----------------------------------------------------------------------

    it('while-loop variable property access inside function uses $$ (pressure-zone-analyzer repro)', () => {
        const code = `
//@version=5
indicator("while loop fn scope")

type PressureZone
    line zoneLine

cleanupZones(array<PressureZone> zones, int maxZones) =>
    while array.size(zones) > maxZones
        PressureZone oldZone = array.shift(zones)
        line.delete(oldZone.zoneLine)

plot(close)
`;
        const output = transpileToString(code);
        // oldZone is inside a while loop inside a function — must use $$
        expect(output).toMatch(/\$\$\.let\.\w*oldZone/);
        // Must NOT have bare $.let.oldZone (without preceding $)
        // Use negative lookbehind to exclude $$.let matches
        expect(output).not.toMatch(/(?<!\$)\$\.let\.\w*oldZone/);
    });

    it('for-loop variable property access inside function uses $$', () => {
        const code = `
//@version=5
indicator("for loop fn scope")

type Wave
    line waveLine

clearWaves(array<Wave> waves) =>
    for i = 0 to array.size(waves) - 1
        Wave w = array.get(waves, i)
        line.delete(w.waveLine)

plot(close)
`;
        const output = transpileToString(code);
        // w is inside a for loop inside a function — must use $$
        expect(output).toMatch(/\$\$\.let\.\w*w\b/);
        expect(output).not.toMatch(/(?<!\$)\$\.let\.\w*w\b/);
    });

    it('if-block variable property access inside function uses $$', () => {
        const code = `
//@version=5
indicator("if block fn scope")

type DrawObj
    label lbl

removeIfExists(array<DrawObj> arr) =>
    if array.size(arr) > 0
        DrawObj item = array.shift(arr)
        label.delete(item.lbl)

plot(close)
`;
        const output = transpileToString(code);
        // item is inside an if block inside a function — must use $$
        expect(output).toMatch(/\$\$\.let\.\w*item/);
        expect(output).not.toMatch(/(?<!\$)\$\.let\.\w*item/);
    });

    it('multiple property accesses on loop variable inside function all use $$', () => {
        const code = `
//@version=5
indicator("multi prop while fn")

type Zone
    line topLine
    line botLine
    label lbl

cleanupZones(array<Zone> arr) =>
    while array.size(arr) > 3
        Zone old = array.shift(arr)
        line.delete(old.topLine)
        line.delete(old.botLine)
        label.delete(old.lbl)

plot(close)
`;
        const output = transpileToString(code);
        // All references to old inside the function must use $$
        expect(output).toMatch(/\$\$\.let\.\w*old\b/);
        expect(output).not.toMatch(/(?<!\$)\$\.let\.\w*old\b/);
        // Verify all three property accesses are present
        expect(output).toMatch(/\.topLine/);
        expect(output).toMatch(/\.botLine/);
        expect(output).toMatch(/\.lbl/);
    });

    // -----------------------------------------------------------------------
    // Negative case: global scope property access should still use $
    // -----------------------------------------------------------------------

    it('UDT property at global scope correctly uses $ (not $$)', () => {
        const code = `
//@version=5
indicator("global scope prop")

type MyZone
    line zoneLine

var MyZone zone = MyZone.new(line.new(na, na, na, na))
line.delete(zone.zoneLine)

plot(close)
`;
        const output = transpileToString(code);
        // At global scope, zone should use $ (no $$ exists)
        expect(output).toMatch(/\$\.(?:var|let)\.\w*zone/);
    });
});


// ===========================================================================
// B) Runtime tests — verify no crash with function-scoped UDT property access
// ===========================================================================

describe('Function-scope property access in namespace args — runtime behavior', () => {

    it('line.delete(udt.field) inside function does not crash', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("fn line delete", overlay=true)

type MyZone
    line zoneLine
    float price

var myZones = array.new<MyZone>(0)

addZone(array<MyZone> zones, float p) =>
    zones.push(MyZone.new(line.new(bar_index - 5, p, bar_index, p), p))

removeOldest(array<MyZone> zones) =>
    if array.size(zones) > 0
        MyZone old = array.shift(zones)
        line.delete(old.zoneLine)

addZone(myZones, close)
if array.size(myZones) > 3
    removeOldest(myZones)

plot(array.size(myZones), "count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['count']).toBeDefined();
        // Count should be capped at 3 (add one per bar, remove when > 3)
        const lastVal = plots['count'].data[plots['count'].data.length - 1].value;
        expect(lastVal).toBeLessThanOrEqual(4);
    });

    it('while loop cleanup pattern (pressure-zone-analyzer repro)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("while cleanup", overlay=true)

type PressureZone
    line zoneLine
    float price

var zones = array.new<PressureZone>(0)

cleanupZones(array<PressureZone> zoneArr, int maxZones) =>
    while array.size(zoneArr) > maxZones
        PressureZone oldZone = array.shift(zoneArr)
        line.delete(oldZone.zoneLine)

zones.push(PressureZone.new(line.new(bar_index - 3, close, bar_index, close, color=#ff0000), close))
cleanupZones(zones, 3)

plot(array.size(zones), "size")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['size']).toBeDefined();
        const lastVal = plots['size'].data[plots['size'].data.length - 1].value;
        expect(lastVal).toBeLessThanOrEqual(3);
    });

    it('multiple drawing field deletions inside function', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("multi field delete", overlay=true)

type AnnotatedZone
    line topLine
    line botLine
    label lbl

var zones = array.new<AnnotatedZone>(0)

removeZone(array<AnnotatedZone> arr) =>
    if array.size(arr) > 0
        AnnotatedZone z = array.shift(arr)
        line.delete(z.topLine)
        line.delete(z.botLine)
        label.delete(z.lbl)

if barstate.isfirst
    zones.push(AnnotatedZone.new(
        line.new(0, 100, 10, 100, color=#ff0000),
        line.new(0, 90, 10, 90, color=#00ff00),
        label.new(5, 95, "Zone1")
    ))
    zones.push(AnnotatedZone.new(
        line.new(0, 80, 10, 80, color=#ff0000),
        line.new(0, 70, 10, 70, color=#00ff00),
        label.new(5, 75, "Zone2")
    ))

if bar_index == 1
    removeZone(zones)

plot(array.size(zones), "remaining")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['remaining']).toBeDefined();
    });

    it('for loop with UDT property access inside function', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("for loop fn prop", overlay=true)

type Wave
    line waveLine
    float price

var waves = array.new<Wave>(0)

clearAllWaves(array<Wave> arr) =>
    for i = 0 to array.size(arr) - 1
        Wave w = array.get(arr, i)
        line.delete(w.waveLine)
    array.clear(arr)

if barstate.isfirst
    waves.push(Wave.new(line.new(0, 100, 5, 200, color=#ff0000), 100.0))
    waves.push(Wave.new(line.new(0, 200, 5, 300, color=#00ff00), 200.0))

if bar_index == 2
    clearAllWaves(waves)

plot(array.size(waves), "count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['count']).toBeDefined();
    });

    it('label.set_text with UDT property inside function', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("label set in fn", overlay=true)

type Marker
    label lbl
    string text

updateMarker(Marker m, string newText) =>
    label.set_text(m.lbl, newText)
    label.set_xy(m.lbl, bar_index, close)

var Marker marker = Marker.new(label.new(0, 0, "init"), "init")
updateMarker(marker, "Bar " + str.tostring(bar_index))

plot(close, "price")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['__labels__']).toBeDefined();
    });

    it('nested function calls with UDT property access', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("nested fn prop", overlay=true)

type Channel
    line upper
    line lower

deleteChannel(Channel ch) =>
    line.delete(ch.upper)
    line.delete(ch.lower)

manageChannels(array<Channel> channels, int max) =>
    while array.size(channels) > max
        Channel old = array.shift(channels)
        deleteChannel(old)

var channels = array.new<Channel>(0)
channels.push(Channel.new(
    line.new(bar_index - 3, high, bar_index, high, color=#ff0000),
    line.new(bar_index - 3, low, bar_index, low, color=#00ff00)
))
manageChannels(channels, 2)

plot(array.size(channels), "ch_count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['ch_count']).toBeDefined();
        const lastVal = plots['ch_count'].data[plots['ch_count'].data.length - 1].value;
        expect(lastVal).toBeLessThanOrEqual(2);
    });

    it('function with request.security context does not crash', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("fn prop with security", overlay=true)

type Level
    line ln
    float val

var levels = array.new<Level>(0)

cleanLevels(array<Level> arr, int maxLevels) =>
    while array.size(arr) > maxLevels
        Level old = array.shift(arr)
        line.delete(old.ln)

levels.push(Level.new(line.new(bar_index - 2, close, bar_index, close), close))
cleanLevels(levels, 3)

htfClose = request.security(syminfo.tickerid, "M", close)
plot(htfClose, "htf")
plot(array.size(levels), "lvl_count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['lvl_count']).toBeDefined();
    });
});
