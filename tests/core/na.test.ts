import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('na (dual-use identifier)', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('bare na returns NaN', async () => {
        const { result } = await pineTS.run(($) => {
            const { na } = $.pine;
            let val = na;
            return { val };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.val[0]).toBeNaN();
    });

    it('na() checks if value is NaN — true case', async () => {
        const { result } = await pineTS.run(($) => {
            const { na } = $.pine;
            let val = na;
            let check = na(val);
            return { check };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.check[0]).toBe(true);
    });

    it('na() checks if value is NaN — false case', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na } = $.pine;
            let check = na(close);
            return { check };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        expect(result.check[0]).toBe(false);
    });

    it('na as function argument to nz()', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na, nz } = $.pine;
            let val = nz(close, na);
            return { val };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // close is a valid number, so nz returns close (not NaN)
        expect(result.val[0]).not.toBeNaN();
    });

    it('na in conditional expression', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na } = $.pine;
            let val = close > 0 ? na : close;
            return { val };
        }, undefined, undefined, { sourceMode: 'trustedJavaScript' });

        // close > 0 is true, so val = na = NaN
        expect(result.val[0]).toBeNaN();
    });

    it('na works with Pine Script syntax', async () => {
        const code = `
//@version=5
indicator("NA Test")
val = na
check = na(close)
plot(check ? 1 : 0, "check")
`;
        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(plots['check']).toBeDefined();
        // close is a valid number, so na(close) = false, plot = 0
        expect(plots['check'].data[0].value).toBe(0);
    });

    it('na as a default parameter value is detected by na(x) inside the function', async () => {
        // Regression for a bug where Pine functions declaring `param = na`
        // would have the parameter hold the NAHelper instance when the caller
        // omitted the argument. `na(param)` returned false on the helper
        // object — letting subsequent code overwrite valid values with the
        // helper itself.
        // The Range-Average-Retest indicator hits this pattern via:
        //   updateAreaValues(area a_rea, float areaHigh, float areaLow) =>
        //       if not na(areaHigh)
        //           a_rea.areaHigh := areaHigh
        //       if not na(areaLow)
        //           a_rea.areaLow := areaLow
        //   updateLastArea(float areaHigh = na, float areaLow = na) =>
        //       updateAreaValues(a_rea, areaHigh, areaLow)
        //   // caller passes only areaHigh → areaLow must remain unchanged
        const code = `
//@version=5
indicator("NA Default Param")

type holder
    float h
    float l

setBoth(holder x, float a = na, float b = na) =>
    if not na(a)
        x.h := a
    if not na(b)
        x.l := b

obj = holder.new(100.0, 200.0)
setBoth(obj, 999.0)        // only \`a\` provided — \`b\` defaults to na, l must stay 200
plot(obj.h, "h")
plot(obj.l, "l")
plot(na(obj.l) ? 1 : 0, "l_is_na")
`;
        const { plots } = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(plots['h'].data[0].value).toBe(999);
        // l was 200 before the call. It must stay 200 — must NOT be clobbered
        // by the NAHelper instance from the default value of `b`.
        expect(plots['l'].data[0].value).toBe(200);
        expect(plots['l_is_na'].data[0].value).toBe(0);
    });

    // ── Regression: built-in type-name calls are typed-na, not constructors ──
    // Pine `box(na)`, `line(na)`, `label(na)` etc. are TYPE CASTS that produce
    // a typed-na value — they do NOT call the constructor.
    // PineTS used to alias `box.any(...)` directly to `box.new(...)`, so
    // `box(na)` would create an empty BoxObject with NaN coordinates instead
    // of a na value. This polluted the helper with placeholder objects that
    // showed up on the chart at NaN positions.
    it('box(na), line(na), label(na) are typed-na, not constructor calls', async () => {
        const code = `
//@version=5
indicator("typed-na test", overlay=true)
box bx = box(na)
line ln = line(na)
label lb = label(na)
plot(na(bx) ? 1 : 0, "bx_na")
plot(na(ln) ? 1 : 0, "ln_na")
plot(na(lb) ? 1 : 0, "lb_na")
`;
        const r = await pineTS.run(code, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        // All three should be na — no actual drawings should be created.
        expect(r.plots['bx_na'].data[0].value).toBe(1);
        expect(r.plots['ln_na'].data[0].value).toBe(1);
        expect(r.plots['lb_na'].data[0].value).toBe(1);
        // Also verify the helpers contain no objects
        const [labelH, lineH, boxH] = r._drawingHelpers || [];
        expect(boxH._boxes.length).toBe(0);
        expect(lineH._lines.length).toBe(0);
        expect(labelH._labels.length).toBe(0);
    });
});
