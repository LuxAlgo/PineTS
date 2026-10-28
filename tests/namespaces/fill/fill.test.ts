import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

const sDate = new Date('2025-01-01').getTime();
const eDate = new Date('2025-01-10').getTime();

describe('FILL Namespace', () => {
    it('fill() between two plots creates a fill entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Upper');
            var p2 = plot(open, 'Lower');
            fill(p1, p2, color.new(color.blue, 80));
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Both plots should exist
        expect(plots['Upper']).toBeDefined();
        expect(plots['Lower']).toBeDefined();

        // Find the fill entry
        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.options.style).toBe('fill');
    });

    it('fill() references correct plot keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'High');
            var p2 = plot(open, 'Low');
            fill(p1, p2, color.new(color.green, 80));
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should reference the correct plot keys
        expect(fillEntry.plot1).toBe('High');
        expect(fillEntry.plot2).toBe('Low');

        // plot1/plot2 should also be in options (for QFChart FillRenderer)
        expect(fillEntry.options.plot1).toBe('High');
        expect(fillEntry.options.plot2).toBe('Low');
    });

    it('fill() between two hlines references correct plot keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var h1 = hline(70, 'Overbought');
            var h2 = hline(30, 'Oversold');
            fill(h1, h2, color.new(color.green, 90));
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Both hlines should exist as plots
        expect(plots['Overbought']).toBeDefined();
        expect(plots['Oversold']).toBeDefined();

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.plot1).toBe('Overbought');
        expect(fillEntry.plot2).toBe('Oversold');
    });

    it('fill() stores plot references in both top-level and options', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Alpha');
            var p2 = plot(open, 'Beta');
            fill(p1, p2, color.blue);
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Top-level references (for PineTS tests)
        expect(fillEntry.plot1).toBe('Alpha');
        expect(fillEntry.plot2).toBe('Beta');

        // options-level references (for QFChart FillRenderer which reads plotOptions)
        expect(fillEntry.options.plot1).toBe('Alpha');
        expect(fillEntry.options.plot2).toBe('Beta');
    });

    it('fill() with duplicate plot titles references correct unique keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Band');
            var p2 = plot(open, 'Band'); // Same title
            fill(p1, p2, color.new(color.red, 80));
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // First plot uses "Band", second gets "Band#1"
        expect(plots['Band']).toBeDefined();
        expect(plots['Band#1']).toBeDefined();

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should reference both plots by their actual keys
        expect(fillEntry.plot1).toBeDefined();
        expect(fillEntry.plot2).toBeDefined();
        expect(fillEntry.plot1).not.toBe(fillEntry.plot2);

        // Both referenced plots should exist in plots
        expect(plots[fillEntry.plot1]).toBeDefined();
        expect(plots[fillEntry.plot2]).toBeDefined();
    });

    it('multiple fill() calls create separate fill entries', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Line1');
            var p2 = plot(open, 'Line2');
            var p3 = plot(high, 'Line3');
            fill(p1, p2, color.blue);
            fill(p2, p3, color.red);
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Find all fill entries
        const fillEntries = Object.values(plots).filter((p: any) => p.options?.style === 'fill');
        expect(fillEntries.length).toBe(2);

        // Each fill should reference different plot pairs
        const fill1 = fillEntries[0] as any;
        const fill2 = fillEntries[1] as any;
        expect(fill1.plot1).not.toBe(fill2.plot1);
    });

    it('fill() color is stored in options', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Top');
            var p2 = plot(open, 'Bottom');
            fill(p1, p2, '#ff000080');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.options.color).toBe('#ff000080');
    });

    it('fill() always stores per-bar color data for dynamic colors', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Upper');
            var p2 = plot(open, 'Lower');
            // Dynamic color: flips green/red based on close > open
            fill(p1, p2, close > open ? color.green : color.red);
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should have per-bar data with color in options
        expect(fillEntry.data).toBeDefined();
        expect(fillEntry.data.length).toBeGreaterThan(0);

        // Each data entry should have an options.color
        for (const d of fillEntry.data) {
            expect(d.options).toBeDefined();
            expect(d.options.color).toBeDefined();
            expect(typeof d.options.color).toBe('string');
        }

        // Should contain both green and red entries (since some bars are bullish, some bearish)
        const uniqueColors = new Set(fillEntry.data.map((d: any) => d.options.color));
        expect(uniqueColors.size).toBeGreaterThanOrEqual(1);
    });

    it('fill() with static color still stores per-bar data', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Top');
            var p2 = plot(open, 'Bottom');
            fill(p1, p2, color.new(color.blue, 80));
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Even static colors should have per-bar data (always pushed now)
        expect(fillEntry.data).toBeDefined();
        expect(fillEntry.data.length).toBeGreaterThan(0);

        // All entries should have the same color
        const colors = fillEntry.data.map((d: any) => d.options.color);
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(1);
    });

    it('fill() with title uses title-based key', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'A');
            var p2 = plot(open, 'B');
            fill(p1, p2, color.blue, 'MyFill');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // fill should be stored with its title
        expect(plots['MyFill']).toBeDefined();
        expect(plots['MyFill'].options.style).toBe('fill');
        expect(plots['MyFill'].title).toBe('MyFill');
    });
});

