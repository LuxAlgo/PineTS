import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('HLINE Namespace', () => {
    it('hline() creates a horizontal line plot entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            hline(70, 'Overbought');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // hline delegates to plot.any, so it should create a plot entry
        expect(plots['Overbought']).toBeDefined();
        expect(plots['Overbought'].data.length).toBeGreaterThan(0);
        expect(plots['Overbought'].title).toBe('Overbought');
    });

    it('hline() plots a constant value on every bar', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            hline(50, 'Midline');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // All data values should be constant at 50
        const values = plots['Midline'].data.map((d: any) => d.value);
        expect(values.length).toBeGreaterThan(0);
        for (const v of values) {
            expect(v).toBe(50);
        }
    });

    it('hline() returns a reference that fill() can consume', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { result } = await pineTS.run((context) => {
            var h1 = hline(70, 'Upper');
            var hasH1 = h1 !== undefined && h1 !== null;
            return { hasH1 };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.hasH1[0]).toBe(true);
    });

    it('two hline() calls with the same title produce separate entries', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            hline(70, 'Level');
            hline(30, 'Level'); // Same title, different callsite
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // First hline uses title "Level" as key, second gets "Level#1"
        expect(plots['Level']).toBeDefined();
        expect(plots['Level#1']).toBeDefined();

        // Values should differ (70 vs 30)
        const firstValues = plots['Level'].data.map((d: any) => d.value);
        const secondValues = plots['Level#1'].data.map((d: any) => d.value);
        expect(firstValues[0]).toBe(70);
        expect(secondValues[0]).toBe(30);
    });

    it('hline() with different titles uses title as key', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            hline(70, 'Overbought');
            hline(30, 'Oversold');
            hline(50, 'Midline');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(plots['Overbought']).toBeDefined();
        expect(plots['Oversold']).toBeDefined();
        expect(plots['Midline']).toBeDefined();
        expect(plots['Overbought']._plotKey).toBe('Overbought');
        expect(plots['Oversold']._plotKey).toBe('Oversold');
        expect(plots['Midline']._plotKey).toBe('Midline');
    });

    it('hline style constants are accessible', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var allStyles = [
                hline.style_solid,
                hline.style_dashed,
                hline.style_dotted,
            ].join(',');
            return { allStyles };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const styles = result.allStyles[0].split(',');
        expect(styles.length).toBe(3);
        expect(styles).toContain('solid');
        expect(styles).toContain('dashed');
        expect(styles).toContain('dotted');
    });
});
