import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Regression guard: a function parameter WITH a default value, referenced as a
// value inside a named-argument object literal, must resolve to the JS
// parameter — not to a (non-existent) `$.let.<name>` global context slot.
describe('defaulted params referenced in named-argument object literals', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('defaulted param forwarded via named arg keeps its value (default used)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
f_reg_def(table tb, color c = #00ff00) =>
    table.cell(tb, 0, 0, "A", text_color=c)
method m_nodef(table tb, color c) =>
    table.cell(tb, 1, 0, "B", text_color=c)
var table tb = table.new(position.top_right, 2, 1)
if barstate.islast
    f_reg_def(tb)
    m_nodef(tb, #123456)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        const tbl = plots['__tables__']?.data?.at(-1)?.value?.[0];
        expect(tbl).toBeDefined();

        // Cell A: defaulted param `c` forwarded as `text_color=c` — must be the default.
        expect(tbl.cells[0][0]?.text).toBe('A');
        expect(tbl.cells[0][0]?.text_color).toBe('#00ff00');

        // Cell B: non-defaulted param (control) — already worked, must keep working.
        expect(tbl.cells[0][1]?.text).toBe('B');
        expect(tbl.cells[0][1]?.text_color).toBe('#123456');
    });

    it('defaulted param forwarded via named arg keeps its value (explicit argument)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
f_reg_def(table tb, color c = #00ff00, string al = text.align_center) =>
    table.cell(tb, 0, 0, "A", text_color=c, text_halign=al)
var table tb = table.new(position.top_right, 1, 1)
if barstate.islast
    f_reg_def(tb, #ff8800, text.align_right)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        const tbl = plots['__tables__']?.data?.at(-1)?.value?.[0];
        expect(tbl.cells[0][0]?.text_color).toBe('#ff8800');
        expect(tbl.cells[0][0]?.text_halign).toBe('right');
    });

    it('defaulted param still works in arithmetic and positional args (control)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("m")
f_calc(float v = 21) =>
    math.max(v * 2, 0)
plot(f_calc())
`;
        const { plots } = await pineTS.run(code);
        const plotKey = Object.keys(plots)[0];
        expect(plots[plotKey].data.at(-1)?.value).toBe(42);
    });
});
