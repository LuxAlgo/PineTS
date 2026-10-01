// SPDX-License-Identifier: AGPL-3.0-only
// Strings and number formatting as on TradingView. Every expected line is what TradingView logs for
// the same script (BINANCE:BTCUSDT 1h, Pine v6); lines that depend on the price are not compared.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

afterEach(() => vi.restoreAllMocks());

async function logs(source: string): Promise<string[]> {
    const lines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...a: any[]) => lines.push(a.join(' ').replace(/^\[[^\]]+\]\s/, '')));
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2));
    await pineTS.run(source);
    return [...new Set(lines)];
}

async function runError(source: string): Promise<string> {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2));
    try {
        await pineTS.run(source);
    } catch (e: any) {
        return String(e.message);
    }
    return 'no error';
}

describe("the na string is the empty string (R4)", () => {
    it("nastr_core", async () => {
        const lines = await logs(`//@version=6
indicator("nastr_core")
if barstate.islast
    string s = na
    s2 = string(na)
    log.info("na_s=" + str.tostring(na(s)))
    log.info("na_s2=" + str.tostring(na(s2)))
    log.info("len=" + str.tostring(str.length(s2)))
    log.info("len_s=" + str.tostring(str.length(s)))
    log.info("cat=" + "a" + s2 + "b")
    log.info("cat_s=" + "a" + s + "b")
    log.info("eq_empty=" + str.tostring(s2 == ""))
    log.info("neq_empty=" + str.tostring(s2 != ""))
    log.info("eq_na=" + str.tostring(s2 == s))
    log.info("eq_x=" + str.tostring(s2 == "x"))
    log.info("tostr=[" + str.tostring(s2) + "]")
    log.info("fmt=[" + str.format("{0}", s2) + "]")
    log.info("upper=[" + str.upper(s2) + "]")
    log.info("trim=[" + str.trim(s) + "]")
    log.info("contains=" + str.tostring(str.contains(s2, "")))
    log.info("contains_a=" + str.tostring(str.contains("abc", s2)))
    log.info("startswith=" + str.tostring(str.startswith(s2, "")))
    log.info("pos=" + str.tostring(str.pos("abc", s2)))
    log.info("join=" + array.join(array.from("x", s2, "y"), ","))
    log.info("newstr=" + array.join(array.new_string(2), ","))
    log.info("newstr_na=" + str.tostring(na(array.new_string(1).get(0))))
    log.info("newstr_len=" + str.tostring(str.length(array.new_string(1).get(0))))
    m = map.new<int, string>()
    log.info("map=[" + m.get(1) + "]")
    log.info("map_na=" + str.tostring(na(m.get(1))))
    log.info("split=" + str.tostring(str.split(s2, ",").size()))
    log.info("repl=[" + str.replace_all("abc", "b", s2) + "]")
    log.info("tonum=" + str.tostring(str.tonumber(s2)))
    log.info("ternary=[" + (bar_index > 0 ? s2 : "x") + "]")
    log.info("ternary_na=" + str.tostring(na(bar_index > 0 ? s2 : "x")))
    log.info("tostring_na_float=" + str.tostring(na))
    log.info("tostring_na_float2=" + str.tostring(float(na)))
    log.info("string_of_str=" + string("q"))
    t = s2 + "z"
    log.info("cat_na=" + str.tostring(na(t)) + " " + str.tostring(str.length(t)))
    var string v = na
    log.info("var_na=" + str.tostring(na(v)) + " [" + v + "]")
plot(close)
`);
        const expected = [
          "na_s=true",
          "na_s2=true",
          "len=0",
          "len_s=0",
          "cat=ab",
          "cat_s=ab",
          "eq_empty=true",
          "neq_empty=false",
          "eq_na=true",
          "eq_x=false",
          "tostr=[]",
          "fmt=[]",
          "upper=[]",
          "trim=[]",
          "contains=true",
          "contains_a=true",
          "startswith=true",
          "pos=0",
          "join=x,,y",
          "newstr=,",
          "newstr_na=true",
          "newstr_len=0",
          "map=[]",
          "map_na=true",
          "split=1",
          "repl=[ac]",
          "tonum=NaN",
          "ternary=[]",
          "ternary_na=true",
          "tostring_na_float=NaN",
          "tostring_na_float2=NaN",
          "string_of_str=q",
          "cat_na=false 1",
          "var_na=true []"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("nastr_more", async () => {
        const lines = await logs(`//@version=6
indicator("nastr_more")
f(int k) =>
    string r = na
    if k > 0
        r := "pos"
    r
g(int k) =>
    switch k
        1 => "one"
        2 => "two"
type T
    string name
    float x
if barstate.islast
    log.info("fn=[" + f(0) + "] " + str.tostring(na(f(0))) + " [" + f(1) + "]")
    log.info("switch=[" + g(3) + "] " + str.tostring(na(g(3))))
    t = T.new()
    log.info("udt=[" + t.name + "] " + str.tostring(na(t.name)))
    a = array.new<string>(2)
    log.info("new_generic=" + str.tostring(na(a.get(0))) + " [" + a.join("|") + "]")
    b = array.new_string(2, "q")
    b.set(0, na)
    log.info("set_na=" + str.tostring(na(b.get(0))) + " [" + b.join("|") + "] " + str.tostring(b.indexof("")))
    log.info("tostring_arr=" + str.tostring(array.from("x", string(na))))
    log.info("fmt_arr=" + str.format("{0}", array.from("x", string(na))))
    log.info("includes_empty=" + str.tostring(array.new_string(1).includes("")))
    c = array.from("b", string(na), "a")
    c.sort()
    log.info("sort=" + c.join(","))
    m = map.new<string, int>()
    m.put(string(na), 5)
    log.info("mapkey=" + str.tostring(m.size()) + " " + str.tostring(m.get("")) + " " + str.tostring(m.contains("")))
    log.info("lower=[" + str.lower(string(na)) + "] repeat=[" + str.repeat(string(na), 3) + "]")
    log.info("substr=[" + str.substring(string(na), 0) + "]")
    log.info("ends=" + str.tostring(str.endswith("abc", string(na))))
    log.info("format_sel=" + str.format("{0}-{1}", string(na), "x"))
plot(close)
`);
        const expected = [
          "fn=[] true [pos]",
          "switch=[] true",
          "udt=[] true",
          "new_generic=true [|]",
          "set_na=true [|q] 0",
          "tostring_arr=[x, ]",
          "fmt_arr=[x, ]",
          "includes_empty=true",
          "sort=,a,b",
          "mapkey=1 5 true",
          "lower=[] repeat=[]",
          "substr=[]",
          "ends=true",
          "format_sel=-x"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("nastr_label", async () => {
        const lines = await logs(`//@version=6
indicator("nastr_label", overlay = true)
if barstate.islast
    lb = label.new(bar_index, close, string(na))
    log.info("label_text=[" + lb.get_text() + "] " + str.tostring(na(lb.get_text())))
    lb2 = label.new(bar_index, close, "x")
    lb2.set_text(string(na))
    log.info("label_set=[" + lb2.get_text() + "]")
    tb = table.new(position.top_right, 1, 1)
    tb.cell(0, 0, string(na))
plot(close)
`);
        const expected = [
          "label_text=[] true",
          "label_set=[]"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("nastr_empty", async () => {
        const lines = await logs(`//@version=6
indicator("nastr_empty")
if barstate.islast
    string e = ""
    log.info("na_lit=" + str.tostring(na("")))
    log.info("na_var=" + str.tostring(na(e)))
    log.info("na_sub=" + str.tostring(na(str.substring("abc", 0, 0))))
    log.info("na_trim=" + str.tostring(na(str.trim("   "))))
    log.info("na_repl=" + str.tostring(na(str.replace_all("aa", "a", ""))))
    log.info("na_cat=" + str.tostring(na("" + "")))
    log.info("na_tostr=" + str.tostring(na(str.tostring(string(na)))))
    log.info("na_upper=" + str.tostring(na(str.upper(string(na)))))
    log.info("na_fmt=" + str.tostring(na(str.format("{0}", string(na)))))
    a = array.from("", "x")
    log.info("na_arr=" + str.tostring(na(a.get(0))))
    s = str.split("a,,b", ",")
    log.info("na_split=" + str.tostring(na(s.get(1))))
    m = map.new<string, string>()
    m.put("k", "")
    log.info("na_map=" + str.tostring(na(m.get("k"))))
    sw = switch bar_index
        -1 => "neg"
    log.info("na_switch_assign=" + str.tostring(na(sw)) + " [" + sw + "]")
    string t = na
    t := t + ""
    log.info("na_after_cat=" + str.tostring(na(t)))
plot(close)
`);
        const expected = [
          "na_lit=true",
          "na_var=true",
          "na_sub=true",
          "na_trim=true",
          "na_repl=true",
          "na_cat=true",
          "na_tostr=true",
          "na_upper=true",
          "na_fmt=true",
          "na_arr=true",
          "na_split=true",
          "na_map=true",
          "na_switch_assign=true []",
          "na_after_cat=true"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("str.tostring of a float without a format (C10)", () => {
    it("tostring_float", async () => {
        const lines = await logs(`//@version=6
indicator("tostring_float")
v(float x) => str.tostring(x)
if barstate.islast
    log.info("a=" + v(1.0 / 3) + " " + v(0.1 + 0.2) + " " + v(-2.0 / 3) + " " + v(12345.123456789012) + " " + v(0.12345678905))
    log.info("b=" + v(1e-7) + " " + v(1e-11) + " " + v(5.0) + " " + v(1e8) + " " + v(1e21) + " " + v(-0.0) + " " + v(na))
    log.info("c=" + v(1e15) + " " + v(1e16) + " " + v(1e20) + " " + v(123456789012.345) + " " + v(0.000012345) + " " + v(1.5e-10) + " " + v(5e-11) + " " + v(4.9e-11))
    log.info("d=" + v(1e15 + 0.3) + " " + v(9007199254740993.0) + " " + v(1.23456789e25) + " " + v(-1e-7) + " " + v(0.99999999999) + " " + v(0.99999999995) + " " + v(-0.00000000004))
    log.info("e=" + v(close) + " " + v(close / 7) + " " + v(volume) + " " + v(math.pi) + " " + v(math.e * 1000000))
    log.info("f=" + str.tostring(5) + " " + str.tostring(-12) + " " + str.tostring(true) + " " + str.tostring(int(na)) + " " + str.tostring(bar_index * 0 + 7))
    log.info("g=" + v(2.5e-9) + " " + v(1e-10) + " " + v(1.00000000005) + " " + v(2.00000000015) + " " + v(1e19) + " " + v(1e22) + " " + v(1.5e300))
    log.info("h=" + v(100.0 / 3) + " " + v(1000000.0 / 3) + " " + v(1e9 / 3) + " " + v(1e12 / 3) + " " + v(-1e12 / 7))
plot(close)
`);
        const expected = [
          "a=0.3333333333 0.3 -0.6666666667 12345.123456789 0.1234567891",
          "b=0.0000001 0 5 100000000 1E21 0 NaN",
          "c=1000000000000000 10000000000000000 100000000000000000000 123456789012.345 0.000012345 0.0000000001 0 0",
          "d=1000000000000000.2 9007199254740992 1.23456789E25 -0.0000001 1 0.9999999999 0",
          "f=5 -12 true NaN 7",
          "g=0.0000000025 0.0000000001 1.0000000001 2.0000000002 10000000000000000000 1E22 1.5E300",
          "h=33.3333333333 333333.3333333333 333333333.3333333 333333333333.3333 -142857142857.14285"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("format.percent, format.volume and patterns without digits", () => {
    it("percent_volume", async () => {
        const lines = await logs(`//@version=6
indicator("percent_volume")
p(float x) => str.tostring(x, format.percent)
vo(float x) => str.tostring(x, format.volume)
if barstate.islast
    log.info("pct=" + p(0.123456) + " " + p(12.3456) + " " + p(1) + " " + p(-0.5) + " " + p(0.005) + " " + p(0.015) + " " + p(1234.5) + " " + p(na) + " " + p(1.0 / 3))
    log.info("vol=" + vo(1234567) + " " + vo(2500000000) + " " + vo(999) + " " + vo(12.3456) + " " + vo(1234) + " " + vo(999999) + " " + vo(1000) + " " + vo(1500))
    log.info("vol2=" + vo(-1234567) + " " + vo(0.5) + " " + vo(1e12) + " " + vo(1e15) + " " + vo(na) + " " + vo(999.5) + " " + vo(1000000) + " " + vo(1234500) + " " + vo(12345) + " " + vo(123456))
    log.info("vol3=" + vo(0.123) + " " + vo(-5.5) + " " + vo(9999.5) + " " + vo(999950) + " " + vo(1e18) + " " + vo(2.5) + " " + vo(3.5) + " " + vo(1235.5))
    log.info("mintick=" + str.tostring(close, format.mintick) + " " + str.tostring(1.0 / 3, format.mintick) + " " + str.tostring(0.005, format.mintick) + " " + str.tostring(0.015, format.mintick))
    log.info("int_fmt=" + str.tostring(2.5, "integer") + " " + str.tostring(3.5, "integer") + " " + str.tostring(-2.5, "integer"))
plot(close)
`);
        const expected = [
          "pct=0.12% 12.35% 1.00% -0.50% 0.01% 0.02% 1234.50% NaN% 0.33%",
          "vol=1.235M 2.5B 999 12 1.234K 999.999K 1K 1.5K",
          "vol2=-1.235M 1 1T 1000T NaN 1000 1M 1.235M 12.345K 123.456K",
          "vol3=0 -6 10K 999.95K 1000000T 3 4 1.236K",
          "int_fmt=integer3 integer4 -integer3"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("format_misc", async () => {
        const lines = await logs(`//@version=6
indicator("format_misc")
if barstate.islast
    log.info("close_brace=" + str.format("a}b {0}", 1))
    log.info("neg_zero=" + str.format("{0}", -0.0001) + " " + str.format("{0,number,#.##}", -0.001) + " " + str.tostring(-0.001, "#.##"))
    log.info("price=" + str.tostring(83123.456, format.price) + " inherit=" + str.tostring(83123.456, format.inherit))
    log.info("pct_str=" + str.tostring(0.5, "percent") + " vol_str=" + str.tostring(1234567.0, "volume") + " mt_str=" + str.tostring(1.2345, "mintick"))
    log.info("nodigit=" + str.tostring(0.4, "integer") + " " + str.tostring(12.6, "abc") + " " + str.tostring(-0.4, "x"))
    log.info("tostr_int_big=" + str.tostring(int(1e15)) + " " + str.tostring(2147483647 + 1))
    log.info("fmt_big=" + str.format("{0}", 1e21) + " " + str.format("{0}", 123456789.123))
    log.info("join_mixed=" + array.join(array.from(1.0, na, 3.5), ","))
    log.info("tostr_arr_int=" + str.tostring(array.from(1, 2)) + " " + str.tostring(array.new_float(2)) + " " + str.tostring(array.from(true, false)))
plot(close)
`);
        const expected = [
          "close_brace=a}b 1",
          "neg_zero=-0 -0 0",
          "price=price83123 inherit=inherit83123",
          "pct_str=0.50% vol_str=1.235M mt_str=1.23",
          "nodigit=integer0 abc13 -x0",
          "tostr_int_big=1000000000000000 2147483648",
          "fmt_big=1,000,000,000,000,000,000,000 123,456,789.123",
          "join_mixed=1.0,NaN,3.5",
          "tostr_arr_int=[1, 2] [NaN, NaN] [true, false]"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("str.tonumber (C11)", () => {
    it("tonumber", async () => {
        const lines = await logs(`//@version=6
indicator("tonumber")
n(string s) => str.tostring(str.tonumber(s))
if barstate.islast
    log.info("a=" + n("1e3") + " " + n("0x10") + " " + n("0b11") + " " + n("") + " " + n("Infinity") + " " + n(" 12 ") + " " + n("12abc") + " " + n("+4"))
    log.info("b=" + n(".5") + " " + n("5.") + " " + n("007") + " " + n("1,000") + " " + n("NaN") + " " + n("1_000") + " " + n("-3.5") + " " + n("1E3"))
    log.info("c=" + n("  -2  ") + " " + n("1.5e-3") + " " + n("-") + " " + n(".") + " " + n("+") + " " + n("- 5") + " " + n("\\t5") + " " + n("5\\n"))
    log.info("d=" + n("-.5") + " " + n("+.5") + " " + n("0") + " " + n("-0") + " " + n("00.10") + " " + n("123456789012345678901234567890") + " " + n("1.2.3") + " " + n("Inf"))
    log.info("e=" + n("-Infinity") + " " + n("1e") + " " + n("5d") + " " + n("5f") + " " + n("0.1") + " " + n("٣") + " " + n("1 2") + " " + n("--5"))
plot(close)
`);
        const expected = [
          "a=NaN NaN NaN NaN NaN 12 NaN 4",
          "b=0.5 5 7 NaN NaN NaN -3.5 NaN",
          "c=-2 NaN NaN NaN NaN NaN 5 5",
          "d=-0.5 0.5 0 0 0.1 1.2345678901E29 NaN NaN"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("str.format arguments, rounding and quoting (C12)", () => {
    it("format_args", async () => {
        const lines = await logs(`//@version=6
indicator("format_args")
if barstate.islast
    log.info("missing=" + str.format("{0} {2}", 1, 2))
    log.info("missing2=" + str.format("{3}", "a"))
    log.info("missing3=" + str.format("{1,number,#.##} {0}", 5))
    log.info("bools=" + str.format("{0} {1}", true, false))
    log.info("int=" + str.format("{0}", 1234567) + " " + str.format("{0}", -5) + " " + str.format("{0}", int(na)))
    log.info("float=" + str.format("{0}", 1.0 / 3) + " " + str.format("{0}", 0.1 + 0.2) + " " + str.format("{0}", 1e-7) + " " + str.format("{0}", 2.0005))
    log.info("fmt_time_na=" + str.format_time(int(na), "yyyy-MM-dd HH:mm", "UTC") + " " + str.format_time(na))
plot(close)
`);
        const expected = [
          "missing=1 {2}",
          "missing2={3}",
          "missing3={1} 5",
          "bools=true false",
          "int=1,234,567 -5 NaN",
          "float=0.333 0.3 0 2.001",
          "fmt_time_na=1970-01-01 00:00 1970-01-01T00:00:00+0000"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("round_ties", async () => {
        const lines = await logs(`//@version=6
indicator("round_ties")
f2(float x) => str.format("{0,number,#.##}", x)
t2(float x) => str.tostring(x, "#.##")
f3(float x) => str.format("{0,number,#.###}", x)
t3(float x) => str.tostring(x, "#.###")
f0(float x) => str.format("{0,number,#}", x)
t0(float x) => str.tostring(x, "#")
if barstate.islast
    log.info("f2=" + f2(2.345) + " " + f2(1.005) + " " + f2(0.125) + " " + f2(0.375) + " " + f2(2.675) + " " + f2(1.115) + " " + f2(8.345) + " " + f2(0.045) + " " + f2(1.125) + " " + f2(-2.345) + " " + f2(-0.125))
    log.info("t2=" + t2(2.345) + " " + t2(1.005) + " " + t2(0.125) + " " + t2(0.375) + " " + t2(2.675) + " " + t2(1.115) + " " + t2(8.345) + " " + t2(0.045) + " " + t2(1.125) + " " + t2(-2.345) + " " + t2(-0.125))
    log.info("f3=" + f3(0.0005) + " " + f3(0.0015) + " " + f3(0.0025) + " " + f3(1.0005) + " " + f3(2.0005) + " " + f3(1.2345) + " " + f3(0.1235))
    log.info("t3=" + t3(0.0005) + " " + t3(0.0015) + " " + t3(0.0025) + " " + t3(1.0005) + " " + t3(2.0005) + " " + t3(1.2345) + " " + t3(0.1235))
    log.info("f0=" + f0(0.5) + " " + f0(1.5) + " " + f0(2.5) + " " + f0(-0.5) + " " + f0(-1.5) + " " + f0(2.5000000001) + " " + f0(1e16 + 2))
    log.info("t0=" + t0(0.5) + " " + t0(1.5) + " " + t0(2.5) + " " + t0(-0.5) + " " + t0(-1.5) + " " + t0(2.4999999999))
    log.info("dflt=" + str.format("{0}", 2.0005) + " " + str.format("{0}", 1.0005) + " " + str.format("{0}", 0.0005) + " " + str.format("{0}", 1.2345) + " " + str.format("{0}", 2.3455))
plot(close)
`);
        const expected = [
          "f2=2.35 1 0.12 0.38 2.67 1.11 8.35 0.04 1.12 -2.35 -0.12",
          "t2=2.35 1.01 0.13 0.38 2.68 1.12 8.35 0.05 1.13 -2.35 -0.13",
          "f3=0 0.002 0.003 1 2.001 1.234 0.123",
          "t3=0.001 0.002 0.003 1.001 2.001 1.235 0.124",
          "f0=0 2 2 -0 -2 3 10000000000000002",
          "t0=1 2 3 -1 -2 2",
          "dflt=2.001 1 0 1.234 2.345"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("fmt_quote", async () => {
        const lines = await logs(`//@version=6
indicator("fmt_quote")
if barstate.islast
    log.info("q1=" + str.format("it''s {0}", 1))
    log.info("q2=" + str.format("'{0}' {0}", 7))
    log.info("q3=" + str.format("it's {0}", 1))
    log.info("q5=" + str.format("{0,number,'#'#}", 5))
    log.info("q6=" + str.format("x {0,number,#.#} y {1,number,integer} z {2,number,percent}", 2.25, 2.5, 0.125))
    log.info("q7=" + str.format("{0, number, #.##}", 1.255))
    log.info("q8=" + str.format("{0,NUMBER,#.##}", 1.255))
plot(close)
`);
        const expected = [
          "q1=it's 1",
          "q2={0} 7",
          "q3=its {0}",
          "q5=#5",
          "q6=x 2.2 y 2 z 12%",
          "q7= 1.25",
          "q8=1.25"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("array.join and arrays in str.format (C4)", () => {
    it("join_float", async () => {
        const lines = await logs(`//@version=6
indicator("join_float")
if barstate.islast
    log.info("j1=" + array.join(array.from(5.0, 2.5, -0.125), ","))
    log.info("j2=" + array.join(array.from(1.0 / 3, 1e8, 1e-7, 123456789.123456789), ";"))
    log.info("j3=" + array.join(array.from(1, 2.5), ","))
    log.info("j4=" + array.join(array.from("x", "y")))
    log.info("j5=" + array.join(array.from(1, 2, 3)) + " " + array.join(array.from(1, 2, 3), "-"))
    a = array.new_float(2)
    log.info("j6=" + array.join(a, ","))
    log.info("j7=" + array.join(array.from(0.1 + 0.2, 1e21, 1e-3, 1e7, 1e6, 0.001, 0.0001, -0.0), ","))
    log.info("j9=" + str.format("{0}", array.from(1.5, 2.0)) + " " + str.format("{0}", array.from(1, 2)) + " " + str.format("{0}", array.from("a", "b")))
    log.info("j10=" + str.tostring(array.from(1.5, 2.0)) + " " + str.tostring(array.from(1.0 / 3, 1e8)))
    b = array.new_int(2)
    log.info("j11=" + array.join(b, ","))
    c = array.from(close, high)
    log.info("j12=" + str.tostring(array.join(c, ",") == str.tostring(close) + "," + str.tostring(high)))
    log.info("j13=" + array.join(array.from(1e7, 12345678.9, 9999999.0, 10000000.5, 0.00099, 123.0), ","))
plot(close)
`);
        const expected = [
          "j1=5.0,2.5,-0.125",
          "j2=0.3333333333333333;1.0E8;1.0E-7;1.2345678912345679E8",
          "j3=1.0,2.5",
          "j4=xy",
          "j5=123 1-2-3",
          "j6=NaN,NaN",
          "j9=[1.5, 2.0] [1, 2] [a, b]",
          "j10=[1.5, 2] [0.3333333333, 100000000]",
          "j11=NaN,NaN",
          "j13=1.0E7,1.23456789E7,9999999.0,1.00000005E7,9.9E-4,123.0"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe("log.* messages", () => {
    it("log_fmt", async () => {
        const lines = await logs(`//@version=6
indicator("log_fmt")
if barstate.islast
    log.info("a=it's {0}")
    log.info("b=x {0}", 5)
    log.info("c=it's {0}", 5)
    log.info("d=it''s {0}", 5)
    log.info("e={0,number,#.##} {1}", 2.345, "s")
    log.info("f=plain {2}")
    log.info("g={0}", 1234567.891)
    log.info("h={0} {1}", true, string(na))
    log.info("i=" + "it's")
    log.warning("j=w {0}", 1.5)
    log.error("k=e {0}", 2.5)
plot(close)
`);
        const expected = [
          "a=it's {0}",
          "b=x 5",
          "c=its {0}",
          "d=it's 5",
          "f=plain {2}",
          "g=1,234,567.891",
          "h=true ",
          "i=it's"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
    it("log_bad", async () => {
        const lines = await logs(`//@version=6
indicator("log_bad")
if barstate.islast
    log.info("bad { 0 }")
plot(close)
`);
        const expected = [
          "bad { 0 }"
        ];
        for (const line of expected) expect(lines).toContain(line);
    });
});

describe('malformed str.format placeholders are runtime errors', () => {
    it("format_badarg", async () => {
        expect(await runError(`//@version=6
indicator("format_badarg")
if barstate.islast
    log.info("bad=" + str.format("{ 0 }", 1))
plot(close)
`)).toContain("can't parse argument number:  0 ");
    });
    it("format_err_a", async () => {
        expect(await runError(`//@version=6
indicator("format_err_a")
if barstate.islast
    log.info("r=" + str.format("{a}", 1))
plot(close)
`)).toContain("can't parse argument number: a");
    });
    it("format_err_empty", async () => {
        expect(await runError(`//@version=6
indicator("format_err_empty")
if barstate.islast
    log.info("r=" + str.format("x {} y", 1))
plot(close)
`)).toContain("can't parse argument number: ");
    });
    it("format_err_unclosed", async () => {
        expect(await runError(`//@version=6
indicator("format_err_unclosed")
if barstate.islast
    log.info("r=" + str.format("x {0", 1))
plot(close)
`)).toContain("Unmatched braces in the pattern.");
    });
    it("format_err_type", async () => {
        expect(await runError(`//@version=6
indicator("format_err_type")
if barstate.islast
    log.info("r=" + str.format("{0,foo}", 1))
plot(close)
`)).toContain("unknown format type: foo");
    });
});
