import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Every expected value below was produced by the same script on TradingView (Pine v6, BINANCE:BTCUSDT 1h).

async function labels(body: string, header = '', version = 6): Promise<Record<string, string>> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const src = `//@version=${version}
indicator("t", overlay=true, max_labels_count=500)
lbs(string k, string v) =>
    label.new(bar_index, close, k + "=" + v)
ji(array<int> a) => array.join(a, ",")
${header}
if barstate.islast
${body
    .trim()
    .split('\n')
    .map((l) => '    ' + l.trim().replace(/^\|/, '    '))
    .join('\n')}
plot(close)
`;
    const { plots } = await pineTS.run(src);
    const out: Record<string, string> = {};
    for (const l of plots['__labels__']?.data?.[0]?.value || []) {
        const i = l.text.indexOf('=');
        out[l.text.slice(0, i)] = l.text.slice(i + 1);
    }
    return out;
}

async function runError(body: string): Promise<string> {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    const src = `//@version=6
indicator("t")
a = array.from(1.0, 2.0, 3.0, 4.0, 5.0)
e = array.new_float(0)
v = 0.0
if bar_index > 5
${body
    .trim()
    .split('\n')
    .map((l) => '    ' + l.trim())
    .join('\n')}
plot(v + a.size())
`;
    try {
        await pineTS.run(src);
    } catch (err: any) {
        return err.message;
    }
    return 'no error';
}

describe('array.slice returns a view of the original array', () => {
    it('writes, pushes and removals go through to the original, also through a slice of a slice', async () => {
        const r = await labels(`
            a = array.from(10, 20, 30, 40, 50, 60)
            s = array.slice(a, 1, 5)
            t = array.slice(s, 1, 3)
            array.set(t, 0, 31)
            lbs("nested_set", ji(a) + "|" + ji(s))
            array.push(t, 77)
            lbs("nested_push", ji(a) + "|" + ji(s) + "|" + ji(t))
            a1 = array.from(1, 2, 3, 4)
            s1 = array.slice(a1, 2)
            array.set(s1, 1, 40)
            lbs("default_to", ji(a1) + "|" + ji(s1))
            a2 = array.from(1, 2, 3, 4, 5, 6)
            s2 = array.slice(a2, 1, 4)
            array.clear(s2)
            lbs("clear", ji(a2) + "|" + str.tostring(s2.size()))
            a3 = array.from(5, 4, 3, 2, 1)
            s3 = array.slice(a3, 1, 4)
            array.sort(s3)
            lbs("sort", ji(a3))
            array.reverse(s3)
            lbs("reverse", ji(a3))
        `);
        expect(r.nested_set).toBe('10,20,31,40,50,60|20,31,40,50');
        expect(r.nested_push).toBe('10,20,31,40,77,50,60|20,31,40,77,50|31,40,77');
        expect(r.default_to).toBe('1,2,3,40|3,40');
        expect(r.clear).toBe('1,5,6|0');
        expect(r.sort).toBe('5,2,3,4,1');
        expect(r.reverse).toBe('5,4,3,2,1');
    });

    it('remove / insert / unshift / shift / pop / fill / concat on a slice change the original; copy does not', async () => {
        const r = await labels(`
            a4 = array.from(1, 2, 3, 4, 5, 6)
            s4 = array.slice(a4, 1, 5)
            r1 = array.remove(s4, 1)
            lbs("remove", ji(a4) + "|" + ji(s4) + "|" + str.tostring(r1))
            array.insert(s4, 0, 90)
            lbs("insert", ji(a4) + "|" + ji(s4))
            array.unshift(s4, 91)
            lbs("unshift", ji(a4) + "|" + ji(s4))
            r2 = array.shift(s4)
            lbs("shift", ji(a4) + "|" + ji(s4) + "|" + str.tostring(r2))
            r3 = array.pop(s4)
            lbs("pop", ji(a4) + "|" + ji(s4) + "|" + str.tostring(r3))
            a5 = array.from(1, 2, 3, 4, 5)
            s5 = array.slice(a5, 1, 4)
            array.fill(s5, 0)
            lbs("fill", ji(a5))
            array.concat(s5, array.from(8, 9))
            lbs("concat", ji(a5) + "|" + ji(s5))
            c5 = array.copy(s5)
            array.set(c5, 0, 55)
            lbs("copy", ji(a5) + "|" + ji(c5))
        `);
        expect(r.remove).toBe('1,2,4,5,6|2,4,5|3');
        expect(r.insert).toBe('1,90,2,4,5,6|90,2,4,5');
        expect(r.unshift).toBe('1,91,90,2,4,5,6|91,90,2,4,5');
        expect(r.shift).toBe('1,90,2,4,5,6|90,2,4,5|91');
        expect(r.pop).toBe('1,90,2,4,6|90,2,4|5');
        expect(r.fill).toBe('1,0,0,0,5');
        expect(r.concat).toBe('1,0,0,0,8,9,5|0,0,0,8,9');
        expect(r.copy).toBe('1,0,0,0,8,9,5|55,0,0,8,9');
    });

    it('sees writes to the original, keeps its window when the original grows, and reads like an array', async () => {
        const r = await labels(`
            a7 = array.from(1, 2, 3, 4)
            s7 = array.slice(a7, 0, 2)
            array.set(a7, 1, 20)
            array.fill(a7, 7, 0, 1)
            lbs("parent_set", ji(s7))
            array.push(a7, 5)
            lbs("parent_push", str.tostring(s7.size()) + "," + str.tostring(s7.get(0)))
            a6 = array.from(1.0, 2.0, 3.0, 4.0, 5.0)
            s6 = array.slice(a6, 1, 4)
            n6 = 0.0
            for x in s6
            |n6 += x
            lbs("stats", str.tostring(array.sum(s6)) + "," + str.tostring(n6) + "," + str.tostring(s6))
        `);
        expect(r.parent_set).toBe('7,20');
        expect(r.parent_push).toBe('2,7');
        expect(r.stats).toBe('9,9,[2, 3, 4]');
    });
});

