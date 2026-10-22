// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Named arguments in a user method called with method syntax: `obj.m(a = x)`.
 * They bind to the method's parameters after the receiver, as in a
 * function-syntax call `m(obj, a = x)`. They used to reach the method as one
 * positional object.
 *
 * A parameter a named-argument call skips takes its default value, in
 * functions and methods alike. It used to read as na.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

const run = async (code: string) =>
    new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime()).run(code);
const last = (ctx: any, title: string) => ctx.plots[title].data.at(-1).value;

describe('named arguments of user methods called with method syntax', () => {
    it('bind by parameter name, after the receiver', async () => {
        const ctx = await run(`//@version=6
indicator("method named args")
method enc(map<string, bool> m, bool a, bool b, bool c) =>
    (a ? 4 : 0) + (b ? 2 : 0) + (c ? 1 : 0)
var trig = map.new<string, bool>()
plot(trig.enc(a = false, b = true, c = true), "all named")
plot(trig.enc(false, c = true, b = false), "mixed")
plot(enc(trig, a = true, c = true, b = false), "function syntax")
`);
        expect(last(ctx, 'all named')).toBe(3);
        expect(last(ctx, 'mixed')).toBe(1);
        expect(last(ctx, 'function syntax')).toBe(5);
    });

    it('leave skipped parameters to their defaults', async () => {
        const ctx = await run(`//@version=6
indicator("method named defaults")
type acc
    float base = 10
method total(acc self, float x = 1, float y = 2, float z = 3) =>
    self.base + x * 100 + y * 10 + z
a = acc.new()
plot(a.total(z = 7), "z only")
plot(a.total(y = 5, x = 0), "x and y")
`);
        expect(last(ctx, 'z only')).toBe(10 + 100 + 20 + 7);
        expect(last(ctx, 'x and y')).toBe(10 + 0 + 50 + 3);
    });

    it('skipped parameters of functions take their defaults', async () => {
        const ctx = await run(`//@version=6
indicator("function named defaults")
f(float base, float x = 1, float y = 2, float z = 3) => base + x * 100 + y * 10 + z
g(float a = 0, float src = high, string tag = na, float b = 0) => (src - high) + str.length(tag) + a + b
plot(f(10, z = 7), "z only")
plot(g(b = 5), "builtin and na string defaults")
`);
        expect(last(ctx, 'z only')).toBe(10 + 100 + 20 + 7);
        expect(last(ctx, 'builtin and na string defaults')).toBe(5);
    });

    it('keep named arguments of built-in methods sharing the call shape', async () => {
        const ctx = await run(`//@version=6
indicator("builtin named", overlay = true)
method describe(string s, int n = 1) => str.length(s) * n
lbl = label.new(bar_index, close, text = "abc")
plot(str.length(lbl.get_text()), "label text")
plot("abcd".describe(n = 3), "user method")
`);
        expect(last(ctx, 'label text')).toBe(3);
        expect(last(ctx, 'user method')).toBe(12);
    });
});
