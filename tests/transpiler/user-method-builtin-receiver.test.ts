import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Regression guard: user-defined `method`s declared on BUILT-IN receiver types
// (table, array<float>, ...) must dispatch when called with dot syntax, exactly
// like they do on TradingView. Three failure shapes are covered:
//   1. method name collides with a built-in member (`cell`) — user method must win
//   2. method name is not a built-in member (`divider`) — must not be a silent no-op
//   3. expression-position call (`eq.to_sparkline()`) — must not evaluate to undefined
describe('user method dispatch on built-in receivers (dot syntax)', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('dot-calls of user methods on a table / array receiver dispatch to the user method', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
method cell(table tb, int col, int row, string txt, color txt_color=#DBDBDB, string align=text.align_center) =>
    table.cell(tb, col, row, txt, text_color=txt_color, text_size=10, text_halign=align, bgcolor=na)
method divider(table tb, int row, int last_col) =>
    table.merge_cells(tb, 0, row, last_col, row)
    table.cell(tb, 0, row, "DIVIDER", text_color=#2E2E2E)
method to_sparkline(array<float> arr) =>
    arr.size() > 1 ? "SPARK" : "N/A"
var table tb = table.new(position.top_right, 3, 3)
var array<float> eq = array.from(1.0, 2.0, 3.0)
if barstate.islast
    tb.cell(0, 0, "Metric", #808080, text.align_left)
    tb.divider(1, 2)
    tb.cell(0, 2, eq.to_sparkline(), #089981, text.align_right)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        const tables = plots['__tables__']?.data?.at(-1)?.value;
        expect(tables).toBeDefined();
        expect(tables.length).toBe(1);
        const tbl = tables[0];

        // Shape 1: name collision with built-in `table.cell` — the user method
        // must run: color goes to text_color (NOT width), align to text_halign
        // (NOT height), text_size forwarded.
        const c00 = tbl.cells[0][0];
        expect(c00).toBeTruthy();
        expect(c00.text).toBe('Metric');
        expect(c00.text_color).toBe('#808080');
        expect(c00.text_halign).toBe('left');
        expect(c00.text_size).toBe(10);
        expect(c00.width).not.toBe('#808080');
        expect(c00.height).not.toBe('left');

        // Shape 2: `divider` is not a built-in table member — must not be a no-op.
        expect(tbl.merges).toEqual([{ startCol: 0, startRow: 1, endCol: 2, endRow: 1 }]);
        const c10 = tbl.cells[1][0];
        expect(c10).toBeTruthy();
        expect(c10.text).toBe('DIVIDER');
        expect(c10.text_color).toBe('#2E2E2E');

        // Shape 3: expression-position dot-call on an array receiver.
        const c20 = tbl.cells[2][0];
        expect(c20).toBeTruthy();
        expect(c20.text).toBe('SPARK');
        expect(c20.text_color).toBe('#089981');
        expect(c20.text_halign).toBe('right');
    });

    it('user method dot-call on a built-in receiver inside a function body (param receiver)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
method divider(table tb, int row) =>
    table.cell(tb, 0, row, "DIV")
f_draw(table t) =>
    t.divider(0)
var table tb = table.new(position.top_right, 1, 1)
if barstate.islast
    f_draw(tb)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        const tbl = plots['__tables__']?.data?.at(-1)?.value?.[0];
        expect(tbl).toBeDefined();
        expect(tbl.cells[0][0]?.text).toBe('DIV');
    });

    it('user method dot-call on a UDT field chain receiver (array<float> field)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
type Stats
    array<float> is_equity
method to_sparkline(array<float> arr) =>
    arr.size() > 1 ? "SPARK" : "N/A"
var Stats bs = Stats.new(is_equity = array.from(1.0, 2.0, 3.0))
var table tb = table.new(position.top_right, 1, 1)
if barstate.islast
    tb.cell(0, 0, bs.is_equity.to_sparkline())
plot(close)
`;
        const { plots } = await pineTS.run(code);
        const tbl = plots['__tables__']?.data?.at(-1)?.value?.[0];
        expect(tbl).toBeDefined();
        expect(tbl.cells[0][0]?.text).toBe('SPARK');
    });

    it('does not hijack built-in calls when no user method matches', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
var table tb = table.new(position.top_right, 1, 1)
var array<float> a = array.from(1.0, 2.0)
if barstate.islast
    tb.cell(0, 0, "plain", text_color=#112233)
    a.push(3.0)
plot(a.size())
`;
        const { plots } = await pineTS.run(code);
        const tbl = plots['__tables__']?.data?.at(-1)?.value?.[0];
        expect(tbl.cells[0][0]?.text).toBe('plain');
        expect(tbl.cells[0][0]?.text_color).toBe('#112233');
        const sizes = plots['plot(a.size())'] ?? plots[Object.keys(plots).find((k) => k !== '__tables__') as string];
        expect(sizes.data.at(-1)?.value).toBe(3);
    });

    it('UDT method named like a built-in still dispatches on UDT receivers, built-in receivers keep built-in', async () => {
        const pineTS = makePineTS();
        // `method delete(MyBox b)` must not hijack `ln.delete()` on a line —
        // this is the case the original receiver guard protected.
        const code = `
//@version=6
indicator("m")
type MyBox
    float v
method delete(MyBox b) =>
    b.v := -1
var MyBox mb = MyBox.new(5)
var line ln = line.new(na, na, na, na)
if barstate.islast
    mb.delete()
    ln.delete()
plot(mb.v)
`;
        const { plots } = await pineTS.run(code);
        const plotKey = Object.keys(plots).find((k) => k !== '__tables__') as string;
        expect(plots[plotKey].data.at(-1)?.value).toBe(-1);
    });
});
