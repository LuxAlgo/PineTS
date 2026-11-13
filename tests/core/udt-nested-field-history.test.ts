// SPDX-License-Identifier: AGPL-3.0-only

/**
 * History on a nested UDT field path (`o.inner.px[1]`) and on a field read through an alias of a
 * nested object (`keepAl = r.inner`, `keepAl.px[1]`). Expected values are TradingView's output for
 * the same script on BTCUSDC 1W (the Mock weekly bars).
 */
import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

const SCRIPT = `//@version=5
indicator("udt nested history")
type Inner
    float px = close
type Outer
    Inner inner

var Outer o = Outer.new(Inner.new(0.0))
o.inner.px := close
v1 = o.inner.px[1] == close[1] ? 1 : 0
v2 = o.inner.px[2] == close[2] ? 1 : 0

f = Outer.new(Inner.new())
v3 = f.inner.px[1] == close[1] ? 1 : 0

var Outer r = Outer.new(Inner.new(0.0))
r.inner := Inner.new(high)
v4 = r.inner.px[1]
v5 = r.inner.px[1] == high[1] ? 1 : 0

keepAl = r.inner
v6 = keepAl.px[1]
v7 = keepAl.px[1] == r.inner.px[1] ? 1 : 0

v8 = o.inner.px[1]

plot(v1, "v1")
plot(v2, "v2")
plot(v3, "v3")
plot(v4, "v4")
plot(v5, "v5")
plot(v6, "v6")
plot(v7, "v7")
plot(v8, "v8")
plot(na(f.inner.px[1]) ? 1 : 0, "fna")
plot(na(keepAl.px[1]) ? 1 : 0, "aliasna")
plot(f.inner.px[1], "fprev")
`;

describe('UDT nested field history (TradingView)', () => {
    it('reads the previous bar through a nested field path and through an alias', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-07-01').getTime());
        const { plots } = await pineTS.run(SCRIPT);
        const at = (name: string, day: string) => plots[name].data.find((p: any) => new Date(p.time).toISOString().slice(0, 10) === day)?.value;
        const row = (day: string) => ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'].map((n) => at(n, day));

        // TV: 1 | 1 | 1 | 9088 | 1 | 9088 | 1 | 8743.6 on 2019-06-03, and the same pattern a week later
        expect(row('2019-06-03')).toEqual([1, 1, 1, 9088, 1, 9088, 1, 8743.6]);
        expect(row('2019-06-10')).toEqual([1, 1, 1, 8752.45, 1, 8752.45, 1, 7638.29]);

        // TV: na on the first bar; on the second, the first bar's close (3,199.27) and high (3,312.32)
        expect(at('fna', '2018-12-10')).toBe(1);
        expect(at('aliasna', '2018-12-10')).toBe(1);
        expect(at('fprev', '2018-12-17')).toBeCloseTo(3199.27, 6);
        expect(at('v6', '2018-12-17')).toBeCloseTo(3312.32, 6);
    });
});
