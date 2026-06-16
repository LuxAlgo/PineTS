import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { Indicator } from '../../src/Indicator';

describe('PineTS Indicator Inputs', () => {
    it('should pass inputs to the context', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h');
        
        const inputs = {
            length: 14,
            source: 'close'
        };

        // Use direct property access or implicit injection
        const indicator = new Indicator(($) => {
            return $.inputs;
        }, inputs);

        const context = await pineTS.run(indicator);
        
        expect(context.inputs).toBeDefined();
        expect(context.inputs.length).toBe(14);
        expect(context.inputs.source).toBe('close');
        expect(context.result).toBeDefined();
        // Result is pushed every bar. Result is object inputs.
        // The result property in context stores the return value of the function.
        // If the function returns an object { length: 14, source: 'close' }, then context.result might be an array of objects or an object of arrays?
        // PineTS collects results. If return is object:
        // context.result[key] = []
        
        // Let's inspect how results are collected in PineTS.class.ts
        // if typeof result === 'object' ... for let key in result ... context.result[key].push(val)
        
        expect(context.result.length).toBeDefined();
        expect(context.result.source).toBeDefined();
        
        // Check last value
        expect(context.result.length[context.result.length.length - 1]).toBe(14);
        expect(context.result.source[context.result.source.length - 1]).toBe('close');
    });

    it('should use default inputs if not provided', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h');
        
        const indicator = new Indicator(($) => {
            return $.inputs;
        });

        const context = await pineTS.run(indicator);
        
        expect(context.inputs).toBeDefined();
        expect(Object.keys(context.inputs).length).toBe(0);
    });

    it('should work with paginated run', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h');
        
        const inputs = {
            threshold: 50
        };

        const indicator = new Indicator(($) => {
            return $.inputs.threshold;
        }, inputs);

        const iterator = pineTS.run(indicator, undefined, 10);
        let count = 0;
        
        for await (const ctx of iterator) {
            expect(ctx.inputs).toBeDefined();
            expect(ctx.inputs.threshold).toBe(50);
            
            // Result here is scalar return, so context.result is array
            const lastResult = ctx.result[ctx.result.length - 1];
            expect(lastResult).toBe(50);
            
            count++;
            if (count > 2) break;
        }
    });
});

describe('Const/variable resolution in input arguments', () => {
    const metaFor = (code: string, title: string) =>
        new Indicator(code).getInputsMeta().find((m) => m.title === title);

    it('resolves const references in defval and string args', () => {
        const code = `//@version=6
indicator("C")
const string GRP = "Indicator Settings"
const string INL = "Moving Average"
const string TT  = "Lookback period."
const int    DEF = 14
len = input.int(DEF, "Length", group = GRP, inline = INL, tooltip = TT)
plot(close)`;
        const m = metaFor(code, 'Length');
        expect(m?.defval).toBe(14);
        expect(m?.group).toBe('Indicator Settings');
        expect(m?.inline).toBe('Moving Average');
        expect(m?.tooltip).toBe('Lookback period.');
    });

    it('resolves a non-const (simple) literal assignment too', () => {
        const code = `//@version=6
indicator("C")
MY_STRING = "STRING"
s = input.string(MY_STRING, "Str")
plot(close)`;
        expect(metaFor(code, 'Str')?.defval).toBe('STRING');
    });

    it('resolves chained const references', () => {
        const code = `//@version=6
indicator("C")
const int BASE = 5
const int LEN  = BASE
n = input.int(LEN, "N")
plot(close)`;
        expect(metaFor(code, 'N')?.defval).toBe(5);
    });

    it('resolves a const color (incl. color.new) to #RRGGBBAA', () => {
        const code = `//@version=6
indicator("C")
const color LINE = color.new(#26a69a, 50)
c = input.color(LINE, "Line")
plot(close)`;
        expect(metaFor(code, 'Line')?.defval).toBe('#26A69A80');
    });

    it('falls back to the bare name for unresolvable (computed) references', () => {
        const code = `//@version=6
indicator("C")
ma = ta.sma(close, 5)
n = input.int(20, "N", tooltip = ma)
plot(close)`;
        // ma is a computed series, not a literal const → tooltip stays the name.
        expect(metaFor(code, 'N')?.tooltip).toBe('ma');
        expect(metaFor(code, 'N')?.defval).toBe(20);
    });
});

