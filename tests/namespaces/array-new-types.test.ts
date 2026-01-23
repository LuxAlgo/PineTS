// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Array New Types', () => {
    describe('array.new_box()', () => {
        it('should create an empty box array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let boxArr = array.new_box();
                let size = array.size(boxArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });

        it('should create a box array with initial size', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let boxArr = array.new_box(5);
                let size = array.size(boxArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(5);
        });
    });

    describe('array.new_color()', () => {
        it('should create an empty color array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let colorArr = array.new_color();
                let size = array.size(colorArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });

        it('should create a color array with initial size and value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, color, plotchar } = context.pine;

                let colorArr = array.new_color(3, color.red);
                let size = array.size(colorArr);
                let first = array.get(colorArr, 0);

                plotchar(size, 'size');
                plotchar(first, 'first');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(3);
            expect(plots['first'].data[0].value).toBe('#FF0000');
        });
    });

    describe('array.new_label()', () => {
        it('should create an empty label array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let labelArr = array.new_label();
                let size = array.size(labelArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });

        it('should create a label array with initial size', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let labelArr = array.new_label(3);
                let size = array.size(labelArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(3);
        });
    });

    describe('array.new_line()', () => {
        it('should create an empty line array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let lineArr = array.new_line();
                let size = array.size(lineArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });

        it('should create a line array with initial size', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let lineArr = array.new_line(4);
                let size = array.size(lineArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(4);
        });
    });

    describe('array.new_linefill()', () => {
        it('should create an empty linefill array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let linefillArr = array.new_linefill();
                let size = array.size(linefillArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });

        it('should create a linefill array with initial size', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let linefillArr = array.new_linefill(2);
                let size = array.size(linefillArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(2);
        });
    });

    describe('array.new_table()', () => {
        it('should create an empty table array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let tableArr = array.new_table();
                let size = array.size(tableArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });

        it('should create a table array with initial size', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { array, plotchar } = context.pine;

                let tableArr = array.new_table(3);
                let size = array.size(tableArr);

                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(3);
        });
    });
});