describe('array.sort / sort_indices', () => {
    it('sorts strings in ordinal order; descending reverses the ascending order, ties included', async () => {
        const r = await labels(`
            sa = array.from("b", "B", "a", "_", "A", "1", "ab", "Ab", "é", "")
            sa.sort()
            lbs("asc", array.join(sa, ","))
            sa.sort(order.descending)
            lbs("desc", array.join(sa, ","))
            lbs("idx_desc", ji(array.sort_indices(array.from("z", "m", "A", "m"), order.descending)))
            lbs("idx_asc", ji(array.sort_indices(array.from("z", "m", "A", "m"))))
            lbs("dup_asc", ji(array.sort_indices(array.from(2, 1, 2, 1, 2))))
            lbs("dup_desc", ji(array.sort_indices(array.from(2, 1, 2, 1, 2), order.descending)))
        `);
        expect(r.asc).toBe(',1,A,Ab,B,_,a,ab,b,é');
        expect(r.desc).toBe('é,b,ab,a,_,B,Ab,A,1,');
        expect(r.idx_desc).toBe('0,3,1,2');
        expect(r.idx_asc).toBe('2,1,3,0');
        expect(r.dup_asc).toBe('1,3,0,2,4');
        expect(r.dup_desc).toBe('4,2,0,3,1');
    });

    it('puts na floats last ascending and first descending', async () => {
        const r = await labels(`
            fa = array.from(3.0, na, 1.0, 2.0)
            fa.sort()
            lbs("asc", str.tostring(fa.get(0)) + "," + str.tostring(fa.get(1)) + "," + str.tostring(fa.get(2)) + "," + str.tostring(fa.get(3)))
            fa.sort(order.descending)
            lbs("desc", str.tostring(fa.get(0)) + "," + str.tostring(fa.get(1)) + "," + str.tostring(fa.get(2)) + "," + str.tostring(fa.get(3)))
            lbs("idx_asc", ji(array.sort_indices(array.from(3.0, na, 1.0, 2.0))))
            lbs("idx_desc", ji(array.sort_indices(array.from(3.0, na, 1.0, 2.0), order.descending)))
        `);
        expect(r.asc).toBe('1,2,3,NaN');
        expect(r.desc).toBe('NaN,3,2,1');
        expect(r.idx_asc).toBe('2,3,0,1');
        expect(r.idx_desc).toBe('1,0,3,2');
    });

    it('sorts and searches arrays of a user-defined type by sort_field', async () => {
        const header = `type P
    float x
    string name
    int k`;
        const r = await labels(
            `
            ps = array.new<P>()
            ps.push(P.new(3.0, "c", 2))
            ps.push(P.new(1.0, "a", 3))
            ps.push(P.new(2.0, "b", 1))
            ps.push(P.new(4.0, "B", 0))
            ps.sort()
            lbs("default", str.tostring(ps.get(0).x) + str.tostring(ps.get(1).x) + str.tostring(ps.get(2).x) + str.tostring(ps.get(3).x))
            ps.sort(order.descending, "name")
            lbs("name_desc", ps.get(0).name + ps.get(1).name + ps.get(2).name + ps.get(3).name)
            array.sort(ps, order.ascending, 2)
            lbs("k_idx", str.tostring(ps.get(0).k) + str.tostring(ps.get(1).k) + str.tostring(ps.get(2).k) + str.tostring(ps.get(3).k))
            lbs("indices_x", ji(ps.sort_indices(order.ascending, "x")))
            lbs("indices_default_desc", ji(array.sort_indices(ps, order.descending)))
            ps.sort(order.ascending, "x")
            lbs("bs", str.tostring(ps.binary_search(3.0, "x")) + "," + str.tostring(array.binary_search(ps, 2.0, 0)) + "," + str.tostring(ps.binary_search(9.0, "x")))
            lbs("bsl", str.tostring(ps.binary_search_leftmost(2.5, "x")) + "," + str.tostring(array.binary_search_leftmost(ps, 0.5)))
            lbs("bsr", str.tostring(ps.binary_search_rightmost(2.5, "x")) + "," + str.tostring(array.binary_search_rightmost(ps, 9.0, "x")))
            pn = array.new<P>()
            pn.push(P.new(na, "n", 5))
            pn.push(P.new(2.0, "t", 6))
            pn.push(P.new(1.0, "o", 7))
            pn.sort()
            lbs("na_field", pn.get(0).name + pn.get(1).name + pn.get(2).name)
        `,
            header
        );
        expect(r.default).toBe('1234');
        expect(r.name_desc).toBe('cbaB');
        expect(r.k_idx).toBe('0123');
        expect(r.indices_x).toBe('3,1,2,0');
        expect(r.indices_default_desc).toBe('0,2,1,3');
        expect(r.bs).toBe('2,1,-1');
        expect(r.bsl).toBe('1,0');
        expect(r.bsr).toBe('2,4');
        expect(r.na_field).toBe('otn');
    });
});

