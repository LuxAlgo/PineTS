// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Pine user functions can be overloaded by parameter count and type:
 *
 *   f(float x) => x * 2.0
 *   f(string s) => str.length(s)
 *
 * JavaScript keeps only the last declaration of a name, so the second and later
 * overloads are renamed `f$2`, `f$3`, … (`$` is not a Pine identifier character)
 * and every call is pointed at the overload it resolves to. Resolution follows
 * TradingView: the argument count selects the candidates, then the argument types;
 * an exact type beats an int promoted to float. A named argument binds by name
 * inside the chosen overload, but does not choose it: `h(x = 3)` calls `h(int val)`
 * over `h(float x)`. An argument whose type can't be inferred statically matches
 * any parameter, and ties go to the first declaration.
 */

const QUALIFIERS = /^(series|simple|const|input)\s+/;

interface Overload {
    jsName: string;
    names: string[];
    types: (string | null)[];
    required: number;
}

const STRING_CALLS = new Set([
    'str.tostring', 'str.format', 'str.format_time', 'str.upper', 'str.lower', 'str.substring', 'str.replace',
    'str.replace_all', 'str.trim', 'str.repeat', 'str.match', 'string',
]);
const INT_CALLS = new Set(['str.length', 'str.pos', 'int', 'math.sign', 'array.size', 'year', 'month', 'dayofmonth', 'dayofweek', 'hour', 'minute', 'second']);
const BOOL_CALLS = new Set([
    'str.contains', 'str.startswith', 'str.endswith', 'na', 'bool', 'ta.crossover', 'ta.crossunder', 'ta.cross', 'ta.rising', 'ta.falling',
    'array.includes', 'timeframe.change',
]);
const FLOAT_SERIES = new Set(['close', 'open', 'high', 'low', 'volume', 'hl2', 'hlc3', 'ohlc4', 'hlcc4']);
const INT_SERIES = new Set(['bar_index', 'last_bar_index', 'time', 'time_close', 'timenow']);
const COMPARISONS = new Set(['==', '!=', '<', '>', '<=', '>=']);

function baseType(varType: any): string | null {
    if (typeof varType !== 'string' || !varType) return null;
    return varType.replace(QUALIFIERS, '').trim();
}

function calleePath(callee: any): string | null {
    if (callee?.type === 'Identifier') return callee.name;
    if (callee?.type === 'MemberExpression' && !callee.computed && callee.property?.type === 'Identifier') {
        const object = calleePath(callee.object);
        return object ? `${object}.${callee.property.name}` : null;
    }
    return null;
}

// Static type of an argument expression, or null when unknown.
function inferType(node: any, scopes: Map<string, string | null>[]): string | null {
    if (!node) return null;
    switch (node.type) {
        case 'Literal':
            if (typeof node.value === 'string') return 'string';
            if (typeof node.value === 'boolean') return 'bool';
            if (typeof node.value === 'number') return typeof node.raw === 'string' && /[.eE]/.test(node.raw) ? 'float' : 'int';
            return null;
        case 'Identifier': {
            for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(node.name)) return scopes[i].get(node.name) ?? null;
            if (FLOAT_SERIES.has(node.name)) return 'float';
            if (INT_SERIES.has(node.name)) return 'int';
            if (node.name === 'true' || node.name === 'false') return 'bool';
            return null;
        }
        case 'UnaryExpression':
            if (node.operator === 'not' || node.operator === '!') return 'bool';
            return inferType(node.argument, scopes);
        case 'BinaryExpression':
        case 'LogicalExpression': {
            if (COMPARISONS.has(node.operator) || ['and', 'or', '&&', '||'].includes(node.operator)) return 'bool';
            const l = inferType(node.left, scopes);
            const r = inferType(node.right, scopes);
            if (node.operator === '+' && (l === 'string' || r === 'string')) return 'string';
            if (l === 'float' || r === 'float') return l && r ? 'float' : null;
            if (l === 'int' && r === 'int') return 'int';
            return null;
        }
        case 'ConditionalExpression': {
            const a = inferType(node.consequent, scopes);
            const b = inferType(node.alternate, scopes);
            if (a === b) return a;
            if ((a === 'int' && b === 'float') || (a === 'float' && b === 'int')) return 'float';
            return a ?? b;
        }
        case 'CallExpression': {
            const path = calleePath(node.callee);
            if (!path) return null;
            if (STRING_CALLS.has(path)) return 'string';
            if (INT_CALLS.has(path)) return 'int';
            if (BOOL_CALLS.has(path)) return 'bool';
            if (path === 'float' || path.startsWith('math.') || path.startsWith('ta.')) return 'float';
            if (path.startsWith('color.')) return 'color';
            return null;
        }
        case 'MemberExpression': {
            const path = calleePath(node);
            if (path?.startsWith('color.')) return 'color';
            return null;
        }
        default:
            return null;
    }
}

