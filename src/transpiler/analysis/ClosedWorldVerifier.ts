// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Closed-world verifier.
 *
 * TradingView resolves every name in a Pine script against its built-in table
 * and rejects anything it does not recognize at compile time. PineTS instead
 * emits unresolved identifiers and member accesses verbatim into the string it
 * hands to `new Function(...)`, which then runs in the host realm. For scripts
 * that came through the Pine front-end this breaks parity with TradingView: a
 * name TradingView would reject (`process`, `fetch`, `Function`) or a member it
 * has no notion of (`x.constructor`, `str.context`) would resolve against the
 * host's JavaScript environment instead.
 *
 * This pass runs on the AST re-parsed from the FINAL generated JavaScript —
 * exactly the string handed to `new Function(...)` — immediately before it is
 * compiled. Verifying the emitted code rather than the transformer's working
 * AST is both more faithful (it checks what actually executes) and more robust
 * (the transformer stamps non-syntactic annotation fields onto nodes, e.g. a
 * `property` on a `CallExpression`, which astring never emits; walking those
 * would raise spurious violations). It enforces the closed world the Pine
 * front-end is supposed to describe:
 *
 *   1. Every identifier reference must resolve to a binding visible at that
 *      lexical position (a parameter, a `var`/`let`/`const`, a function or class
 *      name, a catch binding) or be one of a tiny set of JavaScript values the
 *      transpiler legitimately emits (`undefined`, `NaN`, `Infinity`, `Error`).
 *      A free `process` / `fetch` / `Function` / `globalThis` therefore throws.
 *
 *   2. No member access or object key may use a reserved JavaScript property
 *      that reaches the prototype chain or a PineTS runtime internal
 *      (`constructor`, `__proto__`, `prototype`, `context`, …). This blocks the
 *      `x.constructor.constructor(...)` route to the `Function` constructor and
 *      the `namespace.context` route to the live runtime `Context`.
 *
 *   3. No dynamic computed member access (`x[expr]` with a non-literal key),
 *      `this`, `super`, `with`, `import(...)`, `import.meta`, or `new` of
 *      anything other than `Error`.
 *
 * The measured cost on real scripts is nil: across the 661 Pine fixtures in the
 * test corpus the generated code references only `undefined` and `Error` freely
 * and never names a reserved property or a dynamic computed key. A genuine
 * Pine script cannot express any of the rejected shapes, so a rejection here is
 * the same "undeclared identifier" error TradingView itself would raise.
 */

// JavaScript values the transpiler legitimately leaves as free identifiers in
// generated Pine code. These three literals are emitted for `na` / non-finite
// values. Nothing else is expected free — in particular NOT `Function`, `eval`,
// `globalThis`, `Reflect`, `Proxy`, `arguments`, `process`, `require`, `fetch`,
// or `import`. `Error` is deliberately NOT here: it is a mutable host global
// (`Error.stackTraceLimit = …` reaches the real process-global object), so it is
// allowed ONLY as the callee of `new Error(...)` — see the Identifier branch of
// verifyNode. The loop-guard throw (`new Error("Loop exceeded …")`) is the only
// place the transpiler emits it, and that form stays permitted.
const SAFE_FREE_IDENTIFIERS = new Set(['undefined', 'NaN', 'Infinity']);

// Property names that must never be reached through a Pine member access or
// object key. The first group walks the prototype chain to code execution; the
// second leaks PineTS runtime internals (the live Context and its owners — see
// every namespace's `constructor(private context)` and the `public context`
// drawing/collection objects).
const DENIED_PROPERTY_NAMES = new Set([
    // Prototype-chain escapes → Function constructor, defineProperty, etc.
    'constructor',
    'prototype',
    '__proto__',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
    // Runtime-internal back-references exposed on namespace / object instances.
    'context',
    'pineTS',
    'marketData',
    'provider',
    '_context',
]);

// Raw collection storage is an implementation detail. Exposing it lets a Pine
// program call native Array/Map methods outside the budget. The generated
// `$.pine.array/map/matrix` namespace access is the one legitimate exception.
const RAW_STORAGE_PROPERTY_NAMES = new Set(['matrix', '_matrix', 'array', '_array', 'map', '_map']);

// Keys that are not part of the syntactic child graph. `parent` (and other
// back-references the transformers attach) make the AST cyclic, so descending
// into them would recurse forever; `loc`/`start`/`end`/`range` and the comment
// arrays carry no nodes to verify. Mirrors buildLtfSlices' AST_SKIP_KEYS.
const SKIP_KEYS = new Set(['type', 'parent', 'loc', 'start', 'end', 'range', 'leadingComments', 'trailingComments']);