describe('array statistics with na elements', () => {
    it('median, max, min, mode and sum skip na; sum of no values is na', async () => {
        const r = await labels(`
            lbs("median", str.tostring(array.from(3.0, na, 1.0, 8.0, 5.0).median()) + "," + str.tostring(array.from(4.0, na, na, 1.0, 2.0, 9.0).median()) + "," + str.tostring(array.from(na, 2.0).median()) + "," + str.tostring(array.from(na, na).median()))
            lbs("max_min", str.tostring(array.from(na, 4.0, 2.0).max()) + "," + str.tostring(array.from(na, 4.0, 2.0).min()) + "," + str.tostring(array.from(4.0, 2.0, na).max()) + "," + str.tostring(array.from(na, na).max()))
            lbs("nth", str.tostring(array.from(na, 4.0, 2.0, 7.0).max(1)) + "," + str.tostring(array.from(na, 4.0, 2.0, 7.0).min(1)) + "," + str.tostring(array.from(na, 4.0, 2.0).max(2)) + "," + str.tostring(array.from(na, 4.0, 2.0).min(2)))
            lbs("mode", str.tostring(array.from(na, na, 1.0).mode()))
            lbs("sum", str.tostring(array.sum(array.new_float(0))) + "," + str.tostring(array.from(1.0, na, 2.0).sum()) + "," + str.tostring(array.from(na, na).sum()) + "," + str.tostring(array.sum(array.new_int(0))))
            lbs("range", str.tostring(array.from(1.0, na, 5.0).range()))
        `);
        expect(r.median).toBe('4,3,2,NaN');
        expect(r.max_min).toBe('4,2,4,NaN');
        expect(r.nth).toBe('4,4,2,4');
        expect(r.mode).toBe('1');
        expect(r.sum).toBe('NaN,3,NaN,NaN');
        expect(r.range).toBe('4');
    });

    it('percentile_linear_interpolation: exact positions over the whole array, interpolated positions na when na is held', async () => {
        const r = await labels(`
            a0 = array.from(3.0, 1.0, 8.0, 5.0)
            a1 = array.from(3.0, na, 1.0, 8.0, 5.0)
            a2 = array.from(4.0, na, na, 1.0, 2.0, 9.0)
            p1 = array.from(2.0, na, 4.0)
            s0 = ""
            s1 = ""
            s2 = ""
            for p in array.from(0.0, 10.0, 25.0, 40.0, 50.0, 62.5, 75.0, 90.0, 100.0)
            |s0 += str.tostring(a0.percentile_linear_interpolation(p)) + ","
            |s1 += str.tostring(a1.percentile_linear_interpolation(p)) + ","
            |s2 += str.tostring(a2.percentile_linear_interpolation(p)) + ","
            lbs("a0", s0)
            lbs("a1", s1)
            lbs("a2", s2)
            lbs("p1", str.tostring(p1.percentile_linear_interpolation(50.0 / 3.0)) + "," + str.tostring(p1.percentile_linear_interpolation(25)) + "," + str.tostring(p1.percentile_linear_interpolation(50)))
            lbs("na_pct", str.tostring(a0.percentile_linear_interpolation(na)))
        `);
        expect(r.a0).toBe('1,1,2,3.2,4,5,6.5,8,8,');
        expect(r.a1).toBe('1,1,NaN,NaN,5,NaN,NaN,NaN,NaN,');
        expect(r.a2).toBe('1,NaN,2,NaN,NaN,NaN,NaN,NaN,NaN,');
        expect(r.p1).toBe('2,NaN,4');
        expect(r.na_pct).toBe('NaN');
    });

    it('percentrank counts elements <= the reference over size - 1; binary_search_leftmost below the first element is 0', async () => {
        const r = await labels(`
            pr = array.from(2, 7, 2, 9, 4)
            prn = array.from(2.0, na, 5.0, 2.0)
            lbs("dup", str.tostring(pr.percentrank(0)) + "," + str.tostring(pr.percentrank(1)) + "," + str.tostring(pr.percentrank(3)) + "," + str.tostring(pr.percentrank(4)))
            lbs("na", str.tostring(prn.percentrank(0), "#.####") + "," + str.tostring(prn.percentrank(1)) + "," + str.tostring(prn.percentrank(2), "#.####"))
            bs = array.from(3, 5, 5, 9)
            s = ""
            for v in array.from(1, 3, 4, 5, 6, 9, 10)
            |s += str.tostring(bs.binary_search(v)) + "/" + str.tostring(bs.binary_search_leftmost(v)) + "/" + str.tostring(bs.binary_search_rightmost(v)) + ","
            lbs("bs", s)
            lbs("bs_empty", str.tostring(array.new_int(0).binary_search_leftmost(1)) + "," + str.tostring(array.new_int(0).binary_search_rightmost(1)))
            lbs("every", str.tostring(array.every(array.new_bool(0))) + "," + str.tostring(array.some(array.new_bool(0))) + "," + str.tostring(array.every(array.from(true, true))))
        `);
        expect(r.dup).toBe('25,75,100,50');
        expect(r.na).toBe('33.3333,NaN,66.6667');
        expect(r.bs).toBe('-1/0/0,0/0/0,-1/0/1,1/1/2,-1/2/3,3/3/3,-1/3/4,');
        expect(r.bs_empty).toBe('0,0');
        expect(r.every).toBe('false,false,true');
    });
});

