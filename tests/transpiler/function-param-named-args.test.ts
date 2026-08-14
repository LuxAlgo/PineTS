// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Function Parameter in Named Arguments (ObjectExpression) Tests
 *
 * Regression tests for a bug where function parameters used as values in
 * named argument objects were incorrectly scoped.
 *
 * Example of the bug:
 *   function draw(col) {
 *       line.new(x1, y1, x2, y2, {color: col})
 *   }
 *
 *   Was transpiled to: {color: $.let.col}    ← WRONG ($.let.col is undefined)
 *   Should be:         {color: col}          ← CORRECT (raw function parameter)
 *
 * Root cause: The ObjectExpression handler in ExpressionTransformer.ts only
 * checked isContextBound() for raw identifier preservation. Non-root function
 * parameters are registered as localSeriesVars (not contextBoundVars), so they
 * fell through to createScopedVariableReference() which resolved them to $.let.col.
 *
 * Fix: Also check isLocalSeriesVar() and isLoopVariable() in the ObjectExpression
 * property value handler.
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

function makePineTS() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '1h', 10,
        new Date('2024-01-01').getTime());
}

describe('Function Parameters in Named Args (ObjectExpression)', () => {
    it('should use raw parameter name in named args, not $.let.param', () => {
        const code = `
//@version=5
indicator("Param Named Args Test", overlay=true)

draw(col) =>
    line.new(bar_index - 1, close, bar_index, close, color=col)

draw(color.red)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Inside the draw function, {color: col} should use raw 'col', not '$.let.col'
        // The named args object should be: {color: col}
        expect(jsCode).not.toContain('$.let.col');
        expect(jsCode).not.toContain('$.var.col');

        // Should contain raw 'col' in the object literal
        expect(jsCode).toMatch(/\{\s*color:\s*col\s*\}/);
    });

    it('should handle multiple function params in named args', () => {
        const code = `
//@version=5
indicator("Multi Param Test", overlay=true)

drawLine(col, w) =>
    line.new(bar_index - 1, close, bar_index, close, color=col, width=w)

drawLine(color.blue, 2)
`;
        const result = transpile(code);
        const jsCode = result.toString();

        // Both col and w should be raw identifiers
        expect(jsCode).not.toContain('$.let.col');
        expect(jsCode).not.toContain('$.let.w');
    });

    it('should pass color through function parameter to line.new (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("Color Param Runtime", overlay=true)

draw(col) =>
    line.new(bar_index - 1, close, bar_index, close, color=col)

if barstate.islast
    draw(color.red)
`;
        const { plots } = await pineTS.run(code);
        const lines = plots['__lines__']?.data?.[0]?.value || [];

        // Should have at least one line
        expect(lines.length).toBeGreaterThanOrEqual(1);

        // The line created on the last bar should have the red color
        const activeLine = lines.find((l: any) => l.x1 !== null);
        expect(activeLine).toBeDefined();
        expect(activeLine.color).toBe('#F23645');
    });

    it('should pass color through nested function calls (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("Nested Color Runtime", overlay=true)

inner(col) =>
    line.new(bar_index - 1, close, bar_index, close, color=col)

outer(col) =>
    inner(col)

if barstate.islast
    outer(color.blue)
`;
        const { plots } = await pineTS.run(code);
        const lines = plots['__lines__']?.data?.[0]?.value || [];

        const activeLine = lines.find((l: any) => l.x1 !== null);
        expect(activeLine).toBeDefined();
        expect(activeLine.color).toBe('#2196F3');
    });

    it('should pass label textcolor through function parameter (runtime)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=5
indicator("Label Color Runtime", overlay=true)

drawLabel(col) =>
    label.new(bar_index, close, "test", textcolor=col)

if barstate.islast
    drawLabel(color.white)
`;
        const { plots } = await pineTS.run(code);
        const labels = plots['__labels__']?.data?.[0]?.value || [];

        const activeLabel = labels.find((l: any) => l.x !== null);
        expect(activeLabel).toBeDefined();
        expect(activeLabel.textcolor).toBe('#FFFFFF');
    });
});
