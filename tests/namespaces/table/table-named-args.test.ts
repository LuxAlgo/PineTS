// Regression tests for named-arg detection in table.* functions.
//
// Bug: TableHelper decided whether the trailing transpiler-emitted named-args
// object was "named args" by checking for a hard-coded subset of parameter
// keys. Any call whose named args were ALL outside that subset (force_overlay,
// frame_width, border_width for table.new; end_row for table.clear /
// table.merge_cells) fell through to positional handling: the object landed in
// the next positional slot and every value it carried was silently dropped.
//
// Expected values come from TradingView: e.g.
//   table.new(position.bottom_right, 1, 1, force_overlay=true)
// renders the table on the main chart pane (force_overlay applied, bgcolor default).

import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

function newPineTS() {
    return new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-03-01').getTime());
}

describe('table.new named-arg detection', () => {
    it('applies force_overlay=true as the only named argument (case A)', async () => {
        const { result } = await newPineTS().run((context) => {
            var t = table.new('bottom_right', 1, 1, { force_overlay: true });
            var t_force_overlay = t.force_overlay;
            var t_bgcolor = t.bgcolor;
            return { t_force_overlay, t_bgcolor };
        });

        expect(result.t_force_overlay[0]).toBe(true);
        expect(result.t_bgcolor[0]).toBe('');
    });

    it('applies frame_width and force_overlay named together (case B)', async () => {
        const { result } = await newPineTS().run((context) => {
            var t = table.new('bottom_right', 1, 1, { frame_width: 2, force_overlay: true });
            var t_frame_width = t.frame_width;
            var t_force_overlay = t.force_overlay;
            var t_bgcolor = t.bgcolor;
            return { t_frame_width, t_force_overlay, t_bgcolor };
        });

        expect(result.t_frame_width[0]).toBe(2);
        expect(result.t_force_overlay[0]).toBe(true);
        expect(result.t_bgcolor[0]).toBe('');
    });

    it('applies frame_width=2 as the only named argument (case C)', async () => {
        const { result } = await newPineTS().run((context) => {
            var t = table.new('bottom_right', 1, 1, { frame_width: 2 });
            var t_frame_width = t.frame_width;
            var t_bgcolor = t.bgcolor;
            return { t_frame_width, t_bgcolor };
        });

        expect(result.t_frame_width[0]).toBe(2);
        expect(result.t_bgcolor[0]).toBe('');
    });

    it('applies border_width=2 as the only named argument (case D)', async () => {
        const { result } = await newPineTS().run((context) => {
            var t = table.new('bottom_right', 1, 1, { border_width: 2 });
            var t_border_width = t.border_width;
            var t_bgcolor = t.bgcolor;
            return { t_border_width, t_bgcolor };
        });

        expect(result.t_border_width[0]).toBe(2);
        expect(result.t_bgcolor[0]).toBe('');
    });

    it('recognizes every named parameter of table.new when named alone', async () => {
        const { result } = await newPineTS().run((context) => {
            var t1 = table.new('bottom_right', 1, 1, { bgcolor: '#ff0000' });
            var t2 = table.new('bottom_right', 1, 1, { frame_color: '#00ff00' });
            var t3 = table.new('bottom_right', 1, 1, { frame_width: 2 });
            var t4 = table.new('bottom_right', 1, 1, { border_color: '#0000ff' });
            var t5 = table.new('bottom_right', 1, 1, { border_width: 3 });
            var t6 = table.new('bottom_right', 1, 1, { force_overlay: true });
            var v1 = t1.bgcolor;
            var v2 = t2.frame_color;
            var v3 = t3.frame_width;
            var v4 = t4.border_color;
            var v5 = t5.border_width;
            var v6 = t6.force_overlay;
            // bgcolor must stay at its default in every call that does not name it
            var b2 = t2.bgcolor;
            var b3 = t3.bgcolor;
            var b4 = t4.bgcolor;
            var b5 = t5.bgcolor;
            var b6 = t6.bgcolor;
            return { v1, v2, v3, v4, v5, v6, b2, b3, b4, b5, b6 };
        });

        expect(result.v1[0]).toBe('#ff0000');
        expect(result.v2[0]).toBe('#00ff00');
        expect(result.v3[0]).toBe(2);
        expect(result.v4[0]).toBe('#0000ff');
        expect(result.v5[0]).toBe(3);
        expect(result.v6[0]).toBe(true);
        expect(result.b2[0]).toBe('');
        expect(result.b3[0]).toBe('');
        expect(result.b4[0]).toBe('');
        expect(result.b5[0]).toBe('');
        expect(result.b6[0]).toBe('');
    });

    it('applies force_overlay=true end-to-end from native Pine Script source', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("repro", overlay=false)
plot(close)
var table t = table.new(position.bottom_right, 1, 1, force_overlay=true)
if barstate.islast
    table.cell(t, 0, 0, "X")
`);

        expect(plots['__tables__']).toBeDefined();
        const tables = plots['__tables__'].data[0].value;
        expect(tables.length).toBe(1);
        expect(tables[0].force_overlay).toBe(true);
        expect(tables[0].bgcolor).toBe('');
        expect(tables[0].position).toBe('bottom_right');
    });
});

describe('table.clear / table.merge_cells named-arg detection', () => {
    it('table.clear honors end_row as the only named argument', async () => {
        const { result } = await newPineTS().run((context) => {
            var t = table.new('top_right', 1, 3);
            table.cell(t, 0, 0, 'A');
            table.cell(t, 0, 1, 'B');
            table.cell(t, 0, 2, 'C');
            table.clear(t, 0, 0, 0, { end_row: 1 });
            var c0 = t.getCell(0, 0);
            var c1 = t.getCell(0, 1);
            var c2 = t.getCell(0, 2);
            return { c0, c1, c2 };
        });

        // Rows 0 and 1 cleared, row 2 untouched
        expect(result.c0[0]).toBeFalsy();
        expect(result.c1[0]).toBeFalsy();
        expect(result.c2[0].text).toBe('C');
    });

    it('table.merge_cells honors end_row as the only named argument', async () => {
        const { result } = await newPineTS().run((context) => {
            var t = table.new('top_right', 2, 2);
            table.merge_cells(t, 0, 0, 1, { end_row: 1 });
            // Writing to a merged cell must redirect to the merge origin (0,0)
            table.cell(t, 1, 1, 'M');
            var origin = t.getCell(0, 0);
            return { origin };
        });

        expect(result.origin[0]).toBeTruthy();
        expect(result.origin[0].text).toBe('M');
    });
});
