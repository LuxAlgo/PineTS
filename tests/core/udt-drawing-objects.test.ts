import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

/**
 * Tests for UDT (User-Defined Types) containing drawing object fields (line, label, box).
 *
 * These tests cover the fix for the "$.get(...).ln.set_xy1 is not a function" bug,
 * where factory method thunks inside `var` UDT declarations were stored as raw
 * functions instead of being evaluated to actual drawing objects.
 *
 * The fix resolves thunks inside PineTypeObject fields in initVar() on bar 0.
 */
describe('UDT with Drawing Objects', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    // ----------------------------------------------------------------
    // Core fix: var UDT with line field — thunk resolution in initVar
    // ----------------------------------------------------------------

    it('var UDT with line field: set_xy1/set_xy2 work (thunk resolution)', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Line", overlay=true)
type MyObj
    line ln

var MyObj container = MyObj.new(
    line.new(na, na, na, na, color=#ff0000, width=2)
)
container.ln.set_xy1(bar_index, high)
container.ln.set_xy2(bar_index, low)
plot(close)
`;
        const { plots } = await pineTS.run(code);

        // Line should be created and accessible
        expect(plots['__lines__']).toBeDefined();
        const lines = plots['__lines__'].data[0].value;
        expect(Array.isArray(lines)).toBe(true);
        // Only 1 line should exist (no orphans from thunks firing on every bar)
        expect(lines.filter((l: any) => !l._deleted).length).toBe(1);

        const ln = lines[0];
        expect(ln.color).toBe('#ff0000');
        expect(ln.width).toBe(2);
        // Coordinates should have been updated by set_xy1/set_xy2
        expect(typeof ln.x1).toBe('number');
        expect(typeof ln.y1).toBe('number');
        expect(typeof ln.x2).toBe('number');
        expect(typeof ln.y2).toBe('number');
        expect(ln.x1).not.toBeNaN();
    });

    it('var UDT with label field: set_xy/set_text work (thunk resolution)', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Label", overlay=true)
type MyObj
    label lb

var MyObj container = MyObj.new(
    label.new(na, na, "", color=#5b9cf6, style=label.style_label_down, size=size.small)
)
container.lb.set_xy(bar_index, high)
container.lb.set_text("Price: " + str.tostring(close, "#.##"))
plot(close)
`;
        const { plots } = await pineTS.run(code);

        expect(plots['__labels__']).toBeDefined();
        const labels = plots['__labels__'].data[0].value;
        expect(Array.isArray(labels)).toBe(true);
        expect(labels.filter((l: any) => !l._deleted).length).toBe(1);

        const lb = labels[0];
        expect(typeof lb.x).toBe('number');
        expect(lb.x).not.toBeNaN();
        expect(lb.text).toContain('Price:');
    });

    it('var UDT with box field: set_lefttop/set_rightbottom work (thunk resolution)', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Box", overlay=true)
type MyObj
    box bx

var MyObj container = MyObj.new(
    box.new(na, na, na, na, border_color=#5b9cf6, bgcolor=#5b9cf610)
)
container.bx.set_lefttop(bar_index - 5, high)
container.bx.set_rightbottom(bar_index, low)
plot(close)
`;
        const { plots } = await pineTS.run(code);

        expect(plots['__boxes__']).toBeDefined();
        const boxes = plots['__boxes__'].data[0].value;
        expect(Array.isArray(boxes)).toBe(true);
        expect(boxes.filter((b: any) => !b._deleted).length).toBe(1);

        const bx = boxes[0];
        expect(typeof bx.left).toBe('number');
        expect(typeof bx.top).toBe('number');
        expect(bx.border_color).toBe('#5b9cf6');
    });

    // ----------------------------------------------------------------
    // Multi-field UDT: line + label + box in a single type
    // ----------------------------------------------------------------

    it('var UDT with line + label + box fields: all thunks resolved, no orphans', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Multi-Field", overlay=true)
type ObjectContainer
    line  ln
    label lb
    box   bx

var ObjectContainer myContainer = ObjectContainer.new(
    line.new(na, na, na, na, color=#5b9cf6, width=2),
    label.new(na, na, "", color=#5b9cf6, style=label.style_label_down, size=size.small),
    box.new(na, na, na, na, border_color=#5b9cf6)
)

myContainer.ln.set_xy1(bar_index, high)
myContainer.ln.set_xy2(bar_index, low)
myContainer.lb.set_xy(bar_index, high)
myContainer.lb.set_text("Price: " + str.tostring(close, "#.##"))
myContainer.bx.set_lefttop(bar_index - 4, ta.highest(high, 5))
myContainer.bx.set_rightbottom(bar_index, ta.lowest(low, 5))
plot(close, "Price Plot", color=color.new(#5b9cf6, 50))
`;
        const { plots } = await pineTS.run(code);

        // All three drawing object types should exist
        expect(plots['__lines__']).toBeDefined();
        expect(plots['__labels__']).toBeDefined();
        expect(plots['__boxes__']).toBeDefined();

        // Exactly 1 of each — no orphan objects from thunks on bars 1+
        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        const labels = plots['__labels__'].data[0].value.filter((l: any) => !l._deleted);
        const boxes = plots['__boxes__'].data[0].value.filter((b: any) => !b._deleted);
        expect(lines.length).toBe(1);
        expect(labels.length).toBe(1);
        expect(boxes.length).toBe(1);

        // Verify the objects have valid coordinates (were updated via delegate methods)
        expect(lines[0].x1).not.toBeNaN();
        expect(lines[0].y1).not.toBeNaN();
        expect(lines[0].color).toBe('#5b9cf6');
        expect(labels[0].text).toContain('Price:');
        expect(typeof boxes[0].left).toBe('number');
        expect(typeof boxes[0].top).toBe('number');
    });

    // ----------------------------------------------------------------
    // Delegate methods (instance.method() syntax) on UDT fields
    // ----------------------------------------------------------------

    it('delegate methods on UDT line field (instance.set_xy1 syntax)', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            const { Type, line, na, bar_index, high, low } = context.pine;

            const MyType = Type({ ln: 'line' });
            var container = MyType.new(line.new(0, 100, 10, 200));

            // Use delegate syntax: container.ln.set_xy1(...)
            container.ln.set_xy1(42, 500);
            container.ln.set_xy2(99, 600);

            var x1 = container.ln.get_x1();
            var y1 = container.ln.get_y1();
            var x2 = container.ln.get_x2();
            var y2 = container.ln.get_y2();

            return { x1, y1, x2, y2 };
        });

        expect(result.x1[0]).toBe(42);
        expect(result.y1[0]).toBe(500);
        expect(result.x2[0]).toBe(99);
        expect(result.y2[0]).toBe(600);
    });

    it('delegate methods on UDT label field (instance.set_text syntax)', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            const { Type, label } = context.pine;

            const MyType = Type({ lb: 'label' });
            var container = MyType.new(label.new(0, 100, 'initial'));

            container.lb.set_text('updated');
            container.lb.set_xy(42, 500);

            var text = container.lb.get_text();
            var x = container.lb.get_x();
            var y = container.lb.get_y();

            return { text, x, y };
        });

        expect(result.text[0]).toBe('updated');
        expect(result.x[0]).toBe(42);
        expect(result.y[0]).toBe(500);
    });

    it('delegate methods on UDT box field (instance.set_lefttop syntax)', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            const { Type, box } = context.pine;

            const MyType = Type({ bx: 'box' });
            var container = MyType.new(box.new(0, 100, 10, 50));

            container.bx.set_lefttop(42, 500);
            container.bx.set_rightbottom(99, 200);

            var left = container.bx.get_left();
            var top = container.bx.get_top();
            var right = container.bx.get_right();
            var bottom = container.bx.get_bottom();

            return { left, top, right, bottom };
        });

        expect(result.left[0]).toBe(42);
        expect(result.top[0]).toBe(500);
        expect(result.right[0]).toBe(99);
        expect(result.bottom[0]).toBe(200);
    });

    // ----------------------------------------------------------------
    // UDT field persistence with var across bars
    // ----------------------------------------------------------------

    it('var UDT persists drawing object across bars (same object mutated)', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Persistence", overlay=true)
type MyObj
    line ln

var MyObj container = MyObj.new(
    line.new(0, 100, 10, 200)
)
container.ln.set_x1(bar_index)
container.ln.set_y1(close)
plot(close)
`;
        const { plots } = await pineTS.run(code);

        const lines = plots['__lines__'].data[0].value;
        // Should still be 1 line (var persists, not recreated)
        expect(lines.filter((l: any) => !l._deleted).length).toBe(1);
        // The line's coordinates should reflect the last bar's values
        const ln = lines[0];
        expect(ln.x1).not.toBe(0); // Updated from initial 0
    });

    // ----------------------------------------------------------------
    // Non-var UDT with drawing objects (let — no thunk wrapping)
    // ----------------------------------------------------------------

    it('let UDT with line field works without thunks', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            const { Type, line } = context.pine;

            const MyType = Type({ ln: 'line' });
            let container = MyType.new(line.new(0, 100, 10, 200));

            container.ln.set_xy1(42, 500);
            var x1 = container.ln.get_x1();
            var y1 = container.ln.get_y1();

            return { x1, y1 };
        });

        expect(result.x1[0]).toBe(42);
        expect(result.y1[0]).toBe(500);
    });
});

/**
 * Tests for simple `var` line/label/box declarations (no UDT).
 * Ensures that thunk wrapping + initVar deferred evaluation still works
 * correctly after the UDT fix.
 */
describe('var Drawing Objects (non-UDT, regression)', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('var line creates exactly 1 line (no orphans)', async () => {
        const pineTS = makePineTS();

        const { plots } = await pineTS.run((context) => {
            var myLine = line.new(0, 100, 10, 200, xloc.bar_index, 'none', '#ff0000');
            line.set_xy1(myLine, bar_index, high);
            line.set_xy2(myLine, bar_index, low);
            return {};
        });

        const lines = plots['__lines__'].data[0].value;
        expect(lines.filter((l: any) => !l._deleted).length).toBe(1);
    });

    it('var label creates exactly 1 label (no orphans)', async () => {
        const pineTS = makePineTS();

        const { plots } = await pineTS.run((context) => {
            var myLabel = label.new(0, 100, 'test');
            label.set_xy(myLabel, bar_index, high);
            return {};
        });

        const labels = plots['__labels__'].data[0].value;
        expect(labels.filter((l: any) => !l._deleted).length).toBe(1);
    });

    it('var box creates exactly 1 box (no orphans)', async () => {
        const pineTS = makePineTS();

        const { plots } = await pineTS.run((context) => {
            var myBox = box.new(0, 100, 10, 50);
            box.set_lefttop(myBox, bar_index - 5, high);
            box.set_rightbottom(myBox, bar_index, low);
            return {};
        });

        const boxes = plots['__boxes__'].data[0].value;
        expect(boxes.filter((b: any) => !b._deleted).length).toBe(1);
    });
});

/**
 * Tests for map namespace — ensuring no conflict with native JS Map.
 *
 * Covers the fix for duplicate 'map' in CONTEXT_PINE_VARS which caused
 * `const {map, map} = $.pine` (invalid destructuring).
 */
describe('Map Namespace (no native JS conflict)', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('map.new() and map operations work in Pine Script source', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("Map Test")
var m = map.new<string, float>()
if bar_index == 0
    m.put("a", 10.0)
    m.put("b", 20.0)
    m.put("c", 30.0)
plot(m.size(), "size")
plot(m.get("b"), "val_b")
plot(m.contains("a") ? 1 : 0, "has_a")
`;
        const { plots } = await pineTS.run(code);

        const lastVal = (plotName: string) => {
            const data = plots[plotName]?.data;
            return data?.[data.length - 1]?.value;
        };

        expect(lastVal('size')).toBe(3);
        expect(lastVal('val_b')).toBe(20);
        expect(lastVal('has_a')).toBe(1);
    });

    it('map with drawing object values (map<int, line>)', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("Map Drawing Objects", overlay=true)
var m = map.new<int, line>()
if bar_index == 0
    m.put(1, line.new(0, 100, 10, 200, color=#ff0000))
    m.put(2, line.new(0, 300, 10, 400, color=#00ff00))
plot(m.size(), "size")
plot(m.contains(1) ? 1 : 0, "has_1")
`;
        const { plots } = await pineTS.run(code);

        const lastVal = (plotName: string) => {
            const data = plots[plotName]?.data;
            return data?.[data.length - 1]?.value;
        };

        expect(lastVal('size')).toBe(2);
        expect(lastVal('has_1')).toBe(1);
    });
});

/**
 * Tests for UDT with drawing objects in Pine Script source code (string).
 * These use the full transpiler pipeline end-to-end.
 */
describe('UDT Drawing Objects - Pine Script Source (E2E)', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('full UDT Object Management indicator (the original bug script)', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Object Management", overlay = true)
color MAIN_COLOR = #5b9cf6
type ObjectContainer
    line  ln
    label lb
    box   bx

var ObjectContainer myContainer = ObjectContainer.new(
    line.new(na, na, na, na, color = MAIN_COLOR, width = 2),
    label.new(na, na, "", color = MAIN_COLOR, style = label.style_label_down, size = size.small),
    box.new(na, na, na, na, border_color = MAIN_COLOR, bgcolor = color.new(MAIN_COLOR, 90))
)

myContainer.ln.set_xy1(bar_index, high)
myContainer.ln.set_xy2(bar_index, low)
myContainer.lb.set_xy(bar_index, high)
myContainer.lb.set_text("Price: " + str.tostring(close, "#.##"))

int lookback = 5
float top = ta.highest(high, lookback)
float bottom = ta.lowest(low, lookback)
myContainer.bx.set_lefttop(bar_index - lookback + 1, top)
myContainer.bx.set_rightbottom(bar_index, bottom)
plot(close, "Price Plot", color = color.new(MAIN_COLOR, 50))
`;
        const { plots } = await pineTS.run(code);

        // All drawing types present
        expect(plots['__lines__']).toBeDefined();
        expect(plots['__labels__']).toBeDefined();
        expect(plots['__boxes__']).toBeDefined();
        expect(plots['Price Plot']).toBeDefined();

        // Exactly 1 of each — no orphans
        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        const labels = plots['__labels__'].data[0].value.filter((l: any) => !l._deleted);
        const boxes = plots['__boxes__'].data[0].value.filter((b: any) => !b._deleted);
        expect(lines.length).toBe(1);
        expect(labels.length).toBe(1);
        expect(boxes.length).toBe(1);

        // Verify line properties
        expect(lines[0].color).toBe('#5b9cf6');
        expect(lines[0].width).toBe(2);
        expect(lines[0].x1).not.toBeNaN();
        expect(lines[0].y1).not.toBeNaN();

        // Verify label text was set
        expect(labels[0].text).toContain('Price:');

        // Verify box coordinates
        expect(typeof boxes[0].left).toBe('number');
        expect(typeof boxes[0].top).toBe('number');
        expect(boxes[0].left).not.toBeNaN();
        expect(boxes[0].top).not.toBeNaN();
    });

    it('UDT with var and let drawing objects coexisting', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT var+let", overlay=true)
type MyObj
    line persistent_ln
    label persistent_lb

var MyObj container = MyObj.new(
    line.new(na, na, na, na, color=#ff0000),
    label.new(na, na, "", color=#0000ff)
)

container.persistent_ln.set_xy1(bar_index, high)
container.persistent_ln.set_xy2(bar_index, low)
container.persistent_lb.set_xy(bar_index, high)
container.persistent_lb.set_text(str.tostring(bar_index))
plot(close)
`;
        const { plots } = await pineTS.run(code);

        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        const labels = plots['__labels__'].data[0].value.filter((l: any) => !l._deleted);

        // var UDT: exactly 1 line, 1 label
        expect(lines.length).toBe(1);
        expect(labels.length).toBe(1);
        expect(lines[0].color).toBe('#ff0000');
    });

    it('UDT with mixed drawing and scalar fields', async () => {
        const pineTS = makePineTS();

        const code = `
//@version=6
indicator("UDT Mixed Fields", overlay=true)
type PriceLevel
    float price = 0.0
    string name = ""
    line ln

var PriceLevel level = PriceLevel.new(100.0, "support", line.new(0, 100, 10, 100, color=#00ff00))

level.ln.set_xy1(0, level.price)
level.ln.set_xy2(bar_index, level.price)
plot(level.price, "level_price")
`;
        const { plots } = await pineTS.run(code);

        expect(plots['__lines__']).toBeDefined();
        const lines = plots['__lines__'].data[0].value.filter((l: any) => !l._deleted);
        expect(lines.length).toBe(1);
        expect(lines[0].color).toBe('#00ff00');

        // Scalar field should be accessible
        expect(plots['level_price']).toBeDefined();
        expect(plots['level_price'].data[0].value).toBe(100);
    });
});