describe('Input varId resolution (.input keyed by variable name)', () => {
    const ind = (code: string) => new Indicator(code);

    it('exposes varId on every scanned input', () => {
        const metas = ind(`//@version=6
indicator("T")
length = input.int(14, "Length")
src    = input.source(close, "Source")
plot(close)`).getInputsMeta();
        expect(metas.map((m) => m.varId)).toEqual(['length', 'src']);
    });

    it('keys .input by varId (primary) and forwards overrides under the varId', () => {
        const i = ind(`//@version=6
indicator("T")
length = input.int(14, "Length")
plot(close)`);
        i.input['length'] = 99;
        expect(i.input['length']).toBe(99);
        expect(i.getRuntimeInputs()['length']).toBe(99); // canonical varId key
    });

    it('still resolves by title as a fallback alias (back-compat)', () => {
        const i = ind(`//@version=6
indicator("T")
length = input.int(14, "Length")
plot(close)`);
        i.input['Length'] = 77;             // title alias
        expect(i.input['Length']).toBe(77);
        expect(i.input['length']).toBe(77); // same slot as the varId
        expect(i.getRuntimeInputs()['length']).toBe(77); // stored under the canonical varId
    });

    it('Object.keys lists varIds; title alias is accessible but not enumerated', () => {
        const i = ind(`//@version=6
indicator("T")
length = input.int(14, "Length")
plot(close)`);
        expect(Object.keys(i.input)).toEqual(['length']);
        expect('Length' in i.input).toBe(true);  // alias resolves
        expect('length' in i.input).toBe(true);
    });

    it('isolates duplicate titles by varId', () => {
        const i = ind(`//@version=6
indicator("T")
a = input.int(10, "Length")
b = input.int(20, "Length")
plot(close)`);
        i.input['b'] = 555;
        const rt = i.getRuntimeInputs();
        expect(rt['b']).toBe(555);
        expect(rt['a']).toBeUndefined();    // 'a' untouched
        // title aliases the FIRST input only
        i.input['Length'] = 1;
        expect(i.input['a']).toBe(1);
    });

    it('makes empty/untitled inputs overridable by varId', () => {
        const i = ind(`//@version=6
indicator("T")
x = input.int(5, "")
y = input.int(6)
plot(close)`);
        i.input['x'] = 42;
        i.input['y'] = 43;
        const rt = i.getRuntimeInputs();
        expect(rt['x']).toBe(42);
        expect(rt['y']).toBe(43);
        expect(Object.keys(i.input)).toEqual(['x', 'y']);
    });

    it('rejects an unknown key (neither varId nor title)', () => {
        const i = ind(`//@version=6
indicator("T")
length = input.int(14, "Length")
plot(close)`);
        expect(() => { (i.input as any)['nope'] = 1; }).toThrow(/unknown input key/i);
    });
});

import { normalizeColorToRgbaHex } from '../../src/namespaces/color/PineColor';

