import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('LINE Namespace', () => {
    it('line.new() creates a line with default properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            var ln_x1 = myLine.x1;
            var ln_y1 = myLine.y1;
            var ln_x2 = myLine.x2;
            var ln_y2 = myLine.y2;
            var ln_xloc = myLine.xloc;
            var ln_extend = myLine.extend;
            var ln_style = myLine.style;
            var ln_width = myLine.width;
            return { ln_x1, ln_y1, ln_x2, ln_y2, ln_xloc, ln_extend, ln_style, ln_width };
        });

        expect(result.ln_x1[0]).toBe(0);
        expect(result.ln_y1[0]).toBe(50000);
        expect(result.ln_x2[0]).toBe(10);
        expect(result.ln_y2[0]).toBe(60000);
        expect(result.ln_xloc[0]).toBe('bi');
        expect(result.ln_extend[0]).toBe('none');
        expect(result.ln_style[0]).toBe('style_solid');
        expect(result.ln_width[0]).toBe(1);
        expect(plots['__lines__']).toBeDefined();
        expect(plots['__lines__'].data.length).toBeGreaterThan(0);
    });

    it('line.new() accepts all parameters', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(
                5, 40000, 20, 70000,
                xloc.bar_index, 'both',
                color.red, line.style_dashed, 3,
            );
            var ln_xloc = myLine.xloc;
            var ln_extend = myLine.extend;
            var ln_style = myLine.style;
            var ln_width = myLine.width;
            return { ln_xloc, ln_extend, ln_style, ln_width };
        });

        expect(result.ln_xloc[0]).toBe('bi');
        expect(result.ln_extend[0]).toBe('both');
        expect(result.ln_style[0]).toBe('style_dashed');
        expect(result.ln_width[0]).toBe(3);
    });

    it('line.new() with chart.point objects', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pt1 = chart.point.from_index(5, 45000);
            var pt2 = chart.point.from_index(15, 55000);
            var myLine = line.new(pt1, pt2);
            var ln_x1 = myLine.x1;
            var ln_y1 = myLine.y1;
            var ln_x2 = myLine.x2;
            var ln_y2 = myLine.y2;
            var ln_xloc = myLine.xloc;
            return { ln_x1, ln_y1, ln_x2, ln_y2, ln_xloc };
        });

        expect(result.ln_x1[0]).toBe(5);
        expect(result.ln_y1[0]).toBe(45000);
        expect(result.ln_x2[0]).toBe(15);
        expect(result.ln_y2[0]).toBe(55000);
        expect(result.ln_xloc[0]).toBe('bi');
    });

    it('line.set_x1(), set_y1(), set_x2(), set_y2() update coordinates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            line.set_x1(myLine, 100);
            line.set_y1(myLine, 99000);
            line.set_x2(myLine, 200);
            line.set_y2(myLine, 88000);
            var x1 = myLine.x1;
            var y1 = myLine.y1;
            var x2 = myLine.x2;
            var y2 = myLine.y2;
            return { x1, y1, x2, y2 };
        });

        expect(result.x1[0]).toBe(100);
        expect(result.y1[0]).toBe(99000);
        expect(result.x2[0]).toBe(200);
        expect(result.y2[0]).toBe(88000);
    });

    it('line.set_xy1() and set_xy2() update both coordinates at once', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            line.set_xy1(myLine, 42, 75000);
            line.set_xy2(myLine, 99, 85000);
            var x1 = myLine.x1;
            var y1 = myLine.y1;
            var x2 = myLine.x2;
            var y2 = myLine.y2;
            return { x1, y1, x2, y2 };
        });

        expect(result.x1[0]).toBe(42);
        expect(result.y1[0]).toBe(75000);
        expect(result.x2[0]).toBe(99);
        expect(result.y2[0]).toBe(85000);
    });

    it('line.set_color(), set_width(), set_style() update properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000, xloc.bar_index, 'none', color.blue, line.style_solid, 1);
            line.set_color(myLine, color.red);
            line.set_width(myLine, 5);
            line.set_style(myLine, line.style_dotted);
            var ln_color = myLine.color;
            var ln_width = myLine.width;
            var ln_style = myLine.style;
            return { ln_color, ln_width, ln_style };
        });

        expect(result.ln_color[0]).toBeTruthy();
        expect(result.ln_width[0]).toBe(5);
        expect(result.ln_style[0]).toBe('style_dotted');
    });

    it('line.set_extend() updates extend mode', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            var beforeExtend = myLine.extend;
            line.set_extend(myLine, 'right');
            var afterExtend = myLine.extend;
            return { beforeExtend, afterExtend };
        });

        expect(result.beforeExtend[0]).toBe('none');
        expect(result.afterExtend[0]).toBe('right');
    });

    it('line.set_xloc() updates xloc and both x coordinates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            line.set_xloc(myLine, 1000000, 2000000, xloc.bar_time);
            var x1 = myLine.x1;
            var x2 = myLine.x2;
            var ln_xloc = myLine.xloc;
            return { x1, x2, ln_xloc };
        });

        expect(result.x1[0]).toBe(1000000);
        expect(result.x2[0]).toBe(2000000);
        expect(result.ln_xloc[0]).toBe('bt');
    });

    it('line.set_first_point() and set_second_point() with chart.point', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            var pt1 = chart.point.from_index(42, 75000);
            var pt2 = chart.point.from_index(99, 95000);
            line.set_first_point(myLine, pt1);
            line.set_second_point(myLine, pt2);
            var x1 = myLine.x1;
            var y1 = myLine.y1;
            var x2 = myLine.x2;
            var y2 = myLine.y2;
            return { x1, y1, x2, y2 };
        });

        expect(result.x1[0]).toBe(42);
        expect(result.y1[0]).toBe(75000);
        expect(result.x2[0]).toBe(99);
        expect(result.y2[0]).toBe(95000);
    });

    it('line.get_x1(), get_y1(), get_x2(), get_y2() return correct values', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(5, 40000, 15, 80000);
            var x1 = line.get_x1(myLine);
            var y1 = line.get_y1(myLine);
            var x2 = line.get_x2(myLine);
            var y2 = line.get_y2(myLine);
            return { x1, y1, x2, y2 };
        });

        expect(result.x1[0]).toBe(5);
        expect(result.y1[0]).toBe(40000);
        expect(result.x2[0]).toBe(15);
        expect(result.y2[0]).toBe(80000);
    });

    it('line.get_price() performs linear interpolation', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 100, 10, 200);
            // Midpoint: x=5 should give y=150
            var priceAtMid = line.get_price(myLine, 5);
            // At start: x=0 should give y=100
            var priceAtStart = line.get_price(myLine, 0);
            // At end: x=10 should give y=200
            var priceAtEnd = line.get_price(myLine, 10);
            // Extrapolation: x=20 should give y=300
            var priceExtrap = line.get_price(myLine, 20);
            return { priceAtMid, priceAtStart, priceAtEnd, priceExtrap };
        });

        expect(result.priceAtMid[0]).toBe(150);
        expect(result.priceAtStart[0]).toBe(100);
        expect(result.priceAtEnd[0]).toBe(200);
        expect(result.priceExtrap[0]).toBe(300);
    });

    it('line.copy() creates independent copy', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var orig = line.new(0, 50000, 10, 60000, xloc.bar_index, 'none', color.blue);
            var cp = line.copy(orig);
            var origY1 = orig.y1;
            var copyY1 = cp.y1;

            line.set_y1(cp, 99000);
            var origY1After = orig.y1;
            var copyY1After = cp.y1;
            var differentIds = orig.id !== cp.id;

            return { origY1, copyY1, origY1After, copyY1After, differentIds };
        });

        expect(result.origY1[0]).toBe(50000);
        expect(result.copyY1[0]).toBe(50000);
        expect(result.origY1After[0]).toBe(50000);
        expect(result.copyY1After[0]).toBe(99000);
        expect(result.differentIds[0]).toBe(true);
    });

    it('line.delete() marks line as deleted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            var countBefore = line.all.length;
            line.delete(myLine);
            var deletedFlag = myLine._deleted;
            var countAfter = line.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('line.all returns non-deleted lines', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            line.new(0, 50000, 10, 60000);
            line.new(5, 55000, 15, 65000);
            var line3 = line.new(10, 60000, 20, 70000);
            var totalCount = line.all.length;
            line.delete(line3);
            var afterDeleteCount = line.all.length;
            return { totalCount, afterDeleteCount };
        });

        expect(result.totalCount[0]).toBe(3);
        expect(result.afterDeleteCount[0]).toBe(2);
    });

    it('setters ignore deleted lines', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            line.delete(myLine);
            line.set_y1(myLine, 99999);
            line.set_y2(myLine, 88888);
            line.set_color(myLine, color.red);
            line.set_width(myLine, 10);
            var y1 = myLine.y1;
            var y2 = myLine.y2;
            var width = myLine.width;
            return { y1, y2, width };
        });

        expect(result.y1[0]).toBe(50000);
        expect(result.y2[0]).toBe(60000);
        expect(result.width[0]).toBe(1);
    });

    it('all 6 style constants are accessible', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var allStyles = [
                line.style_solid,
                line.style_dotted,
                line.style_dashed,
                line.style_arrow_left,
                line.style_arrow_right,
                line.style_arrow_both,
            ].join(',');
            return { allStyles };
        });

        const styles = result.allStyles[0].split(',');
        expect(styles.length).toBe(6);
        expect(styles).toContain('style_solid');
        expect(styles).toContain('style_dotted');
        expect(styles).toContain('style_dashed');
        expect(styles).toContain('style_arrow_left');
        expect(styles).toContain('style_arrow_right');
        expect(styles).toContain('style_arrow_both');
    });

    it('line data is stored in __lines__ plot with correct structure', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            line.new(0, 50000, 10, 60000, xloc.bar_index, 'none', '#ff0000', line.style_solid, 2);
            return {};
        });

        expect(plots['__lines__']).toBeDefined();
        expect(plots['__lines__'].data.length).toBeGreaterThan(0);

        const lineEntry = plots['__lines__'].data[0];
        // Lines are stored as an aggregated array (single entry with all lines)
        const lines = lineEntry.value;
        expect(Array.isArray(lines)).toBe(true);
        expect(lines.length).toBeGreaterThan(0);
        // Verify line properties
        const ln = lines[0];
        expect(ln.x1).toBe(0);
        expect(ln.y1).toBe(50000);
        expect(ln.x2).toBe(10);
        expect(ln.y2).toBe(60000);
        expect(ln.style).toBe('style_solid');
        expect(ln.width).toBe(2);
        expect(lineEntry.options.style).toBe('drawing_line');
    });

    it('setter mutations are reflected in plot data (by-reference storage)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var myLine = line.new(0, 50000, 10, 60000);
            line.set_y1(myLine, 99000);
            line.set_y2(myLine, 88000);
            line.set_color(myLine, '#00ff00');
            return {};
        });

        const lineEntry = plots['__lines__'].data[0];
        const lines = lineEntry.value;
        expect(Array.isArray(lines)).toBe(true);
        const ln = lines[lines.length - 1]; // Last line on last bar
        expect(ln.y1).toBe(99000);
        expect(ln.y2).toBe(88000);
        expect(ln.color).toBe('#00ff00');
    });

    it('multiple lines are aggregated into a single __lines__ entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            line.new(0, 50000, 10, 60000, xloc.bar_index, 'none', color.red);
            line.new(0, 55000, 10, 65000, xloc.bar_index, 'none', color.blue);
            line.new(0, 60000, 10, 70000, xloc.bar_index, 'none', color.green);
            return {};
        });

        // There should be exactly 1 data entry containing all 3 lines
        expect(plots['__lines__'].data.length).toBe(1);
        const lines = plots['__lines__'].data[0].value;
        expect(Array.isArray(lines)).toBe(true);
        // At least 3 lines should exist (var creates on bar 0 only, let creates on every bar)
        expect(lines.length).toBeGreaterThanOrEqual(3);
    });
});