describe('array element equality', () => {
    it('includes / indexof / lastindexof match numbers within 1e-10 and never match na', async () => {
        const r = await labels(`
            z = close * 0
            lbs("tol", str.tostring(array.from(z).indexof(z + 1e-10)) + "," + str.tostring(array.from(z).indexof(z + 1.0000001e-10)) + "," + str.tostring(array.from(z + 5.0).indexof(z + 5.0 + 1e-10)) + "," + str.tostring(array.from(z + 5.0).indexof(z + 5.0 + 9e-11)))
            y = z + 0.1 + 0.2
            lbs("sum", str.tostring(array.from(y).indexof(0.3)) + "," + str.tostring(array.from(0.3).includes(y)) + "," + str.tostring(array.from(0.3, 1.0).lastindexof(y)))
            lbs("na", str.tostring(array.from(1.0, na).indexof(na)) + "," + str.tostring(array.from(1.0, na).includes(na)) + "," + str.tostring(array.from(na, 1.0).lastindexof(na)))
            lbs("bs_exact", str.tostring(array.from(1.0, 2.0, 3.0).binary_search(2.0 + 1e-11)))
        `);
        expect(r.tol).toBe('0,-1,-1,0');
        expect(r.sum).toBe('0,true,0');
        expect(r.na).toBe('-1,false,-1');
        expect(r.bs_exact).toBe('-1');
    });

    it.each([
        [5, '1,true,1'],
        [6, '-1,false,-1'],
    ])('na in a search: never for numbers, the empty string for strings, na for colors up to v5 (v%i)', async (version, colorResult) => {
        const r = await labels(
            `
            f = array.from(1.0, na, 3.0)
            lbs("f", str.tostring(f.indexof(na)) + "," + str.tostring(f.includes(na)) + "," + str.tostring(f.lastindexof(na)))
            i = array.new_int(3, 1)
            i.set(1, na)
            lbs("i", str.tostring(i.indexof(na)) + "," + str.tostring(i.includes(na)))
            c = array.new_color(3, color.green)
            c.set(1, color(na))
            lbs("c", str.tostring(c.indexof(color(na))) + "," + str.tostring(c.includes(color(na))) + "," + str.tostring(c.lastindexof(color(na))))
            s = array.new_string(3, "x")
            s.set(1, na)
            lbs("s", str.tostring(s.indexof(na)) + "," + str.tostring(s.includes(na)) + "," + str.tostring(s.indexof("")))
            m = map.new<float, int>()
            m.put(na, 5)
            lbs("na_key", str.tostring(m.size()) + "," + str.tostring(m.get(na)) + "," + str.tostring(m.contains(na)))
        `,
            '',
            version
        );
        expect(r.f).toBe('-1,false,-1');
        expect(r.i).toBe('-1,false');
        expect(r.c).toBe(colorResult);
        expect(r.s).toBe('1,true,1');
        expect(r.na_key).toBe('1,5,true');
    });

    it('compares colors by value in arrays and map keys; float map keys stay exact', async () => {
        const r = await labels(`
            mc = map.new<color, int>()
            mc.put(color.red, 7)
            lbs("map_get", str.tostring(mc.get(color.new(color.red, 0))) + "," + str.tostring(mc.get(#F23645)) + "," + str.tostring(mc.get(color.rgb(242, 54, 69))) + "," + str.tostring(mc.get(color.new(color.red, 50))))
            mc.put(color.rgb(242, 54, 69, 0), 8)
            lbs("map_size", str.tostring(mc.size()) + "," + str.tostring(mc.contains(#F23645FF)))
            ca = array.from(color.red, color.blue)
            lbs("arr", str.tostring(ca.indexof(color.new(color.blue, 0))) + "," + str.tostring(ca.includes(#F23645)) + "," + str.tostring(ca.includes(color.new(color.red, 10))))
            y = close * 0 + 0.1 + 0.2
            m = map.new<float, int>()
            m.put(y, 1)
            m.put(0.3, 2)
            lbs("float_keys", str.tostring(m.size()) + "," + str.tostring(m.get(y)))
        `);
        expect(r.map_get).toBe('7,7,7,NaN');
        expect(r.map_size).toBe('1,true');
        expect(r.arr).toBe('1,true,false');
        expect(r.float_keys).toBe('2,1');
    });
});

