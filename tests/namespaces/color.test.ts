// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import PineTS from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('Color Namespace', () => {
    it('should have all standard color constants', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            return {
                // Standard colors
                white: color.white,
                black: color.black,
                red: color.red,
                green: color.green,
                blue: color.blue,
                yellow: color.yellow,
                orange: color.orange,
                purple: color.purple,
                gray: color.gray,
                // Additional colors
                aqua: color.aqua,
                fuchsia: color.fuchsia,
                olive: color.olive,
                navy: color.navy,
                teal: color.teal,
                silver: color.silver,
                lime: color.lime,
                maroon: color.maroon,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        // Verify color constants are defined
        expect(last(result.white)).toBe('#FFFFFF');
        expect(last(result.black)).toBe('#000000');
        expect(last(result.red)).toBe('#FF0000');
        expect(last(result.green)).toBe('#008000');
        expect(last(result.blue)).toBe('#0000FF');
        expect(last(result.yellow)).toBe('#FFFF00');
        expect(last(result.orange)).toBe('#FFA500');
        expect(last(result.purple)).toBe('#800080');
        expect(last(result.gray)).toBe('#808080');
        expect(last(result.aqua)).toBe('#00FFFF');
        expect(last(result.fuchsia)).toBe('#FF00FF');
        expect(last(result.olive)).toBe('#808000');
        expect(last(result.navy)).toBe('#000080');
        expect(last(result.teal)).toBe('#008080');
        expect(last(result.silver)).toBe('#C0C0C0');
        expect(last(result.lime)).toBe('#00FF00');
        expect(last(result.maroon)).toBe('#800000');
    });

    it('should create colors with color.rgb()', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            return {
                rgb_red: color.rgb(255, 0, 0),
                rgb_green: color.rgb(0, 255, 0),
                rgb_blue: color.rgb(0, 0, 255),
                rgb_with_alpha: color.rgb(255, 128, 64, 50), // 50% transparency
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.rgb_red)).toBe('rgb(255, 0, 0)');
        expect(last(result.rgb_green)).toBe('rgb(0, 255, 0)');
        expect(last(result.rgb_blue)).toBe('rgb(0, 0, 255)');
        expect(last(result.rgb_with_alpha)).toBe('rgba(255, 128, 64, 0.5)');
    });

    it('should create colors with color.new()', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            return {
                new_hex: color.new('#FF5500'),
                new_hex_alpha: color.new('#FF5500', 25), // 25% transparency
                new_rgb: color.new('rgb(100, 150, 200)'),
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.new_hex)).toBe('rgb(255, 85, 0)');
        expect(last(result.new_hex_alpha)).toBe('rgba(255, 85, 0, 0.75)');
    });

    it('should extract color components with r(), g(), b(), t()', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // Test with hex color
            const hex_r = color.r('#FF8040');
            const hex_g = color.g('#FF8040');
            const hex_b = color.b('#FF8040');
            const hex_t = color.t('#FF8040');

            // Test with rgb color
            const rgb_r = color.r('rgb(100, 150, 200)');
            const rgb_g = color.g('rgb(100, 150, 200)');
            const rgb_b = color.b('rgb(100, 150, 200)');

            // Test with rgba color (50% transparency)
            const rgba_t = color.t('rgba(255, 0, 0, 0.5)');

            // Test with named color
            const named_r = color.r(color.red);
            const named_g = color.g(color.green);
            const named_b = color.b(color.blue);

            return {
                hex_r,
                hex_g,
                hex_b,
                hex_t,
                rgb_r,
                rgb_g,
                rgb_b,
                rgba_t,
                named_r,
                named_g,
                named_b,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        // Hex color #FF8040 = RGB(255, 128, 64)
        expect(last(result.hex_r)).toBe(255);
        expect(last(result.hex_g)).toBe(128);
        expect(last(result.hex_b)).toBe(64);
        expect(last(result.hex_t)).toBe(0); // Fully opaque

        // RGB color
        expect(last(result.rgb_r)).toBe(100);
        expect(last(result.rgb_g)).toBe(150);
        expect(last(result.rgb_b)).toBe(200);

        // RGBA transparency (0.5 alpha = 50% transparency)
        expect(last(result.rgba_t)).toBe(50);

        // Named colors
        expect(last(result.named_r)).toBe(255); // Red has R=255
        expect(last(result.named_g)).toBe(128); // Green (#008000) has G=128
        expect(last(result.named_b)).toBe(255); // Blue has B=255
    });

    it('should create gradient colors with from_gradient()', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // Gradient from red to green
            const gradient_start = color.from_gradient(0, 0, 100, '#FF0000', '#00FF00');
            const gradient_mid = color.from_gradient(50, 0, 100, '#FF0000', '#00FF00');
            const gradient_end = color.from_gradient(100, 0, 100, '#FF0000', '#00FF00');

            // Gradient from black to white
            const bw_quarter = color.from_gradient(25, 0, 100, '#000000', '#FFFFFF');
            const bw_half = color.from_gradient(50, 0, 100, '#000000', '#FFFFFF');
            const bw_three_quarter = color.from_gradient(75, 0, 100, '#000000', '#FFFFFF');

            // Value outside range (should clamp)
            const clamped_low = color.from_gradient(-50, 0, 100, '#FF0000', '#00FF00');
            const clamped_high = color.from_gradient(150, 0, 100, '#FF0000', '#00FF00');

            return {
                gradient_start,
                gradient_mid,
                gradient_end,
                bw_quarter,
                bw_half,
                bw_three_quarter,
                clamped_low,
                clamped_high,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        // At start (0%), should be red
        expect(last(result.gradient_start)).toBe('rgb(255, 0, 0)');
        // At end (100%), should be green
        expect(last(result.gradient_end)).toBe('rgb(0, 255, 0)');
        // At midpoint (50%), should be yellow-ish (128, 128, 0)
        expect(last(result.gradient_mid)).toBe('rgb(128, 128, 0)');

        // Black to white gradient
        expect(last(result.bw_quarter)).toBe('rgb(64, 64, 64)');
        expect(last(result.bw_half)).toBe('rgb(128, 128, 128)');
        expect(last(result.bw_three_quarter)).toBe('rgb(191, 191, 191)');

        // Clamped values
        expect(last(result.clamped_low)).toBe('rgb(255, 0, 0)'); // Clamped to start
        expect(last(result.clamped_high)).toBe('rgb(0, 255, 0)'); // Clamped to end
    });

    it('should handle edge cases in color functions', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-02').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { color } = context.pine;

            // Empty/invalid color handling
            const empty_r = color.r('');
            const null_gradient = color.from_gradient(NaN, 0, 100, '#FF0000', '#00FF00');

            // Same range values (should return midpoint or one of the colors)
            const same_range = color.from_gradient(50, 50, 50, '#FF0000', '#00FF00');

            return {
                empty_r,
                null_gradient,
                same_range,
            };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.empty_r)).toBe(0);
        expect(last(result.null_gradient)).toBe('');
        // When range is 0, position defaults to 0.5 (midpoint)
        expect(last(result.same_range)).toBe('rgb(128, 128, 0)');
    });
});
