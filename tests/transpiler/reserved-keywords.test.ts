// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Reserved-word parity with TradingView.
 *
 * Every accept / reject expectation below matches TradingView (Pine v6, Sep 2026):
 *
 * - The v5 migration guide's reserved words — catch, class, do, ellipse, in,
 *   is, polygon, range, return, struct, text, throw, try — plus the keywords
 *   import / export / var / varip are rejected in EVERY declaration position
 *   (variable, `var`, function name, parameter, UDT field, method name, type
 *   name, enum name/member, for-loop variable, typed and local declarations)
 *   with `"X" cannot be used as a variable or function name.`
 * - The remaining syntax keywords (and, or, not, if, for, to, by, as, ...)
 *   are rejected as well, with a syntax error.
 * - `text` etc. remain valid NAMED ARGUMENTS (`label.new(..., text="a")`).
 * - TradingView does NOT apply the check to tuple-destructuring targets:
 *   `[text, b] = f()` compiles — so it does here too.
 * - `type`, `method`, `enum` (and `once`) are contextual: reserved only where
 *   they introduce a declaration, ordinary identifiers everywhere else.
 * - Words reserved in JavaScript but not in Pine (this, new, delete, const,
 *   case, function, default, let, static, extends, arguments, eval, NaN,
 *   undefined, ...) are valid Pine names in every position, including as
 *   parameters and UDT type names.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { transpile } from '../../src/transpiler';

const RESERVED = ['catch', 'class', 'do', 'ellipse', 'in', 'is', 'polygon', 'range', 'return', 'struct', 'text', 'throw', 'try'];
const RESERVED_KEYWORDS = ['import', 'export', 'var', 'varip'];
const SYNTAX_KEYWORDS = ['and', 'or', 'not', 'if', 'else', 'for', 'while', 'switch', 'to', 'by', 'as', 'break', 'continue'];
const CONTEXTUAL = ['type', 'method', 'enum', 'once'];
const JS_ONLY = [
    'this', 'new', 'delete', 'const', 'case', 'function', 'default', 'let', 'static', 'super', 'finally', 'void',
    'typeof', 'yield', 'extends', 'arguments', 'eval', 'NaN', 'undefined', 'Infinity',
];

// Every position in which a new name can be introduced.
const DECLARATION_POSITIONS: Record<string, (w: string) => string> = {
    variable: (w) => `${w} = close\nplot(${w})`,
    'var declaration': (w) => `var ${w} = 0.0\n${w} := close\nplot(${w})`,
    'function name': (w) => `${w}(x) => x + 1\nplot(${w}(close))`,
    parameter: (w) => `f(${w}) => ${w} + 1\nplot(f(close))`,
    'UDT field': (w) => `type T\n    float ${w} = 1\nt = T.new()\nplot(t.${w})`,
    'method name': (w) => `method ${w}(float x) => x + 1\nplot(close.${w}())`,
    'type name': (w) => `type ${w}\n    float v = 1\nt = ${w}.new()\nplot(t.v)`,
    'enum name': (w) => `enum ${w}\n    a\n    b\nplot(close)`,
    'enum member': (w) => `enum E\n    ${w}\n    b\nplot(close)`,
    'for-loop variable': (w) => `s = 0.0\nfor ${w} = 0 to 2\n    s += ${w}\nplot(s)`,
    'typed declaration': (w) => `float ${w} = close\nplot(${w})`,
    'local variable': (w) => `f(x) =>\n    ${w} = x + 1\n    ${w} * 2\nplot(f(close))`,
};

const script = (body: string) => `//@version=6\nindicator("reserved words")\n${body}\n`;

const makePineTS = () =>
    new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());

/** Run a script and return the `plots` map; every script plots `close` as "C" for reference. */
async function run(body: string) {
    const { plots } = await makePineTS().run(script(`${body}\nplot(close, "C")`));
    expect(plots['C']?.data?.length).toBeGreaterThan(0);
    return plots;
}

function values(plots: any, title: string): number[] {
    expect(plots[title], `plot "${title}" missing`).toBeDefined();
    return plots[title].data.map((d: any) => d.value);
}

function expectSeriesClose(actual: number[], expected: number[]) {
    expect(actual.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
        if (Number.isNaN(expected[i])) expect(actual[i]).toBeNaN();
        else expect(actual[i]).toBeCloseTo(expected[i], 8);
    }
}

