// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { pineToJS } from '../transpiler/pineToJS/pineToJS.index';
import type { IPineInput, PineInputType, PineInputDisplay } from './types';

/**
 * Walk a Pine script's AST and harvest every top-level (or nested) `input.*`
 * declaration into an `IPineInput[]`. Returns `[]` for invalid Pine or for
 * source that's a JS function.
 *
 * Two-pass design:
 *   1. Collect enum tables — `enum X { a = "Alpha", b }` becomes
 *      `{ "X.a": "Alpha", "X.b": "b" }` so we can later resolve
 *      `MemberExpression(X, a)` references inside input.enum calls.
 *   2. Walk for CallExpressions to `input.<fn>(...)`, decode positional +
 *      named arguments into a typed `IPineInput`, resolving enum / source
 *      identifier references to their runtime values.
 *
 * Inputs without an explicit `title=` keep `title === undefined`. The runtime
 * lookup ALSO works keyed by `title`, so this is intentional — at runtime an
 * input with no title isn't user-overridable (matches Pine semantics).
 */

const SOURCE_BUILTINS = new Set(['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'volume']);

// Per-function positional parameter order. Decoding rule: walk positional args
// L→R; the Nth positional binds to the Nth param name here. Named args (any
// trailing ObjectExpression) merge on top, overriding any positional binding.
//
// `input.float` / `input.int` have two overloads (options vs minval/maxval/step).
// Both share the same first two params (`defval`, `title`); after that the
// arguments are typically passed by name, so we only need to handle the
// positional case via type-sniffing on the 3rd positional (array → options;
// number → minval). Done in decodeIntFloatPositionals().
const POSITIONAL_BY_FN: Record<string, readonly string[]> = {
    // bare wrapper — auto-typed
    '': ['defval', 'title', 'tooltip', 'inline', 'group', 'display', 'active'],
    bool: ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    color: ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    enum: ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    price: ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    session: ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    source: ['defval', 'title', 'tooltip', 'inline', 'group', 'display', 'active', 'confirm'],
    string: ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    symbol: ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    text_area: ['defval', 'title', 'tooltip', 'group', 'confirm', 'display', 'active'],
    time: ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
    timeframe: ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'],
};

// Inferred type tag for each typed `input.<fn>(...)`. Bare `input(...)` is
// detected from the defval (see inferAutoType).
const TYPE_BY_FN: Record<string, PineInputType> = {
    bool: 'bool',
    color: 'color',
    enum: 'enum',
    float: 'float',
    int: 'int',
    price: 'price',
    session: 'session',
    source: 'source',
    string: 'string',
    symbol: 'symbol',
    text_area: 'text_area',
    time: 'time',
    timeframe: 'timeframe',
};

type EnumTable = Map<string, unknown>; // "tz.utc" → "UTC"

/**
 * Public entry point. Returns `[]` for invalid Pine or for non-string source.
 */
export function scanInputs(source: unknown): IPineInput[] {
    if (typeof source !== 'string') return [];

    const parsed = pineToJS(source);
    if (!parsed.success || !parsed.ast) return [];

    const enumTable = collectEnumTable(parsed.ast);
    const inputs: IPineInput[] = [];
    const seenTitles = new Set<string>();
    walk(parsed.ast, (node) => {
        const meta = decodeInputCall(node, enumTable);
        if (!meta) return;
        if (meta.title !== undefined) {
            if (seenTitles.has(meta.title)) {
                // Pine allows multiple inputs sharing the same title (last wins
                // at runtime). For the JS-side overview, the first one wins
                // and we surface a warning so the collision is visible.
                // eslint-disable-next-line no-console
                console.warn(`[Indicator] duplicate input title "${meta.title}" — first declaration wins for .input access`);
                return;
            }
            seenTitles.add(meta.title);
        }
        inputs.push(meta);
    });
    return inputs;
}

/**
 * Pass 1: collect every enum's field-name → resolved-title mapping.
 *
 * After parser.parseEnumDefinition, `enum tz { utc = "UTC" }` is emitted as a
 * VariableDeclaration whose declarator's `init` is an ObjectExpression with
 * string-literal properties. We walk the program body once and record these.
 */
function collectEnumTable(ast: any): EnumTable {
    const table: EnumTable = new Map();
    walk(ast, (node) => {
        if (node.type !== 'VariableDeclaration') return;
        for (const decl of node.declarations ?? []) {
            const enumName = decl?.id?.name;
            const init = decl?.init;
            if (!enumName || !init || init.type !== 'ObjectExpression') return;
            // Every property must have a Literal string value — that's how
            // parser.parseEnumDefinition emits it (vs. user-defined objects
            // that may hold any expression).
            const allStringLiterals = (init.properties ?? []).every((p: any) => p.value?.type === 'Literal' && typeof p.value.value === 'string');
            if (!allStringLiterals || init.properties.length === 0) return;
            for (const p of init.properties) {
                table.set(`${enumName}.${p.key.name}`, p.value.value);
            }
        }
    });
    return table;
}

/**
 * Decode a single AST node into an `IPineInput`, or return `null` if the node
 * is not a top-level `input.<fn>(...)` call assigned to something.
 *
 * Recognized forms (after parser):
 *   - `let len = input.int(14, "Len", ...)`  → VariableDeclaration → CallExpression
 *   - `len = input.int(...)` is reassignment — also a VariableDeclaration because
 *      Pine simple `=` lowers to `let` at the parser layer.
 *
 * Anything else returns null and is skipped.
 */
function decodeInputCall(node: any, enumTable: EnumTable): IPineInput | null {
    if (node.type !== 'VariableDeclaration') return null;
    for (const decl of node.declarations ?? []) {
        const init = decl?.init;
        if (!init || init.type !== 'CallExpression') continue;

        // Match input.<fn>(...) or bare input(...).
        const callee = init.callee;
        let fnName: string | null = null;
        if (
            callee?.type === 'MemberExpression' &&
            callee.object?.type === 'Identifier' &&
            callee.object.name === 'input' &&
            callee.property?.type === 'Identifier'
        ) {
            fnName = callee.property.name;
        } else if (callee?.type === 'Identifier' && callee.name === 'input') {
            fnName = ''; // bare wrapper
        }
        if (fnName === null) continue;
        const isIntFloat = fnName === 'int' || fnName === 'float';
        if (fnName !== '' && !isIntFloat && !(fnName in POSITIONAL_BY_FN)) continue;

        // Split positionals from the trailing named-args ObjectExpression.
        const args = init.arguments ?? [];
        const lastArg = args[args.length - 1];
        const hasNamed = lastArg?.type === 'ObjectExpression';
        const positionals = hasNamed ? args.slice(0, -1) : args.slice();
        const named: any[] = hasNamed ? (lastArg.properties ?? []) : [];

        const raw: Record<string, any> = {};
        if (fnName === 'int' || fnName === 'float') {
            decodeIntFloatPositionals(positionals, named, raw);
        } else {
            decodePositionals(POSITIONAL_BY_FN[fnName], positionals, raw);
        }
        for (const p of named) {
            if (p.type !== 'Property' || !p.key?.name) continue;
            raw[p.key.name] = p.value;
        }

        // Now turn raw AST values into JS primitives, resolving enum + source refs.
        const resolved: any = {};
        for (const k of Object.keys(raw)) {
            resolved[k] = resolveValue(raw[k], enumTable);
        }

        // Determine the type tag. For bare `input(...)`, infer from defval.
        const type = fnName === '' ? inferAutoType(resolved.defval) : TYPE_BY_FN[fnName];
        if (!type) continue;

        const meta: IPineInput = { type, defval: resolved.defval };
        if (resolved.title !== undefined) meta.title = String(resolved.title);
        if (resolved.tooltip !== undefined) meta.tooltip = String(resolved.tooltip);
        if (resolved.group !== undefined) meta.group = String(resolved.group);
        if (resolved.inline !== undefined) meta.inline = String(resolved.inline);
        if (resolved.confirm !== undefined) meta.confirm = Boolean(resolved.confirm);
        if (resolved.active !== undefined) meta.active = Boolean(resolved.active);
        if (resolved.display !== undefined) meta.display = normalizeDisplay(resolved.display);
        if (resolved.options !== undefined && Array.isArray(resolved.options)) meta.options = resolved.options;
        if (typeof resolved.minval === 'number') meta.minval = resolved.minval;
        if (typeof resolved.maxval === 'number') meta.maxval = resolved.maxval;
        if (typeof resolved.step === 'number') meta.step = resolved.step;

        return meta;
    }
    return null;
}

/**
 * Positional decoder for `input.int` / `input.float`. They share two
 * overloads — the 3rd positional is either `options` (array) or `minval`
 * (number). When the 3rd positional is an `ArrayExpression`, we treat it as
 * the options overload (and bind positions [defval, title, options, tooltip,
 * inline, group, confirm, display, active]). Otherwise we treat positions
 * [3, 4, 5] as [minval, maxval, step].
 */
function decodeIntFloatPositionals(positionals: any[], named: any[], raw: Record<string, any>): void {
    const namedNames = new Set(named.map((p) => p.key?.name).filter(Boolean));
    const sniffOptionsOverload = namedNames.has('options') || positionals[2]?.type === 'ArrayExpression';
    const layout = sniffOptionsOverload
        ? ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active']
        : ['defval', 'title', 'minval', 'maxval', 'step', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'];
    decodePositionals(layout, positionals, raw);
}

function decodePositionals(layout: readonly string[], positionals: any[], raw: Record<string, any>): void {
    for (let i = 0; i < positionals.length && i < layout.length; i++) {
        const name = layout[i];
        if (raw[name] === undefined) raw[name] = positionals[i];
    }
}

/**
 * AST node → JS primitive. Handles enum-field refs (MemberExpression),
 * source-builtin refs (Identifier), arrays, and falls through to Literal.value.
 *
 * Anything we can't resolve becomes `undefined` — better than recording
 * an opaque AST node that the JS caller can't inspect.
 */
function resolveValue(node: any, enumTable: EnumTable): unknown {
    if (node == null) return undefined;
    switch (node.type) {
        case 'Literal':
            return node.value;
        case 'Identifier':
            if (SOURCE_BUILTINS.has(node.name)) return node.name; // input.source(close, …)
            // Could be a display constant if used without the `display.` prefix
            // (rare but valid in Pine). Treat as the bare name.
            return node.name;
        case 'MemberExpression': {
            // Enum field — tz.utc → "UTC"
            const objName = node.object?.type === 'Identifier' ? node.object.name : null;
            const propName = node.property?.type === 'Identifier' ? node.property.name : null;
            if (objName && propName) {
                const key = `${objName}.${propName}`;
                if (enumTable.has(key)) return enumTable.get(key);
                // display.none / display.all / etc. — keep the suffix
                if (objName === 'display') return propName;
                // color.red, color.blue, etc. — return as the qualified path,
                // the caller-facing string is good enough for overrides.
                return key;
            }
            return undefined;
        }
        case 'ArrayExpression':
            return (node.elements ?? []).map((el: any) => resolveValue(el, enumTable));
        case 'UnaryExpression':
            // -3.14 ends up here for negative number literals.
            if (node.operator === '-' && node.argument?.type === 'Literal' && typeof node.argument.value === 'number') {
                return -node.argument.value;
            }
            return undefined;
        default:
            return undefined;
    }
}

/**
 * Infer the type tag of the bare `input(defval, ...)` wrapper from the defval.
 * Mirrors Pine's own runtime auto-detection.
 */
function inferAutoType(defval: unknown): PineInputType | null {
    if (typeof defval === 'boolean') return 'bool';
    if (typeof defval === 'number') return Number.isInteger(defval) ? 'int' : 'float';
    if (typeof defval === 'string') {
        // Source built-ins resolved by resolveValue() come through as strings
        if (SOURCE_BUILTINS.has(defval)) return 'source';
        // Color hex literals start with '#'
        if (defval.startsWith('#')) return 'color';
        return 'string';
    }
    return null;
}

function normalizeDisplay(v: unknown): PineInputDisplay | undefined {
    if (typeof v !== 'string') return undefined;
    const m = v.startsWith('display.') ? v.slice(8) : v;
    if (m === 'none' || m === 'data_window' || m === 'status_line' || m === 'all') return m;
    return undefined;
}

/**
 * Depth-first AST walker. Visits every plausible-host of nested declarations
 * (Program, BlockStatement, IfStatement consequent/alternate, FunctionDeclaration
 * body, For/While body). Bare `ASTNode`s without children are no-ops.
 */
function walk(node: any, visit: (n: any) => void): void {
    if (!node || typeof node !== 'object') return;
    visit(node);
    if (Array.isArray(node.body)) {
        for (const child of node.body) walk(child, visit);
    } else if (node.body) {
        walk(node.body, visit);
    }
    if (Array.isArray(node.consequent)) {
        for (const child of node.consequent) walk(child, visit);
    } else if (node.consequent) {
        walk(node.consequent, visit);
    }
    if (node.alternate) walk(node.alternate, visit);
    if (Array.isArray(node.declarations)) {
        for (const child of node.declarations) walk(child, visit);
    }
}
