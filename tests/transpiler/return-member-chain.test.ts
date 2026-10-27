import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { transpile } from '../../src/transpiler';

// A function whose implicit return is a field chain (`t.lastHigh.c`) must lower the
// chain's root identifier, exactly like a single hop (`t.trend`) does. Left raw, a
// parameter is the series wrapper (first hop reads undefined → TypeError) and a
// local/global is an unscoped name ("Undeclared identifier").

const TYPES = `
type Inner
    float v

type Bar
    int x
    float c
    Inner inner

type ZZ
    int trend
    Bar lastHigh
`;

const mk = () => new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2019-04-01').getTime(), new Date('2019-05-01').getTime());

const values = (plots: any, title: string) => plots[title].data.map((p: any) => p.value);

describe('return of a field chain from a user function', () => {
    it('reads a nested field of a UDT parameter (issue repro)', async () => {
        const { plots } = await mk().run(`//@version=6
indicator("param chain", overlay = false)

type Bar
    int x
    float c

type ZZ
    int trend
    Bar lastHigh

step(ZZ t) => t.lastHigh.c

var ZZ s = ZZ.new(1, Bar.new(1, 2.0))
plot(step(s), "out")
`);
        const out = values(plots, 'out');
        expect(out.length).toBeGreaterThan(0);
        expect(out.every((v: number) => v === 2)).toBe(true);
    });

    it('lowers the parameter root in the generated code', () => {
        const code = transpile(`//@version=6
indicator("codegen")
${TYPES}
step(ZZ t) => t.lastHigh.c
var ZZ s = ZZ.new(1, Bar.new(1, 2.0, Inner.new(3.0)))
plot(step(s))
`).toString();
        expect(code).toContain('return $.precision($.get(t, 0).lastHigh.c)');
        expect(code).not.toMatch(/\$\.precision\(t\.lastHigh/);
    });

    it('tracks per-bar field values across every chain form', async () => {
        const { plots } = await mk().run(`//@version=6
indicator("chain forms")
${TYPES}
typed(ZZ t) => t.lastHigh.c
untyped(t) => t.lastHigh.c
deep(ZZ t) => t.lastHigh.inner.v
intf(ZZ t) => t.lastHigh.x
method hc(ZZ this) => this.lastHigh.c
viaLocal(ZZ t) =>
    z = t
    z.lastHigh.c
block(ZZ t) =>
    k = t.trend * 2
    t.lastHigh.x + k

var ZZ s = ZZ.new(1, Bar.new(0, 0.0, Inner.new(0.0)))
s.lastHigh := Bar.new(bar_index, close, Inner.new(open))

glob() => s.lastHigh.c

plot(close, "close")
plot(open, "open")
plot(bar_index, "bi")
plot(typed(s), "typed")
plot(untyped(s), "untyped")
plot(deep(s), "deep")
plot(intf(s), "intf")
plot(s.hc(), "method")
plot(viaLocal(s), "viaLocal")
plot(block(s), "block")
plot(glob(), "glob")
`);
        const close = values(plots, 'close');
        const open = values(plots, 'open');
        const bi = values(plots, 'bi');
        expect(close.length).toBeGreaterThan(10);

        for (const t of ['typed', 'untyped', 'method', 'viaLocal', 'glob']) {
            expect(values(plots, t), t).toEqual(close);
        }
        expect(values(plots, 'deep')).toEqual(open);
        expect(values(plots, 'intf')).toEqual(bi);
        expect(values(plots, 'block')).toEqual(bi.map((x: number) => x + 2));
    });

    it('keeps calls with different arguments independent', async () => {
        const { plots } = await mk().run(`//@version=6
indicator("two objects")
${TYPES}
step(ZZ t) => t.lastHigh.c
var ZZ a = ZZ.new(1, Bar.new(0, 0.0, Inner.new(0.0)))
var ZZ b = ZZ.new(1, Bar.new(0, 0.0, Inner.new(0.0)))
a.lastHigh := Bar.new(bar_index, high, Inner.new(0.0))
b.lastHigh := Bar.new(bar_index, low, Inner.new(0.0))
plot(high, "high")
plot(low, "low")
plot(step(a), "a")
plot(step(b), "b")
`);
        expect(values(plots, 'a')).toEqual(values(plots, 'high'));
        expect(values(plots, 'b')).toEqual(values(plots, 'low'));
    });

    it('leaves built-in namespace chains untouched', () => {
        const code = transpile(`//@version=6
indicator("ns chain")
f() => strategy.direction.long
plot(close)
`).toString();
        expect(code).not.toMatch(/\$\.get\(strategy/);
    });
});
