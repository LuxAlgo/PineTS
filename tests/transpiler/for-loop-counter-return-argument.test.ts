// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * For Loop Counter in Return-Argument Walk Tests
 *
 * Regression tests for a bug where a for-loop counter was wrapped with $.get()
 * when the loop sits inside a bare-switch arm block whose IIFE is part of a
 * function's implicit return argument (a function whose last statement is a
 * bare `switch`).
 *
 * Example of the bug:
 *   for (iR = 1 to 3)
 *   was transpiled to:
 *   for (let iR = 1; 1 <= 3 ? $.get(iR, 0) <= 3 : $.get(iR, 0) >= 3; 1 <= 3 ? $.get(iR, 0)++ : $.get(iR, 0)--)
 *
 * `$.get(iR, 0)++` is a postfix update on a call expression, which is invalid
 * JavaScript: "Invalid left-hand side expression in postfix operation".
 *
 * The fix adds a ForStatement no-op visitor to the complex-return-argument
 * walker so for-headers are never descended into, and marks loop counters so
 * `addArrayAccess` leaves them as raw JS locals.
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

const counterInSwitchArmSource = `
//@version=6
indicator("For Counter in Switch Arm")

draw(cond) =>
    float s = 0.0
    switch
        cond =>
            for iR = 1 to 3
                s += iR
        => s

plot(1)
`;

describe('For Loop: Counter in switch-arm IIFE (return argument)', () => {
    it('should NOT wrap the loop counter with $.get() in the for-header', () => {
        const jsCode = transpile(counterInSwitchArmSource).toString();

        // Bad: `... ? $.get(iR, 0)++ : $.get(iR, 0)--` → invalid JS
        expect(jsCode).not.toMatch(/,\s*0\)\s*\+\+/);
        expect(jsCode).not.toMatch(/,\s*0\)\s*--/);

        // The counter must stay a raw JS local in the for-header
        expect(jsCode).toMatch(/for \(let iR = 1;/);
    });

    it('should run the generated code without a syntax/parse error (runtime)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null,
            new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const { plots } = await pineTS.run(counterInSwitchArmSource);

        expect(plots).toBeDefined();
    });
});
