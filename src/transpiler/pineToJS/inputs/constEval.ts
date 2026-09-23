// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { resolveColorToRgba, rgbaToHex8 } from '../../../namespaces/color/PineColor';

/**
 * Compile-time evaluation of Pine expressions over the pine2js AST.
 *
 * Pine evaluates every `input*()` argument at compile time: the defaults shown
 * in the settings dialog are the folded values (`input(2 + 2)` → 4,
 * `input.time(timestamp("2024-01-01 00:00 +0000"))` → 1704067200000), and
 * branches whose condition folds to `false` are dropped together with the
 * inputs they declare. This module implements that folding for the subset of
 * the language allowed in a `const` context.
 */

export type ConstType = 'int' | 'float' | 'bool' | 'string' | 'color' | 'source' | 'enum' | 'other';

export interface ConstValue {
    value: unknown;
    type: ConstType;
    /**
     * True when the folded value is exactly what the runtime would compute for
     * the same expression on any symbol. False for context-dependent values
     * (e.g. `timestamp()` without a timezone uses the exchange timezone) and for
     * names kept symbolically (sources, colors, enum fields, namespace constants).
     */
    exact: boolean;
}

export interface ConstEnv {
    /** Resolve a user identifier to its folded value, or undefined when it is not constant. */
    lookup(name: string): ConstValue | undefined;
    /** `"E.a"` → enum field title. */
    enums: Map<string, unknown>;
    /** Pine v5 truncates `const int / const int`; v6 divides fractionally. */
    truncatingIntDivision: boolean;
}

