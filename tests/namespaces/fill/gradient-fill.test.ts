import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('Gradient fill (top_value/bottom_value)', () => {
    const makePineTS = () => new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());

    it('gradient fill stores per-bar top_value and bottom_value in options', async () => {
        const code = `
//@version=5
indicator("Gradient fill test")
osc = ta.rsi(close, 14) - 50
p1 = plot(osc, "Signal")
p2 = plot(0, "Zero")
fill(p1, p2, top_value=math.max(osc, 0), bottom_value=math.min(osc, 0),
     top_color=color.new(color.green, 80), bottom_color=color.new(color.red, 80),
     title="Gradient")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        // Gradient fill plot should exist and be marked as gradient
        const gradientPlot = Object.values(plots).find((p: any) =>
            p.options?.style === 'fill' && p.options?.gradient === true
        ) as any;
        expect(gradientPlot).toBeDefined();
        expect(gradientPlot.options.gradient).toBe(true);

        // Each data point should have top_value, bottom_value, top_color, bottom_color
        const dataPoints = gradientPlot.data.filter((d: any) => d.options);
        expect(dataPoints.length).toBeGreaterThan(0);

        for (const d of dataPoints) {
            expect(d.options).toHaveProperty('top_value');
            expect(d.options).toHaveProperty('bottom_value');
            expect(d.options).toHaveProperty('top_color');
            expect(d.options).toHaveProperty('bottom_color');
        }
    });

    it('gradient fill with conditional na hides fill on inactive bars', async () => {
        // When top_value/bottom_value are na, the fill should not render.
        // This tests the glow breakout pattern: fill only when signal > threshold.
        const code = `
//@version=5
indicator("Conditional gradient fill")
osc = ta.rsi(close, 14) - 50
thresh = 20.0
isOver = osc > thresh
p1 = plot(osc, "Signal")
p2 = plot(thresh, "Threshold")
fill(p1, p2,
     top_value=isOver ? osc : na,
     bottom_value=isOver ? thresh : na,
     top_color=color.new(color.green, 40),
     bottom_color=color.new(color.green, 90),
     title="Glow")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const glowPlot = Object.values(plots).find((p: any) =>
            p.options?.style === 'fill' && p.options?.gradient === true
        ) as any;
        expect(glowPlot).toBeDefined();

        const dataPoints = glowPlot.data.filter((d: any) => d.options);
        expect(dataPoints.length).toBeGreaterThan(0);

        // Some bars should have na (NaN) top_value when signal < threshold
        const naPoints = dataPoints.filter((d: any) =>
            d.options.top_value === null || d.options.top_value === undefined ||
            (typeof d.options.top_value === 'number' && isNaN(d.options.top_value))
        );
        const validPoints = dataPoints.filter((d: any) =>
            typeof d.options.top_value === 'number' && !isNaN(d.options.top_value)
        );

        // Should have a mix of na and valid points (not all visible or all hidden)
        expect(naPoints.length).toBeGreaterThan(0);
        expect(validPoints.length).toBeGreaterThan(0);

        // Valid points should have top_value > bottom_value (signal > threshold)
        for (const d of validPoints) {
            if (typeof d.options.bottom_value === 'number' && !isNaN(d.options.bottom_value)) {
                expect(d.options.top_value).toBeGreaterThanOrEqual(d.options.bottom_value);
            }
        }
    });

    it('base heatmap gradient uses max/min clamping for top_value/bottom_value', async () => {
        const code = `
//@version=5
indicator("Base heatmap gradient")
osc = ta.rsi(close, 14) - 50
p1 = plot(osc, "Signal")
p2 = plot(0, "Zero")
fill(p1, p2, top_value=math.max(osc, 0), bottom_value=math.min(osc, 0),
     top_color=color.new(color.green, 85), bottom_color=color.new(color.red, 85),
     title="Heatmap")
`;
        const pineTS = makePineTS();
        const { plots } = await pineTS.run(code);

        const heatmapPlot = Object.values(plots).find((p: any) =>
            p.options?.style === 'fill' && p.options?.gradient === true
        ) as any;
        expect(heatmapPlot).toBeDefined();

        const dataPoints = heatmapPlot.data.filter((d: any) =>
            d.options && typeof d.options.top_value === 'number' && !isNaN(d.options.top_value)
        );

        for (const d of dataPoints) {
            // top_value = max(osc, 0) → always >= 0
            expect(d.options.top_value).toBeGreaterThanOrEqual(0);
            // bottom_value = min(osc, 0) → always <= 0
            expect(d.options.bottom_value).toBeLessThanOrEqual(0);
        }
    });
});
