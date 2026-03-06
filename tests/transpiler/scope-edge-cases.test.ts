// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Transpiler Scope Edge Cases', () => {
    it('should handle deeply nested scopes with name collisions', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            let x = ta.sma(close, 20);
            
            if (close > 100) {
                let x = ta.ema(close, 20);  // Different x in if scope
                
                if (close > 200) {
                    let x = ta.rsi(close, 14);  // Different x in nested if
                    
                    if (close > 300) {
                        let x = ta.atr(14);  // Different x in double-nested if
                        plotchar(x, 'innermost');
                    }
                    plotchar(x, 'nested');
                }
                plotchar(x, 'if');
            }
            plotchar(x, 'global');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['global']).toBeDefined();
        expect(plots['if']).toBeDefined();
        expect(plots['nested']).toBeDefined();
        expect(plots['innermost']).toBeDefined();
    });

    it('should not transform function parameters that shadow outer vars', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            let sma = ta.sma(close, 20);
            
            function process(sma) {  // Parameter shadows outer var
                return sma * 2;  // Should use parameter, not outer var
            }
            
            let result = process(5);
            plotchar(result, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(plots['result'].data[0].value).toBe(10); // 5 * 2
    });

    it('should handle loop variables in nested loops', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            let sum = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    sum = sum + i + j;
                }
            }
            
            plotchar(sum, 'sum');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['sum']).toBeDefined();
        // Expected: (0+0) + (0+1) + (1+0) + (1+1) + (2+0) + (2+1) = 0 + 1 + 1 + 2 + 2 + 3 = 9
        expect(plots['sum'].data[0].value).toBe(9);
    });

    it('should handle variables with same name in different function scopes', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            function calc1() {
                let result = ta.sma(close, 10);
                return result;
            }
            
            function calc2() {
                let result = ta.ema(close, 10);  // Same name, different scope
                return result;
            }
            
            let sma_result = calc1();
            let ema_result = calc2();
            
            plotchar(sma_result, 'sma');
            plotchar(ema_result, 'ema');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['sma']).toBeDefined();
        expect(plots['ema']).toBeDefined();
        expect(Array.isArray(plots['sma'].data)).toBe(true);
        expect(Array.isArray(plots['ema'].data)).toBe(true);
    });

    it('should handle for loop scope isolation', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { plotchar } = context.pine;
            
            let outer = 10;
            
            for (let i = 0; i < 3; i++) {
                let inner = i * 2;
                outer = outer + inner;
            }
            
            plotchar(outer, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        // Expected: 10 + (0*2) + (1*2) + (2*2) = 10 + 0 + 2 + 4 = 16
        expect(plots['result'].data[0].value).toBe(16);
    });

    it('should handle variable declarations in if/else branches', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            let result = 0;
            
            if (close > 50000) {
                let branch_var = 100;
                result = branch_var;
            } else {
                let branch_var = 200;  // Same name, different scope
                result = branch_var;
            }
            
            plotchar(result, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(typeof plots['result'].data[0].value).toBe('number');
    });

    it('should handle variable shadowing with const, let, and var', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            const x = 10;
            let y = 20;
            var z = 30;
            
            if (close > 0) {
                const x = 11;  // Shadows outer const
                let y = 21;    // Shadows outer let
                var z = 31;    // Shadows outer var
                plotchar(x + y + z, 'inner');
            }
            
            plotchar(x + y + z, 'outer');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['inner']).toBeDefined();
        expect(plots['outer']).toBeDefined();
        expect(plots['inner'].data[0].value).toBe(63); // 11 + 21 + 31
        expect(plots['outer'].data[0].value).toBe(60); // 10 + 20 + 30
    });

    it('should handle tuple destructuring where function locals share names with outer vars (Pine Script)', async () => {
        // Regression test: when a function returns a tuple and the caller destructures into
        // variables (e.g., [fib236, fib382] = calcFibs()), if the function itself also has
        // local variables with the same names, the transpiler's arrayPatternElements set
        // (which is global, not scoped) would falsely flag the function's locals as array
        // pattern vars, causing a crash ("Cannot read properties of undefined (reading 'name')")
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const pineCode = `
//@version=6
indicator("Tuple Scope Test")

calcLevels(float highVal, float lowVal) =>
    float range = highVal - lowVal
    float level1 = lowVal + range * 0.236
    float level2 = lowVal + range * 0.382
    float level3 = lowVal + range * 0.500
    [level1, level2, level3]

float h = ta.highest(high, 10)
float l = ta.lowest(low, 10)

// Destructure into variables - these names DON'T collide with function locals
[level1, level2, level3] = calcLevels(h, l)

plot(level1, "L1")
plot(level2, "L2")
plot(level3, "L3")
`;

        const { plots } = await pineTS.run(pineCode);
        expect(plots).toBeDefined();
        expect(plots['L1']).toBeDefined();
        expect(plots['L2']).toBeDefined();
        expect(plots['L3']).toBeDefined();
        expect(Array.isArray(plots['L1'].data)).toBe(true);
    });

    it('should handle tuple destructuring where caller vars match function locals (Pine Script)', async () => {
        // More specific regression: the exact pattern that caused the crash - caller
        // destructures into the SAME variable names used inside the function
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const pineCode = `
//@version=6
indicator("Tuple Same Names Test")

calcValues(float src) =>
    float val1 = src * 2
    float val2 = src * 3
    [val1, val2]

// Destructure uses the SAME names as the function's locals
[val1, val2] = calcValues(close)

plot(val1, "V1")
plot(val2, "V2")
`;

        const { plots } = await pineTS.run(pineCode);
        expect(plots).toBeDefined();
        expect(plots['V1']).toBeDefined();
        expect(plots['V2']).toBeDefined();
        // val1 should be close * 2, val2 should be close * 3
        const v1 = plots['V1'].data[0]?.value;
        const v2 = plots['V2'].data[0]?.value;
        expect(typeof v1).toBe('number');
        expect(typeof v2).toBe('number');
        if (v1 && v2) {
            expect(v2 / v1).toBeCloseTo(1.5, 5); // (close * 3) / (close * 2) = 1.5
        }
    });

    it('should handle block scope in switch statements', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { plotchar } = context.pine;
            
            let mode = 2;
            let result = 0;
            
            switch (mode) {
                case 1: {
                    let value = 100;
                    result = value;
                    break;
                }
                case 2: {
                    let value = 200;  // Same name, different case scope
                    result = value;
                    break;
                }
                default: {
                    let value = 300;
                    result = value;
                }
            }
            
            plotchar(result, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(plots['result'].data[0].value).toBe(200);
    });
});

