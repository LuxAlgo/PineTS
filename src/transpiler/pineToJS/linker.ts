// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// Links imported Pine Script libraries into the importing script's AST.
//
// The declarations of each library are spliced into the importer's program
// where its `import` statements stood, so the rest of the pipeline only sees
// ordinary user functions, methods, types and enums. Every library declaration
// is renamed with a `<user>$<library>$<version>$` prefix — `$` cannot appear in
// a Pine identifier, so linked names never collide with the importer's own or
// with another library's — and `alias.member` references are rewritten to the
// linked names. Only the declarations the importer can reach are kept, so an
// unused part of a library may rely on an import that was never resolved.
//
// Exported methods keep their Pine name: the importer calls them with method
// syntax (`obj.method()`), dispatched on the receiver type like any user method.

import { Lexer } from './lexer';
import { Parser } from './parser';
import { Identifier, MemberExpression } from './ast';
import { extractPineScriptVersion } from './version';
import type { ImportSpec } from './imports';
import { BUILTIN_METHOD_NAMES, CONTEXT_PINE_VARS } from '../settings';

// Built-in namespaces. An import alias may reuse one (`import TradingView/ta/7 as ta`):
// members the library does not export keep naming the built-ins.
const BUILTIN_NAMES = new Set(CONTEXT_PINE_VARS);

