// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { Context } from '../../src/Context.class';

describe('Transpiler - Await Injection', () => {
    let context: Context;

    beforeEach(() => {
        context = new Context({ symbol: 'BTCUSDC', timeframe: 'D' });
    });

    describe('request.security', () => {
        it('should inject await for request.security without explicit await', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { request } = context.pine;
                const res = request.security('BTCUSDC', 'W', close, false, false);
                return { res };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            // Should have await in the hoisted temp variable
            expect(transpiledCode).toMatch(/const temp_\d+ = await request\.security\(/);
            // Should NOT have await on the temp variable usage
            expect(transpiledCode).not.toMatch(/await temp_\d+\)/);
            // Should initialize variable with temp
            expect(transpiledCode).toMatch(/glb1_res = \$.init\(\$.const\.glb1_res, temp_\d+\)/);
        });

        it('should not duplicate await for request.security with explicit await', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { request } = context.pine;
                const res = await request.security('BTCUSDC', 'W', close, false, false);
                return { res };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            // Should have await in the hoisted temp variable
            expect(transpiledCode).toMatch(/const temp_\d+ = await request\.security\(/);
            // Should NOT have await on the temp variable usage
            expect(transpiledCode).not.toMatch(/await temp_\d+\)/);
            // Count occurrences of 'await' - should only be once
            const awaitCount = (transpiledCode.match(/await/g) || []).length;
            expect(awaitCount).toBe(1);
        });

        it('should handle multiple request.security calls', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { request } = context.pine;
                const weekly = request.security('BTCUSDC', 'W', close, false, false);
                const daily = request.security('BTCUSDC', 'D', close, false, false);
                return { weekly, daily };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            // Should have two await calls
            const awaitMatches = transpiledCode.match(/await request\.security\(/g);
            expect(awaitMatches).toBeTruthy();
            expect(awaitMatches!.length).toBe(2);
        });
    });

    describe('request.security_lower_tf', () => {
        it('should inject await for request.security_lower_tf', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { request } = context.pine;
                const ltf = request.security_lower_tf('BTCUSDC', '1D', close);
                return { ltf };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            expect(transpiledCode).toMatch(/const temp_\d+ = await request\.security_lower_tf\(/);
            expect(transpiledCode).not.toMatch(/await temp_\d+\)/);
        });
    });

    describe('Non-async methods', () => {
        it('should not inject await for non-async methods', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { ta } = context.pine;
                const sma = ta.sma(close, 14);
                return { sma };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            // Should have ta.sma call
            expect(transpiledCode).toMatch(/ta\.sma\(/);
            // Should NOT have await for ta.sma
            expect(transpiledCode).not.toMatch(/await ta\.sma\(/);
            // Should NOT have await for temp variables
            expect(transpiledCode).not.toMatch(/await temp_/);
        });

        it('should handle mix of async and non-async methods', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { ta, request } = context.pine;
                const sma = ta.sma(close, 14);
                const weekly = request.security('BTCUSDC', 'W', close, false, false);
                return { sma, weekly };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            // Should have await only for request.security
            expect(transpiledCode).toMatch(/await request\.security\(/);
            expect(transpiledCode).not.toMatch(/await ta\.sma\(/);
        });
    });

    describe('Generated function signature', () => {
        it('should generate async arrow function', () => {
            const code = `async (context) => {
                const { close } = context.data;
                const { request } = context.pine;
                const res = request.security('BTCUSDC', 'W', close, false, false);
                return { res };
            }`;

            const transpiled = transpile.bind(context)(code);
            const transpiledCode = transpiled.toString();

            // Generated function should be async
            expect(transpiledCode).toMatch(/^async \$ =>/);
        });
    });
});

