import { describe, expect, it } from 'vitest';
import { resolveInput } from '../../src/namespaces/input/utils';
import { string } from '../../src/namespaces/input/methods/string';
import { int } from '../../src/namespaces/input/methods/int';
import { float } from '../../src/namespaces/input/methods/float';
import { bool } from '../../src/namespaces/input/methods/bool';
import { source } from '../../src/namespaces/input/methods/source';
import { any } from '../../src/namespaces/input/methods/any';
import { color } from '../../src/namespaces/input/methods/color';
import { enum_fn } from '../../src/namespaces/input/methods/enum';
import { price } from '../../src/namespaces/input/methods/price';
import { session } from '../../src/namespaces/input/methods/session';
import { symbol } from '../../src/namespaces/input/methods/symbol';
import { text_area } from '../../src/namespaces/input/methods/text_area';
import { time } from '../../src/namespaces/input/methods/time';
import { timeframe } from '../../src/namespaces/input/methods/timeframe';
import { buildKeyedProxy } from '../../src/Indicator/keyedProxy';
import { Context } from '../../src/Context.class';
import { Indicator } from '../../src/Indicator';
import { PineTS } from '../../src/PineTS.class';

describe('input override host-object boundary', () => {
    it('ignores inherited keys at every lookup priority', () => {
        const inputs = Object.create({ in_0: Function, constructor: Object, prototype: Array });
        const context = { inputs };

        expect(resolveInput(context, { __inputId: 'in_0', __varId: 'constructor', title: 'prototype', defval: 'safe' }, 'string')).toBe('safe');
        expect(string(context)('safe', '__proto__')).toBe('safe');
        expect(string(context)('safe', 'constructor')).toBe('safe');
        expect(string(context)('safe', 'prototype')).toBe('safe');
    });

    it('accepts explicitly owned, type-valid overrides and preserves precedence', () => {
        const inputs = Object.assign(Object.create(null), {
            in_0: 'by-id',
            name: 'by-name',
            title: 'by-title',
        });
        const context = { inputs };

        expect(resolveInput(context, { __inputId: 'in_0', __varId: 'name', title: 'title', defval: 'default' }, 'string')).toBe('by-id');
        expect(resolveInput(context, { __varId: 'name', title: 'title', defval: 'default' }, 'string')).toBe('by-name');
        expect(resolveInput(context, { title: 'title', defval: 'default' }, 'string')).toBe('by-title');

        const special = JSON.parse('{"__proto__":"owned"}');
        expect(string({ inputs: special })('default', '__proto__')).toBe('owned');
        expect(Object.prototype).not.toHaveProperty('owned');
    });

    it('rejects incompatible overrides before returning host objects', () => {
        expect(() => string({ inputs: { name: Function } })('default', 'name')).toThrow(TypeError);
        expect(() => int({ inputs: { count: '3' } })(1, 'count')).toThrow(TypeError);
        expect(() => float({ inputs: { ratio: Infinity } })(1.5, 'ratio')).toThrow(TypeError);
        expect(() => bool({ inputs: { enabled: 1 } })(false, 'enabled')).toThrow(TypeError);
        expect(() => source({ inputs: { series: Object } })(1, 'series')).toThrow(TypeError);
    });

    it('enforces every typed input method and the auto-typed input method', () => {
        for (const [factory, defaultValue] of [
            [color, '#ffffff'], [enum_fn, 'a'], [session, '0930-1600'],
            [symbol, 'BTCUSDC'], [text_area, 'text'], [timeframe, '60'],
        ] as const) {
            expect(() => factory({ inputs: { key: Object } })(defaultValue, 'key')).toThrow(TypeError);
        }
        for (const [factory, defaultValue] of [[price, 1.5], [time, 1700000000000]] as const) {
            expect(() => factory({ inputs: { key: '1' } })(defaultValue, 'key')).toThrow(TypeError);
        }
        expect(() => any({ inputs: { key: Function } })(1, 'key')).toThrow(TypeError);
        expect(() => any({ inputs: { key: 'arbitrary' } })(1, 'key')).toThrow(TypeError);
        expect(any({ inputs: { key: 'close' }, data: { close: [42] } })(1, 'key')).toBe(42);
    });

    it('keeps runtime and proxy input maps free of inherited properties', () => {
        const context = new Context({ marketData: [], source: [], inputs: { own: 1 } });
        expect(Object.getPrototypeOf(context.inputs)).toBe(null);
        expect(context.inputs.own).toBe(1);

        const built = buildKeyedProxy([{ key: '__proto__', type: 'string', defval: 'default' }], 'Indicator.input');
        expect(built.proxy.__proto__).toBe('default');
        built.proxy.__proto__ = 'owned';
        expect(built.proxy.__proto__).toBe('owned');
        expect(Object.getPrototypeOf(built.values)).toBe(null);
        expect(Object.prototype).not.toHaveProperty('owned');
    });

    it('rejects overrides outside declared options and bounds', () => {
        expect(() => int({ inputs: { count: 99 } })(10, { title: 'count', minval: 1, maxval: 20 })).toThrow(RangeError);
        expect(() => string({ inputs: { mode: 'other' } })('a', { title: 'mode', options: ['a', 'b'] })).toThrow(RangeError);
        expect(int({ inputs: { count: 20 } })(10, { title: 'count', minval: 1, maxval: 20 })).toBe(20);
        expect(() => any({ inputs: { count: 99 } })(10, { title: 'count', minval: 1, maxval: 20 })).toThrow(RangeError);
    });

    it('uses the compile-time type of bare input() without mistaking int for source or float', async () => {
        const data = [{ openTime: 1, closeTime: 2, open: 100, high: 101, low: 99, close: 100, volume: 1 }];
        const source = (declaration: string) => `//@version=6\nindicator("Inputs")\nv = ${declaration}\nplot(v, "out")`;
        const run = (declaration: string, override: unknown) =>
            new PineTS(data).run(new Indicator(source(declaration), { N: override }));

        await expect(run('input(14, "N")', 1.5)).rejects.toThrow(TypeError);
        await expect(run('input(14, "N")', 'close')).rejects.toThrow(TypeError);
        const floatResult = await run('input(14.0, "N")', 1.5);
        expect(floatResult.plots.out.data[0].value).toBe(1.5);
        const sourceResult = await run('input(close, "N")', 'high');
        expect(sourceResult.plots.out.data[0].value).toBe(101);
    });

    it('does not expose object-valued legacy inputs through the Pine inputs builtin', async () => {
        const data = [{ openTime: 1, closeTime: 2, open: 100, high: 101, low: 99, close: 100, volume: 1 }];
        const code = `//@version=6\nindicator("Inputs")\nplot(na(inputs.bad) ? 0 : 1, "out")`;
        const run = () => new PineTS(data).run(new Indicator(code, { bad: Function }));
        await expect(run()).rejects.toThrow(TypeError);

        const primitiveCode = `//@version=6\nindicator("Inputs")\nplot(inputs.good, "out")`;
        const primitiveResult = await new PineTS(data).run(new Indicator(primitiveCode, { good: 7 }));
        expect(primitiveResult.plots.out.data[0].value).toBe(7);
    });
});
