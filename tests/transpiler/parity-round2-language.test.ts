// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Language semantics pinned against TradingView: for-loop bounds, a loop initializing a `var`,
 * v5 `and` / `or` operands, user function overloads, and a `switch` on a built-in series.
 * Every expected value is TradingView's output for the same script.
 */
import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const mk = (end = '2019-09-01') => new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date(end).getTime());
const last = (plots: any, name: string) => plots[name].data[plots[name].data.length - 1].value;
const onDay = (plots: any, name: string, day: string) =>
    plots[name].data.find((p: any) => new Date(p.time).toISOString().slice(0, 10) === day)?.value;

const LOOPS = `
var _bcnt = array.new_int(0)
h3() =>
    array.push(_bcnt, 1)
    3
int _limit = 5
int v1 = 0
for i = 0 to _limit
    v1 += 1
    _limit := 1
int _lim2 = 1
int v2 = 0
for i = 0 to _lim2
    v2 += 1
    _lim2 := 10
int _st = 1
int v3 = 0
for i = 0 to 6 by _st
    v3 += 1
    _st := 3
array.clear(_bcnt)
int v4 = 0
for i = 0 to h3()
    v4 += 1
int v5 = array.size(_bcnt)
int down = 0
int _dl = 0
for i = 5 to _dl
    down += 1
    _dl := 3
var _vp = array.new_int(0)
var float vq = for i = 0 to 4
    array.push(_vp, i)
    i * 10.0
var _wp = array.new_int(0)
int wcv = 0
var float wq = while wcv < 3
    wcv += 1
    array.push(_wp, wcv)
    wcv * 10.0
var _sp = array.new_int(0)
side(int t) =>
    array.push(_sp, t)
    true
array.clear(_sp)
bool cF = close < 0
bool r1 = cF and side(1)
bool r2 = (not cF) or side(2)
plot(v1, "v1")
plot(v2, "v2")
plot(v3, "v3")
plot(v4, "v4")
plot(v5, "v5")
plot(down, "down")
plot(vq, "vq")
plot(array.size(_vp), "vqn")
plot(wq, "wq")
plot(array.size(_wp), "wqn")
plot(array.size(_sp), "lz")
`;

describe('for loop bounds, var loop initializers and v5 and/or (TradingView)', () => {
    it('v5: the to bound and the step are read once at loop entry; and / or evaluate both operands', async () => {
        const { plots } = await mk().run(`//@version=5\nindicator("loops")\n${LOOPS}`);
        const v = (n: string) => last(plots, n);
        // TV: v1=6 v2=2 v3=7 v4=4 v5=1 down=6 lz=2
        expect([v('v1'), v('v2'), v('v3'), v('v4'), v('v5'), v('down'), v('lz')]).toEqual([6, 2, 7, 4, 1, 6, 2]);
    });

    it('v6: the to bound is re-read every iteration, the step is not; and / or short-circuit', async () => {
        const { plots } = await mk().run(`//@version=6\nindicator("loops")\n${LOOPS}`);
        const v = (n: string) => last(plots, n);
        // TV: v1=2 v2=11 v3=7 v4=4 v5=6 down=3 lz=0
        expect([v('v1'), v('v2'), v('v3'), v('v4'), v('v5'), v('down'), v('lz')]).toEqual([2, 11, 7, 4, 6, 3, 0]);
    });

    it('a loop initializing a var runs once, for one iteration (v5 and v6)', async () => {
        for (const version of [5, 6]) {
            const { plots } = await mk().run(`//@version=${version}\nindicator("loops")\n${LOOPS}`);
            const v = (n: string) => last(plots, n);
            // TV: vq=0 vqn=1 wq=10 wqn=1
            expect([v('vq'), v('vqn'), v('wq'), v('wqn')]).toEqual([0, 1, 10, 1]);
        }
    });

    it('v5: a user function on the right of and runs on every bar, so its ta.* state advances', async () => {
        const { plots } = await mk().run(`//@version=5
indicator("eager")
_fe = array.new_float(0)
f() =>
    e = ta.ema(close, 5)
    array.push(_fe, e)
    e > 0
cond = bar_index % 2 == 0
rAnd = cond and f()
n = array.size(_fe)
plot(n, "n")
plot(n > 0 and array.get(_fe, 0) == ta.ema(close, 5) ? 1 : 0, "same")
`);
        // TV: f() runs once on every bar and its ema equals the unconditional one
        for (const p of plots['n'].data.slice(5)) expect(p.value).toBe(1);
        for (const p of plots['same'].data.slice(5)) expect(p.value).toBe(1);
    });
});

