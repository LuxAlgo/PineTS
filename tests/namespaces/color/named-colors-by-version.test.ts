import { describe, expect, it } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Indicator } from '../../../src/Indicator';
import { Provider } from '@pinets/marketData/Provider.class';

// RGB of every named color as TradingView reports it (color.r/g/b) in each Pine version.
// Pine v6 changed red, teal and yellow; the other 14 are the same in both versions.
const TV_RGB: Record<number, Record<string, [number, number, number]>> = {
    5: {
        aqua: [0, 188, 212], black: [54, 58, 69], blue: [41, 98, 255], fuchsia: [224, 64, 251], gray: [120, 123, 134],
        green: [76, 175, 80], lime: [0, 230, 118], maroon: [136, 14, 79], navy: [49, 27, 146], olive: [128, 128, 0],
        orange: [255, 152, 0], purple: [156, 39, 176], red: [255, 82, 82], silver: [178, 181, 190], teal: [0, 137, 123],
        white: [255, 255, 255], yellow: [255, 235, 59],
    },
    6: {
        aqua: [0, 188, 212], black: [54, 58, 69], blue: [41, 98, 255], fuchsia: [224, 64, 251], gray: [120, 123, 134],
        green: [76, 175, 80], lime: [0, 230, 118], maroon: [136, 14, 79], navy: [49, 27, 146], olive: [128, 128, 0],
        orange: [255, 152, 0], purple: [156, 39, 176], red: [242, 54, 69], silver: [178, 181, 190], teal: [8, 153, 129],
        white: [255, 255, 255], yellow: [253, 216, 53],
    },
};

describe('named colors follow the script Pine version', () => {
    it.each([5, 6])('v%i: every named color has TradingView RGB components', async (version) => {
        const names = Object.keys(TV_RGB[version]);
        const plots = names
            .flatMap((n) => [`plot(color.r(color.${n}), "${n}_r")`, `plot(color.g(color.${n}), "${n}_g")`, `plot(color.b(color.${n}), "${n}_b")`])
            .join('\n');
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime());
        const ctx = await pineTS.run(`//@version=${version}\nindicator("palette")\n${plots}\n`);
        for (const n of names) {
            const rgb = ['r', 'g', 'b'].map((c) => ctx.plots[`${n}_${c}`].data.at(-1).value);
            expect(rgb, `${n} in v${version}`).toEqual(TV_RGB[version][n]);
        }
    });

    it('v5 color.new keeps the v5 red', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-06-01').getTime(), new Date('2019-07-01').getTime());
        const ctx = await pineTS.run(`//@version=5
indicator("color.new")
c = color.new(color.red, 50)
plot(color.r(c), "r")
plot(color.t(c), "t")
`);
        expect(ctx.plots.r.data.at(-1).value).toBe(255);
        expect(ctx.plots.t.data.at(-1).value).toBe(50);
    });

    it('color input defaults use the palette of the script version', () => {
        const meta = (v: number) => new Indicator(`//@version=${v}\nindicator("x")\nc = input.color(color.red, "C")\nplot(close, color = c)`).getInputsMeta()[0].defval;
        expect(meta(5)).toBe('#FF5252FF');
        expect(meta(6)).toBe('#F23645FF');
    });
});
