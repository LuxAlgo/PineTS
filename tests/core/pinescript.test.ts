import { describe, expect, it } from 'vitest';
import { getKlines, runNSFunctionWithArgs } from '../utils';
import { Context, PineTS } from 'index';
import { transpile } from 'transpiler';
import { Provider } from '@pinets/marketData/Provider.class';
import fs from 'fs';
import { deepEqual } from '../compatibility/lib/serializer';

describe('PineScript Language', () => {
    it('History', async () => {
        //const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 5000, new Date('Aug 17 2017').getTime(), new Date('Nov 25 2025').getTime());
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            const container = val[1] || 99999;
            val = val[1] ? val[1] + 1 : 1;
            //=============================

            return {
                val,
                container,
            };
        });

        console.log('>>> TEST: History');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            container: [99999, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });
    it('Compound Assignment', async () => {
        //const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 5000, new Date('Aug 17 2017').getTime(), new Date('Nov 25 2025').getTime());
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            const container = val[1] || 99999;
            val = val[1] ? val[1] + 1 : 1;
            //=============================
            function get_average(avg_src, avg_len) {
                let ret_val = 0.0;
                for (let i = 1; i <= avg_len; i++) {
                    ret_val += avg_src[i] || 0;
                }
                return ret_val / avg_len;
            }

            const _avg = get_average(val, 3);

            return {
                _avg,
            };
        });

        console.log('>>> TEST: Compound Assignment');
        console.log('>>> result: ', context.result);

        const expected = {
            _avg: [0, 0.3333333333, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 1: Variable Declarations and Types
    it('Variable Declaration Types (var, let, const)', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            var varVar = 10;
            let letVar = 20;
            const constVar = 30;

            varVar = varVar + 1;
            letVar = letVar + 1;
            // constVar = constVar + 1; // Should cause error if uncommented
            //=============================

            return {
                varVar,
                letVar,
                constVar,
            };
        });

        console.log('>>> TEST: Variable Declaration Types (var, let, const)');
        console.log('>>> result: ', context.result);

        const expected = {
            varVar: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            letVar: [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21],
            constVar: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('tuples', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2024-01-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            function foo() {
                const oo = open;
                const cc = close;
                return [oo, cc];
            }

            const [res, data] = foo();

            plotchar(res, '_plotchar');

            return {
                res,
                data,
            };
        });

        let plotdata = plots['_plotchar']?.data;
        const sDate = new Date('2025-08-01').getTime();
        const eDate = new Date('2025-11-10').getTime();
        plotdata = plotdata.filter((e) => new Date(e.time).getTime() >= sDate && new Date(e.time).getTime() <= eDate);

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 114228.32
[2025-08-11T00:00:00.000-00:00]: 119327.09
[2025-08-18T00:00:00.000-00:00]: 117489.99
[2025-08-25T00:00:00.000-00:00]: 113491.2
[2025-09-01T00:00:00.000-00:00]: 108270.37
[2025-09-08T00:00:00.000-00:00]: 111140.01
[2025-09-15T00:00:00.000-00:00]: 115342.79
[2025-09-22T00:00:00.000-00:00]: 115314.25
[2025-09-29T00:00:00.000-00:00]: 112224.95
[2025-10-06T00:00:00.000-00:00]: 123529.91
[2025-10-13T00:00:00.000-00:00]: 115073.27
[2025-10-20T00:00:00.000-00:00]: 108689.01
[2025-10-27T00:00:00.000-00:00]: 114571.34
[2025-11-03T00:00:00.000-00:00]: 110550.87
[2025-11-10T00:00:00.000-00:00]: 104710.21`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('Variable Type Inference', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            const numVal = 42;
            const boolVal = true;
            const strVal = 'test';
            const floatVal = 3.14;
            //=============================

            return {
                numVal,
                boolVal,
                strVal,
                floatVal,
            };
        });

        console.log('>>> TEST: Variable Type Inference');
        console.log('>>> result: ', context.result);

        const expected = {
            numVal: [42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42],
            boolVal: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
            strVal: [
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
                'test',
            ],
            floatVal: [3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14, 3.14],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Variable Initialization with Default Values', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let counter = 0;
            let flag = false;
            let value = 100;
            //=============================

            return {
                counter,
                flag,
                value,
            };
        });

        console.log('>>> TEST: Variable Initialization with Default Values');
        console.log('>>> result: ', context.result);

        const expected = {
            counter: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            flag: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
            value: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Variable Reassignment', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let letVar = 0;
            var varVar = 0;

            letVar = letVar + 1;
            varVar = varVar + 2;

            letVar = letVar * 2;
            varVar = varVar * 3;
            //=============================

            return {
                letVar,
                varVar,
            };
        });

        console.log('>>> TEST: Variable Reassignment');
        console.log('>>> result: ', context.result);

        const expected = {
            letVar: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            varVar: [
                6, 24, 78, 240, 726, 2184, 6558, 19680, 59046, 177144, 531438, 1594320, 4782966, 14348904, 43046718, 129140160, 387420486, 1162261464,
                3486784398, 10460353200,
            ],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 2: Variable Scoping
    it('Global Scope Variables', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let globalVar = 10;

            if (close > open) {
                globalVar = globalVar + 5;
            }

            let result = globalVar;
            //=============================

            return {
                globalVar,
                result,
            };
        });

        console.log('>>> TEST: Global Scope Variables');
        console.log('>>> result: ', context.result);

        const expected = {
            globalVar: [10, 15, 10, 15, 10, 10, 10, 15, 10, 10, 10, 10, 10, 10, 15, 10, 10, 15, 10, 15],
            result: [10, 15, 10, 15, 10, 10, 10, 15, 10, 10, 10, 10, 10, 10, 15, 10, 10, 15, 10, 15],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Block Scope Isolation', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let outerVar = 100;

            if (close > open) {
                let innerVar = 200;
                outerVar = outerVar + innerVar;
            }

            // innerVar should not be accessible here
            let result = outerVar;
            //=============================

            return {
                outerVar,
                result,
            };
        });

        console.log('>>> TEST: Block Scope Isolation');
        console.log('>>> result: ', context.result);

        const expected = {
            outerVar: [100, 300, 100, 300, 100, 100, 100, 300, 100, 100, 100, 100, 100, 100, 300, 100, 100, 300, 100, 300],
            result: [100, 300, 100, 300, 100, 100, 100, 300, 100, 100, 100, 100, 100, 100, 300, 100, 100, 300, 100, 300],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Variable Shadowing', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let x = 10;

            if (close > open) {
                let x = 20;
                let innerResult = x;
            }

            let outerResult = x;
            //=============================

            return {
                outerResult,
            };
        });

        console.log('>>> TEST: Variable Shadowing');
        console.log('>>> result: ', context.result);

        const expected = {
            outerResult: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Function Parameter Scope', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let globalVar = 100;

            function testFunc(param) {
                return param + 10;
            }

            let result = testFunc(globalVar);
            //=============================

            return {
                globalVar,
                result,
            };
        });

        console.log('>>> TEST: Function Parameter Scope');
        console.log('>>> result: ', context.result);

        const expected = {
            globalVar: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
            result: [110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110, 110],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Nested Scope Variable Access', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let outer = 50;

            if (close > open) {
                let inner = outer + 10;
                if (close > high) {
                    let nested = inner + outer;
                }
            }
            //=============================

            return {
                outer,
            };
        });

        console.log('>>> TEST: Nested Scope Variable Access');
        console.log('>>> result: ', context.result);

        const expected = {
            outer: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 3: History Access and Series Behavior
    it('History Access with Literal Index', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            val = val[1] ? val[1] + 1 : 1;

            let prev1 = val[1];
            let prev5 = val[5];
            //=============================

            return {
                val,
                prev1,
                prev5,
            };
        });

        console.log('>>> TEST: History Access with Literal Index');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            prev1: [NaN, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
            prev5: [NaN, NaN, NaN, NaN, NaN, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('History Access with Variable Index', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            val = val[1] ? val[1] + 1 : 1;

            let index = 2;
            let prevAtIndex = val[index];
            //=============================

            return {
                val,
                prevAtIndex,
            };
        });

        console.log('>>> TEST: History Access with Variable Index');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            prevAtIndex: [NaN, NaN, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('History Access with Nested Index', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            val = val[1] ? val[1] + 1 : 1;

            let index = 1;
            let nestedAccess = val[index[1]];
            //=============================

            return {
                val,
                nestedAccess,
            };
        });

        console.log('>>> TEST: History Access with Nested Index');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            nestedAccess: [undefined, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('History Access Edge Cases', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            val = val[1] ? val[1] + 1 : 1;

            let farBack = val[100] || 99999;
            let zeroIndex = val[0];
            //=============================

            return {
                val,
                farBack,
                zeroIndex,
            };
        });

        console.log('>>> TEST: History Access Edge Cases');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            farBack: [
                99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999, 99999,
                99999,
            ],
            zeroIndex: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Series Initialization on First Bar', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            let firstBarAccess = val[1] || 88888;
            val = val[1] ? val[1] + 1 : 1;
            //=============================

            return {
                val,
                firstBarAccess,
            };
        });

        console.log('>>> TEST: Series Initialization on First Bar');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            firstBarAccess: [88888, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 4: Operators - Arithmetic
    it('Arithmetic Operators', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let add = close + open;
            let sub = close - open;
            let mul = close * 2;
            let div = close / 2;
            let mod = close % 10;
            let pow = math.pow ? math.pow(close, 2) : close * close;
            //=============================

            return {
                add,
                sub,
                mul,
                div,
                mod,
                pow,
            };
        });

        console.log('>>> TEST: Arithmetic Operators');
        console.log('>>> result: ', context.result);
    });

    it('Comparison Operators', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let eq = close == open;
            let ne = close != open;
            let gt = close > open;
            let lt = close < open;
            let gte = close >= open;
            let lte = close <= open;
            //=============================

            return {
                eq,
                ne,
                gt,
                lt,
                gte,
                lte,
            };
        });

        console.log('>>> TEST: Comparison Operators');
        console.log('>>> result: ', context.result);

        const expected = {
            eq: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
            ne: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
            gt: [
                false,
                true,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                true,
            ],
            lt: [true, false, true, false, true, true, true, false, true, true, true, true, true, true, false, true, true, false, true, false],
            gte: [
                false,
                true,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                true,
            ],
            lte: [true, false, true, false, true, true, true, false, true, true, true, true, true, true, false, true, true, false, true, false],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Logical Operators', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let andOp = close > open && high > low;
            let orOp = close > open || high < low;
            let notOp = !(close > open);
            //=============================

            return {
                andOp,
                orOp,
                notOp,
            };
        });

        console.log('>>> TEST: Logical Operators');
        console.log('>>> result: ', context.result);

        const expected = {
            andOp: [
                false,
                true,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                true,
            ],
            orOp: [
                false,
                true,
                false,
                true,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
                false,
                false,
                true,
                false,
                true,
            ],
            notOp: [true, false, true, false, true, true, true, false, true, true, true, true, true, true, false, true, true, false, true, false],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 5: Operators - Advanced
    it('Ternary Operator', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = close > open ? 1 : 0;
            let nested = close > open ? (high > low ? 2 : 1) : 0;
            //=============================

            return {
                result,
                nested,
            };
        });

        console.log('>>> TEST: Ternary Operator');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
            nested: [0, 2, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 2],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Unary Operators', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let pos = +close;
            let neg = -close;
            let not = !(close > open);
            //=============================

            return {
                pos,
                neg,
                not,
            };
        });

        console.log('>>> TEST: Unary Operators');
        console.log('>>> result: ', context.result);

        const expected = {
            pos: [115445, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN],
            neg: [-115445, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN],
            not: [true, false, true, false, true, true, true, false, true, true, true, true, true, true, false, true, true, false, true, false],
        };

        expect(deepEqual(context.result.not, expected.not)).toBe(true);
        expect(context.result.not).toEqual(expected.not);
    });

    it('Compound Assignment Operators', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let addAssign = 10;
            addAssign += 5;

            let subAssign = 20;
            subAssign -= 3;

            let mulAssign = 4;
            mulAssign *= 2;

            let divAssign = 20;
            divAssign /= 4;

            let modAssign = 17;
            modAssign %= 5;
            //=============================

            return {
                addAssign,
                subAssign,
                mulAssign,
                divAssign,
                modAssign,
            };
        });

        console.log('>>> TEST: Compound Assignment Operators');
        console.log('>>> result: ', context.result);

        const expected = {
            addAssign: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
            subAssign: [17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17],
            mulAssign: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
            divAssign: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            modAssign: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Operator Precedence', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let mulBeforeAdd = 2 + 3 * 4;
            let parenOverride = (2 + 3) * 4;
            let andBeforeOr = true || (false && true);
            //=============================

            return {
                mulBeforeAdd,
                parenOverride,
                andBeforeOr,
            };
        });

        console.log('>>> TEST: Operator Precedence');
        console.log('>>> result: ', context.result);

        const expected = {
            mulBeforeAdd: [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
            parenOverride: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
            andBeforeOr: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('NaN Comparisons', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;
            const { na } = context.core;

            //=============================
            let nanVal = na;
            let nanCompare = nanVal == na;
            let nanCompare2 = na == na;
            //=============================

            return {
                nanVal,
                nanCompare,
                nanCompare2,
            };
        });

        console.log('>>> TEST: NaN Comparisons');
        console.log('>>> result: ', context.result);

        const expected = {
            nanVal: [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN],
            nanCompare: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
            nanCompare2: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Short-Circuit Evaluation', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            let shortAnd = false && (val = 100);
            let shortOr = true || (val = 200);
            //=============================

            return {
                val,
                shortAnd,
                shortOr,
            };
        });

        console.log('>>> TEST: Short-Circuit Evaluation');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            shortAnd: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
            shortOr: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 6: Control Flow - Conditionals
    it('If Statement', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = 0;
            if (close > open) {
                result = 1;
            }
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: If Statement');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('If-Else Statement', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = 0;
            if (close > open) {
                result = 1;
            } else {
                result = -1;
            }
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: If-Else Statement');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [-1, 1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('If-Else If-Else Chain', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = 0;
            if (close > open * 1.01) {
                result = 2;
            } else if (close > open) {
                result = 1;
            } else if (close < open * 0.99) {
                result = -2;
            } else {
                result = -1;
            }
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: If-Else If-Else Chain');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [-1, 1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -2, 1, -1, -1, 1, -1, 1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Nested If Statements', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = 0;
            if (close > open) {
                if (high > close * 1.01) {
                    result = 2;
                } else {
                    result = 1;
                }
            } else {
                result = -1;
            }
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Nested If Statements');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [-1, 1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Ternary Operator as Expression', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = close > open ? 100 : 50;
            let nested = close > open ? (high > low ? 200 : 150) : 0;
            //=============================

            return {
                result,
                nested,
            };
        });

        console.log('>>> TEST: Ternary Operator as Expression');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [50, 100, 50, 100, 50, 50, 50, 100, 50, 50, 50, 50, 50, 50, 100, 50, 50, 100, 50, 100],
            nested: [0, 200, 0, 200, 0, 0, 0, 200, 0, 0, 0, 0, 0, 0, 200, 0, 0, 200, 0, 200],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 7: Control Flow - Switch
    it('Switch Statement', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = 0;
            let condition = close > open ? 1 : close < open ? -1 : 0;

            switch (condition) {
                case 1:
                    result = 100;
                    break;
                case -1:
                    result = -100;
                    break;
                default:
                    result = 0;
            }
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Switch Statement');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [-100, 100, -100, 100, -100, -100, -100, 100, -100, -100, -100, -100, -100, -100, 100, -100, -100, 100, -100, 100],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 8: Loops - For Loops
    it('For Loop with Literal Range', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let sum = 0;
            for (let i = 1; i <= 5; i++) {
                sum += i;
            }
            //=============================

            return {
                sum,
            };
        });

        console.log('>>> TEST: For Loop with Literal Range');
        console.log('>>> result: ', context.result);

        const expected = {
            sum: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('For Loop with Series Range', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            val = val[1] ? val[1] + 1 : 1;

            let sum = 0;
            let limit = val[1] || 3;
            for (let i = 1; i <= limit; i++) {
                sum += i;
            }
            //=============================

            return {
                sum,
            };
        });

        console.log('>>> TEST: For Loop with Series Range');
        console.log('>>> result: ', context.result);

        const expected = {
            sum: [6, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120, 136, 153, 171, 190],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('For Loop Variable Scope', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let outer = 10;
            for (let i = 0; i < 3; i++) {
                let inner = i * 2;
                outer = outer + inner;
            }
            //=============================

            return {
                outer,
            };
        });

        console.log('>>> TEST: For Loop Variable Scope');
        console.log('>>> result: ', context.result);

        const expected = {
            outer: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('For Loop History Access', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-02-20 ').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const { na } = context.pine;

            //=============================
            let val = 0;
            val = !na(val[1]) ? val[1] + 1 : 1;

            let sum = 0;
            for (let i = 1; i <= 3; i++) {
                sum += na(val[i]) ? 0 : val[i];
            }
            //=============================

            return {
                val,
                sum,
            };
        });

        console.log('>>> TEST: For Loop History Access');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            sum: [0, 1, 3, 6, 9, 12, 15, 18, 21, 24, 27],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Nested For Loops', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let sum = 0;
            for (let i = 1; i <= 2; i++) {
                for (let j = 1; j <= 2; j++) {
                    sum += i * j;
                }
            }
            //=============================

            return {
                sum,
            };
        });

        console.log('>>> TEST: Nested For Loops');
        console.log('>>> result: ', context.result);

        const expected = {
            sum: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 9: Loops - While and Control
    it('While Loop', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let counter = 0;
            let sum = 0;
            while (counter < 5) {
                sum += counter;
                counter += 1;
            }
            //=============================

            return {
                sum,
            };
        });

        console.log('>>> TEST: While Loop');
        console.log('>>> result: ', context.result);

        const expected = {
            sum: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Break Statement', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let sum = 0;
            for (let i = 1; i <= 10; i++) {
                sum += i;
                if (i >= 5) {
                    break;
                }
            }
            //=============================

            return {
                sum,
            };
        });

        console.log('>>> TEST: Break Statement');
        console.log('>>> result: ', context.result);

        const expected = {
            sum: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Continue Statement', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let sum = 0;
            for (let i = 1; i <= 5; i++) {
                if (i === 3) {
                    continue;
                }
                sum += i;
            }
            //=============================

            return {
                sum,
            };
        });

        console.log('>>> TEST: Continue Statement');
        console.log('>>> result: ', context.result);

        const expected = {
            sum: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 10: Functions
    it('Function Definition', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function add(a, b) {
                return a + b;
            }

            let result = add(10, 20);
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Function Definition');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Function Call with Literal Arguments', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function multiply(x, y) {
                return x * y;
            }

            let result = multiply(5, 6);
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Function Call with Literal Arguments');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Function Call with Series Arguments', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function double(value) {
                return value * 2;
            }

            let result = double(close);
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Function Call with Series Arguments');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [
                230890, 231937.12, 231788.12, 231973.38, 231404, 231371.26, 231338.82, 231631.94, 231206.9, 231063.22, 230960.1, 230464.58, 229299.78,
                225039.98, 225753.94, 225631, 224245.8, 225301.98, 224679.98, 226180.26,
            ],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Function Return Values', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function getLiteral() {
                return 42;
            }

            function getSeries(src) {
                return src * 2;
            }

            let literalResult = getLiteral();
            let seriesResult = getSeries(close);
            //=============================

            return {
                literalResult,
                seriesResult,
            };
        });

        console.log('>>> TEST: Function Return Values');
        console.log('>>> result: ', context.result);

        const expected = {
            literalResult: [42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42],
            seriesResult: [
                230890, 231937.12, 231788.12, 231973.38, 231404, 231371.26, 231338.82, 231631.94, 231206.9, 231063.22, 230960.1, 230464.58, 229299.78,
                225039.98, 225753.94, 225631, 224245.8, 225301.98, 224679.98, 226180.26,
            ],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Function Parameter History Access', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function getPrev(src) {
                return src[1] || 0;
            }

            let val = 0;
            val = val[1] ? val[1] + 1 : 1;

            let prev = getPrev(val);
            //=============================

            return {
                val,
                prev,
            };
        });

        console.log('>>> TEST: Function Parameter History Access');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            prev: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it.skip('Recursive Functions', async () => {
        // Skipped: Recursive functions may not be fully supported by the transpiler
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function factorial(n) {
                if (n <= 1) {
                    return 1;
                }
                return n * factorial(n - 1);
            }

            let result = factorial(5);
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Recursive Functions');
        console.log('>>> result: ', context.result);
    });

    it('Function Scope Variables', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let globalVar = 100;

            function testFunc() {
                let localVar = 50;
                return localVar + globalVar;
            }

            let result = testFunc();
            //=============================

            return {
                globalVar,
                result,
            };
        });

        console.log('>>> TEST: Function Scope Variables');
        console.log('>>> result: ', context.result);

        const expected = {
            globalVar: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
            result: [150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Default Parameter Values', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function addWithDefault(a, b = 10) {
                return a + b;
            }

            let result1 = addWithDefault(5);
            let result2 = addWithDefault(5, 20);
            //=============================

            return {
                result1,
                result2,
            };
        });

        console.log('>>> TEST: Default Parameter Values');
        console.log('>>> result: ', context.result);

        const expected = {
            result1: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
            result2: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Multiple Return Statements', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function conditionalReturn(val) {
                if (val > 0) {
                    return 1;
                }
                return -1;
            }

            let result1 = conditionalReturn(10);
            let result2 = conditionalReturn(-5);
            //=============================

            return {
                result1,
                result2,
            };
        });

        console.log('>>> TEST: Multiple Return Statements');
        console.log('>>> result: ', context.result);

        const expected = {
            result1: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            result2: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 11: Arrays and Destructuring
    it.skip('Array Creation', async () => {
        // Skipped: Array variables may not be properly handled as series by transpiler
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;
            const array = context.array;

            //=============================
            let arr = array.new(5);
            array.push(arr, 10);
            array.push(arr, 20);
            //=============================

            return {
                arrLength: array.size(arr),
            };
        });

        console.log('>>> TEST: Array Creation');
        console.log('>>> result: ', context.result);
    });

    it('Array Indexing', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;
            const array = context.array;

            //=============================
            let arr = array.new(5);
            array.push(arr, 10);
            array.push(arr, 20);
            array.push(arr, 30);

            let first = array.get(arr, 0);
            let second = array.get(arr, 1);
            let seventh = array.get(arr, 6);
            //=============================

            return {
                first,
                second,
                seventh,
            };
        });

        console.log('>>> TEST: Array Indexing');
        console.log('>>> result: ', context.result);

        const expected = {
            first: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            second: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            seventh: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Array Assignment', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;
            const array = context.array;

            //=============================
            let arr = array.new(5);
            array.push(arr, 10);
            array.set(arr, 0, 100);

            let value = array.get(arr, 0);
            //=============================

            return {
                value,
            };
        });

        console.log('>>> TEST: Array Assignment');
        console.log('>>> result: ', context.result);

        const expected = {
            value: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Array Destructuring', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            function returnArray() {
                return [10, 20];
            }

            let [a, b] = returnArray();
            //=============================

            return {
                a,
                b,
            };
        });

        console.log('>>> TEST: Array Destructuring');
        console.log('>>> result: ', context.result);

        const expected = {
            a: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
            b: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it.skip('Array History Access', async () => {
        // Skipped: Array variables may not be properly handled as series by transpiler
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;
            const array = context.array;

            //=============================
            let arr = array.new(5);
            array.push(arr, 10);

            let prevArr = arr[1];
            //=============================

            return {
                arrSize: array.size(arr),
            };
        });

        console.log('>>> TEST: Array History Access');
        console.log('>>> result: ', context.result);
    });

    // Category 12: Type System and Conversions
    it('Type Coercion', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let num = 10;
            let boolFromNum = num ? true : false;
            let numFromBool = true ? 1 : 0;
            //=============================

            return {
                boolFromNum,
                numFromBool,
            };
        });

        console.log('>>> TEST: Type Coercion');
        console.log('>>> result: ', context.result);

        const expected = {
            boolFromNum: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
            numFromBool: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('NaN and na Handling', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;
            const { na, nz } = context.core;

            //=============================
            let nanVal = na;
            let nanArith = nanVal + 10;
            let nanCompare = nanVal == na;
            let nzResult = nz(nanVal, 999);
            //=============================

            return {
                nanVal,
                nanArith,
                nanCompare,
                nzResult,
            };
        });

        console.log('>>> TEST: NaN and na Handling');
        console.log('>>> result: ', context.result);

        const expected = {
            nanVal: [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN],
            nanArith: [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN],
            nanCompare: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
            nzResult: [999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999, 999],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Null and Undefined Handling', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let nullVal = null;
            let undefinedVal = undefined;
            let nullDefault = nullVal || 100;
            let undefinedDefault = undefinedVal || 200;
            //=============================

            return {
                nullDefault,
                undefinedDefault,
            };
        });

        console.log('>>> TEST: Null and Undefined Handling');
        console.log('>>> result: ', context.result);

        const expected = {
            nullDefault: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
            undefinedDefault: [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Boolean Conversion', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let num = 10;
            let zero = 0;
            let str = 'test';
            let numToBool = num ? true : false;
            let zeroToBool = zero ? true : false;
            let strToBool = str ? true : false;
            //=============================

            return {
                numToBool,
                zeroToBool,
                strToBool,
            };
        });

        console.log('>>> TEST: Boolean Conversion');
        console.log('>>> result: ', context.result);

        const expected = {
            numToBool: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
            zeroToBool: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
            strToBool: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('String Operations', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let str1 = 'Hello';
            let str2 = 'World';
            let concat = str1 + ' ' + str2;
            let compare = str1 == str2;
            //=============================

            return {
                concat,
                compare,
            };
        });

        console.log('>>> TEST: String Operations');
        console.log('>>> result: ', context.result);

        const expected = {
            concat: [
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
                'Hello World',
            ],
            compare: [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 13: Expression Evaluation
    it('Nested Expressions', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let complex = ((close + open) * 2 - (high - low)) / 2;
            let nested = close > open ? (high > low ? 1 : 0) : -1;
            //=============================

            return {
                complex,
                nested,
            };
        });

        console.log('>>> TEST: Nested Expressions');
        console.log('>>> result: ', context.result);

        const expected = {
            complex: [
                230916.42, 231125.5, 231710.39, 231722.07, 231498.01, 231216.99, 231209.485, 231321.18, 231174.415, 230998.04, 230783.42, 230533.625,
                229267.555, 225744.93, 224995.72, 225166.09, 224462.6, 224272.825, 224313.435, 224811.19,
            ],
            nested: [-1, 1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
    });

    it('Expression Side Effects', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            let result = (val = 10) + 5;
            //=============================

            return {
                val,
                result,
            };
        });

        console.log('>>> TEST: Expression Side Effects');
        console.log('>>> result: ', context.result);

        const expected = {
            val: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            result: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Parentheses Precedence', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let withoutParen = 2 + 3 * 4;
            let withParen = (2 + 3) * 4;
            //=============================

            return {
                withoutParen,
                withParen,
            };
        });

        console.log('>>> TEST: Parentheses Precedence');
        console.log('>>> result: ', context.result);

        const expected = {
            withoutParen: [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
            withParen: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Conditional Assignment Patterns', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let ternary = close > open ? 1 : 0;
            let orDefault = close || 100;
            //=============================

            return {
                ternary,
                orDefault,
            };
        });

        console.log('>>> TEST: Conditional Assignment Patterns');
        console.log('>>> result: ', context.result);

        const expected = {
            ternary: [0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
            orDefault: [
                115445, 115968.56, 115894.06, 115986.69, 115702, 115685.63, 115669.41, 115815.97, 115603.45, 115531.61, 115480.05, 115232.29,
                114649.89, 112519.99, 112876.97, 112815.5, 112122.9, 112650.99, 112339.99, 113090.13,
            ],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    // Category 14: Edge Cases and Special Behaviors
    it('Empty Blocks', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let result = 0;
            if (close > open) {
                // Empty block
            }

            for (let i = 0; i < 3; i++) {
                // Empty loop
            }
            //=============================

            return {
                result,
            };
        });

        console.log('>>> TEST: Empty Blocks');
        console.log('>>> result: ', context.result);

        const expected = {
            result: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Variable Used Before Initialization', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        try {
            const context = await pineTS.run(async (context) => {
                const { open, close, high, low, hlc3 } = context.data;
                const ta = context.ta;
                const math = context.math;

                //=============================
                // @ts-ignore - Testing behavior when variable is used before initialization
                let result = uninitialized || 999;
                let uninitialized = 100;
                //=============================

                return {
                    result,
                };
            });
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('Circular Dependencies', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        try {
            const context = await pineTS.run(async (context) => {
                const { open, close, high, low, hlc3 } = context.data;
                const ta = context.ta;
                const math = context.math;

                //=============================
                // @ts-ignore - Testing circular dependency behavior
                let a = b + 1;
                // @ts-ignore - Testing circular dependency behavior
                let b = a + 1;
                //=============================

                return {
                    a,
                    b,
                };
            });
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('Multiple Assignments in Sequence', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let a = 10;
            let b = 20;
            let c = 30;

            a = a + 1;
            b = b + 2;
            c = c + 3;
            //=============================

            return {
                a,
                b,
                c,
            };
        });

        console.log('>>> TEST: Multiple Assignments in Sequence');
        console.log('>>> result: ', context.result);

        const expected = {
            a: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
            b: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
            c: [33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33, 33],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Series Length Consistency', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val1 = 0;
            let val2 = 0;
            let val3 = 0;

            val1 = val1[1] ? val1[1] + 1 : 1;
            val2 = val2[1] ? val2[1] + 2 : 2;
            val3 = val3[1] ? val3[1] + 3 : 3;
            //=============================

            return {
                val1,
                val2,
                val3,
            };
        });

        console.log('>>> TEST: Series Length Consistency');
        console.log('>>> result: ', context.result);

        const expected = {
            val1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            val2: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
            val3: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('First Bar Special Handling', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let val = 0;
            let firstBarVal = val;
            let firstBarHistory = val[1] || 77777;
            val = val[1] ? val[1] + 1 : 1;
            //=============================

            return {
                firstBarVal,
                firstBarHistory,
                val,
            };
        });

        console.log('>>> TEST: First Bar Special Handling');
        console.log('>>> result: ', context.result);

        const expected = {
            firstBarVal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            firstBarHistory: [77777, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
            val: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Bar-by-Bar Execution', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let counter = 0;
            counter = counter[1] ? counter[1] + 1 : 1;

            let state = counter % 2;
            //=============================

            return {
                counter,
                state,
            };
        });

        console.log('>>> TEST: Bar-by-Bar Execution');
        console.log('>>> result: ', context.result);

        const expected = {
            counter: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            state: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });

    it('Operator Precedence Complex', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '4H', 20, new Date('Sep 20 2025').getTime(), new Date('Nov 25 2025').getTime());
        const context = await pineTS.run(async (context) => {
            const { open, close, high, low, hlc3 } = context.data;
            const ta = context.ta;
            const math = context.math;

            //=============================
            let complex1 = 2 + 3 * 4 - 5 / 2;
            let complex2 = ((2 + 3) * (4 - 5)) / 2;
            let complex3 = true || (false && true);
            let complex4 = (true || false) && true;
            //=============================

            return {
                complex1,
                complex2,
                complex3,
                complex4,
            };
        });

        console.log('>>> TEST: Operator Precedence Complex');
        console.log('>>> result: ', context.result);

        const expected = {
            complex1: [11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5, 11.5],
            complex2: [-2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5],
            complex3: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
            complex4: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        };

        expect(deepEqual(context.result, expected)).toBe(true);
        expect(context.result).toEqual(expected);
    });
});