/** Thrown when the verifier rejects a node. Carries no host detail. */
export class ClosedWorldViolation extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ClosedWorldViolation';
    }
}

/** Collect every name bound by a declaration pattern into `out`. */
function collectPatternNames(pattern: any, out: Set<string>): void {
    if (!pattern || typeof pattern !== 'object') return;
    switch (pattern.type) {
        case 'Identifier':
            out.add(pattern.name);
            return;
        case 'ObjectPattern':
            for (const prop of pattern.properties || []) {
                if (prop.type === 'RestElement') collectPatternNames(prop.argument, out);
                else collectPatternNames(prop.value, out);
            }
            return;
        case 'ArrayPattern':
            for (const el of pattern.elements || []) collectPatternNames(el, out);
            return;
        case 'AssignmentPattern':
            collectPatternNames(pattern.left, out);
            return;
        case 'RestElement':
            collectPatternNames(pattern.argument, out);
            return;
        default:
            return;
    }
}

type ScopeKind = 'program' | 'function' | 'block';
type LexicalScope = { parent: LexicalScope | null; kind: ScopeKind; bindings: Set<string> };

function childScope(parent: LexicalScope, kind: ScopeKind): LexicalScope {
    return { parent, kind, bindings: new Set<string>() };
}

function varScope(scope: LexicalScope): LexicalScope {
    while (scope.kind === 'block' && scope.parent) scope = scope.parent;
    return scope;
}

function isBound(name: string, scope: LexicalScope): boolean {
    for (let current: LexicalScope | null = scope; current; current = current.parent) {
        if (current.bindings.has(name)) return true;
    }
    return false;
}

/**
 * Pass 1 — register declarations in their actual JavaScript scopes. `var`
 * hoists to its containing function, while parameters, catches, block bindings
 * and named expressions remain local. Collecting before checking references
 * preserves JavaScript's forward declarations without accepting sibling names.
 */
function collectBindings(node: any, scope: LexicalScope, scopeByNode: WeakMap<object, LexicalScope>, seen: WeakSet<object>): void {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string' || seen.has(node)) return;
    seen.add(node);

    let current = scope;
    switch (node.type) {
        case 'Program':
            scopeByNode.set(node, scope);
            break;
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            if (node.type === 'FunctionDeclaration' && node.id?.name) scope.bindings.add(node.id.name);
            current = childScope(scope, 'function');
            scopeByNode.set(node, current);
            if (node.id?.name) current.bindings.add(node.id.name);
            for (const param of node.params || []) collectPatternNames(param, current.bindings);
            break;
        case 'ClassDeclaration':
        case 'ClassExpression':
            if (node.type === 'ClassDeclaration' && node.id?.name) scope.bindings.add(node.id.name);
            current = childScope(scope, 'block');
            scopeByNode.set(node, current);
            if (node.id?.name) current.bindings.add(node.id.name);
            break;
        case 'BlockStatement':
        case 'SwitchStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
            current = childScope(scope, 'block');
            scopeByNode.set(node, current);
            break;
        case 'CatchClause':
            current = childScope(scope, 'block');
            scopeByNode.set(node, current);
            if (node.param) collectPatternNames(node.param, current.bindings);
            break;
        case 'VariableDeclaration':
            for (const declaration of node.declarations || []) {
                collectPatternNames(declaration.id, node.kind === 'var' ? varScope(scope).bindings : scope.bindings);
            }
            break;
    }

    for (const key of Object.keys(node)) {
        if (SKIP_KEYS.has(key)) continue;
        const value = node[key];
        if (Array.isArray(value)) {
            for (const child of value) collectBindings(child, current, scopeByNode, seen);
        } else if (value && typeof value === 'object' && typeof value.type === 'string') {
            collectBindings(value, current, scopeByNode, seen);
        }
    }
}

/**
 * The transpiler represents some generated string constants (call ids `'p0'`,
 * `'_ta0'`, `'_fn0'`, cache keys `'cache_0'`, callsite ids `"#0"`, …) as
 * `Identifier` nodes whose `name` is wrapped in quotes, relying on astring to
 * emit the name verbatim as a string literal. A Pine identifier can never
 * contain a quote (the lexer forbids it; source strings become `Literal`
 * nodes), so a quote-wrapped Identifier is always a transpiler-internal
 * pseudo-literal, not a free reference. Mirrors ExpressionTransformer's check.
 */
function isPseudoLiteralIdentifier(name: string): boolean {
    return name.length >= 2 && ((name.startsWith("'") && name.endsWith("'")) || (name.startsWith('"') && name.endsWith('"')));
}

