// SPDX-License-Identifier: AGPL-3.0-only

/**
 * UDT field history: `b.c[N]` — the value of the field N bars ago.
 *
 * Pine's semantics are the same whatever the declaration, but the runtime stores the history in two
 * different places and the difference is not cosmetic:
 *
 *  * a per-bar instance (`bar b = bar.new(…)`) stores a NEW object every bar, so the instance's own
 *    history answers the read: `$.get(b, N).field`;
 *  * a `var` instance keeps ONE object and mutates it, so `$.get(b, N)` returns the same object every
 *    bar and `.field` reads TODAY's value — a silent wrong number, not a crash. The history belongs
 *    to the FIELD and has to be accumulated (`$.param`).
 *
 * The crash half of this file (`ReferenceError: n is not defined`) is pinned too: the branches used
 * to wrap the index without transforming it, so `b.i[rpLN]` emitted `$.get(<base>, rpLN)`.
 *
 * Expected values come from the Pine source, not from the engine: with `b.c := close` every bar,
 * `b.c[N]` MUST equal `close[N]` — the control series is computed independently by the ordinary
 * series path.
 */
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

const RANGE = { from: new Date('2024-01-01').getTime(), to: new Date('2024-01-03').getTime() };

function engine() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, RANGE.from, RANGE.to);
}

function values(plots: any, key: string): number[] {
    const node = plots[key];
    return ((node && node.data) || []).map((row: any) => (row && typeof row === 'object' ? row.value : row));
}

function round(list: number[]): any[] {
    return list.map((v) => (v == null || Number.isNaN(v) ? 'na' : Number(v).toFixed(6)));
}

describe('UDT field history', () => {
    it('a `var` instance answers b.c[N] with the field N bars ago, not today', async () => {
        const { plots } = await engine().run(`
//@version=6
indicator("var-field-history")
type bar
    int i
    float c
var bar b = bar.new(0, 0.0)
b.c := close
plot(b.c, "now")
plot(b.c[1], "prev")
plot(b.c[3], "prev3")
plot(close[1], "ctrl1")
plot(close[3], "ctrl3")
`);
        expect(round(values(plots, 'prev'))).toEqual(round(values(plots, 'ctrl1')));
        expect(round(values(plots, 'prev3'))).toEqual(round(values(plots, 'ctrl3')));
        // and the read is NOT the current value (the bug produced exactly that)
        expect(round(values(plots, 'prev'))).not.toEqual(round(values(plots, 'now')));
    });

    it('a field-history read with a VARIABLE index runs (used to be `n is not defined`)', async () => {
        const { plots } = await engine().run(`
//@version=6
indicator("var-field-history-variable-index")
type bar
    int i
    float c
var bar b = bar.new(0, 0.0)
b.c := close
n = input.int(2, minval = 1)
plot(b.c[n], "lagged")
plot(close[2], "ctrl")
`);
        expect(round(values(plots, 'lagged'))).toEqual(round(values(plots, 'ctrl')));
    });

    it('a REASSIGNED index still resolves (money-flow-profile\'s `b.i[rpLN]` shape)', async () => {
        const { plots } = await engine().run(`
//@version=6
indicator("var-field-history-reassigned-index")
type bar
    int i
    float c
var bar b = bar.new(0, 0.0)
b.c := close
n = input.int(3, minval = 1)
n := n > 2 ? 2 : n
plot(b.c[n], "lagged")
plot(close[2], "ctrl")
`);
        expect(round(values(plots, 'lagged'))).toEqual(round(values(plots, 'ctrl')));
    });

    it('a PER-BAR instance still reads the instance from N bars ago (regression guard)', async () => {
        const { plots } = await engine().run(`
//@version=6
indicator("perbar-field-history")
type bar
    int i
    float c
bar b = bar.new(bar_index, close)
plot(b.c, "now")
plot(b.c[1], "prev")
plot(b.c[2], "prev2")
plot(close[1], "ctrl1")
plot(close[2], "ctrl2")
`);
        // Compare TAILS: the direct-chain form does not record the leading `na` the way the ordinary
        // series path does (a one-entry length artefact), so the aligned comparison is from the end —
        // the same convention `scripts/measure-appears.py` uses when a series starts a bar late.
        const tail = (list: number[], n = 40) => round(list).slice(-n);
        expect(tail(values(plots, 'prev'))).toEqual(tail(values(plots, 'ctrl1')));
        expect(tail(values(plots, 'prev2'))).toEqual(tail(values(plots, 'ctrl2')));
        expect(tail(values(plots, 'prev'))).not.toEqual(tail(values(plots, 'now')));
    });
});
