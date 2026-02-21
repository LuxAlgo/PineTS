import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('LABEL Namespace', () => {
    it('label.new() creates a label with default properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'Hello');
            var lbl_text = myLabel.text;
            var lbl_style = myLabel.style;
            var lbl_size = myLabel.size;
            var lbl_textalign = myLabel.textalign;
            var lbl_xloc = myLabel.xloc;
            var lbl_yloc = myLabel.yloc;
            return { lbl_text, lbl_style, lbl_size, lbl_textalign, lbl_xloc, lbl_yloc };
        });

        expect(result.lbl_text[0]).toBe('Hello');
        expect(result.lbl_style[0]).toBe('style_label_down');
        expect(result.lbl_size[0]).toBe('normal');
        expect(result.lbl_textalign[0]).toBe('align_center');
        expect(result.lbl_xloc[0]).toBe('bar_index');
        expect(result.lbl_yloc[0]).toBe('price');
        expect(plots['__labels__']).toBeDefined();
        expect(plots['__labels__'].data.length).toBeGreaterThan(0);
    });

    it('label.new() accepts all parameters', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(
                bar_index, high, 'Full',
                xloc.bar_index, yloc.abovebar,
                color.red, label.style_label_up, color.white,
                size.large, text.align_left, 'My tooltip',
            );
            var lbl_text = myLabel.text;
            var lbl_style = myLabel.style;
            var lbl_yloc = myLabel.yloc;
            var lbl_size = myLabel.size;
            var lbl_textalign = myLabel.textalign;
            var lbl_tooltip = myLabel.tooltip;
            return { lbl_text, lbl_style, lbl_yloc, lbl_size, lbl_textalign, lbl_tooltip };
        });

        expect(result.lbl_text[0]).toBe('Full');
        expect(result.lbl_style[0]).toBe('style_label_up');
        expect(result.lbl_yloc[0]).toBe('abovebar');
        expect(result.lbl_size[0]).toBe('large');
        expect(result.lbl_textalign[0]).toBe('align_left');
        expect(result.lbl_tooltip[0]).toBe('My tooltip');
    });

    it('label.set_text() updates label text', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'Original');
            var before = myLabel.text;
            label.set_text(myLabel, 'Modified');
            var after = myLabel.text;
            return { before, after };
        });

        expect(result.before[0]).toBe('Original');
        expect(result.after[0]).toBe('Modified');
    });

    it('label.set_color() and label.set_textcolor() update colors', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'Colors', xloc.bar_index, yloc.price, color.blue, label.style_label_down, color.white);
            label.set_color(myLabel, color.red);
            label.set_textcolor(myLabel, color.yellow);
            var lblColor = myLabel.color;
            var txtColor = myLabel.textcolor;
            return { lblColor, txtColor };
        });

        expect(result.lblColor[0]).toBeTruthy();
        expect(result.txtColor[0]).toBeTruthy();
    });

    it('label.set_x(), set_y(), set_xy() update coordinates', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'Coord');
            label.set_x(myLabel, 99);
            var xAfterSetX = myLabel.x;
            label.set_y(myLabel, 55000);
            var yAfterSetY = myLabel.y;
            label.set_xy(myLabel, 200, 60000);
            var xAfterSetXY = myLabel.x;
            var yAfterSetXY = myLabel.y;
            return { xAfterSetX, yAfterSetY, xAfterSetXY, yAfterSetXY };
        });

        expect(result.xAfterSetX[0]).toBe(99);
        expect(result.yAfterSetY[0]).toBe(55000);
        expect(result.xAfterSetXY[0]).toBe(200);
        expect(result.yAfterSetXY[0]).toBe(60000);
    });

    it('label.set_size() and label.set_style() update size and style', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'SizeStyle');
            label.set_size(myLabel, size.huge);
            label.set_style(myLabel, label.style_circle);
            var lbl_size = myLabel.size;
            var lbl_style = myLabel.style;
            return { lbl_size, lbl_style };
        });

        expect(result.lbl_size[0]).toBe('huge');
        expect(result.lbl_style[0]).toBe('style_circle');
    });

    it('label.set_textalign() and label.set_tooltip() update properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'Props');
            label.set_textalign(myLabel, text.align_right);
            label.set_tooltip(myLabel, 'New tooltip');
            var lbl_textalign = myLabel.textalign;
            var lbl_tooltip = myLabel.tooltip;
            return { lbl_textalign, lbl_tooltip };
        });

        expect(result.lbl_textalign[0]).toBe('align_right');
        expect(result.lbl_tooltip[0]).toBe('New tooltip');
    });

    it('label.get_text(), get_x(), get_y() return correct values', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, 50000, 'GetterTest');
            var getText = label.get_text(myLabel);
            var getX = label.get_x(myLabel);
            var getY = label.get_y(myLabel);
            return { getText, getX, getY };
        });

        expect(result.getText[0]).toBe('GetterTest');
        expect(result.getX[0]).toBe(0);
        expect(result.getY[0]).toBe(50000);
    });

    it('label.copy() creates independent copy', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var orig = label.new(bar_index, close, 'Original', xloc.bar_index, yloc.price, color.blue);
            var cp = label.copy(orig);
            var origText = orig.text;
            var copyText = cp.text;

            label.set_text(cp, 'CopyModified');
            var origTextAfter = orig.text;
            var copyTextAfter = cp.text;
            var differentIds = orig.id !== cp.id;

            return { origText, copyText, origTextAfter, copyTextAfter, differentIds };
        });

        expect(result.origText[0]).toBe('Original');
        expect(result.copyText[0]).toBe('Original');
        expect(result.origTextAfter[0]).toBe('Original');
        expect(result.copyTextAfter[0]).toBe('CopyModified');
        expect(result.differentIds[0]).toBe(true);
    });

    it('label.delete() marks label as deleted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'ToDelete');
            var countBefore = label.all.length;
            label.delete(myLabel);
            var deletedFlag = myLabel._deleted;
            var countAfter = label.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('label.all returns non-deleted labels', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            label.new(bar_index, close, 'L1');
            label.new(bar_index, close, 'L2');
            var myLabel3 = label.new(bar_index, close, 'L3');
            var totalCount = label.all.length;
            label.delete(myLabel3);
            var afterDeleteCount = label.all.length;
            return { totalCount, afterDeleteCount };
        });

        expect(result.totalCount[0]).toBe(3);
        expect(result.afterDeleteCount[0]).toBe(2);
    });

    it('setters ignore deleted labels', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'BeforeDelete');
            label.delete(myLabel);
            label.set_text(myLabel, 'ShouldNotChange');
            var textAfterDelete = myLabel.text;
            return { textAfterDelete };
        });

        expect(result.textAfterDelete[0]).toBe('BeforeDelete');
    });

    it('label.set_point() positions label from chart.point', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'PointTest');
            var myPoint = chart.point.from_index(42, 75000);
            label.set_point(myLabel, myPoint);
            var xAfter = myLabel.x;
            var yAfter = myLabel.y;
            var xlocAfter = myLabel.xloc;
            return { xAfter, yAfter, xlocAfter };
        });

        expect(result.xAfter[0]).toBe(42);
        expect(result.yAfter[0]).toBe(75000);
        expect(result.xlocAfter[0]).toBe('bar_index');
    });

    it('all 21 style constants are accessible', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var allStyles = [
                label.style_label_down, label.style_label_up,
                label.style_label_left, label.style_label_right,
                label.style_label_lower_left, label.style_label_lower_right,
                label.style_label_upper_left, label.style_label_upper_right,
                label.style_label_center,
                label.style_circle, label.style_square, label.style_diamond,
                label.style_flag, label.style_arrowup, label.style_arrowdown,
                label.style_cross, label.style_xcross,
                label.style_triangleup, label.style_triangledown,
                label.style_none, label.style_text_outline,
            ].join(',');
            return { allStyles };
        });

        const styles = result.allStyles[0].split(',');
        expect(styles.length).toBe(21);
        expect(styles).toContain('style_label_down');
        expect(styles).toContain('style_label_up');
        expect(styles).toContain('style_circle');
        expect(styles).toContain('style_diamond');
        expect(styles).toContain('style_arrowup');
        expect(styles).toContain('style_arrowdown');
        expect(styles).toContain('style_none');
        expect(styles).toContain('style_text_outline');
    });

    it('label data is pushed to __labels__ plot with correct structure', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            label.new(bar_index, 50000, 'PlotTest', xloc.bar_index, yloc.price, '#ff0000', label.style_label_down, '#ffffff');
            return {};
        });

        expect(plots['__labels__']).toBeDefined();
        expect(plots['__labels__'].data.length).toBeGreaterThan(0);

        const labelEntry = plots['__labels__'].data[0];
        expect(labelEntry.value.text).toBe('PlotTest');
        expect(labelEntry.value.x).toBe(0);
        expect(labelEntry.value.style).toBe('style_label_down');
        expect(labelEntry.options.style).toBe('label');
    });

    it('setter mutations are reflected in plot data (by-reference storage)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var myLabel = label.new(bar_index, close, 'Before');
            label.set_text(myLabel, 'After');
            label.set_color(myLabel, '#00ff00');
            return {};
        });

        const labelEntry = plots['__labels__'].data[0];
        expect(labelEntry.value.text).toBe('After');
        expect(labelEntry.value.color).toBe('#00ff00');
    });
});
