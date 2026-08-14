// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Loop Series Variable $.get() Wrapping Tests
 *
 * Regression tests for three related bugs where Series variables (bar_index,
 * close, etc.) were not wrapped with $.get() in loop expressions, causing:
 *
 * BUG 1 - For-loop UPDATE expression:
 *   Pine:  for i = 0 to bar_index
 *   Transpiled update: 0 <= bar_index ? i++ : i--
 *   Bug: raw Series `bar_index` → NaN comparison → always picks i-- → infinite loop
 *   Fix: Added addArrayAccess() + MemberExpression/CallExpression handlers to
 *        the update expression walker in StatementTransformer.ts
 *
 * BUG 2 - For-loop INIT expression:
 *   Pine:  for i = bar_index to 0
 *   Transpiled init: let i = bar_index
 *   Bug: raw Series assigned to i → object, not a number → loop body never executes
 *   Fix: Added addArrayAccess() + namespace check to init expression walker
 *
 * BUG 3 - While-loop TEST condition:
 *   Pine:  while bar_index > cnt
 *   Transpiled: while (bar_index > $.get(cnt, 0))
 *   Bug: raw Series `bar_index` → NaN comparison → always false → loop never executes
 *   Fix: Added addArrayAccess() + namespace check to while test walker
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

function makePineTS() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '1h', 10,
        new Date('2024-01-01').getTime());
}

describe('For Loop: Series in UPDATE expression (infinite loop bug)', () => {
    it('should wrap bar_index with $.get() in for-loop update ternary', () => {
        const code = `
//@version=5
indicator("For Update Test")
float sum = 0.0
for i = 0 to bar_index
    sum += 1
plot(sum)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // The update expression's ternary condition should use $.get(bar_index, 0),
        // not raw bar_index. Raw bar_index is a Series object which causes
        // NaN comparisons → always picks i-- → infinite loop.
        // Look for the for-loop update: the ternary `0 <= $.get(bar_index, 0) ? i++ : i--`
        expect(jsCode).not.toMatch(/0\s*<=\s*bar_index\s*\?/);
    });

    it('should not infinite-loop when bar_index is used as upper bound (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("For Update Runtime")
float sum = 0.0
for i = 0 to bar_index
    sum += 1
plot(sum, "Sum")
`;
        // This would TIMEOUT (infinite loop) if the bug is present
        const resultPromise = pineTS.run(code);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT: infinite loop detected')), 10000)
        );
        const { plots } = await Promise.race([resultPromise, timeoutPromise]) as any;

        expect(plots['Sum']).toBeDefined();
        // On bar 9 (last of 10 bars), sum = bar_index + 1 = 10
        const lastValue = plots['Sum'].data[plots['Sum'].data.length - 1].value;
        expect(lastValue).toBe(10);
    });

    it('should wrap close with $.get() in for-loop update when used as bound', () => {
        const code = `
//@version=5
indicator("For Update Close Test")
int cnt = 0
for i = 0 to close
    cnt += 1
    if cnt > 200
        break
plot(cnt)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // The update ternary should not contain raw 'close' as a comparison operand
        // It should be $.get(close, 0)
        expect(jsCode).not.toMatch(/0\s*<=\s*close\s*\?/);
    });
});

describe('For Loop: Series in INIT expression (loop never runs bug)', () => {
    it('should wrap bar_index with $.get() in for-loop init', () => {
        const code = `
//@version=5
indicator("For Init Test")
float sum = 0.0
for i = bar_index to 0
    sum += 1
plot(sum)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // The init expression should use $.get(bar_index, 0), not raw bar_index.
        // Raw bar_index is a Series object → assigned to i → loop condition
        // compares object to number → NaN → loop never runs.
        // Look for: let i = $.get(bar_index, 0)  (not: let i = bar_index)
        expect(jsCode).not.toMatch(/let\s+\w+\s*=\s*bar_index\s*[;,]/);
    });

    it('should run loop body when bar_index is start value (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("For Init Runtime")
float sum = 0.0
for i = bar_index to 0
    sum += 1
plot(sum, "Sum")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Sum']).toBeDefined();

        // On bar 9 (last of 10 bars), iterates from 9 down to 0 = 10 iterations
        const lastValue = plots['Sum'].data[plots['Sum'].data.length - 1].value;
        expect(lastValue).toBe(10);
    });

    it('should handle expression in init: bar_index - 5 (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("For Init Expr Runtime")
float sum = 0.0
for i = bar_index - 2 to bar_index
    sum += 1
plot(sum, "Sum")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Sum']).toBeDefined();

        // On any bar where bar_index >= 2: iterates from (bar_index-2) to bar_index = 3 iterations
        const lastValue = plots['Sum'].data[plots['Sum'].data.length - 1].value;
        expect(lastValue).toBe(3);
    });
});

describe('While Loop: Series in TEST condition (loop never runs bug)', () => {
    it('should wrap bar_index with $.get() in while-loop condition', () => {
        const code = `
//@version=5
indicator("While Test")
int cnt = 0
while bar_index > cnt
    cnt += 1
plot(cnt)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // The while condition should use $.get(bar_index, 0), not raw bar_index.
        // Raw bar_index is a Series → NaN comparison → loop never runs.
        expect(jsCode).not.toMatch(/while\s*\(\s*bar_index\s*>/);
    });

    it('should execute while loop when bar_index is in condition (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("While Runtime")
int cnt = 0
while bar_index > cnt
    cnt += 1
plot(cnt, "Count")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Count']).toBeDefined();

        // On bar 9: while 9 > cnt → cnt counts up to 9
        const lastValue = plots['Count'].data[plots['Count'].data.length - 1].value;
        expect(lastValue).toBe(9);
    });

    it('should handle close in while condition (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("While Close Runtime")
float val = 0.0
while val < close and val < 10000
    val += 1000
plot(val, "Val")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['Val']).toBeDefined();

        // val increments by 1000 until >= close or >= 10000
        // Should be > 0 (loop actually ran)
        const lastValue = plots['Val'].data[plots['Val'].data.length - 1].value;
        expect(lastValue).toBeGreaterThan(0);
    });
});
