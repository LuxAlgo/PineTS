import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';
import { Provider } from '@pinets/marketData/Provider.class';

describe('PLOT Namespace', () => {
    it('Two plot() calls with the same title produce separate entries', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            const p1 = plot(close, 'SMA');
            const p2 = plot(open, 'SMA'); // Same title, different callsite
            return {};
        });

        // First plot uses title "SMA" as key, second gets "SMA#1"
        expect(plots['SMA']).toBeDefined();
        expect(plots['SMA'].data.length).toBeGreaterThan(0);
        expect(plots['SMA#1']).toBeDefined();
        expect(plots['SMA#1'].data.length).toBeGreaterThan(0);

        // There should be exactly 2 plot entries
        const plotEntries = Object.keys(plots).filter((k) => !k.startsWith('__'));
        expect(plotEntries.length).toBe(2);

        // Both should have title "SMA" but different _plotKey
        expect(plots['SMA'].title).toBe('SMA');
        expect(plots['SMA#1'].title).toBe('SMA');
        expect(plots['SMA']._plotKey).toBe('SMA');
        expect(plots['SMA#1']._plotKey).toBe('SMA#1');

        // Values should differ (close vs open)
        const firstValues = plots['SMA'].data.map((d) => d.value);
        const secondValues = plots['SMA#1'].data.map((d) => d.value);
        const hasDifference = firstValues.some((v, i) => v !== secondValues[i]);
        expect(hasDifference).toBe(true);
    });

    it('Three plot() calls with the same title produce three separate entries', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            plot(close, 'Line');
            plot(open, 'Line');
            plot(high, 'Line');
            return {};
        });

        // Should produce: "Line", "Line#1", "Line#2"
        expect(plots['Line']).toBeDefined();
        expect(plots['Line#1']).toBeDefined();
        expect(plots['Line#2']).toBeDefined();

        const plotEntries = Object.keys(plots).filter((k) => !k.startsWith('__'));
        expect(plotEntries.length).toBe(3);

        // All should have title "Line"
        for (const key of plotEntries) {
            expect(plots[key].title).toBe('Line');
        }
    });

    it('plot() calls with different titles use title as key', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            plot(close, 'Close');
            plot(open, 'Open');
            return {};
        });

        // Each plot should be keyed by its title (no collision)
        expect(plots['Close']).toBeDefined();
        expect(plots['Open']).toBeDefined();
        expect(plots['Close']._plotKey).toBe('Close');
        expect(plots['Open']._plotKey).toBe('Open');
    });

    it('fill() between two plots references correct plot keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Upper');
            var p2 = plot(open, 'Lower');
            fill(p1, p2, color.new(color.blue, 80));
            return {};
        });

        // Both plots should exist
        expect(plots['Upper']).toBeDefined();
        expect(plots['Lower']).toBeDefined();

        // Find the fill entry
        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should reference the correct plot keys
        expect(fillEntry.plot1).toBe('Upper');
        expect(fillEntry.plot2).toBe('Lower');
    });

    it('fill() between two hlines references correct plot keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var h1 = hline(70, 'Overbought');
            var h2 = hline(30, 'Oversold');
            fill(h1, h2, color.new(color.green, 90));
            return {};
        });

        // Both hlines should exist as plots (hline delegates to plot.any)
        expect(plots['Overbought']).toBeDefined();
        expect(plots['Oversold']).toBeDefined();

        // Find the fill entry
        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should reference the correct hline plot keys
        expect(fillEntry.plot1).toBe('Overbought');
        expect(fillEntry.plot2).toBe('Oversold');
    });

    it('fill() between plots with same title references correct unique keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Band');
            var p2 = plot(open, 'Band'); // Same title
            fill(p1, p2, color.new(color.red, 80));
            return {};
        });

        // First plot uses "Band", second gets "Band#1"
        expect(plots['Band']).toBeDefined();
        expect(plots['Band#1']).toBeDefined();

        const plotEntries = Object.keys(plots).filter((k) => !k.startsWith('__'));
        // Should have at least 3 entries: Band, Band#1 (second plot), and fill
        expect(plotEntries.length).toBeGreaterThanOrEqual(3);

        // Find the fill entry
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

    it('plot() returns a reference that fill() can consume', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'A');
            var p2 = plot(open, 'B');

            // Verify plot returns something truthy
            var hasP1 = p1 !== undefined && p1 !== null;
            var hasP2 = p2 !== undefined && p2 !== null;

            return { hasP1, hasP2 };
        });

        expect(result.hasP1[0]).toBe(true);
        expect(result.hasP2[0]).toBe(true);
    });
});