describe('Reserved words are rejected as names (TradingView parity)', () => {
    for (const word of [...RESERVED, ...RESERVED_KEYWORDS]) {
        for (const [position, build] of Object.entries(DECLARATION_POSITIONS)) {
            it(`rejects "${word}" as a ${position}`, () => {
                expect(() => transpile(script(build(word)))).toThrow(`"${word}" cannot be used as a variable or function name.`);
            });
        }
    }

    it('reports the position of the offending name', () => {
        // `    float text = 1` inside the UDT body: line 4 (1-based), column 11.
        expect(() => transpile(script(DECLARATION_POSITIONS['UDT field']('text')))).toThrow(
            '"text" cannot be used as a variable or function name. at 4:11'
        );
        expect(() => transpile(script('range = close\nplot(range)'))).toThrow(
            '"range" cannot be used as a variable or function name. at 3:1'
        );
    });

    for (const word of SYNTAX_KEYWORDS) {
        it(`rejects the keyword "${word}" in every declaration position`, () => {
            for (const [position, build] of Object.entries(DECLARATION_POSITIONS)) {
                expect(() => transpile(script(build(word))), `${word} as ${position}`).toThrow();
            }
        });
    }

    it('"as" is a keyword, not a name', () => {
        expect(() => transpile(script('as = close\nplot(as)'))).toThrow();
        expect(() => transpile(script('type T\n    float as = 1\nplot(close)'))).toThrow(
            '"as" cannot be used as a variable or function name.'
        );
    });
});

describe('Reserved words keep their non-declaration uses', () => {
    it('`text` is still a valid named argument', async () => {
        const plots = await run(`
if barstate.islast
    label.new(bar_index, close, text = "hello", textcolor = color.white)
plot(close * 2, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2));
    });

    it('`text.align_left` namespace access still works', async () => {
        const plots = await run(`
var tbl = table.new(position.top_right, 1, 1)
if barstate.islast
    table.cell(tbl, 0, 0, "x", text_halign = text.align_left)
plot(close + 1, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c + 1));
    });

    it('tuple-destructuring targets are NOT checked (TradingView quirk): `[text, b] = f()`', async () => {
        const plots = await run(`
f() => [close * 2, open]
[text, b] = f()
plot(text, "T")`);
        expectSeriesClose(values(plots, 'T'), values(plots, 'C').map((c) => c * 2));
    });

    it('tuple target that is also a JS keyword: `[catch, b] = f()`', async () => {
        const plots = await run(`
f() => [close * 3, open]
[catch, b] = f()
plot(catch, "T")`);
        expectSeriesClose(values(plots, 'T'), values(plots, 'C').map((c) => c * 3));
    });

    const tuple = (w: string) => `f() => [close, open]\n[${w}, b] = f()\nplot(${w} + b)`;

    it('every reserved word, contextual keyword and JS-only word is accepted as a tuple target', () => {
        for (const word of [...RESERVED.filter((w) => w !== 'in'), ...CONTEXTUAL, ...JS_ONLY]) {
            expect(() => transpile(script(tuple(word))), `[${word}, b] = f()`).not.toThrow();
        }
    });

    it('syntax keywords are still rejected as tuple targets', () => {
        for (const word of ['in', ...SYNTAX_KEYWORDS, ...RESERVED_KEYWORDS]) {
            expect(() => transpile(script(tuple(word))), `[${word}, b] = f()`).toThrow();
        }
    });
});

