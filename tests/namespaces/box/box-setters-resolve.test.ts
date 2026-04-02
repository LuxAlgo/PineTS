import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('Drawing object force_overlay split', () => {
    it('box.new with force_overlay=true creates a separate __boxes_overlay__ plot', async () => {
        const code = `
//@version=5
indicator("Force overlay box", overlay=false)
// Non-overlay box (stays in indicator pane)
var b1 = box.new(0, 100, 10, 50)
// Overlay box (should go to main chart pane)
var b2 = box.new(0, 60000, 10, 50000, force_overlay=true)
plot(close, "price")
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        // Regular boxes plot should exist with the non-overlay box
        expect(plots['__boxes__']).toBeDefined();
        const regularBoxes = plots['__boxes__'].data[0].value;
        const activeRegular = regularBoxes.filter((b: any) => b && !b._deleted && !b.force_overlay);
        expect(activeRegular.length).toBe(1);

        // Overlay boxes plot should exist with the force_overlay box
        expect(plots['__boxes_overlay__']).toBeDefined();
        expect(plots['__boxes_overlay__'].options.overlay).toBe(true);
        const overlayBoxes = plots['__boxes_overlay__'].data[0].value;
        const activeOverlay = overlayBoxes.filter((b: any) => b && !b._deleted);
        expect(activeOverlay.length).toBe(1);
        expect(activeOverlay[0].force_overlay).toBe(true);
    });

    it('line.new with force_overlay=true creates a separate __lines_overlay__ plot', async () => {
        const code = `
//@version=5
indicator("Force overlay line", overlay=false)
var ln1 = line.new(0, 100, 10, 50)
var ln2 = line.new(0, 60000, 10, 50000, force_overlay=true)
plot(close, "price")
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        expect(plots['__lines__']).toBeDefined();
        expect(plots['__lines_overlay__']).toBeDefined();
        expect(plots['__lines_overlay__'].options.overlay).toBe(true);

        const overlayLines = plots['__lines_overlay__'].data[0].value;
        const activeOverlay = overlayLines.filter((l: any) => l && !l._deleted);
        expect(activeOverlay.length).toBe(1);
        expect(activeOverlay[0].force_overlay).toBe(true);
    });

    it('label.new with force_overlay=true creates a separate __labels_overlay__ plot', async () => {
        const code = `
//@version=5
indicator("Force overlay label", overlay=false)
if barstate.islast
    label.new(bar_index, 100, "Indicator label")
    label.new(bar_index, close, "Overlay label", force_overlay=true)
plot(close, "price")
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        expect(plots['__labels__']).toBeDefined();
        expect(plots['__labels_overlay__']).toBeDefined();
        expect(plots['__labels_overlay__'].options.overlay).toBe(true);

        const overlayLabels = plots['__labels_overlay__'].data[0].value;
        const activeOverlay = overlayLabels.filter((l: any) => l && !l._deleted);
        expect(activeOverlay.length).toBe(1);
        expect(activeOverlay[0].force_overlay).toBe(true);
    });

    it('no overlay plot created when no force_overlay objects exist', async () => {
        const code = `
//@version=5
indicator("No force overlay", overlay=false)
var b = box.new(0, 100, 10, 50)
plot(close, "price")
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        expect(plots['__boxes__']).toBeDefined();
        expect(plots['__boxes_overlay__']).toBeUndefined();
    });
});