describe('array defaults and large ints', () => {
    it('new_int and array.new<UDT> without an initial value hold na', async () => {
        const r = await labels(
            `
            lbs("int", str.tostring(na(array.new_int(2).get(0))) + "," + array.join(array.new_int(2), ",") + "," + array.join(array.new_int(2, 5), ","))
            ps = array.new<P>(2)
            cp = array.new<chart.point>(2)
            lbs("udt", str.tostring(na(ps.get(0))) + "," + str.tostring(na(cp.get(1))) + "," + str.tostring(ps.size()))
            lbs("bool", str.tostring(array.new_bool(2).get(0)))
        `,
            `type P
    float x`
        );
        expect(r.int).toBe('true,NaN,NaN,5,5');
        expect(r.udt).toBe('true,true,2');
        expect(r.bool).toBe('false');
    });

    it.each([
        [5, 'true,true'],
        [6, 'false,false'],
    ])('new_bool without an initial value holds na up to v5 and false from v6 (v%i)', async (version, expected) => {
        const r = await labels(
            `
            b = array.new_bool(2)
            lbs("bool", str.tostring(na(b.get(0))) + "," + str.tostring(na(array.new<bool>(1).get(0))))
        `,
            '',
            version
        );
        expect(r.bool).toBe(expected);
    });

    it('stdev and variance of one element: 0 biased, na unbiased', async () => {
        const r = await labels(`
            one = array.from(7.0)
            lbs("one", str.tostring(array.stdev(one)) + "," + str.tostring(array.stdev(one, false)) + "," + str.tostring(array.variance(one)) + "," + str.tostring(array.variance(one, false)))
        `);
        expect(r.one).toBe('0,NaN,0,NaN');
    });

    it('a large int keeps its value through push / get into another int array', async () => {
        const r = await labels(`
            x = 2136215970
            ai = array.new_int(0)
            ai.push(x)
            bi = array.new_int(0)
            bi.push(ai.get(0))
            lbs("big", str.tostring(bi.get(0) == x) + "," + str.tostring(bi.get(0) - x))
            af = array.new_float(0)
            af.push(2136215970.25)
            lbs("big_float", str.tostring(af.get(0) - 2136215970, "#.##########"))
        `);
        expect(r.big).toBe('true,0');
        expect(r.big_float).toBe('0.25');
    });
});