function isGeneratedNamespaceAccess(member: any, name: string): boolean {
    if (name !== 'array' && name !== 'map' && name !== 'matrix') return false;
    const owner = member?.object;
    return owner?.type === 'MemberExpression' && !owner.computed &&
        owner.object?.type === 'Identifier' && owner.object.name === '$' &&
        owner.property?.type === 'Identifier' && owner.property.name === 'pine';
}

function assertPropertyAllowed(name: unknown, member?: any): void {
    if (typeof name === 'string' && (DENIED_PROPERTY_NAMES.has(name) ||
        (member && RAW_STORAGE_PROPERTY_NAMES.has(name) && !isGeneratedNamespaceAccess(member, name)))) {
        throw new ClosedWorldViolation(`Access to reserved property "${name}" is not allowed`);
    }
}

/**
 * Pass 2 — walk every node and enforce the closed world. `parent`/`keyInParent`
 * let us tell a member-property or object-key identifier (never a reference)
 * from a true reference.
 */
function verifyNode(
    node: any,
    parent: any,
    keyInParent: string | null,
    scope: LexicalScope,
    scopeByNode: WeakMap<object, LexicalScope>,
    seen: WeakSet<object>
): void {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string' || seen.has(node)) return;
    seen.add(node);
    const current = scopeByNode.get(node) || scope;

    switch (node.type) {
        case 'ThisExpression':
            throw new ClosedWorldViolation('"this" is not available in Pine scripts');
        case 'Super':
            throw new ClosedWorldViolation('"super" is not available in Pine scripts');
        case 'MetaProperty':
            throw new ClosedWorldViolation('"import.meta" is not available in Pine scripts');
        case 'ImportExpression':
            throw new ClosedWorldViolation('dynamic import() is not available in Pine scripts');
        case 'WithStatement':
            throw new ClosedWorldViolation('"with" is not available in Pine scripts');
        case 'NewExpression':
            // The loop-guard throw emits `new Error(...)`; nothing else is legitimate.
            if (!(node.callee?.type === 'Identifier' && node.callee.name === 'Error')) {
                throw new ClosedWorldViolation('object construction is not available in Pine scripts');
            }
            break;
        case 'Identifier': {
            const isMemberProperty = parent?.type === 'MemberExpression' && keyInParent === 'property' && !parent.computed;
            const isObjectKey = parent?.type === 'Property' && keyInParent === 'key' && !parent.computed;
            if (isMemberProperty || isObjectKey) {
                assertPropertyAllowed(node.name, isMemberProperty ? parent : undefined);
                return; // not a value reference — do not require a declaration
            }
            if (isPseudoLiteralIdentifier(node.name)) return; // transpiler-internal string constant
            // `Error` is permitted only as `new Error(...)` (the loop-guard throw).
            // A bare or member use (`x = Error`, `Error.stackTraceLimit = …`,
            // `Error.captureStackTrace(...)`) would reach and mutate the
            // process-global Error object, so it is rejected like any host global.
            if (node.name === 'Error' && parent?.type === 'NewExpression' && keyInParent === 'callee') return;
            if (!isBound(node.name, current) && !SAFE_FREE_IDENTIFIERS.has(node.name)) {
                throw new ClosedWorldViolation(`Undeclared identifier "${node.name}"`);
            }
            return;
        }
        case 'MemberExpression':
            if (node.computed) {
                // Only a static literal key is allowed (array/tuple indexing,
                // fixed string keys). A dynamic key could target any property.
                if (node.property?.type === 'Literal') {
                    assertPropertyAllowed(node.property.value, node);
                } else {
                    throw new ClosedWorldViolation('dynamic computed member access is not allowed');
                }
            }
            break;
    }

    for (const key of Object.keys(node)) {
        if (SKIP_KEYS.has(key)) continue;
        const value = node[key];
        if (Array.isArray(value)) {
            for (const child of value) verifyNode(child, node, key, current, scopeByNode, seen);
        } else if (value && typeof value === 'object' && typeof value.type === 'string') {
            verifyNode(value, node, key, current, scopeByNode, seen);
        }
    }
}

/**
 * Verify that `ast` (a fully-transformed program) describes a closed world:
 * no free host identifiers, no reserved-property or runtime-internal access,
 * no dynamic member access or other realm escapes. Throws ClosedWorldViolation
 * on the first offending node.
 */
export function verifyClosedWorld(ast: any): void {
    const root: LexicalScope = { parent: null, kind: 'program', bindings: new Set<string>() };
    const scopeByNode = new WeakMap<object, LexicalScope>();
    collectBindings(ast, root, scopeByNode, new WeakSet<object>());
    verifyNode(ast, null, null, root, scopeByNode, new WeakSet<object>());
}