const TYPE_WORD = /[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?/g;

type Missing = { missing: ImportSpec };
type ImportTarget = LibraryModule | Missing;

// A dependency of a declaration (or of the importing script) on a library declaration.
type Ref = { mod: LibraryModule; key: string } | { missing: ImportSpec; via: string; from: string };

interface Decl {
    node: any;
    // `f:name` function (every overload), `m:name` method, `t:name` type, `e:name` enum, `g:name` global.
    keys: string[];
    edges: Ref[];
}

class LibraryModule {
    readonly decls: Decl[] = [];
    readonly byKey = new Map<string, Decl[]>();
    readonly exported = new Set<string>();
    // Pine name -> linked name
    readonly functions = new Map<string, string>();
    readonly types = new Map<string, string>();
    readonly enums = new Map<string, string>();
    readonly globals = new Map<string, string>();
    readonly methodRenames = new Map<string, string>();
    readonly methods = new Set<string>();
    imports = new Map<string, ImportTarget>();

    constructor(
        readonly spec: ImportSpec,
        readonly prefix: string,
    ) {}

    addDecl(node: any, keys: string[]) {
        const decl: Decl = { node, keys, edges: [] };
        this.decls.push(decl);
        for (const key of keys) {
            const list = this.byKey.get(key) ?? [];
            list.push(decl);
            this.byKey.set(key, list);
            if (node.exported) this.exported.add(key);
        }
    }
}

// Rewrite state for one declaration of a library (`mod` set) or for the importing script.
class Env {
    shadow = new Set<string>();
    readonly seen = new WeakSet<object>();
    constructor(
        readonly mod: LibraryModule | null,
        readonly imports: Map<string, ImportTarget>,
        readonly refs: Ref[],
    ) {}
}

export interface LinkResult {
    /** The script's own `import` statements. */
    imports: ImportSpec[];
    /** Those of `imports` whose library source was not provided. */
    unresolved: ImportSpec[];
}

/**
 * Link the libraries `ast` imports, in place. `libraries` maps import paths
 * (`user/library/version`, nested imports included) to Pine Script sources.
 * Without it, nothing is linked and every import is reported unresolved.
 */
export function linkLibraries(ast: any, libraries?: Record<string, string>): LinkResult {
    const imports: ImportSpec[] = ast.body
        .filter((n: any) => n.type === 'ImportDeclaration')
        .map((n: any) => ({ path: n.path, user: n.user, name: n.name, version: n.version, alias: n.alias }));
    if (imports.length === 0) return { imports, unresolved: [] };
    if (!libraries) return { imports, unresolved: imports };
    return new Linker(libraries).link(ast, imports);
}

const isMissing = (t: ImportTarget | undefined): t is Missing => !!t && 'missing' in t;

class Linker {
    private readonly modules = new Map<string, LibraryModule>();
    private readonly loading: string[] = [];
    private readonly prefixes = new Set<string>();

    constructor(private readonly libraries: Record<string, string>) {}

    link(ast: any, imports: ImportSpec[]): LinkResult {
        const targets = this.loadImports(imports, null);
        const at = ast.body.findIndex((n: any) => n.type === 'ImportDeclaration');
        ast.body = ast.body.filter((n: any) => n.type !== 'ImportDeclaration');

        const roots: Ref[] = [];
        const env = new Env(null, targets, roots);
        for (const stmt of ast.body) this.visit(stmt, env);

        ast.body.splice(at, 0, ...this.emit(targets, this.reach(roots)));
        return { imports, unresolved: imports.filter((s) => isMissing(targets.get(s.alias))) };
    }

    // ── loading ──────────────────────────────────────────────────────────

    private loadImports(specs: ImportSpec[], importer: LibraryModule | null): Map<string, ImportTarget> {
        const targets = new Map<string, ImportTarget>();
        for (const spec of specs) {
            if (targets.has(spec.alias)) {
                throw new Error(`Duplicate import alias "${spec.alias}"${importer ? ` in library "${importer.spec.path}"` : ''}`);
            }
            targets.set(spec.alias, this.load(spec) ?? { missing: spec });
        }
        return targets;
    }

    private load(spec: ImportSpec): LibraryModule | null {
        const done = this.modules.get(spec.path);
        if (done) return done;
        const source = this.libraries[spec.path];
        if (typeof source !== 'string') return null;
        if (this.loading.includes(spec.path)) {
            throw new Error(`Circular library import: ${[...this.loading, spec.path].join(' -> ')}`);
        }
        this.loading.push(spec.path);
        try {
            const mod = this.parseLibrary(spec, source);
            this.modules.set(spec.path, mod);
            return mod;
        } finally {
            this.loading.pop();
        }
    }

    private parseLibrary(spec: ImportSpec, source: string): LibraryModule {
        const version = extractPineScriptVersion(source);
        if (version === null || version < 5) {
            throw new Error(
                `Library "${spec.path}": ${version === null ? 'missing //@version annotation' : `Pine Script version ${version} is not supported`}`,
            );
        }
        let ast: any;
        try {
            ast = new Parser(new Lexer(source).tokenize()).parse();
        } catch (e) {
            throw new Error(`Failed to parse library "${spec.path}": ${(e as Error).message}`);
        }

        const body = flatten(ast.body);
        if (!body.some(isLibraryDeclaration)) {
            throw new Error(`"${spec.path}" is not a library: its source has no library() declaration`);
        }

        const mod = new LibraryModule(spec, this.prefixFor(spec));
        mod.imports = this.loadImports(
            body.filter((n) => n.type === 'ImportDeclaration'),
            mod,
        );

        for (const node of body) {
            if (node.type === 'FunctionDeclaration') {
                const name = node.id.name;
                if (node.id.isMethod) mod.methods.add(name);
                else mod.functions.set(name, mod.prefix + name);
                mod.addDecl(node, [(node.id.isMethod ? 'm:' : 'f:') + name]);
            } else if (node.type === 'TypeDefinition') {
                mod.types.set(node.name, mod.prefix + node.name);
                mod.addDecl(node, ['t:' + node.name]);
            } else if (node.type === 'VariableDeclaration' && node._enum) {
                const name = node.declarations[0].id.name;
                mod.enums.set(name, mod.prefix + name);
                mod.addDecl(node, ['e:' + name]);
            } else if (node.type === 'VariableDeclaration') {
                const names = node.declarations.flatMap((d: any) => patternIds(d.id).map((id) => id.name));
                for (const name of names) mod.globals.set(name, mod.prefix + name);
                mod.addDecl(
                    node,
                    names.map((n: string) => 'g:' + n),
                );
            }
            // Anything else (the declaration statement, demo plots, ...) is the
            // library's own script code, which an importer never runs.
        }

        // A method that is not exported is private to the library, so it is renamed —
        // unless an exported method shares its name (an overload on another receiver),
        // or the name is a built-in method's: a receiver type match then tells the
        // calls apart, as for any user method.
        for (const name of mod.methods) {
            if (!mod.exported.has('m:' + name) && !BUILTIN_METHOD_NAMES.has(name)) mod.methodRenames.set(name, mod.prefix + name);
        }

        for (const decl of mod.decls) this.rewriteDeclaration(mod, decl);
        return mod;
    }

    private prefixFor(spec: ImportSpec): string {
        const ident = (s: string) => s.replace(/[^A-Za-z0-9_]/g, '_');
        let base = `${ident(spec.user)}$${ident(spec.name)}$${spec.version}$`;
        if (/^\d/.test(base)) base = '_' + base;
        let prefix = base;
        for (let n = 2; this.prefixes.has(prefix); n++) prefix = `${base}${n}$`;
        this.prefixes.add(prefix);
        return prefix;
    }

    // ── rewriting ────────────────────────────────────────────────────────

    private rewriteDeclaration(mod: LibraryModule, decl: Decl) {
        const env = new Env(mod, mod.imports, decl.edges);
        const node = decl.node;
        delete node._line;

        if (node.type === 'FunctionDeclaration') {
            const name = node.id.name;
            node.id.name = node.id.isMethod ? (mod.methodRenames.get(name) ?? name) : mod.functions.get(name)!;
            env.shadow = localNames(node);
            this.renameTypes(node, env);
            this.renameTypes(node.id, env);
            for (const p of node.params) {
                this.renameTypes(p.type === 'AssignmentPattern' ? p.left : p, env);
                if (p.type === 'AssignmentPattern') this.visit(p.right, env);
            }
            this.visit(node.body, env);
        } else if (node.type === 'TypeDefinition') {
            node.name = mod.types.get(node.name)!;
            this.visit(node, env);
        } else if (node._enum) {
            const id = node.declarations[0].id;
            id.name = mod.enums.get(id.name)!;
        } else {
            for (const d of node.declarations) {
                for (const id of patternIds(d.id)) id.name = mod.globals.get(id.name) ?? id.name;
            }
            this.visit(node.declarations, env);
        }
    }

    private visit(node: any, env: Env): void {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const child of node) this.visit(child, env);
            return;
        }
        if (typeof node.type !== 'string' || env.seen.has(node)) return;
        env.seen.add(node);
        if (env.mod) delete node._line;
        this.renameTypes(node, env);

        switch (node.type) {
            case 'CallExpression':
                return this.visitCall(node, env);
            case 'MemberExpression':
                return this.visitMember(node, env);
            case 'Identifier':
                return this.visitReference(node, env);
            case 'Property':
                // a named argument: the key is a parameter name
                return this.visit(node.value, env);
            case 'VariableDeclarator':
                // the declared names are locals (globals were renamed by rewriteDeclaration)
                for (const id of patternIds(node.id)) this.renameTypes(id, env);
                return this.visit(node.init, env);
            case 'TypeDefinition':
                for (const field of node.fields) {
                    field.type = this.renameTypeString(field.type, env);
                    this.visit(field.defaultValue, env);
                }
                return;
        }
        for (const key of Object.keys(node)) {
            if (key !== 'type') this.visit(node[key], env);
        }
    }

    // A variable read: library globals are renamed, unless a local hides them.
    private visitReference(node: any, env: Env) {
        if (!env.mod || env.shadow.has(node.name)) return;
        const linked = env.mod.globals.get(node.name);
        if (linked) {
            env.refs.push({ mod: env.mod, key: 'g:' + node.name });
            node.name = linked;
        }
    }

    private visitMember(node: any, env: Env) {
        const obj = node.object;
        if (!node.computed && obj?.type === 'MemberExpression' && !obj.computed && obj.object?.type === 'Identifier') {
            // `alias.T.new()`, `alias.E.member`
            const linked = this.aliasType(obj.object.name, obj.property?.name, env);
            if (linked) toIdentifier(obj, linked);
        } else if (!node.computed && obj?.type === 'Identifier' && env.mod && !env.shadow.has(obj.name)) {
            // `T.new()`, `E.member` inside the library
            const type = env.mod.types.get(obj.name);
            const en = env.mod.enums.get(obj.name);
            if (type) env.refs.push({ mod: env.mod, key: 't:' + obj.name });
            if (en) env.refs.push({ mod: env.mod, key: 'e:' + obj.name });
            if (type || en) obj.name = type || en;
        }
        this.visit(obj, env);
        if (node.computed) this.visit(node.property, env);
    }

    private visitCall(node: any, env: Env) {
        const callee = node.callee;
        if (callee?.type === 'Identifier') {
            if (env.mod) this.linkCallee(callee, env);
        } else if (callee?.type === 'MemberExpression' && !callee.computed && callee.property?.type === 'Identifier') {
            const obj = callee.object;
            if (obj?.type === 'Identifier' && env.imports.has(obj.name) && this.linkAliasCall(node, obj.name, callee.property.name, env)) {
                // now `f(...)` or, for an exported method, `receiver.m(...)`
                if (node.callee.type === 'MemberExpression') this.visit(node.callee.object, env);
            } else {
                this.linkMethodCall(callee, env);
                this.visit(callee, env);
            }
        } else {
            this.visit(callee, env);
        }
        this.visit(node.arguments, env);
    }

    // `f(...)` inside a library: a function, a method called as a function, or a type cast.
    private linkCallee(callee: any, env: Env) {
        const mod = env.mod!;
        const name = callee.name;
        const fn = mod.functions.get(name);
        if (fn) {
            env.refs.push({ mod, key: 'f:' + name });
            callee.name = fn;
            return;
        }
        if (mod.methods.has(name)) {
            env.refs.push({ mod, key: 'm:' + name });
            callee.name = mod.methodRenames.get(name) ?? name;
            return;
        }
        const type = !env.shadow.has(name) && mod.types.get(name);
        if (type) {
            env.refs.push({ mod, key: 't:' + name });
            callee.name = type;
        }
    }

    // `alias.f(...)`; returns false when the call is left as is.
    private linkAliasCall(node: any, alias: string, name: string, env: Env): boolean {
        const target = env.imports.get(alias)!;
        if (isMissing(target)) {
            this.missingRef(target, `${alias}.${name}()`, env);
            return false;
        }
        if (target.exported.has('f:' + name)) {
            env.refs.push({ mod: target, key: 'f:' + name });
            node.callee = new Identifier(target.functions.get(name)!);
            return true;
        }
        if (target.exported.has('m:' + name)) {
            // `alias.m(receiver, ...)` is the method call `receiver.m(...)`
            env.refs.push({ mod: target, key: 'm:' + name });
            const [receiver, ...rest] = node.arguments;
            if (receiver && receiver.type !== 'ObjectExpression') {
                node.callee = new MemberExpression(receiver, new Identifier(name), false);
                node.arguments = rest;
            } else {
                node.callee = new Identifier(name);
            }
            return true;
        }
        if (BUILTIN_NAMES.has(alias)) return false;
        throw new Error(`Could not find function or function reference "${alias}.${name}": library "${target.spec.path}" does not export it`);
    }

    // `receiver.m(...)`: the receiver's type is unknown here, so every method of that
    // name the code can see is kept.
    private linkMethodCall(callee: any, env: Env) {
        const obj = callee.object;
        if (obj?.type === 'Identifier' && !env.shadow.has(obj.name) && (BUILTIN_NAMES.has(obj.name) || env.imports.has(obj.name))) return;
        const name = callee.property.name;
        if (env.mod?.methods.has(name)) {
            env.refs.push({ mod: env.mod, key: 'm:' + name });
            const renamed = env.mod.methodRenames.get(name);
            if (renamed) callee.property.name = renamed;
        }
        for (const target of env.imports.values()) {
            if (!isMissing(target) && target.exported.has('m:' + name)) env.refs.push({ mod: target, key: 'm:' + name });
        }
    }

    // Linked name of `alias.member` when it names an exported type or enum.
    private aliasType(alias: string, member: string | undefined, env: Env): string | undefined {
        const target = env.imports.get(alias);
        if (!target || !member) return undefined;
        if (isMissing(target)) {
            this.missingRef(target, `${alias}.${member}`, env);
            return undefined;
        }
        if (target.exported.has('t:' + member)) {
            env.refs.push({ mod: target, key: 't:' + member });
            return target.types.get(member);
        }
        if (target.exported.has('e:' + member)) {
            env.refs.push({ mod: target, key: 'e:' + member });
            return target.enums.get(member);
        }
        return undefined;
    }

    private missingRef(target: Missing, via: string, env: Env) {
        // The importing script's own unresolved imports are reported by linkLibraries.
        if (env.mod) env.refs.push({ missing: target.missing, via, from: env.mod.spec.path });
    }

    // Type annotations: `config`, `array<config>`, `alias.config`, `map<string, alias.State>`.
    private renameTypes(node: any, env: Env) {
        if (typeof node.varType === 'string') node.varType = this.renameTypeString(node.varType, env);
        if (typeof node.returnType === 'string') node.returnType = this.renameTypeString(node.returnType, env);
    }

    private renameTypeString(type: any, env: Env): any {
        if (typeof type !== 'string') return type;
        return type.replace(TYPE_WORD, (word) => {
            const dot = word.indexOf('.');
            if (dot > 0) return this.aliasType(word.slice(0, dot), word.slice(dot + 1), env) ?? word;
            const mod = env.mod;
            if (!mod) return word;
            const type = mod.types.get(word);
            if (type) {
                env.refs.push({ mod, key: 't:' + word });
                return type;
            }
            const en = mod.enums.get(word);
            if (en) {
                env.refs.push({ mod, key: 'e:' + word });
                return en;
            }
            return word;
        });
    }

    // ── output ───────────────────────────────────────────────────────────

    private reach(roots: Ref[]): Set<Decl> {
        const included = new Set<Decl>();
        const queue = [...roots];
        while (queue.length > 0) {
            const ref = queue.pop()!;
            if ('missing' in ref) {
                throw new Error(`Library "${ref.from}" uses ${ref.via} from "${ref.missing.path}", which could not be resolved`);
            }
            for (const decl of ref.mod.byKey.get(ref.key) ?? []) {
                if (included.has(decl)) continue;
                included.add(decl);
                queue.push(...decl.edges);
            }
        }
        return included;
    }

    // Reachable declarations, a library's own imports before it, each in source order.
    private emit(targets: Map<string, ImportTarget>, included: Set<Decl>): any[] {
        const order: LibraryModule[] = [];
        const seen = new Set<LibraryModule>();
        const add = (target: ImportTarget) => {
            if (isMissing(target) || seen.has(target)) return;
            seen.add(target);
            for (const dep of target.imports.values()) add(dep);
            order.push(target);
        };
        for (const target of targets.values()) add(target);
        return order.flatMap((mod) => mod.decls.filter((d) => included.has(d)).map((d) => d.node));
    }
}