describe('Box/Line setters resolve Series values', () => {

    it('box.set_lefttop with time-based expressions produces valid plot data', async () => {
        // Bug: set_lefttop/set_rightbottom didn't call _resolve(), so Series-derived
        // values (e.g. time + offset) were stored as raw Series objects instead of numbers.
        const code = `
//@version=5
indicator("Box setters resolve", overlay=true)
var b = box.new(na, na, na, na, xloc=xloc.bar_time)
if barstate.islast
    barDur = int(math.max(time - time[1], 0))
    leftT = time + 2 * barDur
    rightT = leftT + 6 * barDur
    box.set_lefttop(b, leftT, high)
    box.set_rightbottom(b, rightT, low)
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        expect(plots['__boxes__']).toBeDefined();
        const boxData = plots['__boxes__'].data;
        expect(boxData.length).toBeGreaterThan(0);

        // Find the active (non-deleted) box
        const boxes = Array.isArray(boxData[0].value) ? boxData[0].value : [boxData[0].value];
        const activeBox = boxes.find((b: any) => b && !b._deleted);
        expect(activeBox).toBeDefined();

        // Coordinates must be valid numbers (not NaN, not null, not objects)
        expect(typeof activeBox.left).toBe('number');
        expect(typeof activeBox.right).toBe('number');
        expect(typeof activeBox.top).toBe('number');
        expect(typeof activeBox.bottom).toBe('number');
        expect(isNaN(activeBox.left)).toBe(false);
        expect(isNaN(activeBox.right)).toBe(false);
        expect(isNaN(activeBox.top)).toBe(false);
        expect(isNaN(activeBox.bottom)).toBe(false);

        // xloc should be 'bt' (bar_time)
        expect(activeBox.xloc).toBe('bt');

        // left should be a future timestamp (greater than any market data time)
        expect(activeBox.left).toBeGreaterThan(1000000000000); // reasonable timestamp
        expect(activeBox.right).toBeGreaterThan(activeBox.left); // right > left
    });

    it('line.set_xy1/set_xy2 with time-based expressions produces valid plot data', async () => {
        const code = `
//@version=5
indicator("Line setters resolve", overlay=true)
var ln = line.new(na, na, na, na, xloc=xloc.bar_time)
if barstate.islast
    barDur = int(math.max(time - time[1], 0))
    midT = time + 4 * barDur
    line.set_xy1(ln, time, high)
    line.set_xy2(ln, midT, high)
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        expect(plots['__lines__']).toBeDefined();
        const lineData = plots['__lines__'].data;
        expect(lineData.length).toBeGreaterThan(0);

        const lines = Array.isArray(lineData[0].value) ? lineData[0].value : [lineData[0].value];
        const activeLine = lines.find((l: any) => l && !l._deleted);
        expect(activeLine).toBeDefined();

        // All coordinates must be valid numbers
        expect(typeof activeLine.x1).toBe('number');
        expect(typeof activeLine.x2).toBe('number');
        expect(typeof activeLine.y1).toBe('number');
        expect(typeof activeLine.y2).toBe('number');
        expect(isNaN(activeLine.x1)).toBe(false);
        expect(isNaN(activeLine.x2)).toBe(false);
        expect(isNaN(activeLine.y1)).toBe(false);
        expect(isNaN(activeLine.y2)).toBe(false);

        // x2 should be in the future relative to x1
        expect(activeLine.x2).toBeGreaterThan(activeLine.x1);
    });

    it('box.set_left/set_right/set_top/set_bottom resolve individually', async () => {
        const code = `
//@version=5
indicator("Box individual setters", overlay=true)
var b = box.new(0, 0, 0, 0)
if barstate.islast
    box.set_left(b, bar_index - 10)
    box.set_right(b, bar_index)
    box.set_top(b, high)
    box.set_bottom(b, low)
`;
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());
        const { plots } = await pineTS.run(code);

        const boxes = Array.isArray(plots['__boxes__'].data[0].value)
            ? plots['__boxes__'].data[0].value
            : [plots['__boxes__'].data[0].value];
        const b = boxes.find((b: any) => b && !b._deleted);

        expect(typeof b.left).toBe('number');
        expect(typeof b.right).toBe('number');
        expect(typeof b.top).toBe('number');
        expect(typeof b.bottom).toBe('number');
        expect(isNaN(b.left)).toBe(false);
        expect(isNaN(b.right)).toBe(false);
        expect(b.right).toBeGreaterThan(b.left);
        expect(b.top).toBeGreaterThan(b.bottom);
    });
});
