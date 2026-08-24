// Regression guard: user identifiers named after constant/enum namespaces.
//
// TradingView allows a script to declare a variable whose name collides with
// a constant namespace (position, font, order, currency, dayofweek,
// adjustment, barmerge) while still using the namespace's members
// (e.g. `position.top_right`) elsewhere in the same script.
//
// PineTS handles this via the pineToJS codegen rename pass: the user variable
// is renamed with a `_$N` suffix while member-expression bases keep referring
// to the namespace. Before the fix, these names were missing from
// NAMESPACE_COLLISION_NAMES, so the declaration hijacked the identifier and
// namespace member access threw `ReferenceError: <name> is not defined`.
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

function newPineTS() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());
}

function lastValue(plots: any, title: string) {
    const data = plots[title]?.data;
    expect(data, `plot "${title}" missing`).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    return data[data.length - 1].value;
}

describe('identifier-namespace collision (TV-allowed shadowing)', () => {
    it('position: user variable coexists with table.new(position.top_right, ...)', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("position collision repro", overlay = true)
var table t = table.new(position.top_right, 1, 1)
position = 1
plot(position, "p")
`);
        expect(lastValue(plots, 'p')).toBe(1);
    });

    it('font: user variable coexists with font.family_monospace', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("font collision")
var table t = table.new(position.top_left, 1, 1)
table.cell(t, 0, 0, "x", text_font_family = font.family_monospace)
font = 2
plot(font, "p")
`);
        expect(lastValue(plots, 'p')).toBe(2);
    });

    it('order: user variable coexists with array.sort(..., order.descending)', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("order collision")
a = array.from(3.0, 1.0, 2.0)
array.sort(a, order.descending)
order = array.get(a, 0)
plot(order, "p")
`);
        // descending sort puts the max (3.0) first
        expect(lastValue(plots, 'p')).toBe(3);
    });

    it('currency: user variable coexists with currency.USD', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("currency collision")
currency = 4
plot(currency.USD == "USD" ? currency : -1, "p")
`);
        expect(lastValue(plots, 'p')).toBe(4);
    });

    it('dayofweek: user variable coexists with dayofweek.monday constant', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("dayofweek collision")
dayofweek = dayofweek.monday + 1
plot(dayofweek, "p")
`);
        // dayofweek.monday == 2 on TradingView
        expect(lastValue(plots, 'p')).toBe(3);
    });

    it('adjustment: user variable coexists with adjustment.splits', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("adjustment collision")
string adj = adjustment.splits
adjustment = 5
plot(adjustment, "p")
`);
        expect(lastValue(plots, 'p')).toBe(5);
    });

    it('barmerge: user variable coexists with barmerge.gaps_off', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("barmerge collision")
string g = barmerge.gaps_off
barmerge = 6
plot(barmerge, "p")
`);
        expect(lastValue(plots, 'p')).toBe(6);
    });

    it('does not affect scripts that only READ these namespaces (no user declaration)', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("no collision")
var table t = table.new(position.bottom_right, 1, 1)
plot(dayofweek.friday, "p")
`);
        // dayofweek.friday == 6 on TradingView
        expect(lastValue(plots, 'p')).toBe(6);
    });

    it('dual-use dayofweek built-in variable still works when not shadowed', async () => {
        const { plots } = await newPineTS().run(`
//@version=6
indicator("dayofweek builtin")
plot(dayofweek, "p")
`);
        const v = lastValue(plots, 'p');
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(7);
    });
});
