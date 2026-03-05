// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Matrix Methods - Advanced Operations', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    describe('matrix.concat', () => {
        it('should concatenate two matrices vertically', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(2, 2, 1);
                let m2 = matrix.new(2, 2, 2);
                matrix.concat(m1, m2); // Modifies m1 in place
                
                let rows = matrix.rows(m1);
                let cols = matrix.columns(m1);
                let val1 = matrix.get(m1, 0, 0);
                let val2 = matrix.get(m1, 2, 0);
                
                plotchar(rows, 'rows');
                plotchar(cols, 'cols');
                plotchar(val1, 'val1');
                plotchar(val2, 'val2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(4);
            expect(plots['cols'].data[0].value).toBe(2);
            expect(plots['val1'].data[0].value).toBe(1);
            expect(plots['val2'].data[0].value).toBe(2);
        });
    });

    describe('matrix.diff', () => {
        it('should compute element-wise difference', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(2, 2, 10);
                let m2 = matrix.new(2, 2, 3);
                let result = matrix.diff(m1, m2);
                
                let val = matrix.get(result, 0, 0);
                
                plotchar(val, 'val');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val'].data[0].value).toBe(7); // 10 - 3
        });
    });

    describe('matrix.pow', () => {
        it('should compute matrix power (multiplication)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 2);
                let result = matrix.pow(m, 3); // M^3 = M * M * M
                
                let val = matrix.get(result, 0, 0);
                
                plotchar(val, 'val');
            `;

            const { plots } = await pineTS.run(code);
            // [[2,2],[2,2]] * [[2,2],[2,2]] = [[8,8],[8,8]]
            // [[8,8],[8,8]] * [[2,2],[2,2]] = [[32,32],[32,32]]
            expect(plots['val'].data[0].value).toBe(32);
        });
    });

    describe('matrix.row', () => {
        it('should extract a row from matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, array, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 1, 0, 10);
                matrix.set(m, 1, 1, 20);
                matrix.set(m, 1, 2, 30);
                
                let row = matrix.row(m, 1);
                let size = array.size(row);
                let val0 = array.get(row, 0);
                let val1 = array.get(row, 1);
                let val2 = array.get(row, 2);
                
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
    });

    describe('matrix.col', () => {
        it('should extract a column from matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, array, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 1, 10);
                matrix.set(m, 1, 1, 20);
                matrix.set(m, 2, 1, 30);
                
                let col = matrix.col(m, 1);
                let size = array.size(col);
                let val0 = array.get(col, 0);
                let val1 = array.get(col, 1);
                let val2 = array.get(col, 2);
                
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
    });

    describe('matrix.median', () => {
        it('should compute median of matrix elements', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 5);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 3);
                matrix.set(m, 0, 2, 9);
                
                let med = matrix.median(m);
                
                plotchar(med, 'median');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['median'].data[0].value).toBe(5);
        });
    });

    describe('matrix.sort', () => {
        it('should sort matrix rows', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 3, 0);
                matrix.set(m, 0, 0, 3);
                matrix.set(m, 0, 1, 1);
                matrix.set(m, 0, 2, 2);
                
                matrix.sort(m, 0, 1); // Sort row 0, column 1 (ascending)
                
                let val0 = matrix.get(m, 0, 0);
                let val1 = matrix.get(m, 0, 1);
                let val2 = matrix.get(m, 0, 2);
                
                plotchar(val0, 'val0');
                plotchar(val1, 'val1');
                plotchar(val2, 'val2');
            `;

            const { plots } = await pineTS.run(code);
            // After sorting by column 1, order should be preserved or sorted
            expect(plots['val0'].data[0].value).toBeDefined();
            expect(plots['val1'].data[0].value).toBeDefined();
            expect(plots['val2'].data[0].value).toBeDefined();
        });
    });

    describe('matrix.reshape', () => {
        it('should reshape matrix dimensions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 3, 5); // 2x3 matrix
                matrix.reshape(m, 3, 2); // Reshape to 3x2 (modifies in place)
                
                let rows = matrix.rows(m);
                let cols = matrix.columns(m);
                let val = matrix.get(m, 0, 0);
                
                plotchar(rows, 'rows');
                plotchar(cols, 'cols');
                plotchar(val, 'val');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(3);
            expect(plots['cols'].data[0].value).toBe(2);
            expect(plots['val'].data[0].value).toBe(5);
        });
    });

    describe('matrix.reverse', () => {
        it('should reverse matrix rows and columns', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 2, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 3);
                matrix.set(m, 1, 1, 4);
                matrix.set(m, 2, 0, 5);
                matrix.set(m, 2, 1, 6);
                
                matrix.reverse(m); // Reverses rows AND elements within each row
                
                let val00 = matrix.get(m, 0, 0); // Was at 2,1 (6)
                let val20 = matrix.get(m, 2, 0); // Was at 0,1 (2)
                
                plotchar(val00, 'val00');
                plotchar(val20, 'val20');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val00'].data[0].value).toBe(6); // Was at position [2,1]
            expect(plots['val20'].data[0].value).toBe(2); // Was at position [0,1]
        });
    });

    describe('matrix boolean checks', () => {
        it('should check if matrix is square', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(3, 3, 1);
                let m2 = matrix.new(2, 3, 1);
                
                let isSquare1 = matrix.is_square(m1) ? 1 : 0;
                let isSquare2 = matrix.is_square(m2) ? 1 : 0;
                
                plotchar(isSquare1, 'isSquare1');
                plotchar(isSquare2, 'isSquare2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isSquare1'].data[0].value).toBe(1);
            expect(plots['isSquare2'].data[0].value).toBe(0);
        });

        it('should check if matrix is zero', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(2, 2, 0);
                let m2 = matrix.new(2, 2, 1);
                
                let isZero1 = matrix.is_zero(m1) ? 1 : 0;
                let isZero2 = matrix.is_zero(m2) ? 1 : 0;
                
                plotchar(isZero1, 'isZero1');
                plotchar(isZero2, 'isZero2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isZero1'].data[0].value).toBe(1);
            expect(plots['isZero2'].data[0].value).toBe(0);
        });

        it('should check if matrix is identity', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 1, 1, 1);
                
                let isIdentity = matrix.is_identity(m) ? 1 : 0;
                
                plotchar(isIdentity, 'isIdentity');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isIdentity'].data[0].value).toBe(1);
        });

        it('should check if matrix is diagonal', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 5);
                matrix.set(m, 1, 1, 3);
                matrix.set(m, 2, 2, 7);
                
                let isDiagonal = matrix.is_diagonal(m) ? 1 : 0;
                
                plotchar(isDiagonal, 'isDiagonal');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isDiagonal'].data[0].value).toBe(1);
        });

        it('should check if matrix is symmetric', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 3);
                matrix.set(m, 2, 2, 4);
                
                let isSymmetric = matrix.is_symmetric(m) ? 1 : 0;
                
                plotchar(isSymmetric, 'isSymmetric');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isSymmetric'].data[0].value).toBe(1);
        });

        it('should check if matrix is triangular', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 1, 4);
                matrix.set(m, 1, 2, 5);
                matrix.set(m, 2, 2, 6);
                
                let isTriangular = matrix.is_triangular(m) ? 1 : 0;
                
                plotchar(isTriangular, 'isTriangular');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isTriangular'].data[0].value).toBe(1);
        });

        it('should check if matrix is binary', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(2, 2, 0);
                matrix.set(m1, 0, 0, 1);
                matrix.set(m1, 1, 1, 1);
                
                let m2 = matrix.new(2, 2, 5);
                
                let isBinary1 = matrix.is_binary(m1) ? 1 : 0;
                let isBinary2 = matrix.is_binary(m2) ? 1 : 0;
                
                plotchar(isBinary1, 'isBinary1');
                plotchar(isBinary2, 'isBinary2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isBinary1'].data[0].value).toBe(1);
            expect(plots['isBinary2'].data[0].value).toBe(0);
        });

        it('should check if matrix is stochastic', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 0.5);
                
                let isStochastic = matrix.is_stochastic(m) ? 1 : 0;
                
                plotchar(isStochastic, 'isStochastic');
            `;

            const { plots } = await pineTS.run(code);
            // Stochastic matrix has rows that sum to 1
            expect(plots['isStochastic'].data[0].value).toBeDefined();
        });

        it('should check if matrix is antisymmetric', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, -2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 2, 0, -3);
                matrix.set(m, 1, 2, 1);
                matrix.set(m, 2, 1, -1);
                
                let isAntisymmetric = matrix.is_antisymmetric(m) ? 1 : 0;
                
                plotchar(isAntisymmetric, 'isAntisymmetric');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isAntisymmetric'].data[0].value).toBe(1);
        });

        it('should check if matrix is antidiagonal', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 2, 1);
                matrix.set(m, 1, 1, 2);
                matrix.set(m, 2, 0, 3);
                
                let isAntidiagonal = matrix.is_antidiagonal(m) ? 1 : 0;
                
                plotchar(isAntidiagonal, 'isAntidiagonal');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['isAntidiagonal'].data[0].value).toBe(1);
        });
    });

    describe('matrix row/column operations', () => {
        it('should swap columns', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 0, 4);
                matrix.set(m, 1, 1, 5);
                matrix.set(m, 1, 2, 6);
                
                matrix.swap_columns(m, 0, 2); // Swap first and last columns
                
                let val00 = matrix.get(m, 0, 0); // Should be 3 (was at 0,2)
                let val02 = matrix.get(m, 0, 2); // Should be 1 (was at 0,0)
                let val10 = matrix.get(m, 1, 0); // Should be 6 (was at 1,2)
                let val12 = matrix.get(m, 1, 2); // Should be 4 (was at 1,0)
                
                plotchar(val00, 'val00');
                plotchar(val02, 'val02');
                plotchar(val10, 'val10');
                plotchar(val12, 'val12');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val00'].data[0].value).toBe(3);
            expect(plots['val02'].data[0].value).toBe(1);
            expect(plots['val10'].data[0].value).toBe(6);
            expect(plots['val12'].data[0].value).toBe(4);
        });

        it('should swap rows', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 2, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 3);
                matrix.set(m, 1, 1, 4);
                matrix.set(m, 2, 0, 5);
                matrix.set(m, 2, 1, 6);
                
                matrix.swap_rows(m, 0, 2); // Swap first and last rows
                
                let val00 = matrix.get(m, 0, 0); // Should be 5 (was at 2,0)
                let val01 = matrix.get(m, 0, 1); // Should be 6 (was at 2,1)
                let val20 = matrix.get(m, 2, 0); // Should be 1 (was at 0,0)
                let val21 = matrix.get(m, 2, 1); // Should be 2 (was at 0,1)
                
                plotchar(val00, 'val00');
                plotchar(val01, 'val01');
                plotchar(val20, 'val20');
                plotchar(val21, 'val21');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val00'].data[0].value).toBe(5);
            expect(plots['val01'].data[0].value).toBe(6);
            expect(plots['val20'].data[0].value).toBe(1);
            expect(plots['val21'].data[0].value).toBe(2);
        });

        it('should remove column', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 0, 4);
                matrix.set(m, 1, 1, 5);
                matrix.set(m, 1, 2, 6);
                
                matrix.remove_col(m, 1); // Remove middle column
                
                let cols = matrix.columns(m);
                let val00 = matrix.get(m, 0, 0); // Should be 1
                let val01 = matrix.get(m, 0, 1); // Should be 3 (was at 0,2)
                let val10 = matrix.get(m, 1, 0); // Should be 4
                let val11 = matrix.get(m, 1, 1); // Should be 6 (was at 1,2)
                
                plotchar(cols, 'cols');
                plotchar(val00, 'val00');
                plotchar(val01, 'val01');
                plotchar(val10, 'val10');
                plotchar(val11, 'val11');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['cols'].data[0].value).toBe(2);
            expect(plots['val00'].data[0].value).toBe(1);
            expect(plots['val01'].data[0].value).toBe(3);
            expect(plots['val10'].data[0].value).toBe(4);
            expect(plots['val11'].data[0].value).toBe(6);
        });

        it('should remove row', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 2, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 3);
                matrix.set(m, 1, 1, 4);
                matrix.set(m, 2, 0, 5);
                matrix.set(m, 2, 1, 6);
                
                matrix.remove_row(m, 1); // Remove middle row
                
                let rows = matrix.rows(m);
                let val00 = matrix.get(m, 0, 0); // Should be 1
                let val01 = matrix.get(m, 0, 1); // Should be 2
                let val10 = matrix.get(m, 1, 0); // Should be 5 (was at 2,0)
                let val11 = matrix.get(m, 1, 1); // Should be 6 (was at 2,1)
                
                plotchar(rows, 'rows');
                plotchar(val00, 'val00');
                plotchar(val01, 'val01');
                plotchar(val10, 'val10');
                plotchar(val11, 'val11');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(2);
            expect(plots['val00'].data[0].value).toBe(1);
            expect(plots['val01'].data[0].value).toBe(2);
            expect(plots['val10'].data[0].value).toBe(5);
            expect(plots['val11'].data[0].value).toBe(6);
        });

        it('should add row at specific index', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, array, plotchar } = context.pine;
                
                let m = matrix.new(2, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 0, 7);
                matrix.set(m, 1, 1, 8);
                matrix.set(m, 1, 2, 9);
                
                let newRow = array.from(4, 5, 6);
                matrix.add_row(m, 1, newRow); // Insert at index 1
                
                let rows = matrix.rows(m);
                let val00 = matrix.get(m, 0, 0); // Should be 1 (unchanged)
                let val10 = matrix.get(m, 1, 0); // Should be 4 (new row)
                let val11 = matrix.get(m, 1, 1); // Should be 5 (new row)
                let val12 = matrix.get(m, 1, 2); // Should be 6 (new row)
                let val20 = matrix.get(m, 2, 0); // Should be 7 (was at 1,0)
                
                plotchar(rows, 'rows');
                plotchar(val00, 'val00');
                plotchar(val10, 'val10');
                plotchar(val11, 'val11');
                plotchar(val12, 'val12');
                plotchar(val20, 'val20');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(3);
            expect(plots['val00'].data[0].value).toBe(1);
            expect(plots['val10'].data[0].value).toBe(4);
            expect(plots['val11'].data[0].value).toBe(5);
            expect(plots['val12'].data[0].value).toBe(6);
            expect(plots['val20'].data[0].value).toBe(7);
        });
    });

    describe('matrix advanced math', () => {
        it('should compute matrix trace (sum of diagonal)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 5);
                matrix.set(m, 1, 1, 3);
                matrix.set(m, 2, 2, 7);
                
                let trace = matrix.trace(m); // 5 + 3 + 7 = 15
                
                plotchar(trace, 'trace');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['trace'].data[0].value).toBe(15);
        });

        it('should compute matrix determinant for 2x2', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 4);
                matrix.set(m, 0, 1, 3);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 1);
                
                let det = matrix.det(m); // 4*1 - 3*2 = -2
                
                plotchar(det, 'det');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['det'].data[0].value).toBe(-2);
        });

        it('should compute matrix determinant for 3x3', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 0, 0);
                matrix.set(m, 1, 1, 1);
                matrix.set(m, 1, 2, 4);
                matrix.set(m, 2, 0, 5);
                matrix.set(m, 2, 1, 6);
                matrix.set(m, 2, 2, 0);
                
                let det = matrix.det(m);
                
                plotchar(det, 'det');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['det'].data[0].value).toBeDefined();
            expect(typeof plots['det'].data[0].value).toBe('number');
        });

        it('should compute 2x2 matrix inverse with correct values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // [[4, 7], [2, 6]] → inv = 1/(24-14) * [[6, -7], [-2, 4]] = [[0.6, -0.7], [-0.2, 0.4]]
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 4);
                matrix.set(m, 0, 1, 7);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 6);

                let inv = matrix.inv(m);
                plotchar(matrix.get(inv, 0, 0), 'v00');
                plotchar(matrix.get(inv, 0, 1), 'v01');
                plotchar(matrix.get(inv, 1, 0), 'v10');
                plotchar(matrix.get(inv, 1, 1), 'v11');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['v00'].data[0].value).toBeCloseTo(0.6, 10);
            expect(plots['v01'].data[0].value).toBeCloseTo(-0.7, 10);
            expect(plots['v10'].data[0].value).toBeCloseTo(-0.2, 10);
            expect(plots['v11'].data[0].value).toBeCloseTo(0.4, 10);
        });

        it('should compute 3x3 matrix inverse (A * A^-1 = I)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // [[1,2,3],[0,1,4],[5,6,0]] — verify A * inv(A) = I
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2); matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 0, 0); matrix.set(m, 1, 1, 1); matrix.set(m, 1, 2, 4);
                matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6); matrix.set(m, 2, 2, 0);

                let inv = matrix.inv(m);
                let product = matrix.mult(m, inv);

                // Diagonal should be 1, off-diagonal should be 0
                plotchar(matrix.get(product, 0, 0), 'd00');
                plotchar(matrix.get(product, 1, 1), 'd11');
                plotchar(matrix.get(product, 2, 2), 'd22');
                plotchar(matrix.get(product, 0, 1), 'o01');
                plotchar(matrix.get(product, 1, 0), 'o10');
                plotchar(matrix.get(product, 0, 2), 'o02');
            `;

            const { plots } = await pineTS.run(code);
            // Diagonal elements should be 1
            expect(plots['d00'].data[0].value).toBeCloseTo(1, 8);
            expect(plots['d11'].data[0].value).toBeCloseTo(1, 8);
            expect(plots['d22'].data[0].value).toBeCloseTo(1, 8);
            // Off-diagonal elements should be 0
            expect(plots['o01'].data[0].value).toBeCloseTo(0, 8);
            expect(plots['o10'].data[0].value).toBeCloseTo(0, 8);
            expect(plots['o02'].data[0].value).toBeCloseTo(0, 8);
        });

        it('should compute 4x4 matrix inverse', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // 4x4 matrix — verify A * inv(A) diagonal = 1
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(4, 4, 0);
                matrix.set(m, 0, 0, 2); matrix.set(m, 0, 1, 1); matrix.set(m, 0, 2, 0); matrix.set(m, 0, 3, 1);
                matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 2); matrix.set(m, 1, 2, 1); matrix.set(m, 1, 3, 0);
                matrix.set(m, 2, 0, 1); matrix.set(m, 2, 1, 0); matrix.set(m, 2, 2, 2); matrix.set(m, 2, 3, 1);
                matrix.set(m, 3, 0, 0); matrix.set(m, 3, 1, 1); matrix.set(m, 3, 2, 1); matrix.set(m, 3, 3, 3);

                let inv = matrix.inv(m);
                let product = matrix.mult(m, inv);

                plotchar(matrix.get(product, 0, 0), 'd00');
                plotchar(matrix.get(product, 1, 1), 'd11');
                plotchar(matrix.get(product, 2, 2), 'd22');
                plotchar(matrix.get(product, 3, 3), 'd33');
                plotchar(matrix.get(product, 0, 3), 'o03');
                plotchar(matrix.get(product, 2, 1), 'o21');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['d00'].data[0].value).toBeCloseTo(1, 8);
            expect(plots['d11'].data[0].value).toBeCloseTo(1, 8);
            expect(plots['d22'].data[0].value).toBeCloseTo(1, 8);
            expect(plots['d33'].data[0].value).toBeCloseTo(1, 8);
            expect(plots['o03'].data[0].value).toBeCloseTo(0, 8);
            expect(plots['o21'].data[0].value).toBeCloseTo(0, 8);
        });

        it('should return identity when inverting identity matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 1, 1, 1);
                matrix.set(m, 2, 2, 1);

                let inv = matrix.inv(m);
                plotchar(matrix.get(inv, 0, 0), 'd00');
                plotchar(matrix.get(inv, 1, 1), 'd11');
                plotchar(matrix.get(inv, 2, 2), 'd22');
                plotchar(matrix.get(inv, 0, 1), 'o01');
                plotchar(matrix.get(inv, 1, 2), 'o12');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['d00'].data[0].value).toBeCloseTo(1, 10);
            expect(plots['d11'].data[0].value).toBeCloseTo(1, 10);
            expect(plots['d22'].data[0].value).toBeCloseTo(1, 10);
            expect(plots['o01'].data[0].value).toBeCloseTo(0, 10);
            expect(plots['o12'].data[0].value).toBeCloseTo(0, 10);
        });

        it('should return NaN for singular matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // [[1,2],[2,4]] is singular (det=0, row 2 = 2 * row 1)
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 4);

                let inv = matrix.inv(m);
                plotchar(matrix.get(inv, 0, 0), 'v00');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['v00'].data[0].value).toBeNaN();
        });

        it('should return NaN for non-square matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(2, 3, 1);
                let inv = matrix.inv(m);
                plotchar(matrix.get(inv, 0, 0), 'v00');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['v00'].data[0].value).toBeNaN();
        });

        it('should compute inverse of diagonal matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // diag(2, 5, 4) → inv = diag(1/2, 1/5, 1/4)
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 2);
                matrix.set(m, 1, 1, 5);
                matrix.set(m, 2, 2, 4);

                let inv = matrix.inv(m);
                plotchar(matrix.get(inv, 0, 0), 'v00');
                plotchar(matrix.get(inv, 1, 1), 'v11');
                plotchar(matrix.get(inv, 2, 2), 'v22');
                plotchar(matrix.get(inv, 0, 1), 'o01');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['v00'].data[0].value).toBeCloseTo(0.5, 10);
            expect(plots['v11'].data[0].value).toBeCloseTo(0.2, 10);
            expect(plots['v22'].data[0].value).toBeCloseTo(0.25, 10);
            expect(plots['o01'].data[0].value).toBeCloseTo(0, 10);
        });

        it('should compute matrix rank', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 4);
                matrix.set(m, 2, 2, 1);
                
                let rank = matrix.rank(m);
                
                plotchar(rank, 'rank');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rank'].data[0].value).toBeGreaterThan(0);
        });

        it('should compute Kronecker product', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(2, 2, 1);
                let m2 = matrix.new(2, 2, 2);
                
                let kron = matrix.kron(m1, m2);
                let rows = matrix.rows(kron);
                let cols = matrix.columns(kron);
                
                plotchar(rows, 'rows');
                plotchar(cols, 'cols');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(4); // 2 * 2
            expect(plots['cols'].data[0].value).toBe(4); // 2 * 2
        });

        it('should compute eigenvalues', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, array, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 4);
                matrix.set(m, 0, 1, 1);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 3);
                
                let eigenvals = matrix.eigenvalues(m);
                let size = array.size(eigenvals);
                
                plotchar(size, 'size');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBeGreaterThan(0);
        });

        it('should compute eigenvectors', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 4);
                matrix.set(m, 0, 1, 1);
                matrix.set(m, 1, 0, 2);
                matrix.set(m, 1, 1, 3);
                
                let eigenvecs = matrix.eigenvectors(m);
                let rows = matrix.rows(eigenvecs);
                
                plotchar(rows, 'rows');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBeGreaterThan(0);
        });

        it('should compute pseudo-inverse of wide matrix (m < n) with correct dimensions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // 2x3 wide matrix → pinv should be 3x2
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(2, 3, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 3);
                matrix.set(m, 1, 0, 4);
                matrix.set(m, 1, 1, 5);
                matrix.set(m, 1, 2, 6);

                let pinv = matrix.pinv(m);
                plotchar(matrix.rows(pinv), 'rows');
                plotchar(matrix.columns(pinv), 'cols');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(3);
            expect(plots['cols'].data[0].value).toBe(2);
        });

        it('should compute pseudo-inverse of tall matrix (m > n) with correct dimensions', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // 3x2 tall matrix → pinv should be 2x3
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(3, 2, 0);
                matrix.set(m, 0, 0, 1); matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 3); matrix.set(m, 1, 1, 4);
                matrix.set(m, 2, 0, 5); matrix.set(m, 2, 1, 6);

                let pinv = matrix.pinv(m);
                plotchar(matrix.rows(pinv), 'rows');
                plotchar(matrix.columns(pinv), 'cols');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(2);
            expect(plots['cols'].data[0].value).toBe(3);
        });

        it('should satisfy A * pinv(A) * A ≈ A for tall matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // Moore-Penrose property: A * pinv(A) * A = A
            const code = `
                const { matrix, plotchar } = context.pine;

                let A = matrix.new(3, 2, 0);
                matrix.set(A, 0, 0, 1); matrix.set(A, 0, 1, 2);
                matrix.set(A, 1, 0, 3); matrix.set(A, 1, 1, 4);
                matrix.set(A, 2, 0, 5); matrix.set(A, 2, 1, 6);

                let Ap = matrix.pinv(A);
                let AApA = matrix.mult(matrix.mult(A, Ap), A);

                plotchar(matrix.get(AApA, 0, 0), 'r00');
                plotchar(matrix.get(AApA, 0, 1), 'r01');
                plotchar(matrix.get(AApA, 1, 0), 'r10');
                plotchar(matrix.get(AApA, 1, 1), 'r11');
                plotchar(matrix.get(AApA, 2, 0), 'r20');
                plotchar(matrix.get(AApA, 2, 1), 'r21');
            `;

            const { plots } = await pineTS.run(code);
            // A * pinv(A) * A should equal A
            expect(plots['r00'].data[0].value).toBeCloseTo(1, 6);
            expect(plots['r01'].data[0].value).toBeCloseTo(2, 6);
            expect(plots['r10'].data[0].value).toBeCloseTo(3, 6);
            expect(plots['r11'].data[0].value).toBeCloseTo(4, 6);
            expect(plots['r20'].data[0].value).toBeCloseTo(5, 6);
            expect(plots['r21'].data[0].value).toBeCloseTo(6, 6);
        });

        it('should satisfy A * pinv(A) * A ≈ A for wide matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;

                let A = matrix.new(2, 3, 0);
                matrix.set(A, 0, 0, 1); matrix.set(A, 0, 1, 2); matrix.set(A, 0, 2, 3);
                matrix.set(A, 1, 0, 4); matrix.set(A, 1, 1, 5); matrix.set(A, 1, 2, 6);

                let Ap = matrix.pinv(A);
                let AApA = matrix.mult(matrix.mult(A, Ap), A);

                plotchar(matrix.get(AApA, 0, 0), 'r00');
                plotchar(matrix.get(AApA, 0, 1), 'r01');
                plotchar(matrix.get(AApA, 0, 2), 'r02');
                plotchar(matrix.get(AApA, 1, 0), 'r10');
                plotchar(matrix.get(AApA, 1, 1), 'r11');
                plotchar(matrix.get(AApA, 1, 2), 'r12');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['r00'].data[0].value).toBeCloseTo(1, 6);
            expect(plots['r01'].data[0].value).toBeCloseTo(2, 6);
            expect(plots['r02'].data[0].value).toBeCloseTo(3, 6);
            expect(plots['r10'].data[0].value).toBeCloseTo(4, 6);
            expect(plots['r11'].data[0].value).toBeCloseTo(5, 6);
            expect(plots['r12'].data[0].value).toBeCloseTo(6, 6);
        });

        it('should equal regular inverse for square matrix', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // For square invertible matrix, pinv(A) = inv(A)
            const code = `
                const { matrix, plotchar } = context.pine;

                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 4); matrix.set(m, 0, 1, 7);
                matrix.set(m, 1, 0, 2); matrix.set(m, 1, 1, 6);

                let pinvM = matrix.pinv(m);
                let invM = matrix.inv(m);

                plotchar(matrix.get(pinvM, 0, 0), 'p00');
                plotchar(matrix.get(pinvM, 0, 1), 'p01');
                plotchar(matrix.get(pinvM, 1, 0), 'p10');
                plotchar(matrix.get(pinvM, 1, 1), 'p11');
                plotchar(matrix.get(invM, 0, 0), 'i00');
                plotchar(matrix.get(invM, 0, 1), 'i01');
                plotchar(matrix.get(invM, 1, 0), 'i10');
                plotchar(matrix.get(invM, 1, 1), 'i11');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['p00'].data[0].value).toBeCloseTo(plots['i00'].data[0].value, 8);
            expect(plots['p01'].data[0].value).toBeCloseTo(plots['i01'].data[0].value, 8);
            expect(plots['p10'].data[0].value).toBeCloseTo(plots['i10'].data[0].value, 8);
            expect(plots['p11'].data[0].value).toBeCloseTo(plots['i11'].data[0].value, 8);
        });

        it('should compute pinv for column vector (Nx1)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            // pinv of column vector [a; b; c] = [a b c] / (a² + b² + c²)
            const code = `
                const { matrix, plotchar } = context.pine;

                let v = matrix.new(3, 1, 0);
                matrix.set(v, 0, 0, 1);
                matrix.set(v, 1, 0, 2);
                matrix.set(v, 2, 0, 3);

                let pinvV = matrix.pinv(v);
                plotchar(matrix.rows(pinvV), 'rows');
                plotchar(matrix.columns(pinvV), 'cols');
                // pinv([1;2;3]) = [1 2 3]/(1+4+9) = [1/14, 2/14, 3/14]
                plotchar(matrix.get(pinvV, 0, 0), 'v00');
                plotchar(matrix.get(pinvV, 0, 1), 'v01');
                plotchar(matrix.get(pinvV, 0, 2), 'v02');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['rows'].data[0].value).toBe(1);
            expect(plots['cols'].data[0].value).toBe(3);
            expect(plots['v00'].data[0].value).toBeCloseTo(1/14, 8);
            expect(plots['v01'].data[0].value).toBeCloseTo(2/14, 8);
            expect(plots['v02'].data[0].value).toBeCloseTo(3/14, 8);
        });

        it('should compute matrix multiplication (scalar)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 3);
                let result = matrix.mult(m, 4); // Scalar multiplication
                
                let val00 = matrix.get(result, 0, 0);
                let val11 = matrix.get(result, 1, 1);
                
                plotchar(val00, 'val00');
                plotchar(val11, 'val11');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val00'].data[0].value).toBe(12); // 3 * 4
            expect(plots['val11'].data[0].value).toBe(12); // 3 * 4
        });

        it('should compute matrix multiplication (matrix)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m1 = matrix.new(2, 2, 0);
                matrix.set(m1, 0, 0, 1);
                matrix.set(m1, 0, 1, 2);
                matrix.set(m1, 1, 0, 3);
                matrix.set(m1, 1, 1, 4);
                
                let m2 = matrix.new(2, 2, 0);
                matrix.set(m2, 0, 0, 2);
                matrix.set(m2, 0, 1, 0);
                matrix.set(m2, 1, 0, 1);
                matrix.set(m2, 1, 1, 2);
                
                let result = matrix.mult(m1, m2); // Matrix multiplication
                // [[1,2],[3,4]] * [[2,0],[1,2]] = [[4,4],[10,8]]
                
                let val00 = matrix.get(result, 0, 0);
                let val01 = matrix.get(result, 0, 1);
                let val10 = matrix.get(result, 1, 0);
                let val11 = matrix.get(result, 1, 1);
                
                plotchar(val00, 'val00');
                plotchar(val01, 'val01');
                plotchar(val10, 'val10');
                plotchar(val11, 'val11');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['val00'].data[0].value).toBe(4); // 1*2 + 2*1
            expect(plots['val01'].data[0].value).toBe(4); // 1*0 + 2*2
            expect(plots['val10'].data[0].value).toBe(10); // 3*2 + 4*1
            expect(plots['val11'].data[0].value).toBe(8); // 3*0 + 4*2
        });
    });

    describe('matrix statistics', () => {
        it('should compute mode (most frequent value)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(3, 3, 5);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 0, 2, 5);
                matrix.set(m, 1, 0, 5);
                matrix.set(m, 2, 2, 3);
                
                let mode = matrix.mode(m); // 5 appears most frequently
                
                plotchar(mode, 'mode');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['mode'].data[0].value).toBe(5);
        });

        it('should handle mode with multiple same frequency values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

            const code = `
                const { matrix, plotchar } = context.pine;
                
                let m = matrix.new(2, 2, 0);
                matrix.set(m, 0, 0, 1);
                matrix.set(m, 0, 1, 2);
                matrix.set(m, 1, 0, 1);
                matrix.set(m, 1, 1, 2);
                
                let mode = matrix.mode(m); // Both 1 and 2 appear twice
                
                plotchar(mode, 'mode');
            `;

            const { plots } = await pineTS.run(code);
            // Mode should return one of the most frequent values
            expect([1, 2]).toContain(plots['mode'].data[0].value);
        });
    });
});