function score(argType: string | null, paramType: string | null): number {
    if (paramType === null || argType === null) return 1;
    if (argType === paramType) return 3;
    if (argType === 'int' && paramType === 'float') return 2;
    return -Infinity;
}

function pick(overloads: Overload[], call: any, scopes: Map<string, string | null>[]): Overload | null {
    const last = call.arguments[call.arguments.length - 1];
    const named = last?.type === 'ObjectExpression' ? last.properties : [];
    const positional = named.length ? call.arguments.slice(0, -1) : call.arguments;
    const count = positional.length + named.length;
    let best: Overload | null = null;
    let bestScore = -Infinity;
    for (const o of overloads) {
        if (count > o.names.length || count < o.required) continue;
        let total = 0;
        positional.forEach((arg: any, i: number) => (total += score(inferType(arg, scopes), o.types[i])));
        named.forEach((prop: any, k: number) => {
            const key = prop.key?.name ?? prop.key?.value;
            const idx = o.names.indexOf(key);
            total += score(inferType(prop.value, scopes), o.types[idx >= 0 ? idx : positional.length + k]);
        });
        if (total > bestScore) {
            best = o;
            bestScore = total;
        }
    }
    return best;
}

// A named argument the chosen overload doesn't declare binds by position (`h(x = 3)` → `h(int val)`).
function bindUnknownNamesByPosition(call: any, overload: Overload) {
    const last = call.arguments[call.arguments.length - 1];
    if (last?.type !== 'ObjectExpression') return;
    const keys = last.properties.map((p: any) => p.key?.name ?? p.key?.value);
    if (keys.every((k: string) => overload.names.includes(k))) return;
    call.arguments.splice(call.arguments.length - 1, 1, ...last.properties.map((p: any) => p.value));
}

export function resolveFunctionOverloads(ast: any): void {
    const byName = new Map<string, Overload[]>();
    for (const node of ast.body) {
        if (node.type !== 'FunctionDeclaration' || node.id?.isMethod || !node.id?.name) continue;
        const name = node.id.name;
        const list = byName.get(name) ?? [];
        const jsName = list.length === 0 ? name : `${name}$${list.length + 1}`;
        const names: string[] = [];
        const types: (string | null)[] = [];
        let required = 0;
        for (const p of node.params) {
            const id = p.type === 'AssignmentPattern' ? p.left : p;
            names.push(id?.name);
            types.push(baseType(id?.varType));
            if (p.type !== 'AssignmentPattern') required++;
        }
        list.push({ jsName, names, types, required });
        node.id.name = jsName;
        byName.set(name, list);
    }
    const overloaded = new Map([...byName].filter(([, list]) => list.length > 1));
    if (overloaded.size === 0) return;

    // Walk every call with the declared types of the variables and parameters in scope.
    const scopes: Map<string, string | null>[] = [new Map()];
    const visit = (node: any) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }
        if (node.type === 'FunctionDeclaration') {
            const params = new Map<string, string | null>();
            for (const p of node.params) {
                const id = p.type === 'AssignmentPattern' ? p.left : p;
                if (id?.name) params.set(id.name, baseType(id.varType));
            }
            scopes.push(params);
            visit(node.params);
            visit(node.body);
            scopes.pop();
            return;
        }
        if (node.type === 'VariableDeclaration') {
            for (const decl of node.declarations) {
                visit(decl.init);
                if (decl.id?.type === 'Identifier') {
                    scopes[scopes.length - 1].set(decl.id.name, baseType(decl.id.varType) ?? inferType(decl.init, scopes));
                }
            }
            return;
        }
        for (const key of Object.keys(node)) {
            if (key === 'parent' || key === 'args') continue;
            visit(node[key]);
        }
        if (node.type === 'CallExpression' && node.callee?.type === 'Identifier' && overloaded.has(node.callee.name)) {
            const chosen = pick(overloaded.get(node.callee.name)!, node, scopes);
            if (chosen) {
                bindUnknownNamesByPosition(node, chosen);
                node.callee.name = chosen.jsName;
            }
        }
    };
    visit(ast.body);
}
