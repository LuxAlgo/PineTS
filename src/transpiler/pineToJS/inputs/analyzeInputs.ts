// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Identifier, Literal, ObjectExpression, Property } from '../ast';
import { ConstEnv, ConstType, ConstValue, dottedName, evalConst, finalizeConst, SOURCE_BUILTINS } from './constEval';
import { describeArgument, inferQualified, QualifierEnv, startPos, ValueType } from './qualifiers';

/**
 * Input declaration analysis over the pine2js AST (runs before code generation).
 *
 * TradingView declares inputs at compile time, wherever the `input*()` call
 * sits: global or local scope, `if`/`switch`/loop bodies, function bodies,
 * or directly as an argument (`ta.sma(close, input(14))`). This pass mirrors
 * that model:
 *
 *   - Every reachable input call site gets a sequential id `in_0`, `in_1`, …
 *     in source order — the same ids TradingView uses. Call sites in branches
 *     whose condition folds to a constant are skipped (`if false`, a
 *     `const` false variable, `false and …`, constant ternaries and switches).
 *   - Each input is labelled like the settings dialog: the `title` argument
 *     when given, else the variable it is assigned to (`k = …`, `k := …`,
 *     `k += …`, even deep inside the expression), else the enclosing
 *     function's name, else "untitled".
 *   - Arguments are folded at compile time (see constEval). A folded default
 *     that does not depend on the chart replaces the original expression, so
 *     the runtime value matches the declared one (`input(7 / 2)` is 3).
 *   - Arguments may only reference constants: a loop counter or a function
 *     parameter is an undeclared identifier there, and a variable holding
 *     another input is rejected.
 *
 * The call is tagged with a trailing `{ __inputId, __varId }` argument; the
 * runtime pops it (input/utils.parseInputOptions) and uses the id as the
 * primary override key.
 */

export interface InputSite {
    /** `in_N`, in declaration order. */
    id: string;
    /** `''` for the bare `input()` wrapper, else the `input.<fn>` name. */
    fn: string;
    /** Label shown in the settings dialog. */
    name: string;
    /** Variable the input value is assigned to, when there is one. */
    varId?: string;
    /** Folded argument values keyed by parameter name. */
    args: Record<string, unknown>;
    /** Static type of the folded `defval` (drives the bare `input()` auto-typing). */
    defvalType?: ConstType;
}

export interface AnalyzeInputsOptions {
    /** Pine version of the script — v5 truncates `const int / const int`. */
    version?: number | null;
}

const UNTITLED = 'untitled';

const TYPED_INPUT_FNS = new Set([
    'bool',
    'color',
    'enum',
    'float',
    'int',
    'price',
    'session',
    'source',
    'string',
    'symbol',
    'text_area',
    'time',
    'timeframe',
]);

