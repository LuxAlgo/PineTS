// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import * as acorn from 'acorn';
import { pineToJS } from '../transpiler/pineToJS/pineToJS.index';
import { INDICATOR_PROPS, STRATEGY_PROPS } from './propsSchema';
import type { IPineProp } from './types';

/**
 * Detect whether a script is a `strategy()` or `indicator()`, and extract
 * the actual values passed to that call from source so they can seed
 * `.prop` defaults.
 *
 * Both source kinds are handled:
 *   - Pine string  → pineToJS() AST → walk for the top-level CallExpression
 *   - JS function  → acorn.parse(fn.toString()) → walk for CallExpression with
 *                    callee Identifier matching 'indicator' / 'strategy'
 *
 * Enum-typed args are resolved by the "rightmost-identifier rule": for any
 * `MemberExpression` the rightmost `Identifier` name is the runtime string.
 * Holds for every Pine-namespace constant accepted by indicator()/strategy()
 * (format.percent → "percent", currency.USD → "USD",
 *  strategy.percent_of_equity → "percent_of_equity",
 *  strategy.commission.percent → "percent").
 *
 * Returns `{ type, args }`:
 *   - type   = 'indicator' | 'strategy' | null
 *   - args   = name → resolved value extracted from the source call
 *
 * If the declaration call isn't found, returns `{ type: null, args: {} }`.
 * The Indicator class falls back to the indicator schema in that case.
 */
export interface ScannedDeclaration {
    type: 'indicator' | 'strategy' | null;
    args: Record<string, unknown>;
}

export function scanDeclaration(source: unknown): ScannedDeclaration {
    if (typeof source === 'string') {
        return scanPineDeclaration(source);
    }
    if (typeof source === 'function') {
        return scanJsDeclaration(source);
    }
    return { type: null, args: {} };
}

// ── Pine source path ──────────────────────────────────────────────────

function scanPineDeclaration(source: string): ScannedDeclaration {
    const parsed = pineToJS(source);
    if (!parsed.success || !parsed.ast) return { type: null, args: {} };

    let found: ScannedDeclaration | null = null;
    walk(parsed.ast, (node) => {
        if (found) return;
        if (node.type !== 'ExpressionStatement' && node.type !== 'VariableDeclaration') return;
        const callExpr = node.type === 'ExpressionStatement'
            ? node.expression
            : node.declarations?.[0]?.init;
        if (!callExpr || callExpr.type !== 'CallExpression') return;
        const callee = callExpr.callee;
        if (callee?.type !== 'Identifier') return;
        if (callee.name !== 'indicator' && callee.name !== 'strategy') return;
        found = {
            type: callee.name,
            args: decodeArgs(callExpr.arguments ?? [], schemaFor(callee.name)),
        };
    });
    return found ?? { type: null, args: {} };
}

// ── JS function path ──────────────────────────────────────────────────

function scanJsDeclaration(fn: Function): ScannedDeclaration {
    let parsed: any;
    try {
        parsed = acorn.parse(`(${fn.toString()})`, { ecmaVersion: 'latest' });
    } catch {
        return { type: null, args: {} };
    }
    let found: ScannedDeclaration | null = null;
    walk(parsed, (node) => {
        if (found) return;
        if (node.type !== 'CallExpression') return;
        const callee = node.callee;
        if (callee?.type !== 'Identifier') return;
        if (callee.name !== 'indicator' && callee.name !== 'strategy') return;
        found = {
            type: callee.name,
            args: decodeArgs(node.arguments ?? [], schemaFor(callee.name)),
        };
    });
    return found ?? { type: null, args: {} };
}

// ── Shared decoders ──────────────────────────────────────────────────

function schemaFor(type: 'indicator' | 'strategy'): IPineProp[] {
    return type === 'strategy' ? STRATEGY_PROPS : INDICATOR_PROPS;
}

/**
 * Decode positional args by walking the schema (which is ordered to match
 * the Pine signature), then merge any trailing object literal as named args.
 * Named args override positional bindings (matches Pine semantics where
 * positional + named is illegal anyway).
 */
function decodeArgs(args: any[], schema: IPineProp[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const lastArg = args[args.length - 1];
    const hasNamedObject = lastArg?.type === 'ObjectExpression';
    const positionals = hasNamedObject ? args.slice(0, -1) : args.slice();

    for (let i = 0; i < positionals.length && i < schema.length; i++) {
        const name = schema[i].name;
        out[name] = resolveValue(positionals[i]);
    }

    if (hasNamedObject) {
        for (const p of lastArg.properties ?? []) {
            if (p.type !== 'Property' || !p.key?.name) continue;
            out[p.key.name] = resolveValue(p.value);
        }
    }

    return out;
}

/**
 * AST node → JS primitive. The rightmost-identifier rule handles every Pine
 * namespace constant accepted by indicator()/strategy() — see file header.
 */
function resolveValue(node: any): unknown {
    if (node == null) return undefined;
    switch (node.type) {
        case 'Literal':
            return node.value;
        case 'Identifier':
            return node.name;
        case 'MemberExpression': {
            // Walk to the rightmost Identifier across any depth of nesting.
            let n = node;
            while (n?.type === 'MemberExpression') n = n.property;
            return n?.type === 'Identifier' ? n.name : undefined;
        }
        case 'UnaryExpression':
            if (node.operator === '-' && node.argument?.type === 'Literal' && typeof node.argument.value === 'number') {
                return -node.argument.value;
            }
            return undefined;
        case 'ArrayExpression':
            return (node.elements ?? []).map(resolveValue);
        default:
            return undefined;
    }
}

/**
 * Generic AST walker — same shape used by scanInputs.
 */
function walk(node: any, visit: (n: any) => void): void {
    if (!node || typeof node !== 'object') return;
    visit(node);
    for (const k of Object.keys(node)) {
        const v = (node as any)[k];
        if (k === 'loc' || k === 'range' || k === 'start' || k === 'end') continue;
        if (Array.isArray(v)) for (const child of v) walk(child, visit);
        else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v, visit);
    }
}
