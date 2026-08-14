// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Array Methods - Mutations', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-10').getTime();

    describe('array.push', () => {
        it('should add element to end of array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(0);
                array.push(arr, 10);
                array.push(arr, 20);
                array.push(arr, 30);
                
                let size = array.size(arr);
                let last = array.last(arr);
                
                plotchar(size, 'size');
                plotchar(last, 'last');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(3);
            expect(plots['last'].data[0].value).toBe(30);
        });

        it('should handle pushing to array with initial values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(1, 2, 3);
                array.push(arr, 4);
                
                let size = array.size(arr);
                let last = array.last(arr);
                
                plotchar(size, 'size');
                plotchar(last, 'last');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(4);
            expect(plots['last'].data[0].value).toBe(4);
        });
    });

    describe('array.unshift', () => {
        it('should add element to beginning of array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(0);
                array.push(arr, 10);
                array.unshift(arr, 5);
                
                let size = array.size(arr);
                let first = array.first(arr);
                let last = array.last(arr);
                
                plotchar(size, 'size');
                plotchar(first, 'first');
                plotchar(last, 'last');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(2);
            expect(plots['first'].data[0].value).toBe(5);
            expect(plots['last'].data[0].value).toBe(10);
        });

        it('should handle multiple unshift operations', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(10, 20, 30);
                array.unshift(arr, 5);
                array.unshift(arr, 1);
                
                let size = array.size(arr);
                let first = array.first(arr);
                
                plotchar(size, 'size');
                plotchar(first, 'first');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(5);
            expect(plots['first'].data[0].value).toBe(1);
        });
    });

    describe('array.insert', () => {
        it('should insert element at specific index', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(10, 30);
                array.insert(arr, 1, 20);
                
                let size = array.size(arr);
                let val0 = array.get(arr, 0);
                let val1 = array.get(arr, 1);
                let val2 = array.get(arr, 2);
                
                plotchar(size, 'size');
                plotchar(val0, 'val0');
                plotchar(val1, 'val1');
                plotchar(val2, 'val2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(3);
            expect(plots['val0'].data[0].value).toBe(10);
            expect(plots['val1'].data[0].value).toBe(20);
            expect(plots['val2'].data[0].value).toBe(30);
        });

        it('should insert at beginning when index is 0', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(2, 3);
                array.insert(arr, 0, 1);
                
                let first = array.first(arr);
                let size = array.size(arr);
                
                plotchar(first, 'first');
                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['first'].data[0].value).toBe(1);
            expect(plots['size'].data[0].value).toBe(3);
        });

        it('should insert at end when index equals size', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(1, 2);
                let size = array.size(arr);
                array.insert(arr, size, 3);
                
                let last = array.last(arr);
                let newSize = array.size(arr);
                
                plotchar(last, 'last');
                plotchar(newSize, 'newSize');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['last'].data[0].value).toBe(3);
            expect(plots['newSize'].data[0].value).toBe(3);
        });
    });

    describe('array.set', () => {
        it('should update element at specific index', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(10, 20, 30);
                array.set(arr, 1, 100);
                
                let val0 = array.get(arr, 0);
                let val1 = array.get(arr, 1);
                let val2 = array.get(arr, 2);
                
                plotchar(val0, 'val0');
                plotchar(val1, 'val1');
                plotchar(val2, 'val2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val0'].data[0].value).toBe(10);
            expect(plots['val1'].data[0].value).toBe(100);
            expect(plots['val2'].data[0].value).toBe(30);
        });

        it('should update first element', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(3, 0);
                array.set(arr, 0, 42);
                
                let first = array.first(arr);
                
                plotchar(first, 'first');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['first'].data[0].value).toBe(42);
        });

        it('should update last element', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(3, 0);
                let lastIndex = array.size(arr) - 1;
                array.set(arr, lastIndex, 99);
                
                let last = array.last(arr);
                
                plotchar(last, 'last');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['last'].data[0].value).toBe(99);
        });
    });

    describe('array.fill', () => {
        it('should fill all elements with a value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(5, 0);
                array.fill(arr, 42);
                
                let val0 = array.get(arr, 0);
                let val2 = array.get(arr, 2);
                let val4 = array.get(arr, 4);
                
                plotchar(val0, 'val0');
                plotchar(val2, 'val2');
                plotchar(val4, 'val4');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val0'].data[0].value).toBe(42);
            expect(plots['val2'].data[0].value).toBe(42);
            expect(plots['val4'].data[0].value).toBe(42);
        });

        it('should fill with range parameters', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.from(1, 2, 3, 4, 5);
                array.fill(arr, 99, 1, 4);
                
                let val0 = array.get(arr, 0);
                let val1 = array.get(arr, 1);
                let val2 = array.get(arr, 2);
                let val3 = array.get(arr, 3);
                let val4 = array.get(arr, 4);
                
                plotchar(val0, 'val0');
                plotchar(val1, 'val1');
                plotchar(val2, 'val2');
                plotchar(val3, 'val3');
                plotchar(val4, 'val4');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val0'].data[0].value).toBe(1); // Not filled
            expect(plots['val1'].data[0].value).toBe(99); // Filled
            expect(plots['val2'].data[0].value).toBe(99); // Filled
            expect(plots['val3'].data[0].value).toBe(99); // Filled
            expect(plots['val4'].data[0].value).toBe(5); // Not filled
        });

        it('should handle fill on empty array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(0);
                array.fill(arr, 42);
                
                let size = array.size(arr);
                
                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });
    });

    describe('array.new_bool', () => {
        it('should create boolean array with initial value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_bool(3, true);
                let size = array.size(arr);
                let first = array.first(arr) ? 1 : 0;
                let last = array.last(arr) ? 1 : 0;
                
                plotchar(size, 'size');
                plotchar(first, 'first');
                plotchar(last, 'last');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(3);
            expect(plots['first'].data[0].value).toBe(1);
            expect(plots['last'].data[0].value).toBe(1);
        });

        it('should create empty boolean array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_bool(0);
                let size = array.size(arr);
                
                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(0);
        });
    });

    describe('array.new_string', () => {
        it('should create string array with initial value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_string(2, 'test');
                let size = array.size(arr);
                let first = array.first(arr);
                let last = array.last(arr);
                
                plotchar(size, 'size');
                plotchar(first === 'test' ? 1 : 0, 'firstMatch');
                plotchar(last === 'test' ? 1 : 0, 'lastMatch');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(2);
            expect(plots['firstMatch'].data[0].value).toBe(1);
            expect(plots['lastMatch'].data[0].value).toBe(1);
        });
    });

    describe('array.new_int', () => {
        it('should create integer array with default value', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, startDate, endDate);

            const code = `
                const { array, plotchar } = context.pine;
                
                let arr = array.new_int(4, 7);
                let size = array.size(arr);
                let sum = array.sum(arr);
                
                plotchar(size, 'size');
                plotchar(sum, 'sum');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(4);
            expect(plots['sum'].data[0].value).toBe(28); // 7 * 4
        });
    });
});