describe('user function overloads (TradingView)', () => {
    it('resolves by argument count and type, an exact type before an int promoted to float', async () => {
        const { plots } = await mk().run(`//@version=5
indicator("ovl")
f(float x) => x * 2.0
f(string s) => str.length(s)
f(bool b) => b ? 100.0 : -100.0
g(float a) => a + 1.0
g(float a, float b) => a * b
d(int i) => i + 1000
d(float x) => x * 2.0
plot(f(close), "v1")
plot(f("hello"), "v2")
plot(f(close > open), "v3")
plot(f(3), "v4")
plot(g(2.0), "v5")
plot(g(2.0, 3.0), "v6")
plot(d(3), "w1")
plot(d(3.0), "w2")
plot(close, "close")
plot(close > open ? 100 : -100, "dir")
`);
        const at = (n: string) => onDay(plots, n, '2019-06-03');
        // TV, 2019-06-03: 15276.58 | 5 | f(bool) | 6 | 3 | 6 | 1003 | 6
        expect(at('v1')).toBeCloseTo(15276.58, 6);
        expect(at('v1')).toBeCloseTo(at('close') * 2, 6);
        expect(at('v2')).toBe(5);
        expect(at('v3')).toBe(at('dir'));
        expect([at('v4'), at('v5'), at('v6'), at('w1'), at('w2')]).toEqual([6, 3, 6, 1003, 6]);
    });

    it('named arguments bind inside the overload the argument types choose', async () => {
        const { plots } = await mk().run(`//@version=5
indicator("ovl named")
h(int val) => val + 1000
h(float x) => x * 2.0
q(float a) => a + 1.0
q(float a, float b) => a * b
q2(float a, float b) => a - b
r(float u) => u * 2.0
r(string u) => str.length(u)
plot(h(val=3), "v1")
plot(h(x=3), "v2")
plot(q(a=4.0), "v3")
plot(q(b=3.0, a=4.0), "v4")
plot(q2(b=2.0, a=10.0), "v5")
plot(r(u="abcd"), "v6")
plot(r(u=close) - close * 2, "v7")
`);
        const at = (n: string) => onDay(plots, n, '2019-06-03');
        // TV: 1003 | 1003 | 5 | 12 | 8 | 4 | close * 2
        expect([at('v1'), at('v2'), at('v3'), at('v4'), at('v5'), at('v6'), at('v7')]).toEqual([1003, 1003, 5, 12, 8, 4, 0]);
    });
});

describe('switch on a built-in series (TradingView)', () => {
    it('reads bar_index at the current bar, so its cases match', async () => {
        const { plots } = await mk('2019-02-20').run(`//@version=5
indicator("sw")
var float sOut = na
var int sCnt = 0
switch bar_index % 5
    3 =>
        var float sSnap = close
        sCnt += 1
        sOut := sSnap
    =>
        sOut := sOut
plot(sOut, "sOut")
plot(sCnt, "sCnt")
`);
        // TV: the case runs on bars 3, 8, 13, ... (2018-12-31, 2019-02-04) and its var keeps bar 3's close
        expect(onDay(plots, 'sOut', '2018-12-24')).toBeNaN();
        expect(onDay(plots, 'sOut', '2018-12-31')).toBeCloseTo(4039.13, 6);
        expect(onDay(plots, 'sCnt', '2018-12-31')).toBe(1);
        expect(onDay(plots, 'sCnt', '2019-01-28')).toBe(1);
        expect(onDay(plots, 'sOut', '2019-02-04')).toBeCloseTo(4039.13, 6);
        expect(onDay(plots, 'sCnt', '2019-02-04')).toBe(2);
    });
});
