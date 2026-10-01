// SPDX-License-Identifier: AGPL-3.0-only
// Drawing objects as on TradingView. Every expected line is what TradingView logs for the same
// script (BINANCE:BTCUSDT 1h, Pine v6).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

afterEach(() => vi.restoreAllMocks());

async function run(source: string): Promise<{ lines: string[]; plots: any }> {
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...a: any[]) => lines.push(a.join(' ').replace(/^\[[^\]]+\]\s/, '')));
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 5));
    const { plots } = await pineTS.run(source);
    return { lines: [...new Set(lines)], plots };
}

describe("line.all, label.all, box.all, ... are Pine arrays (3 / D8)", () => {
    it("all_arrays", async () => {
        const { lines } = await run(`//@version=6
indicator("all_arrays", overlay = true, max_lines_count = 20, max_labels_count = 20, max_boxes_count = 20)
if bar_index % 10 == 0 and bar_index > last_bar_index - 60
    line.new(bar_index, high, bar_index + 1, low)
    label.new(bar_index, high, "x" + str.tostring(bar_index % 7))
    box.new(bar_index, high, bar_index + 1, low)
if barstate.islast
    a = line.all
    log.info("sizes=" + str.tostring(line.all.size()) + " " + str.tostring(array.size(label.all)) + " " + str.tostring(box.all.size()) + " " + str.tostring(table.all.size()) + " " + str.tostring(linefill.all.size()) + " " + str.tostring(polyline.all.size()))
    log.info("first=" + str.tostring(bar_index - line.all.first().get_x1()) + " " + str.tostring(bar_index - array.get(label.all, 0).get_x()) + " " + str.tostring(bar_index - box.all.last().get_left()))
    n = 0
    for lb in label.all
        n += str.length(lb.get_text())
    log.info("loop=" + str.tostring(n))
    a.clear()
    log.info("copy=" + str.tostring(a.size()) + " " + str.tostring(line.all.size()))
    for i = line.all.size() - 1 to 3
        line.all.get(i).delete()
    log.info("after_delete=" + str.tostring(line.all.size()))
plot(close)
`);
        const expected = [
          "sizes=6 6 6 0 0 0",
          "loop=12",
          "copy=0 6"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("getters of na and deleted drawings (5 / D7)", () => {
    it("na_getters", async () => {
        const { lines } = await run(`//@version=6
indicator("na_getters", overlay = true)
type T
    box b
    line l
    label lb
    bool br
t = T.new()
box bb = na
line ln = na
label lab = na
if barstate.islast
    log.info("udt_box=" + str.tostring(t.b.get_left()) + " " + str.tostring(t.b.get_top()))
    log.info("udt_line=" + str.tostring(t.l.get_x1()) + " " + str.tostring(t.l.get_y2()) + " " + str.tostring(t.l.get_price(5)))
    log.info("udt_label=" + str.tostring(t.lb.get_x()) + " [" + t.lb.get_text() + "]")
    log.info("fn_box=" + str.tostring(box.get_left(bb)) + " " + str.tostring(bb.get_bottom()))
    log.info("fn_line=" + str.tostring(line.get_x1(ln)) + " " + str.tostring(ln.get_y1()))
    log.info("fn_label=" + str.tostring(label.get_y(lab)) + " [" + label.get_text(lab) + "]")
    log.info("br=" + str.tostring(t.br) + " " + str.tostring(na(t.b)))
plot(close)
`);
        const expected = [
          "udt_box=NaN NaN",
          "udt_line=NaN NaN NaN",
          "udt_label=NaN []",
          "fn_box=NaN NaN",
          "fn_line=NaN NaN",
          "fn_label=NaN []",
          "br=false true"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("na_setter_udt", async () => {
        const { lines } = await run(`//@version=6
indicator("na_setter_udt", overlay = true)
type T
    box b
t = T.new()
if barstate.islast
    t.b.set_right(bar_index)
    log.info("after=ok")
plot(close)
`);
        const expected = [
          "after=ok"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("na_setter_fn", async () => {
        const { lines } = await run(`//@version=6
indicator("na_setter_fn", overlay = true)
line ln = na
if barstate.islast
    line.set_x2(ln, bar_index)
    log.info("after=ok")
plot(close)
`);
        const expected = [
          "after=ok"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("deleted_getters", async () => {
        const { lines } = await run(`//@version=6
indicator("deleted_getters", overlay = true)
if barstate.islast
    l = line.new(bar_index - 3, low, bar_index - 1, high)
    line.delete(l)
    log.info("line=" + str.tostring(line.get_x1(l)) + " " + str.tostring(l.get_y1()) + " " + str.tostring(l.get_x2()) + " " + str.tostring(line.get_y2(l)) + " " + str.tostring(l.get_price(bar_index)))
    b = box.new(bar_index - 3, high, bar_index - 1, low)
    b.delete()
    log.info("box=" + str.tostring(box.get_left(b)) + " " + str.tostring(b.get_top()) + " " + str.tostring(b.get_right()) + " " + str.tostring(box.get_bottom(b)))
    lb = label.new(bar_index, high, "txt")
    label.delete(lb)
    log.info("label=" + str.tostring(label.get_x(lb)) + " " + str.tostring(lb.get_y()) + " [" + lb.get_text() + "]")
    l2 = line.new(bar_index - 3, low, bar_index - 1, high)
    l2.set_x1(bar_index - 5)
    l2.delete()
    l2.set_x1(bar_index - 9)
    log.info("set_after_delete=" + str.tostring(na(l2.get_x1())))
    c = l2.copy()
    log.info("copy_deleted=" + str.tostring(c.get_x1() == bar_index - 5) + " " + str.tostring(line.all.size()))
plot(close)
`);
        const expected = [
          "line=NaN NaN NaN NaN NaN",
          "box=NaN NaN NaN NaN",
          "label=NaN NaN []",
          "set_after_delete=true",
          "copy_deleted=true 1"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("na_deleted", async () => {
        const { lines } = await run(`//@version=6
indicator("na_deleted", overlay = true)
if barstate.islast
    l = line.new(bar_index - 3, low, bar_index - 1, high)
    lb = label.new(bar_index, high, "t")
    b = box.new(bar_index - 3, high, bar_index - 1, low)
    t = table.new(position.top_right, 1, 1)
    l1 = line.new(bar_index - 3, low, bar_index - 1, low)
    l2 = line.new(bar_index - 3, high, bar_index - 1, high)
    f = linefill.new(l1, l2, color.red)
    log.info("before=" + str.tostring(na(l)) + " " + str.tostring(na(lb)) + " " + str.tostring(na(b)) + " " + str.tostring(na(t)) + " " + str.tostring(na(f)))
    line.delete(l)
    label.delete(lb)
    box.delete(b)
    table.delete(t)
    linefill.delete(f)
    log.info("after=" + str.tostring(na(l)) + " " + str.tostring(na(lb)) + " " + str.tostring(na(b)) + " " + str.tostring(na(t)) + " " + str.tostring(na(f)))
    log.info("lf_lines=" + str.tostring(na(f.get_line1())) + " " + str.tostring(na(linefill.get_line2(f))) + " " + str.tostring(f.get_line1().get_y1() == low))
    l3 = line.new(bar_index - 3, low, bar_index - 1, low)
    l4 = line.new(bar_index - 3, high, bar_index - 1, high)
    f2 = linefill.new(l3, l4, color.red)
    l4.delete()
    log.info("cascade=" + str.tostring(na(f2)) + " " + str.tostring(na(f2.get_line1())) + " " + str.tostring(na(f2.get_line2())))
    c = l.copy()
    log.info("copy_of_deleted=" + str.tostring(na(c)))
plot(close)
`);
        const expected = [
          "before=false false false false false",
          "after=true true true true true",
          "lf_lines=false false true",
          "cascade=true false true",
          "copy_of_deleted=false"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("chart.point coordinates follow the drawing xloc, label.set_xloc(id, x, xloc) (D3 / D4)", () => {
    it("xloc_points", async () => {
        const { lines } = await run(`//@version=6
indicator("xloc_points", overlay = true)
if barstate.islast
    a = chart.point.now(high)
    b = chart.point.from_time(time - 5 * 3600000, low)
    l = line.new(b, a, xloc = xloc.bar_time)
    log.info("line_bt=" + str.tostring(l.get_x1() - time) + " " + str.tostring(l.get_x2() - time))
    lb = label.new(a, "L", xloc = xloc.bar_time)
    log.info("label_bt=" + str.tostring(lb.get_x() - time))
    bx = box.new(b, a, xloc = xloc.bar_time)
    log.info("box_bt=" + str.tostring(bx.get_left() - time) + " " + str.tostring(bx.get_right() - time))
    l.set_second_point(chart.point.now(low))
    log.info("set_second=" + str.tostring(l.get_x2() - time) + " " + str.tostring(l.get_x1() - time))
    l2 = line.new(bar_index - 3, low, bar_index - 1, high)
    l2.set_first_point(chart.point.now(low))
    log.info("set_first_bi=" + str.tostring(l2.get_x1() - bar_index))
    bx.set_top_left_point(chart.point.new(time - 7200000, bar_index - 2, high))
    log.info("box_set=" + str.tostring(bx.get_left() - time))
    lb.set_point(chart.point.new(time - 3600000, bar_index - 9, high))
    log.info("label_set=" + str.tostring(lb.get_x() - time))
    lb2 = label.new(bar_index - 1, high, "a")
    label.set_xloc(lb2, time - 7200000, xloc.bar_time)
    log.info("set_xloc=" + str.tostring(label.get_x(lb2) - time))
    lb2.set_xloc(bar_index - 4, xloc.bar_index)
    log.info("set_xloc2=" + str.tostring(lb2.get_x() - bar_index))
    li = line.new(chart.point.now(high), chart.point.from_index(bar_index - 2, low))
    log.info("line_bi=" + str.tostring(li.get_x1() - bar_index) + " " + str.tostring(li.get_x2() - bar_index))
plot(close)
`);
        const expected = [
          "line_bt=-18000000 0",
          "label_bt=0",
          "box_bt=-18000000 0",
          "set_second=0 -18000000",
          "set_first_bi=0",
          "box_set=-7200000",
          "label_set=-3600000",
          "set_xloc=-7200000",
          "set_xloc2=-4",
          "line_bi=0 -2"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("setpoint_fromtime", async () => {
        const { lines } = await run(`//@version=6
indicator("setpoint_fromtime", overlay = true)
if barstate.islast
    lb = label.new(bar_index, close, "t")
    label.set_point(lb, chart.point.from_time(time - 3600000, close))
    log.info("label_x=" + str.tostring(lb.get_x()) + " " + str.tostring(na(lb.get_x())))
    l = line.new(bar_index - 2, low, bar_index, high)
    l.set_first_point(chart.point.from_time(time - 7200000, low))
    log.info("line_x1=" + str.tostring(na(l.get_x1())) + " " + str.tostring(l.get_x2() - bar_index))
plot(close)
`);
        const expected = [
          "label_x=NaN true",
          "line_x1=true 0"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("line.delete deletes its linefills; linefills need two lines (D5 / D9)", () => {
    it("linefill_cascade", async () => {
        const { lines } = await run(`//@version=6
indicator("linefill_cascade", overlay = true, max_lines_count = 6)
if barstate.islast
    l1 = line.new(bar_index - 4, high, bar_index - 1, high)
    l2 = line.new(bar_index - 4, low, bar_index - 1, low)
    f = linefill.new(l1, l2, color.new(color.green, 80))
    log.info("before=" + str.tostring(linefill.all.size()))
    l1.delete()
    log.info("after_method_delete=" + str.tostring(linefill.all.size()) + " " + str.tostring(na(f.get_line1())))
    l3 = line.new(bar_index - 4, high, bar_index - 1, high)
    l4 = line.new(bar_index - 4, low, bar_index - 1, low)
    linefill.new(l3, l4, color.red)
    line.delete(l4)
    log.info("after_fn_delete=" + str.tostring(linefill.all.size()))
    linefill.new(na, na, color.red)
    l5 = line.new(bar_index - 4, high, bar_index - 1, high)
    linefill.new(l5, na, color.red)
    log.info("na_lines=" + str.tostring(linefill.all.size()))
    l6 = line.new(bar_index - 4, high, bar_index - 1, high)
    l7 = line.new(bar_index - 4, low, bar_index - 1, low)
    linefill.new(l6, l7, color.blue)
    for i = 0 to 7
        line.new(bar_index - i, high, bar_index, high)
    log.info("after_max=" + str.tostring(linefill.all.size()) + " " + str.tostring(line.all.size()))
plot(close)
`);
        const expected = [
          "before=1",
          "after_method_delete=0 true",
          "after_fn_delete=0",
          "na_lines=0"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("one table per position, overlapping merge_cells (D6 / 10)", () => {
    it("tables", async () => {
        const { lines } = await run(`//@version=6
indicator("tables", overlay = true)
var t1 = table.new(position.top_right, 1, 1)
t1.cell(0, 0, "first")
t = table.new(position.bottom_left, 2, 2)
t.cell(0, 0, "x")
if barstate.islast
    t2 = table.new(position.top_right, 1, 1)
    t2.cell(0, 0, "second")
    t3 = table.new(position.bottom_right, 1, 1)
    t3.set_position(position.top_center)
    log.info("all=" + str.tostring(table.all.size()))
    m = table.new(position.middle_center, 4, 4)
    m.merge_cells(0, 0, 1, 1)
    m.merge_cells(1, 1, 2, 2)
    m.merge_cells(0, 0, 3, 0)
    m.cell(1, 1, "a")
    m.cell(2, 2, "b")
    m.cell(3, 0, "c")
    log.info("merged=ok " + str.tostring(table.all.size()))
plot(close)
`);
        const expected = [
          "all=3",
          "merged=ok 4"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("table_move", async () => {
        const { lines } = await run(`//@version=6
indicator("table_move", overlay = true)
if barstate.islast
    a = table.new(position.top_right, 1, 1)
    b = table.new(position.top_left, 2, 1)
    b.set_position(position.top_right)
    log.info("move_into_occupied=" + str.tostring(table.all.size()))
    c = table.new(position.bottom_left, 3, 1)
    c.delete()
    log.info("after_delete=" + str.tostring(table.all.size()))
plot(close)
`);
        const expected = [
          "move_into_occupied=1"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});
