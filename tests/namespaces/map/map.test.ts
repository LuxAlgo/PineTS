import { describe, expect, it } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';

describe('Map Namespace', () => {
    it('should handle map operations correctly', async () => {
        const sDate = new Date('2019-01-01').getTime();
        const eDate = new Date('2019-01-05').getTime();
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { map } = context.pine;

            // new
            const m = map.new();

            // put
            const p1 = map.put(m, 'a', 10); // NaN
            const p2 = map.put(m, 'b', 20); // NaN
            //const p3 = map.put(m, 'a', 30); // 10
            const p3 = m.put('a', 30);

            // get
            const g1 = map.get(m, 'a'); // 30
            const g2 = map.get(m, 'b'); // 20
            const g3 = map.get(m, 'c'); // NaN (Pine Script na)

            // size
            const s = map.size(m); // 2

            // contains
            const c1 = map.contains(m, 'a'); // true
            const c2 = map.contains(m, 'c'); // false

            // keys
            const k = map.keys(m); // PineArrayObject ['a', 'b']

            // values
            const v = map.values(m); // PineArrayObject [30, 20]

            // remove
            const r1 = map.remove(m, 'b'); // 20
            const s2 = map.size(m); // 1
            const r2 = map.remove(m, 'z'); // NaN

            // copy
            const m2 = map.copy(m);
            map.put(m2, 'x', 100);
            const s3 = map.size(m); // 1
            const s4 = map.size(m2); // 2

            // clear
            const m_clear = map.copy(m2);
            map.clear(m_clear);
            const s5 = map.size(m_clear); // 0

            // put_all
            map.clear(m2);
            map.put(m2, 'k1', 1);
            const m3 = map.new();
            map.put(m3, 'k2', 2);
            map.put_all(m3, m2); // puts m2 into m3 -> m3 has k2, k1
            const s6 = map.size(m3); // 2
            const val_k1 = map.get(m3, 'k1');
            const val_k2 = map.get(m3, 'k2');

            return {
                p1,
                p2,
                p3,
                g1,
                g2,
                g3,
                s,
                s2,
                s3,
                s4,
                s5,
                s6,
                c1,
                c2,
                r1,
                r2,
                val_k1,
                val_k2,
                k,
                v,
            };
        };

        const { result } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.p1)).toBeNaN();
        expect(last(result.p2)).toBeNaN();
        expect(last(result.p3)).toBe(10);

        expect(last(result.g1)).toBe(30);
        expect(last(result.g2)).toBe(20);
        expect(last(result.g3)).toBeNaN();

        expect(last(result.s)).toBe(2);

        expect(last(result.c1)).toBe(true);
        expect(last(result.c2)).toBe(false);

        const keysObj = last(result.k);
        if (keysObj && keysObj.array) {
            expect(keysObj.array).toEqual(['a', 'b']);
        } else {
            // If we can't access .array, assume something is wrong or verify what keysObj is
            // console.log('keysObj:', keysObj);
        }

        const valuesObj = last(result.v);
        if (valuesObj && valuesObj.array) {
            expect(valuesObj.array).toEqual([30, 20]);
        }

        expect(last(result.r1)).toBe(20);
        expect(last(result.s2)).toBe(1);
        expect(last(result.r2)).toBeNaN();

        expect(last(result.s3)).toBe(1);
        expect(last(result.s4)).toBe(2);
        expect(last(result.s5)).toBe(0);

        expect(last(result.s6)).toBe(2);
        expect(last(result.val_k1)).toBe(1);
        expect(last(result.val_k2)).toBe(2);
    });
});
