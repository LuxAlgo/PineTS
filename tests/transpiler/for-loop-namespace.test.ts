// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * For Loop Test Condition: Namespace Method Call Tests
 *
 * Regression tests for a bug where namespace method calls (e.g. array.size(),
 * math.min()) in for-loop test conditions were incorrectly wrapped with $.get().
 *
 * Example of the bug:
 *   for (i = 0; i < math.min(array.size(zones), 2); i++)
 *   was transpiled to:
 *   for (i = 0; i < $.get(math, 0).min($.get(array, 0).size(zones), 2); i++)
 *
 * The fix skips $.get() wrapping for context-bound namespace identifiers that
 * are the object of a MemberExpression (i.e. the namespace itself, not a variable).
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('For Loop: Namespace Methods in Test Condition', () => {
    it('should NOT wrap namespace objects (math, array) with $.get() in for-loop test', () => {
        const code = `
//@version=5
indicator("For Namespace Test")

var int[] zones = array.new_int(0)
array.push(zones, 10)
array.push(zones, 20)
array.push(zones, 30)

int total = 0
for i = 0 to math.min(array.size(zones), 2) - 1
    total += array.get(zones, i)

plot(total, "Total")
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Namespace objects should NOT be wrapped with $.get()
        // Bad: $.get(math, 0).min(...)  or  $.get(array, 0).size(...)
        expect(jsCode).not.toContain('$.get(math');
        expect(jsCode).not.toContain('$.get(array');
    });

    it('should correctly transpile nested namespace calls in for-loop test', () => {
        const code = `
//@version=5
indicator("Nested NS Test")

var int[] arr = array.new_int(5, 1)
for i = 0 to math.min(array.size(arr), 3) - 1
    array.set(arr, i, i * 10)

plot(array.get(arr, 0))
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Should have proper namespace method calls, not $.get(namespace) calls
        expect(jsCode).not.toContain('$.get(math');
        expect(jsCode).not.toContain('$.get(array');
    });

    it('should correctly run for loop with math.min(array.size()) in test (runtime)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null,
            new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());

        const code = `
//@version=5
indicator("For NS Runtime Test")

var int[] zones = array.new_int(0)
array.push(zones, 100)
array.push(zones, 200)
array.push(zones, 300)
array.push(zones, 400)
array.push(zones, 500)

int total = 0
// Only sum the first 3 elements (math.min(5, 3) = 3)
for i = 0 to math.min(array.size(zones), 3) - 1
    total += array.get(zones, i)

plot(total, "Total")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Total']).toBeDefined();

        // Should sum first 3: 100 + 200 + 300 = 600
        const lastValue = plots['Total'].data[plots['Total'].data.length - 1].value;
        expect(lastValue).toBe(600);
    });

    it('should correctly handle ta namespace calls in for-loop test (runtime)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null,
            new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
//@version=5
indicator("For TA NS Test")

int count = 0
// math.max returns a number that can be used as loop bound
for i = 0 to math.max(1, 3) - 1
    count += 1

plot(count, "Count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Count']).toBeDefined();

        // math.max(1, 3) = 3, so loop runs for i = 0, 1, 2 → count = 3
        const lastValue = plots['Count'].data[plots['Count'].data.length - 1].value;
        expect(lastValue).toBe(3);
    });

    it('should still wrap user variables with $.get() in for-loop test', () => {
        const code = `
//@version=5
indicator("For User Var Test")

int limit = 5
for i = 0 to limit - 1
    0

plot(close)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // User variables like 'limit' SHOULD get $.get() wrapping
        // The for-loop test should reference the user variable through $.get
        expect(jsCode).toContain('$.get');
    });
});
