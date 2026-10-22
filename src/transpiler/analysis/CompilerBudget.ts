// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../../errors/PineRuntimeError';

export const MAX_COMPILER_SOURCE_CODE_UNITS = 262_144;
export const MAX_COMPILER_SOURCE_BYTES = 524_288;
export const MAX_COMPILER_LINES = 10_000;
export const MAX_COMPILER_LINE_CODE_UNITS = 16_384;
export const MAX_COMPILER_NESTING = 256;
export const MAX_COMPILER_TOKENS = 50_000;
export const MAX_COMPILER_LITERAL_CODE_UNITS = 65_536;
export const MAX_COMPILER_AST_NODES = 100_000;
export const MAX_GENERATED_CODE_UNITS = 2_000_000;
const MAX_COMPILER_ELAPSED_MS = 10_000;

function exceeded(dimension: string): never {
    throw new PineRuntimeError(`Pine compilation budget exceeded: ${dimension}.`, 'compiler.budget', 'RESOURCE_LIMIT');
}

/** Cheap bounded preflight, before the Pine lexer or Acorn can recurse. */
export function assertCompilerSourceBudget(source: string): void {
    if (source.length > MAX_COMPILER_SOURCE_CODE_UNITS) exceeded('source size');
    if (new TextEncoder().encode(source).length > MAX_COMPILER_SOURCE_BYTES) exceeded('source bytes');

    let line = 1;
    let lineLength = 0;
    let depth = 0;
    let quote: string | null = null;
    let blockComment = false;
    let lineComment = false;
    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        const next = source[i + 1];
        if (ch === '\n') {
            if (++line > MAX_COMPILER_LINES) exceeded('line count');
            lineLength = 0;
            lineComment = false;
        } else if (++lineLength > MAX_COMPILER_LINE_CODE_UNITS) {
            exceeded('line length');
        }
        if (lineComment) continue;
        if (blockComment) {
            if (ch === '*' && next === '/') { blockComment = false; i++; lineLength++; }
            continue;
        }
        if (quote !== null) {
            if (ch === '\\') { i++; lineLength++; }
            else if (ch === quote) quote = null;
            continue;
        }
        if (ch === '/' && next === '/') { lineComment = true; i++; lineLength++; continue; }
        if (ch === '/' && next === '*') { blockComment = true; i++; lineLength++; continue; }
        if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
        if ('([{'.includes(ch)) {
            if (++depth > MAX_COMPILER_NESTING) exceeded('nesting depth');
        } else if (')]}'.includes(ch)) {
            depth = Math.max(0, depth - 1);
        }
    }
}

export function assertGeneratedCodeBudget(code: string): void {
    if (code.length > MAX_GENERATED_CODE_UNITS) exceeded('generated code size');
}

/** Iterative traversal avoids adding recursion to the budget check itself. */
export function assertCompilerAstBudget(ast: unknown): void {
    const stack: Array<{ node: unknown; depth: number }> = [{ node: ast, depth: 0 }];
    const seen = new WeakSet<object>();
    let nodes = 0;
    while (stack.length > 0) {
        const { node, depth } = stack.pop()!;
        if (node === null || typeof node !== 'object' || seen.has(node)) continue;
        seen.add(node);
        if (Array.isArray(node)) {
            for (const value of node) stack.push({ node: value, depth });
            continue;
        }
        const record = node as Record<string, unknown>;
        if (typeof record.type !== 'string') continue;
        if (++nodes > MAX_COMPILER_AST_NODES) exceeded('AST node count');
        if (depth > MAX_COMPILER_NESTING) exceeded('AST depth');
        if (record.type === 'Literal' && typeof record.value === 'string' && record.value.length > MAX_COMPILER_LITERAL_CODE_UNITS) {
            exceeded('literal size');
        }
        for (const [key, value] of Object.entries(record)) {
            if (key === 'loc' || key === 'start' || key === 'end' || key === 'parent') continue;
            if (value !== null && typeof value === 'object') stack.push({ node: value, depth: depth + 1 });
        }
    }
}

export function assertCompilerElapsed(startedAt: number): void {
    if (Date.now() - startedAt > MAX_COMPILER_ELAPSED_MS) exceeded('elapsed time');
}