// Positional parameter order per input function (Pine v6 reference).
const POSITIONAL_BY_FN: Record<string, readonly string[]> = {
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
// input.int / input.float: the 3rd positional is `options` (array) or `minval`.
const INT_FLOAT_OPTIONS = ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'];
const INT_FLOAT_RANGE = ['defval', 'title', 'minval', 'maxval', 'step', 'tooltip', 'inline', 'group', 'confirm', 'display', 'active'];

const DEFVAL_TYPE: Record<string, string> = {
    '': 'bool', // the bare wrapper's first overload; used for bool / string runtime defaults
    int: 'int',
    float: 'float',
    bool: 'bool',
    string: 'string',
    text_area: 'string',
    session: 'string',
    symbol: 'string',
    timeframe: 'string',
    time: 'int',
    price: 'float',
    color: 'color',
};

/** Type an input argument must have, as a `const`, for qualifier checks. */
function expectedArgType(fn: string, param: string): string | undefined {
    if (param === 'defval') return DEFVAL_TYPE[fn];
    if (param === 'title' || param === 'tooltip' || param === 'group' || param === 'inline') return 'string';
    if (param === 'minval' || param === 'maxval' || param === 'step') return fn === 'int' ? 'int' : 'float';
    if (param === 'confirm') return 'bool';
    return undefined;
}

type Sym =
    | { kind: 'value'; name: string; init: any; scope: Scope; nonConst: boolean; inputDerived: boolean; cache?: ConstValue | null; busy?: boolean }
    | { kind: 'loop' | 'param'; name: string };

class Scope {
    readonly vars = new Map<string, Sym>();
    constructor(readonly parent: Scope | null) {}
    resolve(name: string): Sym | undefined {
        for (let s: Scope | null = this; s; s = s.parent) {
            const sym = s.vars.get(name);
            if (sym) return sym;
        }
        return undefined;
    }
}

interface Ctx {
    scope: Scope;
    /** Variable the current expression is assigned to. */
    target: string | null;
    /** Enclosing function name. */
    fnName: string | null;
}

export function analyzeInputs(ast: any, options: AnalyzeInputsOptions = {}): InputSite[] {
    return new InputAnalyzer(ast, options).run();
}

/** `"input"` → `''`, `"input.int"` → `'int'`, anything else → null. */
export function inputFnName(call: any): string | null {
    if (call?.type !== 'CallExpression') return null;
    const name = dottedName(call.callee);
    if (name === 'input') return '';
    if (name?.startsWith('input.') && TYPED_INPUT_FNS.has(name.slice(6))) return name.slice(6);
    return null;
}

class InputAnalyzer {
    private readonly sites: InputSite[] = [];
    private readonly enums = new Map<string, unknown>();
    private readonly reassigned = new Set<string>();
    private readonly visited = new WeakSet<object>();
    private readonly truncatingIntDivision: boolean;

    constructor(
        private readonly ast: any,
        options: AnalyzeInputsOptions,
    ) {
        this.truncatingIntDivision = options.version != null && options.version < 6;
    }

    run(): InputSite[] {
        this.collectEnumsAndReassignments(this.ast);
        const global = new Scope(null);
        this.visitStatements(this.ast.body ?? [], { scope: global, target: null, fnName: null });
        return this.sites;
    }

    // ── pre-pass ────────────────────────────────────────────────────────

    private collectEnumsAndReassignments(root: any): void {
        forEachNode(root, (node) => {
            if (node.type === 'AssignmentExpression' && node.left?.type === 'Identifier') {
                this.reassigned.add(node.left.name);
            }
            if (node.type === 'VariableDeclaration') {
                for (const decl of node.declarations ?? []) {
                    const init = decl?.init;
                    if (decl?.id?.type !== 'Identifier' || init?.type !== 'ObjectExpression' || !init.properties?.length) continue;
                    // pine2js lowers `enum E` to `E = { field: "title", … }` (string literals only).
                    const isEnum = init.properties.every((p: any) => p.value?.type === 'Literal' && typeof p.value.value === 'string');
                    if (!isEnum) continue;
                    for (const p of init.properties) this.enums.set(`${decl.id.name}.${p.key.name}`, p.value.value);
                }
            }
        });
    }

    // ── constant environment ────────────────────────────────────────────

    private env(scope: Scope): ConstEnv {
        return {
            enums: this.enums,
            truncatingIntDivision: this.truncatingIntDivision,
            lookup: (name) => {
                const sym = scope.resolve(name);
                if (!sym || sym.kind !== 'value' || sym.nonConst || sym.busy) return undefined;
                if (sym.cache === undefined) {
                    sym.busy = true;
                    sym.cache = evalConst(sym.init, this.env(sym.scope)) ?? null;
                    sym.busy = false;
                }
                return sym.cache ?? undefined;
            },
        };
    }

    private fold(node: any, scope: Scope): ConstValue | undefined {
        return evalConst(node, this.env(scope));
    }

    /** Constant boolean value of a condition, or undefined when it depends on runtime data. */
    private foldCondition(node: any, scope: Scope): boolean | undefined {
        const cv = this.fold(node, scope);
        return cv?.type === 'bool' ? (cv.value as boolean) : undefined;
    }

    // ── declarations ────────────────────────────────────────────────────

    private declareValue(scope: Scope, name: string, init: any, varType?: string | null): void {
        // An explicitly `series`/`simple` variable is never folded, nor is one reassigned anywhere.
        const nonConst = this.reassigned.has(name) || /\b(series|simple)\b/.test(varType ?? '');
        scope.vars.set(name, { kind: 'value', name, init, scope, nonConst, inputDerived: containsInputCall(init) });
    }

    private declarePattern(scope: Scope, pattern: any, kind: 'loop' | 'param'): void {
        if (pattern?.type === 'Identifier') scope.vars.set(pattern.name, { kind, name: pattern.name });
        else if (pattern?.type === 'ArrayPattern') for (const el of pattern.elements ?? []) this.declarePattern(scope, el, kind);
        else if (pattern?.type === 'AssignmentPattern') this.declarePattern(scope, pattern.left, kind);
    }

    // ── traversal ───────────────────────────────────────────────────────

    private visitStatements(stmts: any[], ctx: Ctx): void {
        for (const s of stmts) this.visit(s, ctx);
    }

    private visit(node: any, ctx: Ctx): void {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const n of node) this.visit(n, ctx);
            return;
        }
        if (typeof node.type !== 'string' || this.visited.has(node)) return;
        this.visited.add(node);

        switch (node.type) {
            case 'VariableDeclaration':
                for (const decl of node.declarations ?? []) {
                    const name = decl.id?.type === 'Identifier' ? decl.id.name : null;
                    this.visit(decl.init, { ...ctx, target: name ?? ctx.target });
                    if (name) this.declareValue(ctx.scope, name, decl.init, decl.varType ?? decl.id?.varType ?? null);
                }
                return;

            case 'AssignmentExpression': {
                const name = node.left?.type === 'Identifier' ? node.left.name : null;
                this.visit(node.right, { ...ctx, target: name ?? ctx.target });
                if (name && containsInputCall(node.right)) {
                    const sym = ctx.scope.resolve(name);
                    if (sym?.kind === 'value') sym.inputDerived = true;
                }
                return;
            }

            case 'BlockStatement':
                this.visitStatements(node.body ?? [], { ...ctx, scope: new Scope(ctx.scope) });
                return;

            case 'IfStatement': {
                this.visit(node.test, ctx);
                const cond = this.foldCondition(node.test, ctx.scope);
                if (cond !== false) this.visitBranch(node.consequent, ctx);
                if (cond !== true && node.alternate) this.visitBranch(node.alternate, ctx);
                return;
            }

            case 'ConditionalExpression': {
                this.visit(node.test, ctx);
                const cond = this.foldCondition(node.test, ctx.scope);
                if (cond !== false) this.visit(node.consequent, ctx);
                if (cond !== true) this.visit(node.alternate, ctx);
                return;
            }

            case 'BinaryExpression':
            case 'LogicalExpression': {
                this.visit(node.left, ctx);
                const op = node.operator;
                if (op === '&&' || op === '||') {
                    const left = this.foldCondition(node.left, ctx.scope);
                    if (left === (op === '||')) return; // right operand never evaluated
                }
                this.visit(node.right, ctx);
                return;
            }

            case 'SwitchExpression':
                this.visitSwitch(node, ctx);
                return;

            case 'ForStatement': {
                const scope = new Scope(ctx.scope);
                const init = node.init;
                if (init?.type === 'VariableDeclaration') {
                    for (const decl of init.declarations ?? []) {
                        this.visit(decl.init, ctx);
                        this.declarePattern(scope, decl.id, 'loop');
                    }
                } else {
                    this.visit(init, ctx);
                }
                const loopCtx = { ...ctx, scope };
                this.visit(node.test, loopCtx);
                this.visit(node.update, loopCtx);
                this.visitBranch(node.body, loopCtx);
                return;
            }

            case 'FunctionDeclaration': {
                const scope = new Scope(ctx.scope);
                for (const p of node.params ?? []) this.declarePattern(scope, p, 'param');
                const fnCtx: Ctx = { scope, target: null, fnName: node.id?.name ?? null };
                this.visit(node.params, fnCtx);
                this.visitBranch(node.body, fnCtx);
                return;
            }

            case 'CallExpression': {
                const fn = inputFnName(node);
                if (fn !== null) {
                    this.recordInput(node, fn, ctx);
                    return;
                }
                this.visit(node.callee, ctx);
                this.visit(node.arguments, ctx);
                return;
            }

            default:
                this.visitChildren(node, ctx);
        }
    }

    /** Block bodies open a scope; a bare statement (`else if`) is visited as-is. */
    private visitBranch(node: any, ctx: Ctx): void {
        if (node?.type === 'BlockStatement') this.visit(node, ctx);
        else this.visit(node, { ...ctx, scope: new Scope(ctx.scope) });
    }

    private visitSwitch(node: any, ctx: Ctx): void {
        this.visit(node.discriminant, ctx);
        const subject = node.discriminant ? this.fold(node.discriminant, ctx.scope) : undefined;
        let taken = false; // a previous arm is statically selected → the rest is dead
        for (const c of node.cases ?? []) {
            let live = !taken;
            if (live && c.test) {
                this.visit(c.test, ctx);
                if (node.discriminant) {
                    const test = subject ? this.fold(c.test, ctx.scope) : undefined;
                    if (subject && test && test.type === subject.type) {
                        if (test.value === subject.value) taken = true;
                        else live = false;
                    }
                } else {
                    const cond = this.foldCondition(c.test, ctx.scope);
                    if (cond === true) taken = true;
                    else if (cond === false) live = false;
                }
            } else if (live && !c.test) {
                taken = true;
            }
            if (!live) continue;
            const armCtx = { ...ctx, scope: new Scope(ctx.scope) };
            // `statements` holds the whole arm body; `consequent` aliases its last expression.
            if (c.statements?.length) this.visitStatements(c.statements, armCtx);
            else this.visit(c.consequent, armCtx);
        }
    }

    private visitChildren(node: any, ctx: Ctx): void {
        for (const key of Object.keys(node)) {
            if (key === 'args' || key === 'type' || key.startsWith('_')) continue;
            const child = node[key];
            if (child && typeof child === 'object') this.visit(child, ctx);
        }
    }

    // ── input call sites ────────────────────────────────────────────────

    private recordInput(call: any, fn: string, ctx: Ctx): void {
        this.validateArguments(call, ctx.scope);

        const args: any[] = call.arguments ?? [];
        const last = args[args.length - 1];
        const hasNamed = last?.type === 'ObjectExpression';
        const named: any[] = hasNamed ? (last.properties ?? []) : [];
        const positionals = hasNamed ? args.slice(0, -1) : args.slice();

        // Parameter name → argument node (named arguments win over positionals).
        const raw: Record<string, { node: any; holder: any; key: string }> = {};
        const layout =
            fn === 'int' || fn === 'float'
                ? named.some((p) => p.key?.name === 'options') || positionals[2]?.type === 'ArrayExpression'
                    ? INT_FLOAT_OPTIONS
                    : INT_FLOAT_RANGE
                : POSITIONAL_BY_FN[fn];
        positionals.forEach((node, i) => {
            if (i < layout.length) raw[layout[i]] = { node, holder: args, key: String(i) };
        });
        for (const p of named) {
            if (p.type === 'Property' && p.key?.name) raw[p.key.name] = { node: p.value, holder: p, key: 'value' };
        }

        this.checkQualifiers(call, fn, raw, ctx.scope);

        const values: Record<string, unknown> = {};
        let defvalType: ConstType | undefined;
        for (const [param, { node }] of Object.entries(raw)) {
            const cv = node?.type === 'ArrayExpression' ? undefined : this.fold(node, ctx.scope);
            if (param === 'defval') defvalType = cv?.type;
            values[param] = cv ? finalizeConst(cv) : fallbackValue(node, (n) => this.fold(n, ctx.scope));
        }

        this.inlineDefval(raw.defval, ctx.scope);

        const id = `in_${this.sites.length}`;
        const title = typeof values.title === 'string' ? values.title : undefined;
        const varId = ctx.target ?? undefined;
        const site: InputSite = { id, fn, name: title ?? ctx.target ?? ctx.fnName ?? UNTITLED, args: values };
        if (varId !== undefined) site.varId = varId;
        if (defvalType !== undefined) site.defvalType = defvalType;
        this.sites.push(site);

        const props = [new Property(new Identifier('__inputId'), new Literal(id))];
        if (varId !== undefined) props.push(new Property(new Identifier('__varId'), new Literal(varId)));
        args.push(new ObjectExpression(props));
    }

    /**
     * Substitute a folded default when it is a plain value whose computation
     * does not depend on the chart, so the runtime returns the declared value.
     */
    private inlineDefval(entry: { node: any; holder: any; key: string } | undefined, scope: Scope): void {
        if (!entry || !entry.node || entry.node.type === 'Literal') return;
        const cv = this.fold(entry.node, scope);
        if (!cv || !cv.exact || !['int', 'float', 'bool', 'string'].includes(cv.type)) return;
        const value = finalizeConst(cv);
        const raw =
            cv.type === 'float' && typeof value === 'number' && Number.isInteger(value)
                ? `${value}.0`
                : typeof value === 'number'
                  ? String(value)
                  : null;
        entry.holder[entry.key] = new Literal(value, raw);
    }

    private qualifierEnv(scope: Scope, seen = new Set<Sym>()): QualifierEnv {
        return {
            lookup: (name) => {
                const sym = scope.resolve(name);
                if (!sym) return undefined;
                if (sym.kind !== 'value' || sym.nonConst || sym.inputDerived || seen.has(sym)) return null;
                const cv = this.fold({ type: 'Identifier', name }, scope);
                if (cv && ['int', 'float', 'bool', 'string'].includes(cv.type)) return { qual: 'const', type: cv.type as ValueType };
                seen.add(sym);
                const q = inferQualified(sym.init, this.qualifierEnv(sym.scope, seen));
                seen.delete(sym);
                return q ?? null;
            },
        };
    }

    /**
     * Input arguments must be constants. A runtime value (`bar_index`,
     * `close * 2`, `barstate.isfirst`, `ta.sma(…)`, a variable holding one)
     * is rejected with TradingView's messages: CE10123 naming the argument
     * and its qualified type, or — for a numeric defval of the bare
     * `input()` — "Arguments of input function must be of constant type".
     */
    private checkQualifiers(call: any, fn: string, raw: Record<string, { node: any }>, scope: Scope): void {
        if (fn === 'enum') return;
        const env = this.qualifierEnv(scope);
        const fnName = fn === '' ? 'input' : `input.${fn}`;
        for (const [param, { node }] of Object.entries(raw)) {
            if (fn === 'source' && param === 'defval') {
                const isBuiltinSource = node?.type === 'Identifier' && SOURCE_BUILTINS.has(node.name) && !scope.resolve(node.name);
                if (isBuiltinSource) continue;
                const pos = leftmostPos(call.callee);
                throw new Error(
                    'Invalid value for the "defval" parameter of the "input.source" function. ' +
                        `Possible values: [open, high, low, close, hl2, hlc3, ohlc4, hlcc4].${pos ? ` at ${pos}` : ''}`,
                );
            }
            if (fn !== '' && param === 'defval' && node?.type === 'Identifier' && node.name === 'na' && !scope.resolve('na')) {
                const pos = startPos(node);
                throw new Error(`The "defval" parameter of the "${fnName}()" function cannot accept a "na" argument.${pos ? ` at ${pos}` : ''}`);
            }
            const expected = expectedArgType(fn, param);
            if (!expected || !node) continue;
            const q = inferQualified(node, env);
            if (!q || (q.qual !== 'simple' && q.qual !== 'series')) continue;

            if (fn === '' && param === 'defval' && q.type !== 'bool' && q.type !== 'string') {
                // Numeric runtime defaults of the bare wrapper: a source builtin is
                // a source input; a ternary is accepted as one too.
                if (node.type === 'Identifier' && SOURCE_BUILTINS.has(node.name) && !scope.resolve(node.name)) continue;
                if (node.type === 'ConditionalExpression') continue;
                const pos = leftmostPos(call.callee);
                throw new Error(`Arguments of input function must be of constant type, or "source" builtin variables.${pos ? ` at ${pos}` : ''}`);
            }

            const pos = startPos(node);
            throw new Error(
                `Cannot call "${fnName}" with argument "${param}"="${describeArgument(node, q)}". ` +
                    `An argument of "${q.qual} ${q.type}" type was used but a "const ${expected}"  is expected.${pos ? ` at ${pos}` : ''}`,
            );
        }
    }

    /**
     * Input arguments are evaluated at compile time, in a scope where only
     * constants exist: loop counters and function parameters are undeclared
     * there (even when an outer variable has the same name), and a variable
     * holding another input's value is not a constant.
     */
    private validateArguments(call: any, scope: Scope): void {
        forEachNode({ type: 'Args', list: call.arguments ?? [] }, (node, parent, key) => {
            if (node.type !== 'Identifier') return;
            if (parent?.type === 'Property' && key === 'key') return;
            if (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed) return;
            const sym = scope.resolve(node.name);
            if (!sym) return;
            if (sym.kind === 'loop' || sym.kind === 'param') {
                throw new Error(`Undeclared identifier "${node.name}"${node._pos ? ` at ${node._pos}` : ''}`);
            }
            if (sym.kind === 'value' && sym.inputDerived) {
                const pos = leftmostPos(call.callee);
                throw new Error(`Arguments of input function must be of constant type, or "source" builtin variables.${pos ? ` at ${pos}` : ''}`);
            }
        });
    }
}

