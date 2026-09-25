import { describe, expect, it } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';

const last = (arr: any[]) => arr[arr.length - 1];

describe('Color Namespace', () => {
    const sDate = new Date('2019-01-01').getTime();
    const eDate = new Date('2019-01-05').getTime();

    // ── Predefined color constants ──────────────────────────────────

    it('should return all 17 predefined color constants', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        // Note: color constants are methods (not getters) because the transpiler
        // converts `color.white` → `color.white()` via KNOWN_NAMESPACES.
        // In tests (no transpilation), we must call them explicitly.
        const sourceCode = (context: any) => {
            const { color } = context.pine;
            return {
                aqua: color.aqua(),
                black: color.black(),
                blue: color.blue(),
                fuchsia: color.fuchsia(),
                gray: color.gray(),
                green: color.green(),
                lime: color.lime(),
                maroon: color.maroon(),
                navy: color.navy(),
                olive: color.olive(),
                orange: color.orange(),
                purple: color.purple(),
                red: color.red(),
                silver: color.silver(),
                teal: color.teal(),
                white: color.white(),
                yellow: color.yellow(),
            };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.aqua)).toBe('#00BCD4');
        expect(last(result.black)).toBe('#363A45');
        expect(last(result.blue)).toBe('#2962FF');
        expect(last(result.fuchsia)).toBe('#E040FB');
        expect(last(result.gray)).toBe('#787B86');
        expect(last(result.green)).toBe('#4CAF50');
        expect(last(result.lime)).toBe('#00E676');
        expect(last(result.maroon)).toBe('#880E4F');
        expect(last(result.navy)).toBe('#311B92');
        expect(last(result.olive)).toBe('#808000');
        expect(last(result.orange)).toBe('#FF9800');
        expect(last(result.purple)).toBe('#9C27B0');
        expect(last(result.red)).toBe('#F23645');
        expect(last(result.silver)).toBe('#B2B5BE');
        expect(last(result.teal)).toBe('#089981');
        expect(last(result.white)).toBe('#FFFFFF');
        expect(last(result.yellow)).toBe('#FDD835');
    });

    // ── color.new() ─────────────────────────────────────────────────

    it('color.new() should apply transparency to hex color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // No transparency
            const no_alpha = color.new('#FF0000');
            // 0% transparency = fully opaque (alpha byte FF)
            const zero_alpha = color.new('#FF0000', 0);
            // 50% transparency (alpha byte 7F due to floating-point: 2.55*50=127.49...)
            const half_alpha = color.new('#FF0000', 50);
            // 100% transparency = fully transparent (alpha byte 00)
            const full_alpha = color.new('#FF0000', 100);

            return { no_alpha, zero_alpha, half_alpha, full_alpha };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.no_alpha)).toBe('#FF0000');
        expect(last(result.zero_alpha)).toBe('#FF0000FF');
        expect(last(result.half_alpha)).toBe('#FF00007F');
        expect(last(result.full_alpha)).toBe('#FF000000');
    });

    it('color.new() should apply transparency to named color', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const red_50 = color.new(color.red(), 50);
            const white_100 = color.new(color.white(), 100);

            return { red_50, white_100 };
        };

        const { result } = await pineTS.run(sourceCode);

        // color.red = #F23645, 50% transparency -> alpha = 127 = 0x7F (floating-point rounding)
        expect(last(result.red_50)).toBe('#F236457F');
        // color.white = #FFFFFF, 100% transparency -> alpha = 0 = 0x00
        expect(last(result.white_100)).toBe('#FFFFFF00');
    });

    it('color.new() should handle na (NaN) gracefully', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color, na } = context.pine;

            // color(na) is a type-cast that passes through NaN
            const na_color = color.new(NaN);

            return { na_color };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.na_color)).toBeNaN();
    });

    it('color.new() should apply transparency to rgb() string input', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // color.rgb() returns "rgb(r,g,b)" string
            const rgb_input = color.rgb(207, 23, 23);
            // color.new() with rgb() input should produce valid hex, not "rgba(rgb(...), alpha)"
            const with_alpha = color.new(rgb_input, 85);
            const with_zero = color.new(rgb_input, 0);
            const no_alpha = color.new(rgb_input);

            return { rgb_input, with_alpha, with_zero, no_alpha };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.rgb_input)).toBe('rgb(207, 23, 23)');
        // 85% transparency → alpha = (100-85)/100*255 = 38.25 → 0x26
        expect(last(result.with_alpha)).toBe('#cf171726');
        // 0% transparency → fully opaque → alpha = FF
        expect(last(result.with_zero)).toBe('#cf1717FF');
        // No alpha arg → return as-is
        expect(last(result.no_alpha)).toBe('rgb(207, 23, 23)');
    });

    it('color.new() should replace alpha when input already has alpha (#RRGGBBAA)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // Simulate double color.new(): get_color() returns color.new(#00ff00, 0) = #00ff00FF
            const first_pass = color.new('#00ff00', 0);   // → "#00ff00FF"
            // Then bgcolor does color.new(first_pass, 85) — should REPLACE alpha, not append
            const second_pass = color.new(first_pass, 85); // → should be "#00ff0026", NOT "#00ff00FF26"

            // Also test with a named color double-wrap
            const red_opaque = color.new(color.red(), 0);   // → "#F23645FF"
            const red_semi = color.new(red_opaque, 50);      // → should be "#F236457F"

            return { first_pass, second_pass, red_opaque, red_semi };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.first_pass)).toBe('#00ff00FF');
        expect(last(result.second_pass)).toBe('#00ff0026');  // replaced alpha, not appended
        expect(last(result.red_opaque)).toBe('#F23645FF');
        expect(last(result.red_semi)).toBe('#F236457F');     // replaced alpha, not appended
    });

    it('color.new() should apply transparency to rgba() string input', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // color.rgb() with alpha returns "rgba(r,g,b,a)" string
            const rgba_input = color.rgb(100, 200, 50, 30);
            // color.new() should parse rgba() and apply new alpha
            const with_alpha = color.new(rgba_input, 50);

            return { rgba_input, with_alpha };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.rgba_input)).toBe('rgba(100, 200, 50, 0.7)');
        // 50% transparency → alpha = 127 → 0x7F
        expect(last(result.with_alpha)).toBe('#64c8327F');
    });

    // ── color.rgb() ─────────────────────────────────────────────────

    it('color.rgb() should create color from RGB components', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const no_alpha = color.rgb(255, 128, 0);
            const with_alpha = color.rgb(255, 128, 0, 50);

            return { no_alpha, with_alpha };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.no_alpha)).toBe('rgb(255, 128, 0)');
        expect(last(result.with_alpha)).toBe('rgba(255, 128, 0, 0.5)');
    });

    // ── color.from_gradient() ───────────────────────────────────────

    it('color.from_gradient() should interpolate between two colors', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // At bottom = pure black
            const at_bottom = color.from_gradient(0, 0, 100, '#000000', '#FFFFFF');
            // At top = pure white
            const at_top = color.from_gradient(100, 0, 100, '#000000', '#FFFFFF');
            // At midpoint = gray
            const at_mid = color.from_gradient(50, 0, 100, '#000000', '#FFFFFF');
            // Below bottom = clamped to bottom
            const below = color.from_gradient(-10, 0, 100, '#000000', '#FFFFFF');
            // Above top = clamped to top
            const above = color.from_gradient(200, 0, 100, '#000000', '#FFFFFF');

            return { at_bottom, at_top, at_mid, below, above };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.at_bottom)).toBe('#000000');
        expect(last(result.at_top)).toBe('#FFFFFF');
        // Midpoint of #000000 and #FFFFFF = #808080 (128, 128, 128)
        expect(last(result.at_mid)).toBe('#808080');
        expect(last(result.below)).toBe('#000000');
        expect(last(result.above)).toBe('#FFFFFF');
    });

    // ── Component extraction: color.r(), color.g(), color.b(), color.t() ──

    it('color.r() should extract red component (0-255)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const r_hex = color.r('#FF8040');
            const r_rgba = color.r('rgba(100, 200, 50, 0.5)');
            const r_na = color.r(NaN);

            return { r_hex, r_rgba, r_na };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.r_hex)).toBe(255);
        expect(last(result.r_rgba)).toBe(100);
        expect(last(result.r_na)).toBeNaN();
    });

    it('color.g() should extract green component (0-255)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const g_hex = color.g('#FF8040');
            const g_rgb = color.g('rgb(100, 200, 50)');

            return { g_hex, g_rgb };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.g_hex)).toBe(128);
        expect(last(result.g_rgb)).toBe(200);
    });

    it('color.b() should extract blue component (0-255)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const b_hex = color.b('#FF8040');
            const b_rgb = color.b('rgb(100, 200, 50)');

            return { b_hex, b_rgb };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.b_hex)).toBe(64);
        expect(last(result.b_rgb)).toBe(50);
    });

    it('color.t() should extract transparency (0-100, Pine scale)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // Fully opaque hex (#RRGGBB, no alpha) -> transparency = 0
            const t_opaque = color.t('#FF0000');
            // Hex with alpha byte FF (fully opaque) -> transparency = 0
            const t_hex_ff = color.t('#FF0000FF');
            // Hex with alpha byte 00 (fully transparent) -> transparency = 100
            const t_hex_00 = color.t('#FF000000');
            // rgba with alpha 0.5 -> transparency = 50
            const t_rgba = color.t('rgba(255, 0, 0, 0.5)');
            // na input -> NaN
            const t_na = color.t(NaN);

            return { t_opaque, t_hex_ff, t_hex_00, t_rgba, t_na };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.t_opaque)).toBe(0);
        expect(last(result.t_hex_ff)).toBe(0);
        expect(last(result.t_hex_00)).toBe(100);
        expect(last(result.t_rgba)).toBe(50);
        expect(last(result.t_na)).toBeNaN();
    });

    // ── color.any() — type-cast ─────────────────────────────────────

    it('color.any() should pass through values (type-cast)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const cast_na = color.any(NaN);
            const cast_hex = color.any('#FF0000');

            return { cast_na, cast_hex };
        };

        const { result } = await pineTS.run(sourceCode);

        // color(na) returns null (Pine Script na for colors, not NaN)
        expect(last(result.cast_na)).toBeNull();
        expect(last(result.cast_hex)).toBe('#FF0000');
    });

    // ── Roundtrip: create color then extract components ─────────────

    it('should roundtrip: rgb() -> r/g/b extraction', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            const c = color.rgb(100, 150, 200);
            const r = color.r(c);
            const g = color.g(c);
            const b = color.b(c);
            const t = color.t(c);

            return { r, g, b, t };
        };

        const { result } = await pineTS.run(sourceCode);

        expect(last(result.r)).toBe(100);
        expect(last(result.g)).toBe(150);
        expect(last(result.b)).toBe(200);
        expect(last(result.t)).toBe(0); // No transparency
    });

    it('should roundtrip: from_gradient() -> component extraction', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // Gradient from red to blue at midpoint
            const c = color.from_gradient(50, 0, 100, '#FF0000', '#0000FF');
            const r = color.r(c);
            const g = color.g(c);
            const b = color.b(c);

            return { r, g, b };
        };

        const { result } = await pineTS.run(sourceCode);

        // Midpoint between red(255,0,0) and blue(0,0,255) = (128,0,128)
        expect(last(result.r)).toBe(128);
        expect(last(result.g)).toBe(0);
        expect(last(result.b)).toBe(128);
    });
});