describe('Color input defval normalization (getInputsMeta)', () => {
    const metaFor = (code: string, title: string) =>
        new Indicator(code).getInputsMeta().find((m) => m.title === title);

    it('normalizes a #RRGGBB hex literal to #RRGGBBAA (opaque alpha)', () => {
        const m = metaFor(`//@version=6
indicator("C")
c = input.color(#ff0000, "Line")
plot(close)`, 'Line');
        expect(m?.type).toBe('color');
        expect(m?.defval).toBe('#FF0000FF');
    });

    it('resolves a named color constant to its RGBA hex', () => {
        const m = metaFor(`//@version=6
indicator("C")
c = input.color(color.red, "Line")
plot(close)`, 'Line');
        expect(m?.defval).toBe('#F23645FF'); // color.red = #F23645
    });

    it('preserves an explicit alpha byte and uppercases the result', () => {
        const m = metaFor(`//@version=6
indicator("C")
c = input.color(#00bcd480, "Line")
plot(close)`, 'Line');
        expect(m?.defval).toBe('#00BCD480');
    });

    it('normalizes the bare input() auto-detected color form', () => {
        const m = metaFor(`//@version=6
indicator("C")
c = input(#336699, "Line")
plot(close)`, 'Line');
        expect(m?.type).toBe('color');
        expect(m?.defval).toBe('#336699FF');
    });

    it('keeps .input reads consistent with the normalized meta', () => {
        const ind = new Indicator(`//@version=6
indicator("C")
c = input.color(color.blue, "Line")
plot(close)`);
        ind.getInputsMeta(); // trigger scan
        expect(ind.input['Line']).toBe('#2196F3FF'); // color.blue = #2196F3
    });

    it('statically evaluates color.new(col, transp) defaults', () => {
        // transp 50 → alpha 0.5 → 0x80
        const m = metaFor(`//@version=6
indicator("C")
c = input.color(color.new(#26a69a, 50), "Line")
plot(close)`, 'Line');
        expect(m?.defval).toBe('#26A69A80');
    });

    it('evaluates color.new with a named-constant base', () => {
        const m = metaFor(`//@version=6
indicator("C")
c = input.color(color.new(color.teal, 0), "Line")
plot(close)`, 'Line');
        expect(m?.defval).toBe('#089981FF'); // color.teal = #089981, transp 0 = opaque
    });

    it('statically evaluates color.rgb(r,g,b) and color.rgb(r,g,b,transp)', () => {
        const opaque = metaFor(`//@version=6
indicator("C")
c = input.color(color.rgb(6, 162, 47), "Line")
plot(close)`, 'Line');
        expect(opaque?.defval).toBe('#06A22FFF');

        const withTransp = metaFor(`//@version=6
indicator("C")
c = input.color(color.rgb(207, 23, 23, 50), "Line")
plot(close)`, 'Line');
        expect(withTransp?.defval).toBe('#CF171780');
    });

    it('leaves non-color input defaults untouched', () => {
        const ind = new Indicator(`//@version=6
indicator("C")
len = input.int(14, "Length")
src = input.string("EMA", "Type")
plot(close)`);
        const metas = ind.getInputsMeta();
        expect(metas.find((m) => m.title === 'Length')?.defval).toBe(14);
        expect(metas.find((m) => m.title === 'Type')?.defval).toBe('EMA');
    });
});

describe('normalizeColorToRgbaHex (unit)', () => {
    it('expands 6-digit hex to opaque RGBA', () => {
        expect(normalizeColorToRgbaHex('#ff0000')).toBe('#FF0000FF');
    });
    it('passes 8-digit hex through (uppercased)', () => {
        expect(normalizeColorToRgbaHex('#aabbccdd')).toBe('#AABBCCDD');
    });
    it('resolves named constants with and without the namespace', () => {
        expect(normalizeColorToRgbaHex('color.green')).toBe('#4CAF50FF');
        expect(normalizeColorToRgbaHex('teal')).toBe('#089981FF');
    });
    it('converts rgb()/rgba() to RGBA hex (a in 0..1 → alpha byte)', () => {
        expect(normalizeColorToRgbaHex('rgb(255, 0, 0)')).toBe('#FF0000FF');
        expect(normalizeColorToRgbaHex('rgba(255, 0, 0, 0.5)')).toBe('#FF000080');
    });
    it('returns non-color / unparseable values unchanged', () => {
        expect(normalizeColorToRgbaHex('not a color')).toBe('not a color');
        expect(normalizeColorToRgbaHex(42)).toBe(42);
        expect(normalizeColorToRgbaHex(undefined)).toBe(undefined);
    });
});
