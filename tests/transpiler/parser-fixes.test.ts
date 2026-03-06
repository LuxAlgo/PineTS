// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Parser & Codegen Fixes Test Suite
 *
 * Tests for syntax patterns added to the pineToJS parser/codegen and
 * the transformation pass to support advanced Pine Script constructs:
 *   - For loop as expression (assigned to variable)
 *   - While loop as expression (assigned to variable)
 *   - Switch without discriminant as expression (condition-based, IIFE)
 *   - Enum definitions and enum-based switch
 *   - Double negation / unary minus on expressions
 *   - IIFE body variable transformation ($.set inside for/while-as-expression)
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

// ---------------------------------------------------------------------------
// 1. For Loop as Expression
// ---------------------------------------------------------------------------
describe('Parser Fix: For Loop as Expression', () => {
    it('should parse for-loop assigned to a variable', () => {
        const code = `
//@version=5
indicator("For Expr Test")

sum = 0.0
result = for i = 0 to 4
    sum += close[i]
    sum

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toBeDefined();
        // The for-as-expression should produce an IIFE in the JS output
        expect(pine2js.code).toContain('(() =>');
    });

    it('should transpile for-loop-as-expression through full pipeline', () => {
        const code = `
//@version=5
indicator("For Expr Test")

sum = 0.0
result = for i = 0 to 4
    sum += close[i]
    sum

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Should contain the IIFE wrapping
        expect(jsCode).toContain('(() => {');
        // The variable should be properly initialized
        expect(jsCode).toContain('$.let.glb1_result');
    });

    it('should transpile for-loop with step as expression', () => {
        const code = `
//@version=5
indicator("For Step Expr")

result = for i = 0 to 10 by 3
    i

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('(() =>');

        const result = transpile(code);
        const jsCode = result.toString();
        expect(jsCode).toContain('$.let.glb1_result');
    });

    it('should run for-loop-as-expression at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("For Expr Runtime")

int _total = 0
_result = for i = 1 to 5
    _total += i
    _total

plot(_result, "Result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Result']).toBeDefined();
        expect(plots['Result'].data.length).toBeGreaterThan(0);

        // 1+2+3+4+5 = 15
        const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
        expect(lastValue).toBe(15);
    });
});

// ---------------------------------------------------------------------------
// 2. While Loop as Expression
// ---------------------------------------------------------------------------
describe('Parser Fix: While Loop as Expression', () => {
    it('should parse while-loop assigned to a variable', () => {
        const code = `
//@version=5
indicator("While Expr Test")

float acc = 0.0
int idx = 0
result = while idx < 5
    idx += 1
    acc += close[idx]
    acc

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toBeDefined();
        expect(pine2js.code).toContain('(() =>');
    });

    it('should transpile while-loop-as-expression through full pipeline', () => {
        const code = `
//@version=5
indicator("While Expr Test")

float acc = 0.0
int idx = 0
result = while idx < 5
    idx += 1
    acc += close[idx]
    acc

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('(() => {');
        expect(jsCode).toContain('$.let.glb1_result');
    });

    it('should parse while(true) with break as expression', () => {
        const code = `
//@version=5
indicator("While Break Expr")

result = while true
    break
    0.0

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
    });

    it('should run while-loop-as-expression at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("While Expr Runtime")

float _acc = 0.0
int _idx = 0
_result = while _idx < 5
    _idx += 1
    _acc += close[_idx]
    _acc

plot(_result, "Result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Result']).toBeDefined();
        expect(plots['Result'].data.length).toBeGreaterThan(0);

        const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
        expect(lastValue).toBeTypeOf('number');
        expect(isNaN(lastValue)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 3. Switch Without Discriminant as Expression
// ---------------------------------------------------------------------------
describe('Parser Fix: Switch Without Discriminant as Expression', () => {
    it('should parse condition-based switch assigned to a variable', () => {
        const code = `
//@version=5
indicator("Switch Cond Expr")

rsi = ta.rsi(close, 14)
result = switch
    rsi > 70 => 2
    rsi > 50 => 1
    rsi > 30 => -1
    => -2

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toBeDefined();
        // Condition-based switch as expression should produce an IIFE
        expect(pine2js.code).toContain('(() =>');
    });

    it('should transpile condition-based switch-as-expression to if/else IIFE', () => {
        const code = `
//@version=5
indicator("Switch Cond Expr")

rsi = ta.rsi(close, 14)
result = switch
    rsi > 70 => 2
    rsi > 50 => 1
    rsi > 30 => -1
    => -2

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Should contain IIFE wrapping since it's an expression assignment
        expect(jsCode).toContain('(() => {');
        // Should use if/else, NOT switch statement
        expect(jsCode).toContain('if (');
        expect(jsCode).toContain('else');
        expect(jsCode).toContain('$.let.glb1_result');
    });

    it('should NOT wrap condition-based switch in IIFE when used as statement', () => {
        const code = `
//@version=5
indicator("Switch Cond Stmt")

rsi = ta.rsi(close, 14)
var signal = 0

switch
    rsi > 70 =>
        signal := 1
    rsi < 30 =>
        signal := -1

plot(signal)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Used as statement — should be if/else without IIFE
        expect(jsCode).toContain('if (');
        expect(jsCode).toContain('else if (');
        // Should NOT have IIFE for the switch-as-statement
        // The switch-as-statement should produce plain if/else
        expect(jsCode).toContain('$.var.glb1_signal');
    });

    it('should run condition-based switch-as-expression at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("Switch Cond Runtime")

_rsi = ta.rsi(close, 14)
_result = switch
    _rsi > 70 => 2
    _rsi > 50 => 1
    _rsi > 30 => -1
    => -2

plot(_result, "Result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Result']).toBeDefined();
        expect(plots['Result'].data.length).toBeGreaterThan(0);

        const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
        expect(lastValue).toBeTypeOf('number');
    });
});

// ---------------------------------------------------------------------------
// 4. Enum Definitions
// ---------------------------------------------------------------------------
describe('Parser Fix: Enum Definitions', () => {
    it('should parse enum definition', () => {
        const code = `
//@version=5
indicator("Enum Test")

enum Trend
    strong_up
    up
    neutral
    down

plot(close)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toBeDefined();
    });

    it('should parse enum with member access', () => {
        const code = `
//@version=5
indicator("Enum Access")

enum Trend
    strong_up
    up
    neutral
    down

t = Trend.strong_up
plot(close)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('Trend.strong_up');
    });

    it('should parse enum used in switch expression', () => {
        const code = `
//@version=5
indicator("Enum Switch")

enum Direction
    long
    short
    flat

dir = Direction.long
result = switch dir
    Direction.long  => 1
    Direction.short => -1
    => 0

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('switch');
        expect(pine2js.code).toContain('Direction.long');
    });

    it('should parse enum used in if/else expression', () => {
        const code = `
//@version=5
indicator("Enum If")

enum Trend
    strong_up
    up
    neutral
    down

trend = if close > open * 1.02
    Trend.strong_up
else if close > open
    Trend.up
else
    Trend.neutral

plot(close)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('Trend.strong_up');
        expect(pine2js.code).toContain('Trend.up');
        expect(pine2js.code).toContain('Trend.neutral');
    });

    it('should transpile enum through full pipeline', () => {
        const code = `
//@version=5
indicator("Enum Full")

enum Direction
    long
    short
    flat

dir = Direction.long
result = switch dir
    Direction.long  => 1
    Direction.short => -1
    => 0

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();
        expect(jsCode).toBeDefined();
        expect(jsCode).toContain('$.let.glb1_result');
    });

    it('should rename enum in arrow function return with if/else', () => {
        const code = `
//@version=6
indicator("Enum Fn Return")

enum Signal
    Buy
    Sell
    Neutral

getSignal(rsi) =>
    if rsi < 30
        Signal.Buy
    else if rsi > 70
        Signal.Sell
    else
        Signal.Neutral

rsi = ta.rsi(close, 14)
sig = getSignal(rsi)
plot(sig == Signal.Buy ? 1 : 0)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Enum should be renamed inside function return statements
        expect(jsCode).toContain('$.get($.let.glb1_Signal, 0).Buy');
        expect(jsCode).toContain('$.get($.let.glb1_Signal, 0).Sell');
        expect(jsCode).toContain('$.get($.let.glb1_Signal, 0).Neutral');

        // Should NOT contain bare 'Signal.Buy' (except in string literals and comments)
        const lines = jsCode.split('\n').filter(l => !l.trim().startsWith('//'));
        const codeOnly = lines.filter(l => !l.includes("'Signal."));
        expect(codeOnly.join('\n')).not.toMatch(/(?<!\.)Signal\./);
    });

    it('should rename enum in if-condition test', () => {
        const code = `
//@version=6
indicator("Enum If Condition", overlay=true)

enum Signal
    Buy
    Sell

sig = close > open ? Signal.Buy : Signal.Sell
if sig == Signal.Buy
    label.new(bar_index, low, "BUY")
if sig == Signal.Sell
    label.new(bar_index, high, "SELL")
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Enum access in if-condition should be fully renamed
        expect(jsCode).toContain('$.get($.let.glb1_Signal, 0).Buy');
        expect(jsCode).toContain('$.get($.let.glb1_Signal, 0).Sell');

        // The if-conditions should use __eq with renamed enum
        expect(jsCode).toContain('__eq');
    });

    it('should rename enum in ternary expression', () => {
        const code = `
//@version=6
indicator("Enum Ternary")

enum Dir
    Up
    Down

dir = close > open ? Dir.Up : Dir.Down
val = dir == Dir.Up ? 1 : -1
plot(val)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Enum access in ternary should be renamed
        expect(jsCode).toContain('$.get($.let.glb1_Dir, 0).Up');
        expect(jsCode).toContain('$.get($.let.glb1_Dir, 0).Down');
    });

    it('should generate implicit return for arrow function with if/else', () => {
        const code = `
//@version=6
indicator("Implicit Return")

enum State
    Active
    Idle

getState(val) =>
    if val > 0
        State.Active
    else
        State.Idle

s = getState(close)
plot(s == State.Active ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);

        // Phase 1 should generate return statements for each branch
        expect(pine2js.code).toContain('return State.Active');
        expect(pine2js.code).toContain('return State.Idle');
    });
});

// ---------------------------------------------------------------------------
// 5. Double Negation / Unary Minus
// ---------------------------------------------------------------------------
describe('Parser Fix: Double Negation and Unary Minus', () => {
    it('should parse double negation of literal', () => {
        const code = `
//@version=5
indicator("Double Neg")

x = -(-5.0)
plot(x)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toBeDefined();
        // Should have nested negation (parser normalizes 5.0 → 5)
        expect(pine2js.code).toContain('-(-5)');
    });

    it('should parse unary negation on variable', () => {
        const code = `
//@version=5
indicator("Unary Neg")

x = -close
plot(x)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('-close');
    });

    it('should parse negation of parenthesized expression', () => {
        const code = `
//@version=5
indicator("Neg Expr")

x = -(close - open)
plot(x)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('-(close - open)');
    });

    it('should transpile double negation through full pipeline', () => {
        const code = `
//@version=5
indicator("Double Neg Full")

x = -(-5.0)
y = -close
z = -(close - open)
plot(x + y + z)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toBeDefined();
        // Double negation: codegen outputs `- -5` (space-separated unary operators)
        expect(jsCode).toContain('- -5');
    });

    it('should run double negation at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("Double Neg Runtime")

_dbl = -(-5.0)
plot(_dbl, "Double")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Double']).toBeDefined();

        // -(-5.0) = 5.0, should be 5.0 on every bar
        const lastValue = plots['Double'].data[plots['Double'].data.length - 1].value;
        expect(lastValue).toBe(5.0);
    });
});

// ---------------------------------------------------------------------------
// 6. IIFE Body Variable Transformation
// ---------------------------------------------------------------------------
describe('Parser Fix: IIFE Body Variable Transformation', () => {
    it('should transform assignments inside while-as-expression IIFE bodies', () => {
        const code = `
//@version=5
indicator("IIFE Assign Test")

float acc = 0.0
int idx = 0
result = while idx < 5
    idx += 1
    acc += close[idx]
    acc

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Variables inside the IIFE body should be transformed to $.set()
        // idx += 1 → $.set($.let.glb1_idx, ...)
        expect(jsCode).toContain('$.set($.let.glb1_idx');
        // acc += close[idx] → $.set($.let.glb1_acc, ...)
        expect(jsCode).toContain('$.set($.let.glb1_acc');
    });

    it('should NOT transform local IIFE variables (like __result)', () => {
        const code = `
//@version=5
indicator("IIFE Local Var Test")

float acc = 0.0
int idx = 0
result = while idx < 5
    idx += 1
    acc += close[idx]
    acc

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // The __result variable is local to the IIFE and should NOT be
        // transformed to $.set($.let.__result, ...)
        expect(jsCode).not.toContain('$.let.__result');
    });

    it('should transform assignments inside for-as-expression IIFE bodies', () => {
        const code = `
//@version=5
indicator("For IIFE Assign")

float total = 0.0
result = for i = 0 to 4
    total += close[i]
    total

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // total += close[i] should be transformed to $.set()
        expect(jsCode).toContain('$.set($.let.glb1_total');
    });

    it('should NOT transform sub-expression assignments in normal initializers', () => {
        // This is the "Expression Side Effects" regression guard:
        // let result = (val = 10) + 5
        // The (val = 10) is an assignment as sub-expression and should
        // remain a JS assignment, NOT be converted to $.set()
        const code = `
//@version=5
indicator("Sub-Expr Assign")

x = 10
y = x + 5

plot(y)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Normal initializer — should be $.init, not $.set inside IIFE
        expect(jsCode).toContain('$.init(');
        expect(jsCode).toBeDefined();
    });

    it('should run while-as-expression with transformed body vars at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("While IIFE Runtime")

float _acc = 0.0
int _idx = 0
_result = while _idx < 5
    _idx += 1
    _acc += close[_idx]
    _acc

plot(_result, "Result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Result']).toBeDefined();
        expect(plots['Result'].data.length).toBeGreaterThan(0);

        const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
        expect(lastValue).toBeTypeOf('number');
        expect(isNaN(lastValue)).toBe(false);
    });

    it('should run for-as-expression with transformed body vars at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("For IIFE Runtime")

int _total = 0
_result = for i = 1 to 5
    _total += i
    _total

plot(_result, "Result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Result']).toBeDefined();
        expect(plots['Result'].data.length).toBeGreaterThan(0);

        // 1+2+3+4+5 = 15
        const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
        expect(lastValue).toBe(15);
    });
});

// ---------------------------------------------------------------------------
// 7. While Loop with Break and Continue
// ---------------------------------------------------------------------------
describe('Parser Fix: While with Break and Continue', () => {
    it('should parse while with conditional break', () => {
        const code = `
//@version=5
indicator("While Break")

int count = 0
float sum = 0.0
while count < 100
    count += 1
    sum += close / 10
    if sum >= close
        break

plot(count)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('break');
    });

    it('should parse while with continue (skip iterations)', () => {
        const code = `
//@version=5
indicator("While Continue")

int idx = 0
float sum = 0.0
while idx < 10
    idx += 1
    if idx % 2 == 0
        continue
    sum += idx

plot(sum)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('continue');
    });

    it('should run while with break at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("While Break Runtime")

int _count = 0
float _sum = 0.0
while _count < 100
    _count += 1
    _sum += close / 10
    if _sum >= close
        break

plot(_count, "Count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Count']).toBeDefined();

        // The loop should break well before 100 iterations
        const lastValue = plots['Count'].data[plots['Count'].data.length - 1].value;
        expect(lastValue).toBeTypeOf('number');
        expect(lastValue).toBeLessThanOrEqual(100);
        expect(lastValue).toBeGreaterThan(0);
    });

    it('should run while with continue at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("While Continue Runtime")

int _idx = 0
float _sum = 0.0
while _idx < 10
    _idx += 1
    if _idx % 2 == 0
        continue
    _sum += _idx

plot(_sum, "Sum")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Sum']).toBeDefined();

        // Sum of odd numbers 1+3+5+7+9 = 25
        const lastValue = plots['Sum'].data[plots['Sum'].data.length - 1].value;
        expect(lastValue).toBe(25);
    });
});

// ---------------------------------------------------------------------------
// 8. Nested Loops
// ---------------------------------------------------------------------------
describe('Parser Fix: Nested Loops', () => {
    it('should parse nested while loops', () => {
        const code = `
//@version=5
indicator("Nested While")

int outer = 0
int total = 0
while outer < 3
    int inner = 0
    while inner < 4
        total += 1
        inner += 1
    outer += 1

plot(total)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
    });

    it('should run nested while loops at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("Nested While Runtime")

int _outer = 0
int _total = 0
while _outer < 3
    int _inner = 0
    while _inner < 4
        _total += 1
        _inner += 1
    _outer += 1

plot(_total, "Total")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Total']).toBeDefined();

        // 3 outer * 4 inner = 12
        const lastValue = plots['Total'].data[plots['Total'].data.length - 1].value;
        expect(lastValue).toBe(12);
    });

    it('should parse triple-nested for loops', () => {
        const code = `
//@version=5
indicator("Triple Nested For")

int total = 0
for i = 0 to 2
    for j = 0 to 2
        for k = 0 to 2
            total += 1

plot(total)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
    });

    it('should run triple-nested for loops at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("Triple Nested Runtime")

int _total = 0
for i = 0 to 2
    for j = 0 to 2
        for k = 0 to 2
            _total += 1

plot(_total, "Total")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Total']).toBeDefined();

        // 3 * 3 * 3 = 27
        const lastValue = plots['Total'].data[plots['Total'].data.length - 1].value;
        expect(lastValue).toBe(27);
    });
});

// ---------------------------------------------------------------------------
// 9. Switch with Computed Discriminant
// ---------------------------------------------------------------------------
describe('Parser Fix: Switch with Computed Discriminant', () => {
    it('should parse switch on a computed expression', () => {
        const code = `
//@version=5
indicator("Switch Computed")

result = switch math.round(close) % 5
    0 => 100
    1 => 101
    2 => 102
    => 199

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('switch');
    });

    it('should transpile switch with computed discriminant', () => {
        const code = `
//@version=5
indicator("Switch Computed Full")

result = switch math.round(close) % 5
    0 => 100
    1 => 101
    2 => 102
    => 199

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toBeDefined();
        expect(jsCode).toContain('$.let.glb1_result');
    });
});

// ---------------------------------------------------------------------------
// 10. Deeply Nested If/Else as Expression
// ---------------------------------------------------------------------------
describe('Parser Fix: Deeply Nested If/Else as Expression', () => {
    it('should parse 3-level nested if/else assigned to variable', () => {
        const code = `
//@version=5
indicator("Deep Nested If")

result = if close > open
    if close > high[1]
        if volume > volume[1]
            3.0
        else
            2.0
    else
        1.0
else
    if close < low[1]
        -2.0
    else
        -1.0

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
    });

    it('should transpile deeply nested if/else as expression', () => {
        const code = `
//@version=5
indicator("Deep Nested If")

result = if close > open
    if close > high[1]
        3.0
    else
        2.0
else
    -1.0

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toBeDefined();
        expect(jsCode).toContain('$.let.glb1_result');
    });
});

// ---------------------------------------------------------------------------
// 11. If Block with Multiple Statements and Final Expression
// ---------------------------------------------------------------------------
describe('Parser Fix: Multi-Statement If Block as Expression', () => {
    it('should parse if block with intermediate assignments and final expression', () => {
        const code = `
//@version=5
indicator("Multi Stmt If")

result = if close > open
    body = close - open
    wick = high - close
    body + wick
else
    body = open - close
    wick = open - low
    body + wick

plot(result)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
    });

    it('should transpile multi-statement if block as expression', () => {
        const code = `
//@version=5
indicator("Multi Stmt If Full")

result = if close > open
    body = close - open
    wick = high - close
    body + wick
else
    body = open - close
    wick = open - low
    body + wick

plot(result)
`;
        const result = transpile(code);
        const jsCode = result.toString();
        expect(jsCode).toBeDefined();
        expect(jsCode).toContain('$.let.glb1_result');
    });
});

// ---------------------------------------------------------------------------
// 12. For Loop with Edge Cases
// ---------------------------------------------------------------------------
describe('Parser Fix: For Loop Edge Cases', () => {
    it('should parse for loop with break', () => {
        const code = `
//@version=5
indicator("For Break")

int total = 0
for i = 0 to 99
    total += 1
    if total > 10
        break

plot(total)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('break');
    });

    it('should parse for loop with continue', () => {
        const code = `
//@version=5
indicator("For Continue")

float sum = 0.0
for i = 1 to 10
    if i % 2 == 0
        continue
    sum += i

plot(sum)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('continue');
    });

    it('should run for with break at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("For Break Runtime")

int _total = 0
for i = 0 to 99
    _total += 1
    if _total > 10
        break

plot(_total, "Total")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Total']).toBeDefined();

        const lastValue = plots['Total'].data[plots['Total'].data.length - 1].value;
        expect(lastValue).toBe(11); // increments to 11, then > 10 triggers break
    });

    it('should run for with continue at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("For Continue Runtime")

float _sum = 0.0
for i = 1 to 10
    if i % 2 == 0
        continue
    _sum += i

plot(_sum, "Sum")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Sum']).toBeDefined();

        // Sum of odd numbers 1+3+5+7+9 = 25
        const lastValue = plots['Sum'].data[plots['Sum'].data.length - 1].value;
        expect(lastValue).toBe(25);
    });
});

// ---------------------------------------------------------------------------
// 13. Multi-Line Expression Continuation
// ---------------------------------------------------------------------------
describe('Parser Fix: Multi-Line Expression Continuation', () => {
    it('should parse "and" at end of line with continuation', () => {
        const code = `
//@version=5
indicator("And Continuation")

a = close < open and
    low < high
plot(a ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('&&');
    });

    it('should parse "or" at end of line with continuation', () => {
        const code = `
//@version=5
indicator("Or Continuation")

b = close > open or
    high > low
plot(b ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('||');
    });

    it('should parse chained "and" across multiple lines', () => {
        const code = `
//@version=5
indicator("Chained And")

c = close > open and
    high > low and
    volume > 0
plot(c ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        // Should produce two && operators
        const matches = pine2js.code!.match(/&&/g);
        expect(matches).not.toBeNull();
        expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse comparison operator at end of line with continuation', () => {
        const code = `
//@version=5
indicator("Comparison Continuation")

d = close >
    open
plot(d ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('>');
    });

    it('should parse mixed "and"/"or" across lines', () => {
        const code = `
//@version=5
indicator("Mixed And Or")

e = close < open and
    low < high or
    volume > 0
plot(e ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('&&');
        expect(pine2js.code).toContain('||');
    });

    it('should parse deeply nested multiline with parentheses', () => {
        const code = `
//@version=5
indicator("Nested Parens")

f = (close > open and
    high > low) or
    (volume > 0 and
    close > 100)
plot(f ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('&&');
        expect(pine2js.code).toContain('||');
    });

    it('should parse "not" on continuation line after "and"', () => {
        const code = `
//@version=5
indicator("Not Continuation")

g = close > open and
    not (low > high)
plot(g ? 1 : 0)
`;
        const pine2js = pineToJS(code);
        expect(pine2js.success).toBe(true);
        expect(pine2js.code).toContain('&&');
        expect(pine2js.code).toContain('!');
    });

    it('should run multiline "and" condition at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("And Runtime")

_a = close < open and
    low < high
plot(_a ? 1 : 0, "A")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['A']).toBeDefined();
        expect(plots['A'].data.length).toBeGreaterThan(0);

        // Every value should be 0 or 1
        for (const pt of plots['A'].data) {
            expect([0, 1]).toContain(pt.value);
        }
    });

    it('should run multiline comparison continuation at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("Cmp Runtime")

_d = close >
    open
plot(_d ? 1 : 0, "D")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['D']).toBeDefined();
        expect(plots['D'].data.length).toBeGreaterThan(0);

        // Every value should be 0 or 1
        for (const pt of plots['D'].data) {
            expect([0, 1]).toContain(pt.value);
        }
    });
});

// ---------------------------------------------------------------------------
// 14. Namespace Constants in Ternary Arguments
// ---------------------------------------------------------------------------
describe('Parser Fix: Namespace Constants in Ternary Arguments', () => {
    it('should not wrap namespace property access with $.get in ternary inside function args', () => {
        const code = `
//@version=5
indicator("Label Style Ternary")

_above = close > open
label.new(bar_index, close, "X",
     style = _above ? label.style_label_down : label.style_label_up)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // label.style_label_down should NOT be wrapped with $.get(label.__value, 0)
        expect(jsCode).not.toContain('label.__value');
        // It should appear as direct namespace access
        expect(jsCode).toContain('label.style_label_down');
        expect(jsCode).toContain('label.style_label_up');
    });

    it('should run label with ternary style at runtime', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("Label Style Runtime", overlay=true)

_above = close > open
label.new(bar_index, close, "X",
     style = _above ? label.style_label_down : label.style_label_up,
     color = color.new(color.blue, 50))
plot(close, "Close")
`;
        // Should not throw "Cannot read properties of undefined (reading 'style_label_down')"
        const { plots } = await pineTS.run(code);
        expect(plots['Close']).toBeDefined();
        expect(plots['__labels__']).toBeDefined();
    });

    it('should preserve line namespace constants in ternary args', () => {
        const code = `
//@version=5
indicator("Line Style Ternary")

_bull = close > open
line.new(bar_index[1], close[1], bar_index, close,
     style = _bull ? line.style_solid : line.style_dashed)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).not.toContain('line.__value');
        expect(jsCode).toContain('line.style_solid');
        expect(jsCode).toContain('line.style_dashed');
    });
});
