// SPDX-License-Identifier: AGPL-3.0-only
// color(na), color.new transparency, nz on bools, comparisons of na literals, method dispatch by array
// element type, and the history of a function parameter when the function is not called on every bar.
// Every expected value was read on TradingView (BINANCE:BTCUSDC 1W / BINANCE:BTCUSDT 1h) from the same
// expressions.

import { describe, expect, it } from 'vitest';
import { PineTS, Provider } from 'index';

async function run(code: string) {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-09-02').getTime());
    const { plots } = await pineTS.run(code);
    const series = (name: string) => plots[name].data.map((d: any) => d.value);
    const last = (name: string) => series(name)[series(name).length - 1];
    return { series, last };
}

describe('color(na) written in the source', () => {
    it('is na in v6', async () => {
        const { last } = await run(`//@version=6
indicator("t")
c = array.new_color(3, color.green)
c.set(1, color(na))
plot(na(color(na)) ? 1 : 0, "na cast")
plot(color.r(nz(color(na), color.rgb(10, 20, 30))), "nz cast")
plot(c.indexof(color(na)), "search")
`);
        expect(last('na cast')).toBe(1);
        expect(last('nz cast')).toBe(10);
        expect(last('search')).toBe(-1);
    });

    it('is transparent black in v5: not na for na(), nz() and fixnan(), while a color variable holding na is', async () => {
        const { last, series } = await run(`//@version=5
indicator("t")
color cna = na
plot(na(color(na)) ? 1 : 0, "na cast")
plot(color.r(color(na)), "r cast")
plot(color.t(color(na)), "t cast")
plot(color.r(nz(color(na), color.rgb(10, 20, 30))), "nz cast")
plot(na(cna) ? 1 : 0, "na var")
plot(color.r(nz(cna, color.rgb(10, 20, 30))), "nz var")
plot(na(color(cna)) ? 1 : 0, "na cast of var")
holes = bar_index % 2 == 0 ? color.rgb(200, 100, 50) : color(na)
plot(color.r(fixnan(holes)), "fixnan cast holes")
plot(bar_index, "bi")
`);
        expect(last('na cast')).toBe(0);
        expect(last('r cast')).toBe(0);
        expect(last('t cast')).toBe(100);
        expect(last('nz cast')).toBe(0);
        expect(last('na var')).toBe(1);
        expect(last('nz var')).toBe(10);
        expect(last('na cast of var')).toBe(1);
        const bi = series('bi');
        series('fixnan cast holes').forEach((r: number, i: number) => expect(r).toBe(bi[i] % 2 === 0 ? 200 : 0));
    });
});

describe('color.new transparency', () => {
    it('truncates a literal and keeps a series fractional (read back through the alpha byte)', async () => {
        const { last } = await run(`//@version=5
indicator("t")
float z = close - close
plot(color.t(color.new(color.red, 33.7)), "lit 33.7")
plot(color.t(color.new(color.red, 50.4)), "lit 50.4")
plot(color.t(color.new(color.red, z + 33.7)), "ser 33.7")
plot(color.t(color.new(color.red, z + 50.4)), "ser 50.4")
plot(color.t(color.new(color.navy, z + 0.5)), "ser 0.5")
plot(color.t(color.new(color.navy, z + 1.5)), "ser 1.5")
plot(color.t(color.new(color.navy, z + 6.5)), "ser 6.5")
plot(color.t(color.new(color.navy, z + 99.6)), "ser 99.6")
`);
        expect(last('lit 33.7')).toBe(33);
        expect(last('lit 50.4')).toBe(50);
        expect(last('ser 33.7')).toBe(34);
        expect(last('ser 50.4')).toBe(51);
        expect(last('ser 0.5')).toBe(0);
        expect(last('ser 1.5')).toBe(2);
        expect(last('ser 6.5')).toBe(7);
        expect(last('ser 99.6')).toBe(100);
    });
});

describe('na literals and nz on bools', () => {
    it('folds na != na to true and na == na to false; a series na compared with itself is falsy', async () => {
        const { last } = await run(`//@version=5
indicator("t")
float fna = na
plot((na != na) ? 1 : 0, "lit neq")
plot((na == na) ? 1 : 0, "lit eq")
plot((fna != fna) ? 1 : 0, "ser neq")
plot((fna == fna) ? 1 : 0, "ser eq")
`);
        expect(last('lit neq')).toBe(1);
        expect(last('lit eq')).toBe(0);
        expect(last('ser neq')).toBe(0);
        expect(last('ser eq')).toBe(0);
    });

    it('nz of a bool na is false (a bool), not 0', async () => {
        const { last } = await run(`//@version=5
indicator("t")
bool bna = na
plot(str.tostring(nz(bna)) == "false" ? 1 : 0, "nz bool")
plot(nz(bna, true) ? 1 : 0, "nz bool true")
`);
        expect(last('nz bool')).toBe(1);
        expect(last('nz bool true')).toBe(1);
    });
});

describe('user methods dispatched by array element type', () => {
    it('picks the array<int> overload for an int array and the array<float> one for a float array', async () => {
        const { last } = await run(`//@version=5
indicator("t")
method head(array<float> a) =>
    array.size(a) > 0 ? array.get(a, 0) : na
method head(array<int> a) =>
    (array.size(a) > 0 ? array.get(a, 0) : 0) + 1000
arrF = array.from(1.5, 2.5)
arrI = array.from(2, 3)
plot(arrF.head(), "float")
plot(arrI.head(), "int")
`);
        expect(last('float')).toBe(1.5);
        expect(last('int')).toBe(1002);
    });
});

describe('history of a parameter in a function not called on every bar', () => {
    it('s[1] is the value of the previous call', async () => {
        const { series } = await run(`//@version=5
indicator("t")
prevArg(float s) =>
    s[1]
float condPrev = na
if bar_index % 2 == 0
    condPrev := prevArg(close)
plot(condPrev, "cond")
plot(prevArg(close), "every bar")
plot(close, "close")
plot(bar_index, "bi")
`);
        const close = series('close');
        const bi = series('bi');
        const cond = series('cond');
        const every = series('every bar');
        for (let i = 4; i < bi.length; i++) {
            expect(every[i]).toBe(close[i - 1]);
            if (bi[i] % 2 === 0) expect(cond[i]).toBe(close[i - 2]);
            else expect(Number.isNaN(cond[i])).toBe(true);
        }
        // first call: no previous call
        expect(Number.isNaN(cond[0])).toBe(true);
    });
});
