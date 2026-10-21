// SPDX-License-Identifier: AGPL-3.0-only
// Drawing setters / getters called with named arguments (`line.set_extend(id=l, extend=extend.none)`)
// behave like the positional call. The expected values follow from the Pine reference: a named
// argument binds to the parameter of that name.

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

describe('drawing functions with named arguments', () => {
    it('line setters', async () => {
        const { lines } = await run(`//@version=6
indicator("named_line", overlay = true)
if barstate.islast
    l = line.new(0, 1, 5, 2, extend = extend.right)
    line.set_extend(id = l, extend = extend.none)
    line.set_x2(id = l, x = 7)
    line.set_xy1(l, y = 3, x = 2)
    line.set_width(width = 4, id = l)
    log.info("line=" + str.tostring(line.get_x1(id = l)) + " " + str.tostring(line.get_y1(l)) + " " + str.tostring(line.get_x2(l)))
`);
        expect(lines).toContain('line=2 3 7');
    });

    it('extend and width reach the line (function and method syntax)', async () => {
        const { plots } = await run(`//@version=6
indicator("named_line_props", overlay = true)
if barstate.islast
    a = line.new(0, 1, 5, 2, extend = extend.right)
    line.set_extend(id = a, extend = extend.none)
    line.set_width(id = a, width = 3)
    b = line.new(0, 1, 5, 2, extend = extend.right)
    b.set_extend(extend = extend.left)
`);
        const data = plots['__lines__'].data;
        const live = data[data.length - 1].value.filter((l: any) => !l._deleted);
        expect(live.map((l: any) => l.extend)).toEqual(['n', 'l']);
        expect(live[0].width).toBe(3);
    });

    it('box, label, linefill setters', async () => {
        const { lines } = await run(`//@version=6
indicator("named_other", overlay = true)
if barstate.islast
    b = box.new(0, 10, 5, 0)
    box.set_lefttop(id = b, left = 1, top = 9)
    box.set_right(id = b, right = 6)
    lb = label.new(0, 1, "a")
    label.set_text(id = lb, text = "b")
    label.set_xy(lb, y = 4, x = 3)
    l1 = line.new(0, 1, 5, 1)
    l2 = line.new(0, 2, 5, 2)
    f = linefill.new(l1, l2, color.red)
    linefill.set_color(id = f, color = color.blue)
    log.info("box=" + str.tostring(box.get_left(b)) + " " + str.tostring(box.get_top(b)) + " " + str.tostring(box.get_right(id = b)))
    log.info("label=" + label.get_text(id = lb) + " " + str.tostring(label.get_x(lb)) + " " + str.tostring(label.get_y(lb)))
    log.info("fill=" + str.tostring(linefill.get_line2(id = f).get_y1()))
`);
        expect(lines).toContain('box=1 9 6');
        expect(lines).toContain('label=b 3 4');
        expect(lines).toContain('fill=2');
    });
});
