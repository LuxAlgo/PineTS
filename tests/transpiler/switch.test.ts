// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { transpile } from '../../src/transpiler';

describe('Transpiler - Switch Statements', () => {
    describe('Bug Fix: Variables transformed in switch within IIFE', () => {
        it('should properly transform variables inside switch statements within IIFEs', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            // Test Pine Script with switch in IIFE
            const indicatorCode = `
//@version=6
indicator("Switch IIFE Test")

maType = "EMA"
maResult = switch maType
    "EMA" => ta.ema(close, 9)
    "SMA" => ta.sma(close, 9)

plot(maResult, "MA")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['MA']).toBeDefined();
            expect(plots['MA'].data.length).toBeGreaterThan(0);

            // Verify the values are valid numbers (not NaN after first bar)
            const lastValue = plots['MA'].data[plots['MA'].data.length - 1].value;
            expect(lastValue).toBeTypeOf('number');
            expect(isNaN(lastValue)).toBe(false);
        });

        it('should transform variable references correctly in switch discriminant', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

maTypeGlobal = "EMA"
maGlobal = switch maTypeGlobal
    "EMA" => ta.ema(close, 10)
    "SMA" => ta.sma(close, 10)

plot(maGlobal)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify that maTypeGlobal is correctly transformed to $.get($.let.glb1_maTypeGlobal, 0) in switch
            expect(code).toContain('switch ($.get($.let.glb1_maTypeGlobal, 0))');
        });

        it('should handle switch expressions with multiple variable references', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch Multi-Var Test")

period = 14
maType = "EMA"

result = switch maType
    "EMA" => ta.ema(close, period)
    "SMA" => ta.sma(close, period)
    "RMA" => ta.rma(close, period)

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Result']).toBeDefined();
            expect(plots['Result'].data.length).toBeGreaterThan(0);

            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(lastValue).toBeTypeOf('number');
            expect(isNaN(lastValue)).toBe(false);
        });
    });

    describe('Bug Fix: Hoisted statements stay inside case blocks', () => {
        it('should keep hoisted TA call parameters inside their case blocks', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

source = close
maTypeGlobal = "EMA"
maGlobal = switch maTypeGlobal
    "EMA" => ta.ema(source, 10)
    "SMA" => ta.sma(source, 10)

plot(maGlobal)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify that ta.param and ta.ema/sma calls are inside the case blocks
            // Look for the pattern where case 'EMA': has const p12 = ta.param before return
            expect(code).toMatch(/case 'EMA':[^]*?const p\d+ = ta\.param[^]*?const temp_\d+ = ta\.ema[^]*?return temp_\d+/);
            expect(code).toMatch(/case 'SMA':[^]*?const p\d+ = ta\.param[^]*?const temp_\d+ = ta\.sma[^]*?return temp_\d+/);
        });

        it('should not hoist statements outside the IIFE', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

source = close
length = 10
maTypeGlobal = "EMA"
maGlobal = switch maTypeGlobal
    "EMA" => ta.ema(source, length)
    "SMA" => ta.sma(source, length)

plot(maGlobal)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify the structure has IIFE with switch inside
            expect(code).toContain('$.let.glb1_maGlobal = $.init($.let.glb1_maGlobal, (() => {');
            expect(code).toContain('switch ($.get($.let.glb1_maTypeGlobal, 0))');

            // Count how many times ta.param appears after $.init for maGlobal
            // All ta.param calls should be inside the IIFE, not before it
            const maGlobalInit = code.indexOf('$.let.glb1_maGlobal = $.init');
            const iifePart = code.substring(maGlobalInit);
            const nextInit = iifePart.indexOf('$.init', 50); // Find next init after this one
            const relevantSection = nextInit > 0 ? iifePart.substring(0, nextInit) : iifePart;

            // All ta.param calls should be after the "(() => {" and before the "})())"
            expect(relevantSection).toMatch(/\(\(\) => \{[^]*?ta\.param[^]*?\}\)\(\)\)/);
        });
    });

    describe('Bug Fix: Function parameters vs global variables', () => {
        it('should handle function parameters with same names as global variables', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

ma(float source, int length, simple string maType) =>
    switch maType
        "EMA" => ta.ema(source, length)
        "SMA" => ta.sma(source, length)

source = close
length = 10
result = ma(source, length, "EMA")

plot(result)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Global variables should be properly scoped
            expect(code).toContain('$.let.glb1_source = $.init($.let.glb1_source, close)');
            expect(code).toContain('$.let.glb1_length = $.init($.let.glb1_length, 10)');

            // Function should use its parameters directly (not transformed)
            expect(code).toMatch(/function ma\(source, length, maType\)/);

            // Inside function, parameters should be used directly
            expect(code).toMatch(/function ma[^]*?ta\.param\(source/);
            expect(code).toMatch(/function ma[^]*?ta\.param\(length/);
        });

        it('should correctly scope both global and parameter variables in complete example', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("MACD Test")

ma(float source, int length, simple string maType) =>
    switch maType
        "EMA" => ta.ema(source, length)
        "SMA" => ta.sma(source, length)

source = close
length = 10
maTypeGlobal = "EMA"
maGlobal = switch maTypeGlobal
    "EMA" => ta.ema(source, length)
    "SMA" => ta.sma(source, length)

maFast = ma(source, 12, "EMA")

plot(maGlobal, "Global MA")
plot(maFast, "Fast MA")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Global MA']).toBeDefined();
            expect(plots['Fast MA']).toBeDefined();

            const globalLastValue = plots['Global MA'].data[plots['Global MA'].data.length - 1].value;
            const fastLastValue = plots['Fast MA'].data[plots['Fast MA'].data.length - 1].value;

            expect(isNaN(globalLastValue)).toBe(false);
            expect(isNaN(fastLastValue)).toBe(false);
            expect(globalLastValue).not.toEqual(fastLastValue); // Different periods should produce different values
        });
    });

    describe('Bug Fix: Multiline switch cases (pine2js)', () => {
        it('should preserve all statements in multiline switch cases including default', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch with default")

maType = input.string("EMA", "MA type", options = ["EMA", "SMA", "RMA", "WMA"])
maLength = input.int(10, "MA length", minval = 2)

ma = switch maType
    "EMA" => ta.ema(close, maLength)
    "SMA" => ta.sma(close, maLength)
    "RMA" => ta.rma(close, maLength)
    "WMA" => ta.wma(close, maLength)
    => 
        runtime.error("No matching MA type found.")
        float(na)

plot(ma)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify that default case includes both runtime.error and float(na)
            expect(code).toContain('default:');
            expect(code).toContain("runtime.error('No matching MA type found.')");
            expect(code).toMatch(/default:[^]*?runtime\.error[^]*?float/);
        });

        it('should handle multiple statements before return value in switch case', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

value = 5
result = switch value
    1 => 10
    2 => 20
    =>
        runtime.error("Invalid value")
        float(na)

plot(result)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Check that both statements are present in default case
            expect(code).toMatch(/default:[^]*?runtime\.error\('Invalid value'\)[^]*?return.*?float/);
        });
    });

    describe('Switch with nested expressions', () => {
        it('should handle nested switch and conditional expressions in IIFE', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Nested Switch Test")

maType = "EMA"
useShort = true
shortPeriod = 9
longPeriod = 21

period = useShort ? shortPeriod : longPeriod

result = switch maType
    "EMA" => ta.ema(close, period)
    "SMA" => ta.sma(close, period)

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Result']).toBeDefined();
            expect(plots['Result'].data.length).toBeGreaterThan(0);

            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(lastValue).toBeTypeOf('number');
            expect(isNaN(lastValue)).toBe(false);
        });

        it('should handle switch inside function with nested TA calls', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Test")

dynamicMA(src, len, maType) =>
    switch maType
        "EMA" => ta.ema(src, len)
        "SMA" => ta.sma(src, len)
        "RMA" => ta.rma(src, len)
        => ta.sma(src, len)

fast = dynamicMA(close, 9, "EMA")
slow = dynamicMA(close, 21, "SMA")

plot(fast, "Fast")
plot(slow, "Slow")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Fast']).toBeDefined();
            expect(plots['Slow']).toBeDefined();

            const fastLastValue = plots['Fast'].data[plots['Fast'].data.length - 1].value;
            const slowLastValue = plots['Slow'].data[plots['Slow'].data.length - 1].value;

            expect(isNaN(fastLastValue)).toBe(false);
            expect(isNaN(slowLastValue)).toBe(false);
        });
    });

    describe('Switch with side effects (non-return cases)', () => {
        it('should handle switch cases that modify variables instead of returning values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch with Side Effects")

mode = "multiplier"
var float result = 0.0

// Switch that modifies variables rather than returning
temp = switch mode
    "multiplier" =>
        result := close * 2
        result
    "divider" =>
        result := close / 2
        result
    =>
        result := close
        result

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);
            
            expect(plots['Result']).toBeDefined();
            expect(plots['Result'].data.length).toBeGreaterThan(0);
            
            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(isNaN(lastValue)).toBe(false);
        });

        it('should handle switch with nested assignments in multiline blocks', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch with Nested Assignments")

sma14 = ta.sma(close, 14)
sma28 = ta.sma(close, 28)
ssma = 100 * (close - sma14) / sma14

longCondition = ssma > 0 and ssma[1] <= 0
shortCondition = ssma < 0 and ssma[1] >= 0

scenario = input.string("market", "Scenario", options=["market", "limit"])

var color plotColor = color.gray

colorResult = switch scenario
    "market" =>
        if longCondition
            color.green
        else if shortCondition
            color.red
        else
            color.gray
    "limit" =>
        if longCondition
            color.lime
        else if shortCondition
            color.orange
        else
            color.gray
    =>
        color.gray

plot(ssma, "SSMA", color=colorResult)
`;

            const { plots } = await pineTS.run(indicatorCode);
            
            expect(plots['SSMA']).toBeDefined();
            expect(plots['SSMA'].data.length).toBeGreaterThan(0);
        });
    });

    describe('Switch with nested/multiline code blocks', () => {
        it('should handle switch cases with multiple statements (multiline blocks)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Multiline Switch Test")

mode = "calculate"

result = switch mode
    "calculate" =>
        temp = close * 2
        adjusted = temp + 10
        adjusted
    "simple" =>
        close + 5
    =>
        float(na)

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Result']).toBeDefined();
            expect(plots['Result'].data.length).toBeGreaterThan(0);
            
            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(isNaN(lastValue)).toBe(false);
        });

        it('should handle switch with nested conditionals in case blocks', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Nested Conditionals in Switch")

mode = "complex"
threshold = 50

result = switch mode
    "complex" =>
        base = close > threshold ? close * 1.1 : close * 0.9
        adjusted = base + 5
        adjusted
    "simple" =>
        close
    =>
        0.0

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Result']).toBeDefined();
            expect(plots['Result'].data.length).toBeGreaterThan(0);
            
            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(isNaN(lastValue)).toBe(false);
        });

        it('should handle switch with TA function calls in multiline case blocks', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("TA in Multiline Switch")

indicator_type = "trend"

result = switch indicator_type
    "trend" =>
        fast = ta.ema(close, 9)
        slow = ta.ema(close, 21)
        fast - slow
    "momentum" =>
        rsi = ta.rsi(close, 14)
        rsi
    =>
        0.0

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Result']).toBeDefined();
            expect(plots['Result'].data.length).toBeGreaterThan(0);
            
            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(isNaN(lastValue)).toBe(false);
        });

        it('should verify multiline statements are included in transpiled output', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

mode = "multi"
result = switch mode
    "multi" =>
        value1 = close * 2
        value2 = value1 + 10
        value2
    "single" => close
    => 0.0

plot(result)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify all statements in multiline case are present in transpiled code
            expect(code).toContain('value1');
            expect(code).toContain('value2');
            // Check that they appear in sequence within a case block
            expect(code).toMatch(/case 'multi':[^]*?value1[^]*?value2/);
        });
    });

    describe('Switch without discriminant (converted to if/else)', () => {
        it('should handle basic switch without expression (from switch2.pine)', async () => {
            const indicatorCode = `
//@version=6
strategy("Switch without an expression", "", true)

bool longCondition  = ta.crossover( ta.sma(close, 14), ta.sma(close, 28))
bool shortCondition = ta.crossunder(ta.sma(close, 14), ta.sma(close, 28))

switch
    longCondition  => strategy.entry("Long ID", strategy.long)
    shortCondition => strategy.entry("Short ID", strategy.short)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify that it's converted to if/else if (variables are transformed with $.get)
            expect(code).toContain('if ($.get($.let.glb1_longCondition');
            expect(code).toContain('else if ($.get($.let.glb1_shortCondition');
            expect(code).toContain('strategy.entry');
            
            // Should NOT be a switch statement
            expect(code).not.toContain('switch (');
        });

        it('should handle switch without expression (condition-based switch)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch without expression")

longCondition = ta.crossover(ta.sma(close, 14), ta.sma(close, 28))
shortCondition = ta.crossunder(ta.sma(close, 14), ta.sma(close, 28))

var signal = 0

switch
    longCondition =>
        signal := 1
    shortCondition =>
        signal := -1

plot(signal, "Signal")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Signal']).toBeDefined();
            expect(plots['Signal'].data.length).toBeGreaterThan(0);
        });

        it('should convert switch without discriminant to if/else if in transpiled code', async () => {
            const indicatorCode = `
//@version=6
indicator("Test")

cond1 = close > ta.sma(close, 20)
cond2 = close < ta.sma(close, 20)

var result = 0

switch
    cond1 =>
        result := 1
    cond2 =>
        result := -1

plot(result)
`;

            const transpiledFn = transpile(indicatorCode, { debug: false });
            const code = transpiledFn.toString();

            // Verify that it's converted to if/else if, not a switch statement
            expect(code).toContain('if (');
            expect(code).toContain('else if (');
            // Should NOT have switch statement with discriminant
            expect(code).not.toContain('switch (cond1)');
            expect(code).not.toContain('switch (cond2)');
        });

        it('should handle switch without expression with multiline blocks', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch without expr with blocks")

rsi = ta.rsi(close, 14)
oversold = rsi < 30
overbought = rsi > 70

var signal = 0
var strength = 0.0

switch
    oversold =>
        signal := 1
        strength := (30 - rsi) / 30
    overbought =>
        signal := -1
        strength := (rsi - 70) / 30
    =>
        signal := 0
        strength := 0.0

plot(signal, "Signal")
plot(strength, "Strength")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Signal']).toBeDefined();
            expect(plots['Strength']).toBeDefined();
            expect(plots['Signal'].data.length).toBeGreaterThan(0);
            expect(plots['Strength'].data.length).toBeGreaterThan(0);
        });

        it('should handle default case in switch without discriminant', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Switch without expr with default")

highVol = ta.atr(14) > ta.sma(ta.atr(14), 50)
lowVol = ta.atr(14) < ta.sma(ta.atr(14), 50)

var mode = "neutral"

switch
    highVol =>
        mode := "high"
    lowVol =>
        mode := "low"
    =>
        mode := "neutral"

// Convert mode to number for plotting
result = mode == "high" ? 1 : mode == "low" ? -1 : 0
plot(result, "Mode")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Mode']).toBeDefined();
            expect(plots['Mode'].data.length).toBeGreaterThan(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle multiple switch statements in same scope', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Multiple Switch")

maType = "EMA"
period = 14

fastMA = switch maType
    "EMA" => ta.ema(close, 9)
    "SMA" => ta.sma(close, 9)

slowMA = switch maType
    "EMA" => ta.ema(close, 21)
    "SMA" => ta.sma(close, 21)

plot(fastMA, "Fast")
plot(slowMA, "Slow")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Fast']).toBeDefined();
            expect(plots['Slow']).toBeDefined();
            
            const fastLastValue = plots['Fast'].data[plots['Fast'].data.length - 1].value;
            const slowLastValue = plots['Slow'].data[plots['Slow'].data.length - 1].value;
            
            expect(isNaN(fastLastValue)).toBe(false);
            expect(isNaN(slowLastValue)).toBe(false);
            expect(fastLastValue).not.toEqual(slowLastValue);
        });

        it('should handle switch with single case', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const indicatorCode = `
//@version=6
indicator("Single Case Switch")

value = "A"
result = switch value
    "A" => 100
    => 0

plot(result, "Result")
`;

            const { plots } = await pineTS.run(indicatorCode);

            expect(plots['Result']).toBeDefined();
            
            const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
            expect(lastValue).toBe(100);
        });
    });
});
