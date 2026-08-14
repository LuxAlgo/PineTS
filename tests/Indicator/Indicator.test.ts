// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect, vi } from 'vitest';
import { Indicator } from '../../src/Indicator';
import { PineTS } from '../../src/PineTS.class';

function makeData(n = 30) {
    const out: any[] = [];
    const t0 = new Date('2024-01-01T00:00:00Z').getTime();
    const DAY = 86_400_000;
    for (let i = 0; i < n; i++) {
        const base = 100 + i * 0.6;
        out.push({
            openTime: t0 + i * DAY,
            open: base, high: base + 1.5, low: base - 0.8, close: base + 0.4,
            volume: 1000, closeTime: t0 + (i + 1) * DAY - 1,
        });
    }
    return out;
}

describe('Indicator', () => {

    describe('input discovery from Pine source', () => {
        it('harvests every input.* type with title-keyed defaults', () => {
            const code = `
//@version=6
indicator("Test")
len    = input.int(14, "Length")
mult   = input.float(2.0, "Mult", minval=0.1, maxval=10.0, step=0.1)
on     = input.bool(true, "On")
src    = input.source(close, "Source")
sym    = input.symbol("AAPL", "Symbol")
tf     = input.timeframe("1D", "Timeframe")
sess   = input.session("0930-1600", "Session")
maType = input.string("EMA", "Type", options=["EMA", "SMA"])
col    = input.color(#ff0000, "Color")
msg    = input.text_area("hi", "Message")
plot(close)
`;
            const ind = new Indicator(code);
            const view = ind.input as Record<string, unknown>;

            expect(view['Length']).toBe(14);
            expect(view['Mult']).toBe(2);
            expect(view['On']).toBe(true);
            expect(view['Source']).toBe('close');
            expect(view['Symbol']).toBe('AAPL');
            expect(view['Timeframe']).toBe('1D');
            expect(view['Session']).toBe('0930-1600');
            expect(view['Type']).toBe('EMA');
            expect(view['Color']).toBe('#FF0000FF'); // color defaults normalize to #RRGGBBAA
            expect(view['Message']).toBe('hi');
        });

        it('resolves enum field references to their titles (TradingView semantics)', () => {
            const code = `
//@version=6
indicator("Test")

enum tz
    utc = "UTC"
    ny  = "America/New_York"
    lon = "Europe/London"

selected = input.enum(tz.utc, "TZ", options=[tz.utc, tz.ny, tz.lon])
plot(close)
`;
            const ind = new Indicator(code);
            const meta = ind.getInputsMeta();
            expect(meta).toHaveLength(1);
            expect(meta[0].type).toBe('enum');
            expect(meta[0].defval).toBe('UTC');
            expect(meta[0].options).toEqual(['UTC', 'America/New_York', 'Europe/London']);
            expect((ind.input as any)['TZ']).toBe('UTC');
        });

        it('auto-types bare input(defval, ...) from the defval', () => {
            const code = `
//@version=6
indicator("Test")
a = input(42, "Int")
b = input(3.14, "Float")
c = input("hi", "String")
d = input(true, "Bool")
plot(close)
`;
            const meta = new Indicator(code).getInputsMeta();
            expect(meta.map((m) => m.type)).toEqual(['int', 'float', 'string', 'bool']);
        });

        it('returns an empty array for JS-function source', () => {
            const ind = new Indicator(($: any) => { return $.data.close[0]; });
            expect(ind.getInputsMeta()).toEqual([]);
            expect(Object.keys(ind.input)).toEqual([]);
        });
    });

    describe('input proxy: frozen container, mutable values', () => {
        const code = `
//@version=6
indicator("X")
len = input.int(14, "Length", minval=5, maxval=100)
on  = input.bool(true, "On")
ma  = input.string("EMA", "MA", options=["EMA", "SMA"])
plot(close)
`;

        it('allows per-key mutation', () => {
            const ind = new Indicator(code);
            (ind.input as any)['Length'] = 20;
            expect((ind.input as any)['Length']).toBe(20);
        });

        it('rejects replacement of the .input container', () => {
            const ind = new Indicator(code);
            expect(() => { (ind as any).input = { Length: 5 }; }).toThrow(/cannot be replaced/i);
        });

        it('rejects unknown keys', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.input as any)['Nope'] = 1; }).toThrow(/unknown input key/i);
        });

        it('rejects deletion', () => {
            const ind = new Indicator(code);
            expect(() => { delete (ind.input as any)['Length']; }).toThrow(/cannot delete/i);
        });

        it('rejects int when given a float', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.input as any)['Length'] = 3.7; }).toThrow(/expects an int/i);
        });

        it('rejects values outside minval/maxval', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.input as any)['Length'] = 4; }).toThrow(/below minval/i);
            expect(() => { (ind.input as any)['Length'] = 101; }).toThrow(/above maxval/i);
        });

        it('rejects values not in options', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.input as any)['MA'] = 'WMA'; }).toThrow(/not one of/i);
        });

        it('rejects wrong type on bool input', () => {
            const ind = new Indicator(code);
            expect(() => { (ind.input as any)['On'] = 'yes'; }).toThrow(/expects a boolean/i);
        });
    });

    describe('runtime inputs flow', () => {
        it('propagates .input overrides to runtime resolveInput', async () => {
            const code = `
//@version=6
indicator("LengthDemo")
len = input.int(14, "Length")
if not barstate.islast
    log.info('{0}', len)
`;
            const ind = new Indicator(code);
            // Write via the title alias; it canonicalizes to the varId.
            (ind.input as any)['Length'] = 33;

            const pine = new PineTS(makeData(5));
            await pine.run(ind);

            // Overrides are forwarded under the canonical varId ('len').
            const inputs = ind.getRuntimeInputs();
            expect(inputs['len']).toBe(33);
            // Reading back through either key reflects the override.
            expect((ind.input as any)['len']).toBe(33);
            expect((ind.input as any)['Length']).toBe(33);
        });

        it('explicit .input override takes priority over legacy constructor inputs', async () => {
            const code = `
//@version=6
indicator("Demo")
len = input.int(14, "Length")
plot(len, "out")
`;
            // Legacy constructor map is TITLE-keyed; resolveInput falls back to it.
            const ind = new Indicator(code, { 'Length': 7 });
            expect(ind.getRuntimeInputs()['Length']).toBe(7);

            // Explicit .input write is VARID-keyed and resolveInput checks varId
            // BEFORE title, so it wins at runtime even though the legacy title
            // entry is still present in the map.
            (ind.input as any)['Length'] = 20;
            const rt = ind.getRuntimeInputs();
            expect(rt['len']).toBe(20);       // canonical override
            expect(rt['Length']).toBe(7);     // legacy entry untouched

            const ctx = await new PineTS(makeData(5)).run(ind);
            const out = ctx.plots['out'].data;
            expect(out[out.length - 1].value).toBe(20); // varId override wins at runtime
        });
    });

    describe('prepare() caching', () => {
        it('idempotent: calling prepare() twice returns the same artifact', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            const a = ind.prepare();
            const b = ind.prepare();
            expect(a).toBe(b);
            expect(typeof a.fn).toBe('function');
        });

        it('detects visible-range usage', () => {
            const code = `
//@version=6
indicator("VR", overlay=true)
t = chart.left_visible_bar_time
plot(close)
`;
            const ind = new Indicator(code);
            expect(ind.usesVisibleRange()).toBe(true);
        });

        it('reports false for non-viewport scripts', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            expect(ind.usesVisibleRange()).toBe(false);
        });
    });

    describe('Indicator.from()', () => {
        it('wraps raw functions', () => {
            const fn = ($: any) => $.data.close[0];
            const ind = Indicator.from(fn);
            expect(ind.source).toBe(fn);
        });

        it('wraps raw strings', () => {
            const src = `//@version=6\nindicator("X")\nplot(close)`;
            const ind = Indicator.from(src);
            expect(ind.source).toBe(src);
        });

        it('passes through existing Indicators', () => {
            const ind = new Indicator(`//@version=6\nindicator("X")\nplot(close)`);
            expect(Indicator.from(ind)).toBe(ind);
        });
    });

    describe('duplicate titles', () => {
        it('keeps both (distinguished by varId), no warning', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            try {
                const code = `
//@version=6
indicator("Dup")
a = input.int(14, "Length")
b = input.int(20, "Length")
plot(close)
`;
                const ind = new Indicator(code);
                const meta = ind.getInputsMeta();
                // Both surface now — distinct varIds, shared title.
                expect(meta).toHaveLength(2);
                expect(meta.map((m) => m.varId)).toEqual(['a', 'b']);
                expect(meta.map((m) => m.defval)).toEqual([14, 20]);
                expect(meta.every((m) => m.title === 'Length')).toBe(true);
                // No duplicate-varId collision → no warning.
                expect(warn).not.toHaveBeenCalled();
                // Each is addressable by its varId; title aliases the first.
                expect(Object.keys(ind.input)).toEqual(['a', 'b']);
            } finally {
                warn.mockRestore();
            }
        });
    });
});
