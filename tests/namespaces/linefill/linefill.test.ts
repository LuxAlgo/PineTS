import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('LINEFILL Namespace', () => {
    it('linefill.new() creates a linefill between two lines', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var lf = linefill.new(l1, l2, color.blue);
            var lf_color = lf.color;
            var hasLine1 = lf.line1 !== undefined;
            var hasLine2 = lf.line2 !== undefined;
            return { lf_color, hasLine1, hasLine2 };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.lf_color[0]).toBeTruthy();
        expect(result.hasLine1[0]).toBe(true);
        expect(result.hasLine2[0]).toBe(true);
        expect(plots['__linefills__']).toBeDefined();
        expect(plots['__linefills__'].data.length).toBeGreaterThan(0);
    });

    it('linefill.get_line1() and get_line2() return correct line references', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var lf = linefill.new(l1, l2, color.blue);
            var gotLine1 = linefill.get_line1(lf);
            var gotLine2 = linefill.get_line2(lf);
            var line1Match = gotLine1.id === l1.id;
            var line2Match = gotLine2.id === l2.id;
            return { line1Match, line2Match };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.line1Match[0]).toBe(true);
        expect(result.line2Match[0]).toBe(true);
    });

    it('linefill.set_color() updates linefill color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var lf = linefill.new(l1, l2, '#ff0000');
            var colorBefore = lf.color;
            linefill.set_color(lf, '#00ff00');
            var colorAfter = lf.color;
            return { colorBefore, colorAfter };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.colorBefore[0]).toBe('#ff0000');
        expect(result.colorAfter[0]).toBe('#00ff00');
    });

    it('linefill.delete() marks linefill as deleted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var lf = linefill.new(l1, l2, color.blue);
            var countBefore = linefill.all.length;
            linefill.delete(lf);
            var deletedFlag = lf._deleted;
            var countAfter = linefill.all.length;
            return { deletedFlag, countBefore, countAfter };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('linefill.all returns non-deleted linefills', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var l3 = line.new(0, 30000, 10, 40000);
            var lf1 = linefill.new(l1, l2, color.blue);
            var lf2 = linefill.new(l2, l3, color.red);
            var totalCount = linefill.all.length;
            linefill.delete(lf2);
            var afterDeleteCount = linefill.all.length;
            return { totalCount, afterDeleteCount };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.totalCount[0]).toBe(2);
        expect(result.afterDeleteCount[0]).toBe(1);
    });

    it('set_color ignores deleted linefills', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var lf = linefill.new(l1, l2, '#ff0000');
            linefill.delete(lf);
            linefill.set_color(lf, '#00ff00');
            var colorAfterDelete = lf.color;
            return { colorAfterDelete };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.colorAfterDelete[0]).toBe('#ff0000');
    });

    it('linefill data is stored in __linefills__ plot with correct structure', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            linefill.new(l1, l2, '#5b9cf6');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(plots['__linefills__']).toBeDefined();
        expect(plots['__linefills__'].data.length).toBeGreaterThan(0);

        const lfEntry = plots['__linefills__'].data[0];
        // Linefills are stored as an aggregated array (single entry with all linefills)
        const linefills = lfEntry.value;
        expect(Array.isArray(linefills)).toBe(true);
        expect(linefills.length).toBeGreaterThan(0);
        // Verify linefill properties
        const lf = linefills[0];
        expect(lf.color).toBe('#5b9cf6');
        expect(lf.line1).toBeDefined();
        expect(lf.line2).toBeDefined();
        expect(lfEntry.options.style).toBe('linefill');
    });

    it('linefill references remain connected to their lines', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var lf = linefill.new(l1, l2, color.blue);
            // Modify line coordinates after creating linefill
            line.set_y1(l1, 99000);
            // The linefill's line reference should reflect the change
            var lfLine1Y1 = lf.line1.y1;
            return { lfLine1Y1 };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // Since linefill stores a reference to the line object,
        // mutations should be reflected
        expect(result.lfLine1Y1[0]).toBe(99000);
    });

    it('multiple linefills are aggregated into a single __linefills__ entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            var l3 = line.new(0, 30000, 10, 40000);
            linefill.new(l1, l2, color.blue);
            linefill.new(l2, l3, color.red);
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // There should be exactly 1 data entry containing all linefills
        expect(plots['__linefills__'].data.length).toBe(1);
        const linefills = plots['__linefills__'].data[0].value;
        expect(Array.isArray(linefills)).toBe(true);
        expect(linefills.length).toBeGreaterThanOrEqual(2);
    });
});

/**
 * Regression test for GitHub issue #167:
 * linefill.new() with named color arg receives {color: '#...'} object
 * instead of the plain color string, because linefill.any() forwarded the
 * transpiler's named-args object as-is to new().
 */
describe('linefill.new named-args regression (#167)', () => {
    const sDate = new Date('2025-01-01').getTime();
    const eDate = new Date('2025-11-20').getTime();

    it('linefill.new with named color=color.blue via Pine Script stores a string color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const code = `
//@version=5
indicator("Linefill Named Color", overlay=true)

var line l1 = na
var line l2 = na
var linefill lf = na

if barstate.islast
    l1 := line.new(bar_index - 10, high, bar_index, high, color=color.red)
    l2 := line.new(bar_index - 10, low, bar_index, low, color=color.green)
    lf := linefill.new(l1, l2, color=color.blue)
        `;

        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(plots['__linefills__']).toBeDefined();
        const linefills = plots['__linefills__'].data[0]?.value;
        expect(linefills).toBeDefined();
        expect(linefills.length).toBeGreaterThan(0);

        const lf = linefills[linefills.length - 1];
        // Color must be a resolved string, NOT an object like {color: '#2196F3'}
        expect(typeof lf.color).toBe('string');
        expect(lf.color).not.toBe('[object Object]');
    });

    it('linefill.new with positional color still works', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const { plots } = await pineTS.run((context) => {
            var l1 = line.new(0, 50000, 10, 60000);
            var l2 = line.new(0, 40000, 10, 50000);
            linefill.new(l1, l2, '#ff5733');
            return {};
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        const linefills = plots['__linefills__'].data[0].value;
        expect(linefills[0].color).toBe('#ff5733');
    });

    it('linefill.new with color(na) via named arg preserves null as the na marker', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const code = `
//@version=5
indicator("Linefill Na Color", overlay=true)
var line l1 = na
var line l2 = na
var linefill lf = na
if barstate.islast
    l1 := line.new(bar_index - 5, high, bar_index, high)
    l2 := line.new(bar_index - 5, low, bar_index, low)
    lf := linefill.new(l1, l2, color=color(na))
        `;

        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        const linefills = plots['__linefills__']?.data[0]?.value;
        expect(linefills).toBeDefined();
        expect(linefills.length).toBeGreaterThan(0);

        const lf = linefills[linefills.length - 1];
        // color(na) must round-trip as `null` so renderers can detect
        // "no color requested" and skip painting the element (used as an
        // invisible positional anchor in some published scripts).
        // Regression guard for commit 804b45f.
        expect(lf.color).toBeNull();
    });
});
