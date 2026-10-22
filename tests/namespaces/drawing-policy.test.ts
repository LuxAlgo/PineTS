// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { Core } from '../../src/namespaces/Core';
import { LineHelper } from '../../src/namespaces/line/LineHelper';
import { LabelHelper } from '../../src/namespaces/label/LabelHelper';
import { BoxHelper } from '../../src/namespaces/box/BoxHelper';
import { initializeStrategy } from '../../src/namespaces/strategy/utils';
import { any as declareStrategy } from '../../src/namespaces/strategy/methods/any';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { LinefillHelper } from '../../src/namespaces/linefill/LinefillHelper';
import { LineObject } from '../../src/namespaces/line/LineObject';

function drawingContext(max = 50): any {
    return {
        idx: 0,
        _execTick: 1,
        indicator: {
            max_lines_count: max,
            max_labels_count: max,
            max_boxes_count: max,
            max_polylines_count: Math.min(max, 100),
        },
        plots: {},
        marketData: [{ openTime: 0 }],
    };
}

describe('drawing resource policy', () => {
    it.each([
        ['max_lines_count', 500],
        ['max_labels_count', 500],
        ['max_boxes_count', 500],
        ['max_polylines_count', 100],
    ])('enforces the declared range for %s after source and property overrides', (key, max) => {
        const sourceContext: any = {};
        const sourceCore = new Core(sourceContext);
        expect(() => sourceCore.indicator('x', { [key]: max + 1 })).toThrow(new RegExp(key));
        expect(() => sourceCore.indicator('x', { [key]: 0 })).toThrow(new RegExp(key));
        expect(() => sourceCore.indicator('x', { [key]: 1.5 })).toThrow(new RegExp(key));
        expect(() => sourceCore.indicator('x', { [key]: Infinity })).toThrow(new RegExp(key));
        expect(() => sourceCore.indicator('x', { [key]: max })).not.toThrow();

        const overrideContext: any = { _propOverrides: { [key]: max + 1 } };
        expect(() => new Core(overrideContext).indicator('x')).toThrow(new RegExp(key));
    });

    it('rejects oversized maxima through versioned Pine entry points', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2));
        await expect(pineTS.run('//@version=6\nindicator("x", max_lines_count=501)\nplot(close)')).rejects.toThrow(/max_lines_count/);
        await expect(pineTS.run('//@version=6\nstrategy("x", max_polylines_count=101)\nplot(close)')).rejects.toThrow(/max_polylines_count/);
    });

    it('keeps same-bar line churn bounded without losing FIFO and explicit-delete semantics', () => {
        const context = drawingContext(2);
        const lines = new LineHelper(context);
        const first = lines.new(0, 0, 1, 1);
        const second = lines.new(1, 1, 2, 2);
        first.delete();
        const third = lines.new(2, 2, 3, 3);
        expect(lines.all).toEqual([second, third]);
        const fourth = lines.copy(third)!;
        expect(lines.all).toEqual([third, fourth]);

        for (let i = 0; i < 200; i++) lines.new(i, 0, i + 1, 1);
        const backing = (lines as any)._lines;
        expect(backing.length ?? backing.size).toBeLessThanOrEqual(2);
        expect(lines.all).toHaveLength(2);
        lines.syncToPlot();
        expect(context.plots.__lines__.data[0].value).toHaveLength(2);
    });

    it('enforces the same limits for strategy declarations and their redraws', () => {
        const context = drawingContext();
        delete context.indicator;
        expect(() => initializeStrategy(context, { max_lines_count: 501 })).toThrow(/max_lines_count/);
        initializeStrategy(context, { max_lines_count: 1 });
        const lines = new LineHelper(context);
        const first = lines.new(0, 0, 1, 1);
        const second = lines.new(1, 1, 2, 2);
        expect(first._deleted).toBe(true);
        expect(lines.all).toEqual([second]);

        context._propOverrides = { max_lines_count: 501 };
        expect(() => declareStrategy(context)('x')).toThrow(/max_lines_count/);
        expect(context.strategy.config.max_lines_count).toBe(1);
    });

    it('counts creations across drawing types in one bar and resets on the next execution', () => {
        const context = drawingContext(500);
        const lines = new LineHelper(context);
        const labels = new LabelHelper(context);
        const boxes = new BoxHelper(context);

        for (let i = 0; i < 4999; i++) lines.new(i, 0, i + 1, 1);
        labels.new(0, 0, 'x');
        expect(() => boxes.new(0, 1, 1, 0)).toThrow(/drawing|creation|limit/i);
        expect(boxes.all).toHaveLength(0);

        context.idx = 1;
        context._execTick = 2;
        expect(() => boxes.new(0, 1, 1, 0)).not.toThrow();
        expect(boxes.all).toHaveLength(1);
    });

    it('keeps linefill pair replacement, cascade deletion, and FIFO storage bounded', () => {
        const context = drawingContext(2);
        const fills = new LinefillHelper(context);
        const a = new LineObject(0, 0, 1, 1);
        const b = new LineObject(1, 0, 2, 1);
        const c = new LineObject(2, 0, 3, 1);
        const d = new LineObject(3, 0, 4, 1);
        const first = fills.new(a, b, 'red')!;
        expect(fills.new(b, a, 'blue')).toBe(first);
        expect(first.color).toBe('blue');
        const second = fills.new(b, c, 'red')!;
        const third = fills.new(c, d, 'red')!;
        expect(first._deleted).toBe(true);
        expect(fills.all).toEqual([second, third]);
        expect((fills as any)._linefills.size).toBe(2);
        second.delete();
        expect(fills.all).toEqual([third]);
        fills.deleteForLine(c);
        expect(fills.all).toEqual([]);
        expect(fills.new(a, b, 'green')).not.toBe(first);
    });
});
