import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';
import { Provider } from '@pinets/marketData/Provider.class';
import { transpile } from '../../../src/transpiler';

/**
 * Pine's `display.*` constants are a SET type: `+` is the union of two displays and `-`
 * removes one display's surfaces from another (TradingView reference manual, `plot()` —
 * "display: ... You can use display.all - display.price_scale"). PineTS represents a
 * display as the concatenation of its member names in canonical order (`'all'` and
 * `'none'` for the full and empty sets), which is what `+` on the string enum already
 * produced. Native JS `-` on those strings yields NaN — the transpiler must route both
 * operators to set operations.
 */

const CASES: Array<[pine: string, expected: string]> = [
    // The four boundary cases with `none` (the empty set) and `all`.
    ['display.all - display.none', 'all'],
    ['display.all + display.none', 'all'],
    ['display.none + display.all', 'all'],
    ['display.none - display.all', 'none'],
    // Everyday usage.
    ['display.all - display.price_scale', 'panedata_windowstatus_line'],
    ['display.pane + display.data_window', 'panedata_window'],
    ['display.data_window + display.pane', 'panedata_window'], // canonical order, not source order
    ['display.all - display.pane - display.price_scale', 'data_windowstatus_line'],
    ['display.pane + display.status_line + display.price_scale + display.data_window', 'all'],
    ['display.pane + display.pane', 'pane'], // a union, not a concatenation
    ['display.pane - display.pane', 'none'],
    ['display.pane - display.data_window', 'pane'], // removing an absent surface is a no-op
    ['display.all + display.pane', 'all'],
    ['display.none + display.none', 'none'],
];

async function displayOf(expr: string, extraLines = ''): Promise<unknown> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const ctx: any = await pineTS.run(`//@version=5
indicator("display arithmetic")
${extraLines}
plot(close, "P", display = ${expr})
`);
    return ctx.plots?.P?.options?.display;
}

describe('plot(display = …) — `+` / `-` on display constants are set operations', () => {
    for (const [expr, expected] of CASES) {
        it(`${expr} → ${expected}`, async () => {
            expect(await displayOf(expr)).toBe(expected);
        });
    }

    it('a display held in a variable combines like a literal member', async () => {
        expect(await displayOf('d', 'd = display.all - display.status_line')).toBe('panedata_windowprice_scale');
        expect(await displayOf('d - display.pane', 'd = display.all - display.status_line')).toBe('data_windowprice_scale');
        expect(await displayOf('display.pane + d', 'd = display.data_window')).toBe('panedata_window');
    });

    it('a plain member and the default are untouched', async () => {
        expect(await displayOf('display.status_line')).toBe('status_line');
        expect(await displayOf('display.none')).toBe('none');
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
        const ctx: any = await pineTS.run(`//@version=5
indicator("default display")
plot(close, "P")
`);
        expect(ctx.plots?.P?.options?.display).toBeUndefined();
    });

    it('other display arguments (hline, plotshape, input) route through the same operators', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
        const ctx: any = await pineTS.run(`//@version=5
indicator("other displays")
len = input.int(14, "Len", display = display.all - display.status_line)
hline(50, "Mid", display = display.all - display.price_scale)
plotshape(true, "S", display = display.none + display.pane)
`);
        const byTitle = (title: string): any => Object.values<any>(ctx.plots ?? {}).find((p) => p?.title === title);
        expect(byTitle('Mid')?.options?.display).toBe('panedata_windowstatus_line');
        expect(byTitle('S')?.options?.display).toBe('pane');
    });

    it('numeric arithmetic elsewhere is left alone by the rewrite', () => {
        const code = transpile(
            `//@version=5
indicator("arith")
x = close - open + 1
plot(x, "X", display = display.all - display.none)
`,
            { debug: false }
        ).toString();
        // Only the display expression is routed to the set operators; `close - open + 1` keeps its native operators.
        expect(code).toMatch(/display\.__minus\(display\.all, display\.none\)/);
        expect(code).not.toMatch(/__minus\([^)]*close/);
        expect(code).not.toMatch(/__union\([^)]*close/);
    });
});