describe('array runtime errors', () => {
    it.each([
        ['v := array.first(e)', 'Cannot call `first()` if array is empty.'],
        ['v := array.last(e)', 'Cannot call `last()` if array is empty.'],
        ['v := array.pop(e)', 'Cannot call `pop()` if array is empty.'],
        ['v := array.shift(e)', 'Cannot call `shift()` if array is empty.'],
        ['v := array.slice(a, -3, -1).size()', 'Index -3 is out of bounds, array size is 5.'],
        ['v := array.slice(a, 2, 9).size()', 'Index 9 is out of bounds, array size is 5.'],
        ['v := array.slice(a, 5).size()', 'Index 5 is out of bounds, array size is 5.'],
        ['v := array.slice(a, 2, -1).size()', 'Index -1 is out of bounds, array size is 5.'],
        ['v := array.slice(e, 0, 0).size()', 'Index 0 is out of bounds, array size is 0.'],
        ['v := array.slice(a, 3, 2).size()', "Index 'from' should be less than index 'to'."],
        ['array.fill(a, 0.0, -2)', 'Index -2 is out of bounds, array size is 5.'],
        ['array.fill(a, 0.0, 1, 9)', 'Index 9 is out of bounds, array size is 5.'],
        ['array.fill(a, 0.0, 5, 5)', 'Index 5 is out of bounds, array size is 5.'],
        ['array.fill(a, 0.0, 0, -1)', 'Index -1 is out of bounds, array size is 5.'],
        ['array.fill(e, 1.0)\nv := e.size()', 'Index 0 is out of bounds, array size is 0.'],
        ['v := array.max(a, 5)', 'Index 5 is out of bounds, array size is 5.'],
        ['v := array.min(a, 5)', 'Index 5 is out of bounds, array size is 5.'],
        ['v := array.max(a, -1)', 'Index -1 is out of bounds, array size is 5.'],
        ['v := array.percentrank(a, 5)', 'Index 5 is out of bounds, array size is 5.'],
        ['v := array.percentrank(a, -1)', 'Index -1 is out of bounds, array size is 5.'],
        [
            'v := array.percentile_linear_interpolation(e, 110)',
            "Invalid value of the 'percentage' argument (110) in the 'array.percentile_linear_interpolation' function. It must be in the range [0..100].",
        ],
        [
            'v := array.percentile_nearest_rank(a, -10)',
            "Invalid value of the 'percentage' argument (-10) in the 'array.percentile_nearest_rank' function. It must be in the range [0..100].",
        ],
    ])('%s', async (stmt, message) => {
        expect(await runError(stmt)).toBe(message);
    });

    it('accepts the in-bounds edges and returns na on empty arrays', async () => {
        const r = await labels(`
            a = array.from(1.0, 2.0, 3.0, 4.0, 5.0)
            e = array.new_float(0)
            lbs("slice", str.tostring(array.slice(a, 0, 5).size()) + "," + str.tostring(array.slice(a, 2, 2).size()) + "," + str.tostring(array.slice(a, 4, 5).size()))
            b = array.from(1.0, 2.0, 3.0, 4.0, 5.0)
            array.fill(b, 9.0, 2, 2)
            array.fill(b, 0.0, 3, 1)
            array.fill(b, 7.0, 4, 5)
            array.fill(b, 8.0, 1, na)
            lbs("fill", str.tostring(array.sum(b)))
            lbs("nth", str.tostring(array.max(a, 4)) + "," + str.tostring(array.min(a, 4)) + "," + str.tostring(array.max(e, 1)))
            lbs("empty", str.tostring(na(array.median(e))) + str.tostring(na(array.mode(e))) + str.tostring(na(array.percentile_nearest_rank(e, 50))) + str.tostring(na(array.percentrank(e, 0))) + str.tostring(na(array.first(array.new_float(3)))))
        `);
        expect(r.slice).toBe('5,0,1');
        expect(r.fill).toBe('33');
        expect(r.nth).toBe('1,5,NaN');
        expect(r.empty).toBe('truetruetruetruetrue');
    });
});
