import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('BOX Namespace', () => {
    it('box.new() creates with default properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            var b_left = b.left;
            var b_top = b.top;
            var b_right = b.right;
            var b_bottom = b.bottom;
            var b_xloc = b.xloc;
            var b_extend = b.extend;
            var b_border_style = b.border_style;
            var b_border_width = b.border_width;
            return { b_left, b_top, b_right, b_bottom, b_xloc, b_extend, b_border_style, b_border_width };
        });

        expect(result.b_left[0]).toBe(0);
        expect(result.b_top[0]).toBe(60000);
        expect(result.b_right[0]).toBe(10);
        expect(result.b_bottom[0]).toBe(50000);
        expect(result.b_xloc[0]).toBe('bi');
        expect(result.b_extend[0]).toBe('none');
        expect(result.b_border_style[0]).toBe('style_solid');
        expect(result.b_border_width[0]).toBe(1);
        expect(plots['__boxes__']).toBeDefined();
        expect(plots['__boxes__'].data.length).toBeGreaterThan(0);
    });

    it('box.new() with all parameters', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000, {
                border_color: '#ff0000',
                border_style: 'style_dashed',
                border_width: 3,
                bgcolor: '#00ff00',
                text: 'Hello',
                text_color: '#0000ff',
                text_size: 'large',
                extend: 'right',
            });
            var b_border_color = b.border_color;
            var b_border_style = b.border_style;
            var b_border_width = b.border_width;
            var b_bgcolor = b.bgcolor;
            var b_text = b.text;
            var b_text_color = b.text_color;
            var b_text_size = b.text_size;
            var b_extend = b.extend;
            return { b_border_color, b_border_style, b_border_width, b_bgcolor, b_text, b_text_color, b_text_size, b_extend };
        });

        expect(result.b_border_color[0]).toBe('#ff0000');
        expect(result.b_border_style[0]).toBe('style_dashed');
        expect(result.b_border_width[0]).toBe(3);
        expect(result.b_bgcolor[0]).toBe('#00ff00');
        expect(result.b_text[0]).toBe('Hello');
        expect(result.b_text_color[0]).toBe('#0000ff');
        expect(result.b_text_size[0]).toBe('large');
        expect(result.b_extend[0]).toBe('right');
    });

    it('box.new() with chart.point objects', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pt1 = chart.point.from_index(5, 60000);
            var pt2 = chart.point.from_index(15, 50000);
            var b = box.new(pt1, pt2);
            var b_left = b.left;
            var b_top = b.top;
            var b_right = b.right;
            var b_bottom = b.bottom;
            var b_xloc = b.xloc;
            return { b_left, b_top, b_right, b_bottom, b_xloc };
        });

        expect(result.b_left[0]).toBe(5);
        expect(result.b_top[0]).toBe(60000);
        expect(result.b_right[0]).toBe(15);
        expect(result.b_bottom[0]).toBe(50000);
        expect(result.b_xloc[0]).toBe('bi');
    });

    it('box.set_left/right/top/bottom() update coordinates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.set_left(b, 100);
            box.set_right(b, 200);
            box.set_top(b, 99000);
            box.set_bottom(b, 88000);
            var left = b.left;
            var right = b.right;
            var top = b.top;
            var bottom = b.bottom;
            return { left, right, top, bottom };
        });

        expect(result.left[0]).toBe(100);
        expect(result.right[0]).toBe(200);
        expect(result.top[0]).toBe(99000);
        expect(result.bottom[0]).toBe(88000);
    });

    it('box.set_lefttop() and set_rightbottom() update combined coordinates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.set_lefttop(b, 42, 75000);
            box.set_rightbottom(b, 99, 65000);
            var left = b.left;
            var top = b.top;
            var right = b.right;
            var bottom = b.bottom;
            return { left, top, right, bottom };
        });

        expect(result.left[0]).toBe(42);
        expect(result.top[0]).toBe(75000);
        expect(result.right[0]).toBe(99);
        expect(result.bottom[0]).toBe(65000);
    });

    it('box.set_top_left_point() and set_bottom_right_point() with chart.point', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            var pt1 = chart.point.from_index(42, 75000);
            var pt2 = chart.point.from_index(99, 65000);
            box.set_top_left_point(b, pt1);
            box.set_bottom_right_point(b, pt2);
            var left = b.left;
            var top = b.top;
            var right = b.right;
            var bottom = b.bottom;
            return { left, top, right, bottom };
        });

        expect(result.left[0]).toBe(42);
        expect(result.top[0]).toBe(75000);
        expect(result.right[0]).toBe(99);
        expect(result.bottom[0]).toBe(65000);
    });

    it('box.set_xloc() updates xloc and coordinates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.set_xloc(b, 1000000, 2000000, xloc.bar_time);
            var left = b.left;
            var right = b.right;
            var b_xloc = b.xloc;
            return { left, right, b_xloc };
        });

        expect(result.left[0]).toBe(1000000);
        expect(result.right[0]).toBe(2000000);
        expect(result.b_xloc[0]).toBe('bt');
    });

    it('box.get_left/right/top/bottom() return correct values', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(5, 70000, 15, 55000);
            var left = box.get_left(b);
            var right = box.get_right(b);
            var top = box.get_top(b);
            var bottom = box.get_bottom(b);
            return { left, right, top, bottom };
        });

        expect(result.left[0]).toBe(5);
        expect(result.right[0]).toBe(15);
        expect(result.top[0]).toBe(70000);
        expect(result.bottom[0]).toBe(55000);
    });

    it('box.set_bgcolor/border_color/border_width/border_style() update style', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.set_bgcolor(b, '#aabbcc');
            box.set_border_color(b, '#ddeeff');
            box.set_border_width(b, 5);
            box.set_border_style(b, 'style_dotted');
            var bgcolor = b.bgcolor;
            var border_color = b.border_color;
            var border_width = b.border_width;
            var border_style = b.border_style;
            return { bgcolor, border_color, border_width, border_style };
        });

        expect(result.bgcolor[0]).toBe('#aabbcc');
        expect(result.border_color[0]).toBe('#ddeeff');
        expect(result.border_width[0]).toBe(5);
        expect(result.border_style[0]).toBe('style_dotted');
    });

    it('box.set_extend() updates extend mode', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            var beforeExtend = b.extend;
            box.set_extend(b, 'both');
            var afterExtend = b.extend;
            return { beforeExtend, afterExtend };
        });

        expect(result.beforeExtend[0]).toBe('none');
        expect(result.afterExtend[0]).toBe('both');
    });

    it('box.set_text/text_color/text_size() update text properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.set_text(b, 'Test Box');
            box.set_text_color(b, '#ff00ff');
            box.set_text_size(b, 'large');
            var text = b.text;
            var text_color = b.text_color;
            var text_size = b.text_size;
            return { text, text_color, text_size };
        });

        expect(result.text[0]).toBe('Test Box');
        expect(result.text_color[0]).toBe('#ff00ff');
        expect(result.text_size[0]).toBe('large');
    });

    it('box.set_text_halign/valign/wrap/font_family/formatting() update text layout', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.set_text_halign(b, 'left');
            box.set_text_valign(b, 'top');
            box.set_text_wrap(b, 'wrap_auto');
            box.set_text_font_family(b, 'monospace');
            box.set_text_formatting(b, 'format_bold');
            var halign = b.text_halign;
            var valign = b.text_valign;
            var wrap = b.text_wrap;
            var font = b.text_font_family;
            var formatting = b.text_formatting;
            return { halign, valign, wrap, font, formatting };
        });

        expect(result.halign[0]).toBe('left');
        expect(result.valign[0]).toBe('top');
        expect(result.wrap[0]).toBe('wrap_auto');
        expect(result.font[0]).toBe('monospace');
        expect(result.formatting[0]).toBe('format_bold');
    });

    it('box.copy() creates independent copy', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var orig = box.new(0, 60000, 10, 50000, { border_color: '#ff0000' });
            var cp = box.copy(orig);
            var origTop = orig.top;
            var copyTop = cp.top;

            box.set_top(cp, 99000);
            var origTopAfter = orig.top;
            var copyTopAfter = cp.top;
            var differentIds = orig.id !== cp.id;

            return { origTop, copyTop, origTopAfter, copyTopAfter, differentIds };
        });

        expect(result.origTop[0]).toBe(60000);
        expect(result.copyTop[0]).toBe(60000);
        expect(result.origTopAfter[0]).toBe(60000);
        expect(result.copyTopAfter[0]).toBe(99000);
        expect(result.differentIds[0]).toBe(true);
    });

    it('box.delete() marks box as deleted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            var countBefore = box.all.length;
            box.delete(b);
            var deletedFlag = b._deleted;
            var countAfter = box.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('box.all returns non-deleted boxes', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            box.new(0, 60000, 10, 50000);
            box.new(5, 65000, 15, 55000);
            var box3 = box.new(10, 70000, 20, 60000);
            var totalCount = box.all.length;
            box.delete(box3);
            var afterDeleteCount = box.all.length;
            return { totalCount, afterDeleteCount };
        });

        expect(result.totalCount[0]).toBe(3);
        expect(result.afterDeleteCount[0]).toBe(2);
    });

    it('instance b.delete() method works', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            var countBefore = box.all.length;
            b.delete();
            var deletedFlag = b._deleted;
            var countAfter = box.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('setters ignore deleted boxes', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var b = box.new(0, 60000, 10, 50000);
            box.delete(b);
            box.set_top(b, 99999);
            box.set_bottom(b, 88888);
            box.set_bgcolor(b, '#ff0000');
            box.set_border_width(b, 10);
            var top = b.top;
            var bottom = b.bottom;
            var border_width = b.border_width;
            return { top, bottom, border_width };
        });

        expect(result.top[0]).toBe(60000);
        expect(result.bottom[0]).toBe(50000);
        expect(result.border_width[0]).toBe(1);
    });

    it('box data is stored in __boxes__ plot with correct structure', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            box.new(0, 60000, 10, 50000, { border_color: '#ff0000', border_width: 2 });
            return {};
        });

        expect(plots['__boxes__']).toBeDefined();
        expect(plots['__boxes__'].data.length).toBeGreaterThan(0);

        const boxEntry = plots['__boxes__'].data[0];
        const boxes = boxEntry.value;
        expect(Array.isArray(boxes)).toBe(true);
        expect(boxes.length).toBeGreaterThan(0);
        // Verify box properties
        const b = boxes[0];
        expect(b.left).toBe(0);
        expect(b.top).toBe(60000);
        expect(b.right).toBe(10);
        expect(b.bottom).toBe(50000);
        expect(b.border_color).toBe('#ff0000');
        expect(b.border_width).toBe(2);
        expect(boxEntry.options.style).toBe('drawing_box');
    });

    it('multiple boxes are aggregated into a single entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            box.new(0, 60000, 10, 50000, { border_color: color.red });
            box.new(5, 65000, 15, 55000, { border_color: color.blue });
            box.new(10, 70000, 20, 60000, { border_color: color.green });
            return {};
        });

        // There should be exactly 1 data entry containing all boxes
        expect(plots['__boxes__'].data.length).toBe(1);
        const boxes = plots['__boxes__'].data[0].value;
        expect(Array.isArray(boxes)).toBe(true);
        expect(boxes.length).toBeGreaterThanOrEqual(3);
    });
});
