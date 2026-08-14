// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { wrapInContextFunction } from '../../src/transpiler/transformers/WrapperTransformer';

describe('WrapperTransformer - Async Conversion', () => {
    describe('Unwrapped code', () => {
        it('should wrap unwrapped code in async arrow function', () => {
            const code = `const { close } = context.data;\nreturn { close };`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async \(context\) =>/);
            expect(result).toContain('const { close } = context.data;');
            expect(result).toContain('return { close };');
        });
    });

    describe('Non-async functions', () => {
        it('should convert non-async arrow function to async', () => {
            const code = `(context) => { return { close: context.data.close }; }`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async context =>/);
            expect(result).toContain('return');
        });

        it('should convert non-async function declaration to async', () => {
            const code = `function indicator(context) { return { close: context.data.close }; }`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async function indicator\(context\)/);
        });

        it('should convert parenthesized non-async function expression to async', () => {
            const code = `(function(context) { return { close: context.data.close }; })`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async function \(context\)/);
        });
    });

    describe('Already async functions', () => {
        it('should preserve async arrow function as-is', () => {
            const code = `async (context) => { return { close: context.data.close }; }`;
            const result = wrapInContextFunction(code);

            expect(result).toBe(code);
        });

        it('should preserve async function declaration as-is', () => {
            const code = `async function indicator(context) { return { close: context.data.close }; }`;
            const result = wrapInContextFunction(code);

            expect(result).toBe(code);
        });

        it('should preserve parenthesized async function expression as-is', () => {
            const code = `(async function(context) { return { close: context.data.close }; })`;
            const result = wrapInContextFunction(code);

            expect(result).toBe(code);
        });
    });

    describe('Edge cases', () => {
        it('should handle single-line arrow function', () => {
            const code = `(context) => context.data.close`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async context =>/);
        });

        it('should handle function with parameters', () => {
            const code = `function process(context, options) { return {}; }`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async function process/);
            expect(result).toContain('context, options');
        });

        it('should handle empty function body', () => {
            const code = `(context) => {}`;
            const result = wrapInContextFunction(code);

            expect(result).toMatch(/^async context =>/);
        });
    });
});

