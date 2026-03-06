// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * While Loop Test Condition Hoisting Tests
 *
 * Regression tests for a bug where namespace method calls (e.g. array.size())
 * in while-loop test conditions were hoisted to temp variables OUTSIDE the loop.
 * This caused the condition to be evaluated only once, leading to infinite loops
 * when the condition depended on values that changed each iteration.
 *
 * The fix adds a dedicated WhileStatement handler in MainTransformer that
 * suppresses hoisting during test-condition transformation.
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('While Loop: Test Condition Hoisting', () => {
    it('should NOT hoist array.size() out of while-loop test condition', () => {
        const code = `
//@version=5
indicator("While Hoisting Test")

var int[] arr = array.new_int(0)
array.push(arr, 1)
array.push(arr, 2)
array.push(arr, 3)

while array.size(arr) > 1
    array.shift(arr)

plot(array.size(arr), "Size")
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // The while condition should contain array.size() inline, not a temp variable
        // It should NOT have something like: const temp_X = array.size(arr); while (temp_X > 1)
        // Instead, the while condition should evaluate array.size each iteration
        expect(jsCode).not.toMatch(/temp_\d+.*=.*array.*size[\s\S]*while\s*\(/);

        // The while condition should contain the size call directly
        expect(jsCode).toMatch(/while\s*\(/);
    });

    it('should NOT hoist math.min() out of while-loop test condition', () => {
        const code = `
//@version=5
indicator("While Math Test")

int counter = 0
while counter < math.min(5, 10)
    counter += 1

plot(counter, "Counter")
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // math.min should remain inline in the while condition
        expect(jsCode).not.toMatch(/temp_\d+.*=.*math\.min[\s\S]*while\s*\(/);
    });

    it('should correctly run while loop with array.size() in condition (runtime)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null,
            new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());

        const code = `
//@version=5
indicator("While Runtime Test")

var int[] arr = array.new_int(0)
array.push(arr, 10)
array.push(arr, 20)
array.push(arr, 30)
array.push(arr, 40)
array.push(arr, 50)

// Remove elements until only 2 remain
while array.size(arr) > 2
    array.shift(arr)

plot(array.size(arr), "FinalSize")
plot(array.first(arr), "First")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['FinalSize']).toBeDefined();
        expect(plots['First']).toBeDefined();

        // After removing 3 elements from [10,20,30,40,50], should have [40,50]
        const lastSize = plots['FinalSize'].data[plots['FinalSize'].data.length - 1].value;
        const lastFirst = plots['First'].data[plots['First'].data.length - 1].value;
        expect(lastSize).toBe(2);
        expect(lastFirst).toBe(40);
    });

    it('should correctly run while loop with nested namespace calls in condition (runtime)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null,
            new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());

        const code = `
//@version=5
indicator("While Nested NS Test")

var int[] arr = array.new_int(0)
array.push(arr, 1)
array.push(arr, 2)
array.push(arr, 3)
array.push(arr, 4)
array.push(arr, 5)
array.push(arr, 6)

// math.min(array.size(arr), 4) — nested namespace calls in while condition
while array.size(arr) > math.min(3, 10)
    array.pop(arr)

plot(array.size(arr), "Result")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Result']).toBeDefined();

        const lastValue = plots['Result'].data[plots['Result'].data.length - 1].value;
        expect(lastValue).toBe(3);
    });

    it('should handle while loop with user variable in condition alongside namespace call', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null,
            new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());

        const code = `
//@version=5
indicator("While User Var Test")

var int[] items = array.new_int(0)
for i = 1 to 8
    array.push(items, i)

int maxItems = 3

while array.size(items) > maxItems
    array.shift(items)

plot(array.size(items), "Size")
plot(array.first(items), "First")
`;
        const { plots } = await pineTS.run(code);

        const size = plots['Size'].data[plots['Size'].data.length - 1].value;
        const first = plots['First'].data[plots['First'].data.length - 1].value;
        expect(size).toBe(3);
        expect(first).toBe(6); // After removing 1,2,3,4,5 from [1..8], first is 6
    });
});