/**
 * Metadata value for an argument that does not fold: arrays fold per element,
 * an unresolvable bare name is kept as-is (`tooltip = ma` → "ma").
 */
function fallbackValue(node: any, fold: (n: any) => ConstValue | undefined): unknown {
    if (!node) return undefined;
    if (node.type === 'ArrayExpression') {
        return (node.elements ?? []).map((el: any) => {
            const cv = fold(el);
            return cv ? finalizeConst(cv) : fallbackValue(el, fold);
        });
    }
    if (node.type === 'Identifier') return node.name;
    return undefined;
}

function containsInputCall(node: any): boolean {
    let found = false;
    forEachNode(node, (n) => {
        if (!found && inputFnName(n) !== null) found = true;
    });
    return found;
}

function leftmostPos(node: any): string | undefined {
    let n = node;
    while (n?.type === 'MemberExpression') n = n.object;
    return n?._pos;
}

/** Pre-order walk over every AST node (skipping the `args` alias of `arguments`). */
function forEachNode(root: any, visit: (node: any, parent: any, key: string) => void): void {
    const seen = new WeakSet<object>();
    const walk = (node: any, parent: any, key: string) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const n of node) walk(n, parent, key);
            return;
        }
        if (seen.has(node)) return;
        seen.add(node);
        if (typeof node.type === 'string') visit(node, parent, key);
        for (const k of Object.keys(node)) {
            if (k === 'args' || k.startsWith('_')) continue;
            const child = node[k];
            if (child && typeof child === 'object') walk(child, node, k);
        }
    };
    walk(root, null, '');
}