/**
 * Regression tests for force_overlay + color(na) + gradient fill.
 *
 * These cover bugs where:
 * - color(na) returning null was treated as a named-options object,
 *   swallowing subsequent named args like force_overlay
 * - Gradient fills passed as named args (top_value, bottom_value, etc.)
 *   were not detected as gradients
 * - Plots with color(na) were rendered with default blue instead of hidden
 */
describe('force_overlay + color(na) + gradient fill (regression)', () => {

    it('plot() with color(na) sets per-point color to undefined (hidden)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const code = `
//@version=6
indicator("Test", overlay = false)
plot(close, "Visible")
plot(close, "Hidden", color(na))
        `;

        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Visible plot should have default color
        expect(plots['Visible'].data[0].options.color).toBe('#2962ff');

        // Hidden plot (color=na) should have undefined color on every point
        for (const point of plots['Hidden'].data) {
            expect(point.options.color).toBeUndefined();
        }
    });

    it('plot() with color(na) and force_overlay=true sets overlay correctly', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const code = `
//@version=6
indicator("Test", overlay = false)
plot(close, "Normal")
plot(close, "OverlayHidden", color(na), force_overlay = true)
        `;

        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Normal plot: overlay = false (indicator is not overlay)
        expect(plots['Normal'].options.overlay).toBe(false);

        // OverlayHidden: force_overlay should be true despite color(na)
        expect(plots['OverlayHidden'].options.overlay).toBe(true);

        // And per-point color should still be undefined (hidden)
        for (const point of plots['OverlayHidden'].data) {
            expect(point.options.color).toBeUndefined();
        }
    });

    it('gradient fill via named args (top_value/bottom_value) is detected', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const code = `
//@version=6
indicator("Test", overlay = false)
p1 = plot(close, "Upper", color(na), force_overlay = true)
p2 = plot(open, "Lower", color(na), force_overlay = true)
fill(p1, p2, top_value = close, bottom_value = open, top_color = color.new(#089981, 70), bottom_color = color.new(#f23645, 70))
        `;

        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Both plots should be overlay
        expect(plots['Upper'].options.overlay).toBe(true);
        expect(plots['Lower'].options.overlay).toBe(true);

        // Find the fill
        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Must be detected as a gradient fill
        expect(fillEntry.options.gradient).toBe(true);

        // Per-bar data should have gradient properties
        const lastPoint = fillEntry.data[fillEntry.data.length - 1];
        expect(lastPoint.options.top_color).toBeDefined();
        expect(lastPoint.options.bottom_color).toBeDefined();
        expect(typeof lastPoint.options.top_value).toBe('number');
        expect(typeof lastPoint.options.bottom_value).toBe('number');
    });

    it('gradient fill via positional args still works', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Upper');
            var p2 = plot(open, 'Lower');
            fill(p1, p2, close, open, color.new(color.green, 80), color.new(color.red, 80));
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.options.gradient).toBe(true);

        const lastPoint = fillEntry.data[fillEntry.data.length - 1];
        expect(lastPoint.options.top_color).toBeDefined();
        expect(lastPoint.options.bottom_color).toBeDefined();
    });

    it('null from color(na) does not swallow subsequent named args', async () => {
        // Regression: color(na) returned null, which typeof === 'object',
        // causing parseArgsForPineParams to treat it as the named-options
        // object and stop parsing — swallowing force_overlay.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const code = `
//@version=6
indicator("Test", overlay = false)
plot(close, "A", color(na), force_overlay = true)
plot(close, "B", color.red, force_overlay = true)
plot(close, "C", force_overlay = true)
        `;

        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // All three should have overlay = true
        expect(plots['A'].options.overlay).toBe(true);
        expect(plots['B'].options.overlay).toBe(true);
        expect(plots['C'].options.overlay).toBe(true);

        // A has color(na) → hidden, B has explicit red, C has no color → default
        expect(plots['A'].data[0].options.color).toBeUndefined();
        expect(plots['B'].data[0].options.color).toBe('#F23645');
        expect(plots['C'].data[0].options.color).toBe('#2962ff');
    });
});
