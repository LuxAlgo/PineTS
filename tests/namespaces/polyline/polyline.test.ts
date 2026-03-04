import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('POLYLINE Namespace', () => {
    it('polyline.new() creates with default properties', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result, plots } = await pineTS.run((context) => {
            var pts = array.from(
                chart.point.from_index(0, 50000),
                chart.point.from_index(5, 60000),
                chart.point.from_index(10, 55000),
            );
            var pl = polyline.new(pts);
            var pl_curved = pl.curved;
            var pl_closed = pl.closed;
            var pl_xloc = pl.xloc;
            var pl_line_color = pl.line_color;
            var pl_line_width = pl.line_width;
            var pl_line_style = pl.line_style;
            return { pl_curved, pl_closed, pl_xloc, pl_line_color, pl_line_width, pl_line_style };
        });

        expect(result.pl_curved[0]).toBe(false);
        expect(result.pl_closed[0]).toBe(false);
        expect(result.pl_xloc[0]).toBe('bi');
        expect(result.pl_line_color[0]).toBe('#2962ff');
        expect(result.pl_line_width[0]).toBe(1);
        expect(result.pl_line_style[0]).toBe('style_solid');
        expect(plots['__polylines__']).toBeDefined();
        expect(plots['__polylines__'].data.length).toBeGreaterThan(0);
    });

    it('polyline.new() with named options', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pts = array.from(
                chart.point.from_index(0, 50000),
                chart.point.from_index(5, 60000),
            );
            var pl = polyline.new(pts, {
                curved: true,
                closed: true,
                line_color: '#ff0000',
                fill_color: '#00ff00',
                line_style: 'style_dashed',
                line_width: 3,
            });
            var pl_curved = pl.curved;
            var pl_closed = pl.closed;
            var pl_line_color = pl.line_color;
            var pl_fill_color = pl.fill_color;
            var pl_line_style = pl.line_style;
            var pl_line_width = pl.line_width;
            return { pl_curved, pl_closed, pl_line_color, pl_fill_color, pl_line_style, pl_line_width };
        });

        expect(result.pl_curved[0]).toBe(true);
        expect(result.pl_closed[0]).toBe(true);
        expect(result.pl_line_color[0]).toBe('#ff0000');
        expect(result.pl_fill_color[0]).toBe('#00ff00');
        expect(result.pl_line_style[0]).toBe('style_dashed');
        expect(result.pl_line_width[0]).toBe(3);
    });

    it('polyline.new() with chart.point objects stores points', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pt1 = chart.point.from_index(0, 50000);
            var pt2 = chart.point.from_index(10, 60000);
            var pt3 = chart.point.from_index(20, 55000);
            var pts = array.from(pt1, pt2, pt3);
            var pl = polyline.new(pts);
            var pointCount = pl.points.length;
            var firstPrice = pl.points[0].price;
            var lastPrice = pl.points[2].price;
            return { pointCount, firstPrice, lastPrice };
        });

        expect(result.pointCount[0]).toBe(3);
        expect(result.firstPrice[0]).toBe(50000);
        expect(result.lastPrice[0]).toBe(55000);
    });

    it('polyline.delete() marks as deleted', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pts = array.from(
                chart.point.from_index(0, 50000),
                chart.point.from_index(5, 60000),
            );
            var pl = polyline.new(pts);
            var countBefore = polyline.all.length;
            polyline.delete(pl);
            var deletedFlag = pl._deleted;
            var countAfter = polyline.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('polyline.all returns non-deleted polylines', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pts1 = array.from(chart.point.from_index(0, 50000), chart.point.from_index(5, 60000));
            var pts2 = array.from(chart.point.from_index(0, 40000), chart.point.from_index(5, 50000));
            var pl1 = polyline.new(pts1);
            var pl2 = polyline.new(pts2);
            var totalCount = polyline.all.length;
            polyline.delete(pl2);
            var afterDeleteCount = polyline.all.length;
            return { totalCount, afterDeleteCount };
        });

        expect(result.totalCount[0]).toBe(2);
        expect(result.afterDeleteCount[0]).toBe(1);
    });

    it('instance p.delete() method works', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { result } = await pineTS.run((context) => {
            var pts = array.from(
                chart.point.from_index(0, 50000),
                chart.point.from_index(5, 60000),
            );
            var pl = polyline.new(pts);
            var countBefore = polyline.all.length;
            pl.delete();
            var deletedFlag = pl._deleted;
            var countAfter = polyline.all.length;
            return { deletedFlag, countBefore, countAfter };
        });

        expect(result.deletedFlag[0]).toBe(true);
        expect(result.countBefore[0]).toBe(1);
        expect(result.countAfter[0]).toBe(0);
    });

    it('data stored in __polylines__ plot with correct structure', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var pts = array.from(
                chart.point.from_index(0, 50000),
                chart.point.from_index(5, 60000),
                chart.point.from_index(10, 55000),
            );
            polyline.new(pts, { line_color: '#5b9cf6' });
            return {};
        });

        expect(plots['__polylines__']).toBeDefined();
        expect(plots['__polylines__'].data.length).toBeGreaterThan(0);

        const plEntry = plots['__polylines__'].data[0];
        const polylines = plEntry.value;
        expect(Array.isArray(polylines)).toBe(true);
        expect(polylines.length).toBeGreaterThan(0);
        // Verify polyline properties
        const pl = polylines[0];
        expect(pl.line_color).toBe('#5b9cf6');
        expect(pl.points.length).toBe(3);
        expect(plEntry.options.style).toBe('drawing_polyline');
    });

    it('multiple polylines are aggregated into a single entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

        const { plots } = await pineTS.run((context) => {
            var pts1 = array.from(chart.point.from_index(0, 50000), chart.point.from_index(5, 60000));
            var pts2 = array.from(chart.point.from_index(0, 40000), chart.point.from_index(5, 50000));
            polyline.new(pts1, { line_color: color.red });
            polyline.new(pts2, { line_color: color.blue });
            return {};
        });

        // There should be exactly 1 data entry containing all polylines
        expect(plots['__polylines__'].data.length).toBe(1);
        const polylines = plots['__polylines__'].data[0].value;
        expect(Array.isArray(polylines)).toBe(true);
        expect(polylines.length).toBeGreaterThanOrEqual(2);
    });
});