// ── AST helpers ─────────────────────────────────────────────────────────

/** Top-level statements, with comma sequences (`a = 1, b = 2`) flattened. */
function flatten(body: any[]): any[] {
    return body.flatMap((n) => (n?.type === 'BlockStatement' && n._sequence ? flatten(n.body) : [n]));
}

function isLibraryDeclaration(node: any): boolean {
    const call = node?.type === 'ExpressionStatement' ? node.expression : null;
    return call?.type === 'CallExpression' && call.callee?.type === 'Identifier' && call.callee.name === 'library';
}

function patternIds(id: any): any[] {
    if (id?.type === 'Identifier') return [id];
    if (id?.type === 'ArrayPattern') return id.elements.filter((e: any) => e?.type === 'Identifier');
    return [];
}

/** Parameters and every variable declared in a function's body. */
function localNames(fn: any): Set<string> {
    const names = new Set<string>();
    for (const p of fn.params) {
        const id = p.type === 'AssignmentPattern' ? p.left : p;
        if (id?.name) names.add(id.name);
    }
    const seen = new WeakSet<object>();
    const walk = (node: any) => {
        if (!node || typeof node !== 'object' || seen.has(node)) return;
        seen.add(node);
        if (Array.isArray(node)) return node.forEach(walk);
        if (node.type === 'VariableDeclarator') for (const id of patternIds(node.id)) names.add(id.name);
        for (const key of Object.keys(node)) if (key !== 'type') walk(node[key]);
    };
    walk(fn.body);
    return names;
}

/** Turn a node into an Identifier in place (it may be shared by several parents). */
function toIdentifier(node: any, name: string) {
    for (const key of Object.keys(node)) delete node[key];
    node.type = 'Identifier';
    node.name = name;
}
