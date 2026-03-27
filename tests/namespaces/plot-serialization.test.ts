// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Plot Data Serialization Tests
 *
 * Verifies that context.plots contains only serialized plain objects
 * (no circular references, no internal _helper/context refs).
 * JSON.stringify must work without errors on all plot entries.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Plot Data Serialization', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-10').getTime();

    it('labels: JSON.stringify works, no _helper refs', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("Label Test", overlay=true)
if barstate.isfirst
    label.new(bar_index, close, "Hello", color=color.red, textcolor=color.white)
plot(close)
        `;
        const ctx = await pineTS.run(code);
        const labels = ctx.plots['__labels__'];
        expect(labels).toBeDefined();

        // Must serialize without error
        const json = JSON.stringify(labels);
        expect(json).toBeDefined();

        // Must not contain _helper or context references
        expect(json).not.toContain('_helper');
        expect(json).not.toContain('context');

        // Data should be plain objects
        const parsed = JSON.parse(json);
        const items = parsed.data[0].value;
        expect(items.length).toBeGreaterThan(0);
        expect(items[0]).toHaveProperty('text', 'Hello');
        expect(items[0]).toHaveProperty('_deleted');
    });

    it('lines: JSON.stringify works, no _helper refs', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("Line Test", overlay=true)
if barstate.isfirst
    line.new(bar_index, close, bar_index + 5, close + 100, color=color.blue)
plot(close)
        `;
        const ctx = await pineTS.run(code);
        const lines = ctx.plots['__lines__'];
        expect(lines).toBeDefined();

        const json = JSON.stringify(lines);
        expect(json).toBeDefined();
        expect(json).not.toContain('_helper');

        const parsed = JSON.parse(json);
        const items = parsed.data[0].value;
        expect(items.length).toBeGreaterThan(0);
        expect(items[0]).toHaveProperty('x1');
        expect(items[0]).toHaveProperty('y1');
        expect(items[0]).toHaveProperty('_deleted');
    });

    it('boxes: JSON.stringify works, no _helper refs', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("Box Test", overlay=true)
if barstate.isfirst
    box.new(bar_index, close + 100, bar_index + 5, close - 100, bgcolor=color.new(color.blue, 80))
plot(close)
        `;
        const ctx = await pineTS.run(code);
        const boxes = ctx.plots['__boxes__'];
        expect(boxes).toBeDefined();

        const json = JSON.stringify(boxes);
        expect(json).toBeDefined();
        expect(json).not.toContain('_helper');

        const parsed = JSON.parse(json);
        const items = parsed.data[0].value;
        expect(items.length).toBeGreaterThan(0);
        expect(items[0]).toHaveProperty('left');
        expect(items[0]).toHaveProperty('bgcolor');
        expect(items[0]).toHaveProperty('_deleted');
    });

    it('tables: JSON.stringify works, no _helper refs', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("Table Test", overlay=true)
if barstate.islast
    var t = table.new(position.top_right, 2, 2)
    table.cell(t, 0, 0, "A")
    table.cell(t, 1, 0, "B")
plot(close)
        `;
        const ctx = await pineTS.run(code);
        const tables = ctx.plots['__tables__'];
        expect(tables).toBeDefined();

        const json = JSON.stringify(tables);
        expect(json).toBeDefined();
        expect(json).not.toContain('_helper');
        expect(json).not.toContain('"context"');

        const parsed = JSON.parse(json);
        const items = parsed.data[0].value;
        expect(items.length).toBeGreaterThan(0);
        expect(items[0]).toHaveProperty('position');
        expect(items[0]).toHaveProperty('cells');
    });

    it('linefills: JSON.stringify works, line data inlined', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("Linefill Test", overlay=true)
if barstate.isfirst
    l1 = line.new(bar_index, close, bar_index + 5, close + 100, color=color.red)
    l2 = line.new(bar_index, close - 50, bar_index + 5, close + 50, color=color.blue)
    linefill.new(l1, l2, color=color.new(color.green, 80))
plot(close)
        `;
        const ctx = await pineTS.run(code);
        const linefills = ctx.plots['__linefills__'];
        expect(linefills).toBeDefined();

        const json = JSON.stringify(linefills);
        expect(json).toBeDefined();
        expect(json).not.toContain('_helper');

        const parsed = JSON.parse(json);
        const items = parsed.data[0].value;
        expect(items.length).toBeGreaterThan(0);
        // Line data should be inlined as plain objects
        expect(items[0].line1).toHaveProperty('x1');
        expect(items[0].line1).toHaveProperty('y1');
        expect(items[0].line2).toHaveProperty('x1');
    });

    it('polylines: JSON.stringify works, points serialized', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("Polyline Test", overlay=true)
if barstate.islast
    pts = array.new<chart.point>()
    pts.push(chart.point.from_index(bar_index - 2, close - 50))
    pts.push(chart.point.from_index(bar_index - 1, close + 50))
    pts.push(chart.point.from_index(bar_index, close))
    polyline.new(pts, line_color=color.red)
plot(close)
        `;
        const ctx = await pineTS.run(code);
        const polylines = ctx.plots['__polylines__'];
        expect(polylines).toBeDefined();

        const json = JSON.stringify(polylines);
        expect(json).toBeDefined();
        expect(json).not.toContain('_helper');

        const parsed = JSON.parse(json);
        const items = parsed.data[0].value;
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].points.length).toBeGreaterThan(0);
        expect(items[0].points[0]).toHaveProperty('index');
        expect(items[0].points[0]).toHaveProperty('price');
    });

    it('full indicator with all drawing types: JSON.stringify(context.plots) works', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
        const code = `
//@version=6
indicator("All Drawings", overlay=true)
if barstate.isfirst
    label.new(bar_index, close, "L")
    line.new(bar_index, close, bar_index + 1, close + 10)
    box.new(bar_index, close + 20, bar_index + 2, close - 20)
plot(close)
        `;
        const ctx = await pineTS.run(code);

        // The entire plots object must serialize without error
        const json = JSON.stringify(ctx.plots);
        expect(json).toBeDefined();
        expect(json).not.toContain('_helper');
        expect(json.length).toBeGreaterThan(0);

        // Verify it round-trips
        const parsed = JSON.parse(json);
        expect(parsed).toHaveProperty('__labels__');
        expect(parsed).toHaveProperty('__lines__');
        expect(parsed).toHaveProperty('__boxes__');
    });
});
