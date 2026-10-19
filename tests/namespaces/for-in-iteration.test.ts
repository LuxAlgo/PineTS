// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

/**
 * End-to-end runtime tests for `for x in collection` and `for [i, x] in collection`
 * codegen. Iteration must work uniformly across:
 *   - PineArrayObject (var/let arrays, UDT array fields, function params)
 *   - Plain JS arrays (built-ins like box.all, line.all, label.all)
 * for both destructuring and non-destructuring forms.
 *
 * Regressions caught here:
 *   - `for [i, x] in udt.field`  used to throw "is not iterable" (no .array.entries())
 *   - `for el in box.all`        regressed when codegen unconditionally added .array
 */
describe('for-in iteration — runtime end-to-end', () => {
    const mkPts = () =>
        new PineTS(
            Provider.Mock,
            'BTCUSDC',
            'D',
            null,
            new Date('2024-01-01').getTime(),
            new Date('2024-01-15').getTime(),
        );

    it('iterates a PineArrayObject identifier (non-destructuring)', async () => {
        const code = `
//@version=6
indicator("for-in identifier")
var arr = array.from(10.0, 20.0, 30.0, 40.0)
sum = 0.0
for v in arr
    sum := sum + v
plot(sum, "sum")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['sum'].data)).toBe(100);
    });

    it('iterates a PineArrayObject identifier with destructuring', async () => {
        const code = `
//@version=6
indicator("for-in identifier destructured")
var arr = array.from(10.0, 20.0, 30.0, 40.0)
idxsum = 0
valsum = 0.0
for [i, v] in arr
    idxsum := idxsum + i
    valsum := valsum + v
plot(idxsum, "idxsum")
plot(valsum, "valsum")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['idxsum'].data)).toBe(0 + 1 + 2 + 3);
        expect(last(plots['valsum'].data)).toBe(100);
    });

    it('iterates a UDT array field (non-destructuring) — member expression', async () => {
        const code = `
//@version=6
indicator("for-in udt.field")
type bucket
    array<float> prices = na
var b = bucket.new(array.from(1.5, 2.5, 3.5))
sum = 0.0
for p in b.prices
    sum := sum + p
plot(sum, "sum")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['sum'].data)).toBeCloseTo(7.5);
    });

    it('iterates a UDT array field with destructuring — member expression', async () => {
        // Regression: was throwing "is not iterable" — destructuring a scalar yielded
        // by PineArrayObject's [Symbol.iterator]
        const code = `
//@version=6
indicator("for-in udt.field destructured")
type bucket
    array<float> prices = na
var b = bucket.new(array.from(10.0, 20.0, 30.0))
idxsum = 0
valsum = 0.0
for [i, p] in b.prices
    idxsum := idxsum + i
    valsum := valsum + p
plot(idxsum, "idxsum")
plot(valsum, "valsum")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['idxsum'].data)).toBe(0 + 1 + 2);
        expect(last(plots['valsum'].data)).toBe(60);
    });

    it('iterates a built-in plain JS array (box.all) — non-destructuring', async () => {
        // Regression: built-ins like box.all return plain JS arrays (no .array field).
        // Previously codegen emitted `box.all.array` → undefined → "is not iterable".
        const code = `
//@version=6
indicator("for-in box.all")
if barstate.islast
    box.new(0, 100, 1, 50)
    box.new(2, 200, 3, 150)
    box.new(4, 300, 5, 250)
count = 0
for el in box.all
    count := count + 1
plot(count, "count")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['count'].data)).toBe(3);
    });

    it('iterates a built-in plain JS array (box.all) — destructuring', async () => {
        const code = `
//@version=6
indicator("for-in box.all destructured")
if barstate.islast
    box.new(0, 100, 1, 50)
    box.new(2, 200, 3, 150)
idxsum = 0
for [i, el] in box.all
    idxsum := idxsum + i
plot(idxsum, "idxsum")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['idxsum'].data)).toBe(0 + 1);
    });

    // A matrix header iterates its rows as arrays (#378). Expected values from TradingView.
    it('iterates the rows of a matrix, in both forms and inside a function', async () => {
        const code = `
//@version=6
indicator("for-in matrix")
m = matrix.new<float>(2, 3, 1.0)
m.set(1, 2, 5.0)
float total = 0.0
for row in m
    total += row.sum()
float idxw = 0.0
for [i, row] in m
    idxw += (i + 1) * row.sum()
f(matrix<float> mm) =>
    float s = 0.0
    for r in mm
        s += r.max()
    s
int cnt = 0
for r in matrix.new<int>(0, 0)
    cnt += 1
plot(total, "total")
plot(idxw, "idxw")
plot(f(m), "fn")
plot(cnt, "empty")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['total'].data)).toBe(10);
        expect(last(plots['idxw'].data)).toBe(17);
        expect(last(plots['fn'].data)).toBe(6);
        expect(last(plots['empty'].data)).toBe(0);
    });

    it('a row is a copy: changing it leaves the matrix unchanged', async () => {
        const code = `
//@version=6
indicator("for-in matrix row copy")
m = matrix.new<float>(2, 2, 1.0)
for row in m
    row.set(0, 100.0)
plot(m.get(0, 0) + m.get(1, 0), "sum")
        `;
        const { plots } = await mkPts().run(code);
        const last = (a: any[]) => a[a.length - 1].value;
        expect(last(plots['sum'].data)).toBe(2);
    });
});