describe('Contextual keywords (type / method / enum / once) are valid names outside their declaration position', () => {
    for (const word of CONTEXTUAL) {
        for (const [position, build] of Object.entries(DECLARATION_POSITIONS)) {
            it(`accepts "${word}" as a ${position}`, () => {
                expect(() => transpile(script(build(word)))).not.toThrow();
            });
        }
    }

    it('`type = close` at the start of a line is a variable, not a type declaration', async () => {
        const plots = await run(`
type = close
plot(type * 2, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2));
    });

    it('`method = 2` / `plot(method)` — every contextual keyword works as a plain variable', async () => {
        const plots = await run(`
method = 2
enum = 3
once = 4
plot(method, "M")
plot(method + enum + once, "S")`);
        const c = values(plots, 'C');
        expectSeriesClose(values(plots, 'M'), c.map(() => 2));
        expectSeriesClose(values(plots, 'S'), c.map(() => 9));
    });

    it('`method(x) => ...` at the start of a line is a function named method', async () => {
        const plots = await run(`
method(x) => x * 2
y = method(close)
plot(y, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2));
    });

    it('`var enum = 0` / `enum := enum + 1` is a persistent counter', async () => {
        const plots = await run(`
var enum = 0
enum := enum + 1
plot(enum, "N")`);
        const n = values(plots, 'N');
        expectSeriesClose(n, n.map((_, i) => i + 1));
    });

    it('`type` / `method` / `enum` as function parameters and locals', async () => {
        const plots = await run(`
f(type, method) =>
    enum = type + method
    enum * 2
plot(f(close, 1), "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => (c + 1) * 2));
    });

    it('`int type` UDT field, `method` method name and `type type` UDT in one script', async () => {
        const plots = await run(`
type type
    float v = 1
type Row
    int type = 0
    float method = 0.0
method method(Row this) => this.method * this.type
r = Row.new(3, close)
t = type.new(2)
plot(r.method() + t.v, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 3 + 2));
    });

    it('the declaration forms still work: `type Foo`, `method f(...)`, `enum E`', async () => {
        const plots = await run(`
enum Side
    long = "L"
    short = "S"
type Foo
    float x
method twice(Foo this) => this.x * 2
foo = Foo.new(close)
s = Side.long
plot(foo.twice() + (s == Side.long ? 1 : 0), "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2 + 1));
    });

    it('a contextual keyword on a wrapped (continuation) line is an identifier', async () => {
        const plots = await run(`
type = 1
y = close +
  type
plot(y, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c + 1));
    });
});

describe('JavaScript reserved words are valid Pine names in every position', () => {
    for (const word of JS_ONLY) {
        it(`accepts "${word}" as a variable, var, function, parameter, field, method, type, enum, loop and local name`, () => {
            for (const [position, build] of Object.entries(DECLARATION_POSITIONS)) {
                expect(() => transpile(script(build(word))), `${word} as ${position}`).not.toThrow();
            }
        });
    }

    it('`new` as a variable and `delete` as a function', async () => {
        const plots = await run(`
delete(x) => x - 1
new = close * 2
plot(delete(new), "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2 - 1));
    });

    it('`const`, `case` and `this` as plain variables', async () => {
        const plots = await run(`
const = 2
case = 3
this = close
plot(this * const + case, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2 + 3));
    });

    it('JS reserved words as function parameters, including a UDT-typed one', async () => {
        const plots = await run(`
type P
    float x
f(new, P delete, function = 1) => new + delete.x + function
p = P.new(close)
plot(f(close, p), "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2 + 1));
    });

    it('a UDT named with a JS reserved word, used in typed declarations, parameters and generics', async () => {
        const plots = await run(`
type new
    float v = 1
twice(new f) => f.v * 2
new n = new.new(close)
arr = array.new<new>()
arr.push(new.new(2))
a = twice(n)
b = arr.get(0).v
plot(a + b, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c * 2 + 2));
    });

    it('renamed UDT names are followed in the type markers read by the analysis pass', () => {
        const js = transpile(script(`
type new
    float v = 1
twice(new f) => f.v * 2
new n = new.new(close)
plot(twice(n))`)).toString();
        // The JS identifier is renamed everywhere the Pine type is named…
        expect(js).not.toMatch(/\bconst new\b/);
        expect(js).not.toMatch(/\bnew\.new\(/);
        // …and the original word is gone as a bare identifier.
        expect(js).not.toMatch(/[^\w$.]new[^\w$]/);
    });

    it('a global variable named `this` next to a method whose receiver is `this`', async () => {
        const plots = await run(`
type T
    float v = 1
method get(T this) => this.v
this = close
t = T.new(3)
plot(t.get() + this, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c + 3));
    });

    it('a parameter shadows a same-named global that had to be renamed', async () => {
        const plots = await run(`
new = 100
f(new) => new + 1
plot(f(close) + new, "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c + 1 + 100));
    });

    it('named arguments to a function whose name had to be renamed', async () => {
        const plots = await run(`
delete(a, b) => a - b
plot(delete(b = 1, a = close), "D")`);
        expectSeriesClose(values(plots, 'D'), values(plots, 'C').map((c) => c - 1));
    });

    it('shadowing `NaN` / `undefined` does not break na handling', async () => {
        const plots = await run(`
NaN = 5
undefined = close
x = bar_index > 0 ? undefined : na
plot(nz(x, NaN), "D")`);
        const c = values(plots, 'C');
        expectSeriesClose(values(plots, 'D'), c.map((v, i) => (i > 0 ? v : 5)));
    });
});