export const SOURCE_BUILTINS = new Set(['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'volume']);

const MATH_CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, phi: 1.618033988749895, rphi: 0.618033988749895 };

const COLOR_LITERAL = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;

const num = (value: number, type: 'int' | 'float', exact = true): ConstValue | undefined =>
    Number.isFinite(value) ? { value, type, exact } : undefined;

const isNumeric = (v: ConstValue | undefined): v is ConstValue & { value: number } =>
    !!v && (v.type === 'int' || v.type === 'float') && typeof v.value === 'number';

const numType = (...vals: ConstValue[]): 'int' | 'float' => (vals.every((v) => v.type === 'int') ? 'int' : 'float');

const allExact = (...vals: ConstValue[]) => vals.every((v) => v.exact);

/**
 * The value an `int`-typed expression produces once consumed. Division inside an
 * int expression is computed fractionally and the result is truncated at the
 * end: `input(1 / 2 * 4)` is 2 and `input(7 / 2)` is 3 on TradingView.
 */
export function finalizeConst(cv: ConstValue): unknown {
    if (cv.type === 'int' && typeof cv.value === 'number') return Math.trunc(cv.value);
    return cv.value;
}

/** Dotted name of a non-computed member chain (`color.red`), or null. */
export function dottedName(node: any): string | null {
    if (node?.type === 'Identifier') return node.name;
    if (node?.type === 'MemberExpression' && !node.computed && node.property?.type === 'Identifier') {
        const obj = dottedName(node.object);
        return obj === null ? null : `${obj}.${node.property.name}`;
    }
    return null;
}

export function evalConst(node: any, env: ConstEnv): ConstValue | undefined {
    if (node == null) return undefined;
    switch (node.type) {
        case 'Literal':
            return evalLiteral(node);
        case 'Identifier':
            if (node.name === 'na') return undefined;
            if (SOURCE_BUILTINS.has(node.name)) return { value: node.name, type: 'source', exact: false };
            return env.lookup(node.name);
        case 'MemberExpression':
            return evalMember(node, env);
        case 'UnaryExpression':
            return evalUnary(node, env);
        case 'BinaryExpression':
        case 'LogicalExpression':
            return evalBinary(node, env);
        case 'ConditionalExpression': {
            const test = evalConst(node.test, env);
            if (test?.type !== 'bool') return undefined;
            return evalConst(test.value ? node.consequent : node.alternate, env);
        }
        case 'CallExpression':
            return evalCall(node, env);
        default:
            return undefined;
    }
}

function evalLiteral(node: any): ConstValue | undefined {
    const v = node.value;
    if (typeof v === 'boolean') return { value: v, type: 'bool', exact: true };
    if (typeof v === 'string') {
        if (COLOR_LITERAL.test(v)) return { value: v, type: 'color', exact: false };
        return { value: v, type: 'string', exact: true };
    }
    if (typeof v === 'number') {
        const isFloat = typeof node.raw === 'string' ? /[.eE]/.test(node.raw) : !Number.isInteger(v);
        return num(v, isFloat ? 'float' : 'int');
    }
    return undefined;
}

function evalMember(node: any, env: ConstEnv): ConstValue | undefined {
    const name = dottedName(node);
    if (name === null) return undefined;
    if (env.enums.has(name)) return { value: env.enums.get(name), type: 'enum', exact: false };
    const [ns, prop] = name.split('.');
    if (ns === 'math' && prop in MATH_CONSTANTS) return num(MATH_CONSTANTS[prop], 'float');
    if (ns === 'color' && resolveColorToRgba(name)) return { value: name, type: 'color', exact: false };
    // Other namespace constants (display.none, shape.circle, …) keep their dotted name.
    return { value: name, type: 'other', exact: false };
}

function evalUnary(node: any, env: ConstEnv): ConstValue | undefined {
    const arg = evalConst(node.argument, env);
    if (!arg) return undefined;
    if (node.operator === '!' || node.operator === 'not') {
        return arg.type === 'bool' ? { value: !arg.value, type: 'bool', exact: arg.exact } : undefined;
    }
    if (!isNumeric(arg)) return undefined;
    if (node.operator === '-') return num(-arg.value, arg.type as 'int' | 'float', arg.exact);
    if (node.operator === '+') return arg;
    return undefined;
}

function evalBinary(node: any, env: ConstEnv): ConstValue | undefined {
    const op = node.operator;
    if (op === '&&' || op === '||' || op === 'and' || op === 'or') {
        const left = evalConst(node.left, env);
        if (left?.type !== 'bool') return undefined;
        const isAnd = op === '&&' || op === 'and';
        // Short-circuit: `false and x` / `true or x` fold even when x is not constant.
        if (isAnd ? !left.value : left.value) return left;
        const right = evalConst(node.right, env);
        return right?.type === 'bool' ? { value: right.value, type: 'bool', exact: left.exact && right.exact } : undefined;
    }

    const left = evalConst(node.left, env);
    const right = evalConst(node.right, env);
    if (!left || !right) return undefined;

    if (op === '+' && left.type === 'string' && right.type === 'string') {
        return { value: String(left.value) + String(right.value), type: 'string', exact: allExact(left, right) };
    }

    if (op === '==' || op === '===' || op === '!=' || op === '!==') {
        const comparable = (isNumeric(left) && isNumeric(right)) || (left.type === right.type && ['string', 'bool'].includes(left.type));
        if (!comparable) return undefined;
        const eq = isNumeric(left) ? Math.abs((left.value as number) - (right.value as number)) < 1e-10 : left.value === right.value;
        return { value: op.startsWith('=') ? eq : !eq, type: 'bool', exact: allExact(left, right) };
    }

    if (!isNumeric(left) || !isNumeric(right)) return undefined;
    const a = left.value;
    const b = right.value;
    const exact = allExact(left, right);
    switch (op) {
        case '+':
            return num(a + b, numType(left, right), exact);
        case '-':
            return num(a - b, numType(left, right), exact);
        case '*':
            return num(a * b, numType(left, right), exact);
        case '/': {
            if (b === 0) return undefined;
            const type = numType(left, right);
            const q = a / b;
            return num(type === 'int' && env.truncatingIntDivision ? Math.trunc(q) : q, type, exact);
        }
        case '%':
            if (b === 0) return undefined;
            return num(a % b, numType(left, right), exact);
        case '>':
            return { value: a > b, type: 'bool', exact };
        case '<':
            return { value: a < b, type: 'bool', exact };
        case '>=':
            return { value: a >= b, type: 'bool', exact };
        case '<=':
            return { value: a <= b, type: 'bool', exact };
        default:
            return undefined;
    }
}

type MathFn = { arity: [number, number]; type: 'int' | 'float' | 'same'; fn: (...xs: number[]) => number };

const MATH_FUNCTIONS: Record<string, MathFn> = {
    abs: { arity: [1, 1], type: 'same', fn: Math.abs },
    max: { arity: [2, Infinity], type: 'same', fn: Math.max },
    min: { arity: [2, Infinity], type: 'same', fn: Math.min },
    avg: { arity: [2, Infinity], type: 'float', fn: (...xs) => xs.reduce((s, x) => s + x, 0) / xs.length },
    floor: { arity: [1, 1], type: 'int', fn: Math.floor },
    ceil: { arity: [1, 1], type: 'int', fn: Math.ceil },
    sqrt: { arity: [1, 1], type: 'float', fn: Math.sqrt },
    pow: { arity: [2, 2], type: 'float', fn: Math.pow },
    exp: { arity: [1, 1], type: 'float', fn: Math.exp },
    log: { arity: [1, 1], type: 'float', fn: Math.log },
    log10: { arity: [1, 1], type: 'float', fn: Math.log10 },
    sign: { arity: [1, 1], type: 'float', fn: Math.sign },
    sin: { arity: [1, 1], type: 'float', fn: Math.sin },
    cos: { arity: [1, 1], type: 'float', fn: Math.cos },
    tan: { arity: [1, 1], type: 'float', fn: Math.tan },
    asin: { arity: [1, 1], type: 'float', fn: Math.asin },
    acos: { arity: [1, 1], type: 'float', fn: Math.acos },
    atan: { arity: [1, 1], type: 'float', fn: Math.atan },
    todegrees: { arity: [1, 1], type: 'float', fn: (x) => (x * 180) / Math.PI },
    toradians: { arity: [1, 1], type: 'float', fn: (x) => (x * Math.PI) / 180 },
};

function evalCall(node: any, env: ConstEnv): ConstValue | undefined {
    const callee = dottedName(node.callee);
    if (callee === null) return undefined;
    // Named arguments (trailing object literal) are not supported by the folder.
    const rawArgs: any[] = node.arguments ?? [];
    if (rawArgs.some((a) => a?.type === 'ObjectExpression')) return undefined;
    const args = rawArgs.map((a) => evalConst(a, env));
    if (args.some((a) => !a)) return undefined;
    const vals = args as ConstValue[];

    if (callee === 'int' && vals.length === 1 && isNumeric(vals[0])) return num(Math.trunc(vals[0].value), 'int', vals[0].exact);
    if (callee === 'float' && vals.length === 1 && isNumeric(vals[0])) return num(finalizeConst(vals[0]) as number, 'float', vals[0].exact);

    if (callee.startsWith('math.')) {
        const name = callee.slice(5);
        if (name === 'round') {
            if (!vals.every(isNumeric) || vals.length < 1 || vals.length > 2) return undefined;
            const x = vals[0].value as number;
            if (vals.length === 1) return num(Math.round(x), 'int', vals[0].exact);
            const scale = Math.pow(10, vals[1].value as number);
            return num(Math.round(x * scale) / scale, 'float', allExact(...vals));
        }
        const spec = MATH_FUNCTIONS[name];
        if (!spec || vals.length < spec.arity[0] || vals.length > spec.arity[1] || !vals.every(isNumeric)) return undefined;
        const type = spec.type === 'same' ? numType(...vals) : spec.type;
        return num(spec.fn(...vals.map((v) => v.value as number)), type, allExact(...vals));
    }

    if (callee === 'str.upper' || callee === 'str.lower' || callee === 'str.length') {
        if (vals.length !== 1 || vals[0].type !== 'string') return undefined;
        const s = String(vals[0].value);
        if (callee === 'str.length') return num(s.length, 'int', vals[0].exact);
        return { value: callee === 'str.upper' ? s.toUpperCase() : s.toLowerCase(), type: 'string', exact: vals[0].exact };
    }

    if (callee === 'color.new' || callee === 'color.rgb') return evalColorCall(callee, vals);

    if (callee === 'timestamp' && vals.length === 1 && vals[0].type === 'string') return evalTimestamp(String(vals[0].value));

    return undefined;
}

/** `color.new(col, transp)` / `color.rgb(r, g, b, transp?)` → #RRGGBBAA. transp is 0..100 (0 = opaque). */
function evalColorCall(callee: string, vals: ConstValue[]): ConstValue | undefined {
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    if (callee === 'color.rgb') {
        const [r, g, b, transp] = vals.map((v) => v.value);
        if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') return undefined;
        const a = clamp01(1 - (typeof transp === 'number' ? transp : 0) / 100);
        return { value: rgbaToHex8(r, g, b, a), type: 'color', exact: false };
    }
    const base = resolveColorToRgba(vals[0]?.value);
    const transp = vals[1]?.value;
    if (!base || typeof transp !== 'number') return undefined;
    return { value: rgbaToHex8(base[0], base[1], base[2], clamp01(1 - transp / 100)), type: 'color', exact: false };
}

/**
 * `timestamp(dateString)`. A string with an explicit offset is absolute. Without
 * one, the runtime uses the exchange timezone, so the folded value (computed in
 * UTC) is reported for metadata but never substituted into the code.
 */
function evalTimestamp(ds: string): ConstValue | undefined {
    const s = ds.trim();
    const hasZone = /[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
    const t = hasZone ? new Date(s).getTime() : new Date(s.includes('T') ? s + 'Z' : s.replace(/\s+/, 'T') + 'Z').getTime();
    return num(t, 'int', hasZone);
}
