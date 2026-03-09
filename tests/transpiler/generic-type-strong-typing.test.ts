import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

/**
 * Tests for generic type strong typing: array.new<TYPE>()
 *
 * The transpiler rewrites array.new<float>(...) → array.new_float(...) for known types.
 * This ensures the array gets the correct element type even when the initial value
 * would be inferred as a different type (e.g. 0.0 → int in JS).
 *
 * Matrix generic syntax (matrix.new<TYPE>) is also rewritten to matrix.new_TYPE
 * but only as a transpiler compatibility shim — no runtime type enforcement exists
 * for matrix yet. Those tests verify the transpiler rewrite doesn't crash.
 */
describe('Generic Type Strong Typing', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    // ─── Array ───────────────────────────────────────────────────────

    describe('array.new<TYPE> strong typing', () => {
        it('array.new<float> allows setting float values (the original bug)', async () => {
            // This was the core bug: array.new<float>(3, 0.0) inferred type as int
            // because 0.0 === 0 in JS, then array.set(arr, 0, 2.1) failed
            const code = `
//@version=6
indicator("array.new<float> strong typing")
var arr = array.new<float>(3, 0.0)
array.set(arr, 0, 2.1)
array.set(arr, 1, 3.5)
array.set(arr, 2, 0.7)
plot(array.get(arr, 0), "v0")
plot(array.get(arr, 1), "v1")
plot(array.get(arr, 2), "v2")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['v0'].data[0].value).toBe(2.1);
            expect(plots['v1'].data[0].value).toBe(3.5);
            expect(plots['v2'].data[0].value).toBe(0.7);
        });

        it('array.new<float> with integer initial value accepts floats', async () => {
            // Even with integer 0 as initial value, <float> forces float type
            const code = `
//@version=6
indicator("array.new<float> int initial")
var arr = array.new<float>(2, 0)
array.set(arr, 0, 1.5)
array.set(arr, 1, 2.7)
plot(array.get(arr, 0), "v0")
plot(array.get(arr, 1), "v1")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['v0'].data[0].value).toBe(1.5);
            expect(plots['v1'].data[0].value).toBe(2.7);
        });

        it('array.new<int> creates integer-typed array', async () => {
            const code = `
//@version=6
indicator("array.new<int> typing")
var arr = array.new<int>(3, 0)
array.set(arr, 0, 10)
array.set(arr, 1, 20)
array.set(arr, 2, 30)
plot(array.get(arr, 0), "v0")
plot(array.get(arr, 1), "v1")
plot(array.get(arr, 2), "v2")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['v0'].data[0].value).toBe(10);
            expect(plots['v1'].data[0].value).toBe(20);
            expect(plots['v2'].data[0].value).toBe(30);
        });

        it('array.new<string> creates string-typed array', async () => {
            const code = `
//@version=6
indicator("array.new<string> typing")
var arr = array.new<string>(2, "")
array.set(arr, 0, "hello")
array.set(arr, 1, "world")
plot(array.size(arr), "size")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['size'].data[0].value).toBe(2);
        });

        it('array.new<bool> creates boolean-typed array', async () => {
            const code = `
//@version=6
indicator("array.new<bool> typing")
var arr = array.new<bool>(3, false)
array.set(arr, 0, true)
array.set(arr, 1, false)
array.set(arr, 2, true)
plot(array.size(arr), "size")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['size'].data[0].value).toBe(3);
        });

        it('array.new<color> creates color-typed array', async () => {
            const code = `
//@version=6
indicator("array.new<color> typing")
var arr = array.new<color>(2, color.red)
array.set(arr, 0, color.blue)
array.set(arr, 1, color.green)
plot(array.size(arr), "size")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['size'].data[0].value).toBe(2);
        });

        it('array.new<float> with no initial value', async () => {
            // array.new<float>(3) — no initial value, should still be float-typed
            const code = `
//@version=6
indicator("array.new<float> no init")
var arr = array.new<float>(3)
array.set(arr, 0, 1.1)
array.set(arr, 1, 2.2)
array.set(arr, 2, 3.3)
plot(array.get(arr, 0), "v0")
plot(array.get(arr, 1), "v1")
plot(array.get(arr, 2), "v2")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['v0'].data[0].value).toBeCloseTo(1.1);
            expect(plots['v1'].data[0].value).toBeCloseTo(2.2);
            expect(plots['v2'].data[0].value).toBeCloseTo(3.3);
        });

        it('array.new<float> used with array operations (push, avg, sum)', async () => {
            const code = `
//@version=6
indicator("array.new<float> operations")
var arr = array.new<float>(0)
if barstate.isfirst
    array.push(arr, 1.5)
    array.push(arr, 2.5)
    array.push(arr, 3.0)
plot(array.size(arr), "size")
plot(array.avg(arr), "avg")
plot(array.sum(arr), "sum")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['size'].data[0].value).toBe(3);
            expect(plots['avg'].data[0].value).toBeCloseTo(2.333, 2);
            expect(plots['sum'].data[0].value).toBe(7);
        });
    });

    // ─── Matrix ──────────────────────────────────────────────────────

    describe('matrix.new<TYPE> transpiler rewrite (no runtime type enforcement)', () => {
        it('matrix.new<float> transpiles and runs without error', async () => {
            const code = `
//@version=6
indicator("matrix.new<float> strong typing")
var m = matrix.new<float>(2, 2, 0)
matrix.set(m, 0, 0, 1.5)
matrix.set(m, 0, 1, 2.7)
matrix.set(m, 1, 0, 3.3)
matrix.set(m, 1, 1, 4.9)
plot(matrix.get(m, 0, 0), "m00")
plot(matrix.get(m, 0, 1), "m01")
plot(matrix.get(m, 1, 0), "m10")
plot(matrix.get(m, 1, 1), "m11")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['m00'].data[0].value).toBe(1.5);
            expect(plots['m01'].data[0].value).toBe(2.7);
            expect(plots['m10'].data[0].value).toBe(3.3);
            expect(plots['m11'].data[0].value).toBe(4.9);
        });

        it('matrix.new<int> transpiles and runs without error', async () => {
            const code = `
//@version=6
indicator("matrix.new<int> typing")
var m = matrix.new<int>(2, 2, 0)
matrix.set(m, 0, 0, 1)
matrix.set(m, 0, 1, 2)
matrix.set(m, 1, 0, 3)
matrix.set(m, 1, 1, 4)
plot(matrix.get(m, 0, 0), "m00")
plot(matrix.rows(m), "rows")
plot(matrix.columns(m), "cols")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['m00'].data[0].value).toBe(1);
            expect(plots['rows'].data[0].value).toBe(2);
            expect(plots['cols'].data[0].value).toBe(2);
        });

        it('matrix.new<float> works with matrix operations', async () => {
            const code = `
//@version=6
indicator("matrix.new<float> operations")
var m = matrix.new<float>(2, 2, 0)
matrix.set(m, 0, 0, 1.5)
matrix.set(m, 0, 1, 2.5)
matrix.set(m, 1, 0, 3.5)
matrix.set(m, 1, 1, 4.5)
plot(matrix.avg(m), "avg")
plot(matrix.max(m), "max")
plot(matrix.min(m), "min")
plot(matrix.elements_count(m), "count")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['avg'].data[0].value).toBe(3);
            expect(plots['max'].data[0].value).toBe(4.5);
            expect(plots['min'].data[0].value).toBe(1.5);
            expect(plots['count'].data[0].value).toBe(4);
        });
    });

    // ─── Edge Cases ──────────────────────────────────────────────────

    describe('Generic type edge cases', () => {
        it('array.new<float> and array.new<int> coexist in same script', async () => {
            const code = `
//@version=6
indicator("mixed generic types")
var floats = array.new<float>(2, 0)
var ints = array.new<int>(2, 0)
array.set(floats, 0, 1.5)
array.set(floats, 1, 2.5)
array.set(ints, 0, 10)
array.set(ints, 1, 20)
plot(array.get(floats, 0), "f0")
plot(array.get(floats, 1), "f1")
plot(array.get(ints, 0), "i0")
plot(array.get(ints, 1), "i1")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['f0'].data[0].value).toBe(1.5);
            expect(plots['f1'].data[0].value).toBe(2.5);
            expect(plots['i0'].data[0].value).toBe(10);
            expect(plots['i1'].data[0].value).toBe(20);
        });

        it('generic type inside user function', async () => {
            const code = `
//@version=6
indicator("generic type in function")
make_array() =>
    arr = array.new<float>(3, 0)
    array.set(arr, 0, 1.1)
    array.set(arr, 1, 2.2)
    array.set(arr, 2, 3.3)
    arr

var result = make_array()
plot(array.get(result, 0), "v0")
plot(array.get(result, 1), "v1")
plot(array.get(result, 2), "v2")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['v0'].data[0].value).toBeCloseTo(1.1);
            expect(plots['v1'].data[0].value).toBeCloseTo(2.2);
            expect(plots['v2'].data[0].value).toBeCloseTo(3.3);
        });

        it('mixed array and matrix generic types', async () => {
            const code = `
//@version=6
indicator("mixed array and matrix generics")
var arr = array.new<float>(3, 0)
var m = matrix.new<float>(2, 2, 0)
array.set(arr, 0, 1.5)
matrix.set(m, 0, 0, 2.5)
plot(array.get(arr, 0), "arr_val")
plot(matrix.get(m, 0, 0), "mat_val")
`;
            const { plots } = await pineTS.run(code);

            expect(plots['arr_val'].data[0].value).toBe(1.5);
            expect(plots['mat_val'].data[0].value).toBe(2.5);
        });
    });
});
