// SPDX-License-Identifier: AGPL-3.0-only

/**
 * TypeInferencePass — Pine v5 const-int division inference.
 *
 * Runs BEFORE the main lowering pass, on the clean AST (operands are still bare
 * identifiers and literals — not yet `$.get(...)`), and ONLY for Pine v5 sources
 * (the caller in `transpiler/index.ts` gates on the //@version directive).
 *
 * Purpose: replicate Pine v5's `const int / const int → int` truncation.
 * Per TradingView's v6 migration guide ("Fractional division of constants"):
 *
 *   - In v5, `int / int` truncates toward zero ONLY when BOTH operands are
 *     qualified as 'const' (compile-time constants): `5 / 2 === 2`.
 *   - If at least one operand is 'input', 'simple', or 'series' — loop counters,
 *     mutable (`:=`-reassigned) variables, `var` declarations, `input.int(...)`,
 *     int builtins like `bar_index` — the fractional remainder is PRESERVED
 *     even in v5: `i / 4 === 0.75`.
 *   - In v6, `int / int` NEVER truncates, regardless of qualifiers. (v6 scripts
 *     never reach this pass.)
 *
 * When a `/` BinaryExpression has BOTH operands provably const int, it is
 * rewritten in place to `$.pine.math.__idiv(left, right)`; the main pass then
 * lowers the operand subtrees inside the call args. Anything not provably
 * const-int keeps native `/`, so partial coverage never corrupts a genuine
 * fractional division — the worst case is a missed truncation.
 *
 * Lattice: `constint` (compile-time int constant) → `int` (int-typed but
 * input/simple/series-qualified) → `notint` (float / string / bool / na /
 * unknown). Only `constint / constint` triggers the rewrite; the `int` tier
 * exists so int-ness still propagates through arithmetic without ever
 * upgrading a non-const operand to const.
 */
import ScopeManager from './ScopeManager';
import { ASTFactory } from '../utils/ASTFactory';

type T = 'constint' | 'int' | 'notint';

/**
 * Built-in variables that are `int`-typed in Pine. They are series-qualified,
 * never 'const', so they can propagate int-ness but never trigger truncation.
 */
const INT_BUILTIN_VARS = new Set<string>([
    'bar_index', 'last_bar_index',
    'time', 'time_close', 'timenow',
    'year', 'month', 'weekofyear', 'dayofmonth', 'dayofweek', 'hour', 'minute', 'second',
]);

/**
 * Built-in calls that RETURN `int` (dotted callee name). All are 'input',
 * 'simple' or 'series' qualified — never 'const' — so they propagate int-ness
 * without enabling truncation. CONSERVATIVE subset — anything absent defaults
 * to `notint`, which is a safe missed inference, never a wrong one.
 *
 * Deliberately EXCLUDED (fail-safe on uncertainty):
 * - `ta.pivothigh` / `ta.pivotlow` — return the pivot PRICE (float), not a bar
 *   count. (Listing them as int caused a real over-truncation regression.)
 * - `math.round` — overloaded (1-arg → int, 2-arg → float).
 * - `math.sign`, `str.pos`, `input.time` — return type uncertain; excluded until
 *   verified rather than risk mis-typing a float.
 */
const INT_RETURNING_CALLS = new Set<string>([
    'input.int',
    'math.floor', 'math.ceil',
    'array.size', 'matrix.rows', 'matrix.columns',
    'str.length',
    'timestamp',
    'ta.barssince', 'ta.highestbars', 'ta.lowestbars',
]);

/**
 * An integer literal (`2`, `11`) — NOT a float literal (`2.0`, `.5`, `1e5`).
 * Relies on the raw literal text (preserved by pine2js codegen) to distinguish
 * `2` from `2.0`: an integer VALUE alone is ambiguous (`2.0` also has value 2).
 */
function isIntLiteral(n: any): boolean {
    return (
        n &&
        n.type === 'Literal' &&
        typeof n.value === 'number' &&
        Number.isInteger(n.value) &&
        !(typeof n.raw === 'string' && /[.eE]/.test(n.raw))
    );
}

/** Dotted name of a call callee: `input.int` → "input.int", `foo` → "foo". */
function calleeName(callee: any): string | null {
    if (!callee) return null;
    if (callee.type === 'Identifier') return callee.name;
    if (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object?.type === 'Identifier' &&
        callee.property?.type === 'Identifier'
    ) {
        return `${callee.object.name}.${callee.property.name}`;
    }
    return null;
}

/**
 * Collect every identifier name that is EVER written after declaration —
 * `:=` reassignments (AssignmentExpression) and loop-counter updates
 * (UpdateExpression / compound assignment in for-headers). Pine qualifies a
 * mutated variable as 'series' program-wide, so a single write anywhere
 * disqualifies the name from 'const' everywhere. Name-based (not scope-based):
 * a shadowed name may be over-disqualified, which fails safe (missed
 * truncation), never wrong.
 */
function collectMutatedNames(ast: any): Set<string> {
    const mutated = new Set<string>();
    (function scan(node: any): void {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'AssignmentExpression' && node.left?.type === 'Identifier') {
            mutated.add(node.left.name);
        } else if (node.type === 'UpdateExpression' && node.argument?.type === 'Identifier') {
            mutated.add(node.argument.name);
        }
        for (const key in node) {
            if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'raw') continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const c of child) if (c && typeof c === 'object') scan(c);
            } else if (child && typeof child === 'object') {
                scan(child);
            }
        }
    })(ast);
    return mutated;
}

/** JOIN two types: int-ness survives only if both sides are int-ish, and the
 *  result of a join is never const (a value that can vary is not a constant). */
function join(a: T, b: T): T {
    return a !== 'notint' && b !== 'notint' ? 'int' : 'notint';
}

/** Scope stack of variable-name → inferred type. Pine rarely shadows, but function
 *  bodies get their own frame so a param never leaks a type to the global scope. */
class Env {
    private stack: Map<string, T>[] = [new Map()];
    push(): void { this.stack.push(new Map()); }
    pop(): void { if (this.stack.length > 1) this.stack.pop(); }
    /** Declaration: establish a variable's type in the current scope. */
    set(name: string, t: T): void { this.stack[this.stack.length - 1].set(name, t); }
    get(name: string): T | undefined {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const v = this.stack[i].get(name);
            if (v !== undefined) return v;
        }
        return undefined;
    }
    /**
     * Reassignment (`x := ...`): JOIN with the existing type. A variable is
     * int-ish only if EVERY value it holds is int-ish; once it takes a `notint`
     * value (its `na`/float initializer, or any float assignment) it stays
     * `notint` forever. This mirrors Pine's "type is fixed at declaration" — a
     * `var float x = na` reassigned to a float pivot stays float — and fails
     * safe: a mis-typed signature can never upgrade a float variable to int.
     */
    assign(name: string, t: T): void {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].has(name)) {
                this.stack[i].set(name, join(this.stack[i].get(name)!, t));
                return;
            }
        }
        this.stack[this.stack.length - 1].set(name, join(t, t));
    }
}

export function runTypeInferencePass(ast: any, _scopeManager: ScopeManager): void {
    const env = new Env();
    const mutatedNames = collectMutatedNames(ast);

    // Visit a node; for expressions, return its inferred type AND rewrite any
    // provably-const-int `/` inside it. Every child is visited exactly once so
    // no division is missed. Unknown/unhandled shapes fall back to generic child
    // recursion and yield `notint` (safe: no rewrite).
    function visit(node: any): T {
        if (!node || typeof node !== 'object') return 'notint';

        switch (node.type) {
            case 'Literal':
                if (typeof node.value === 'number') return isIntLiteral(node) ? 'constint' : 'notint';
                return 'notint';

            case 'Identifier':
                if (INT_BUILTIN_VARS.has(node.name)) return 'int'; // series int, never const
                return env.get(node.name) ?? 'notint';

            case 'UnaryExpression':
                // Unary +/- preserve numeric type (`-11` is const int); `!`/`~` are notint.
                if (node.operator === '-' || node.operator === '+') return visit(node.argument);
                visit(node.argument);
                return 'notint';

            case 'BinaryExpression': {
                const lt = visit(node.left);
                const rt = visit(node.right);
                if (node.operator === '/') {
                    if (lt === 'constint' && rt === 'constint') {
                        // v5 const int / const int → const int (truncated toward
                        // zero). Rewrite in place; the main pass lowers
                        // node.left / node.right in the args.
                        const call = ASTFactory.createMathIntDivCall(node.left, node.right);
                        Object.assign(node, call);
                        return 'constint';
                    }
                    // Any non-const int operand → fractional result (even in v5).
                    return 'notint';
                }
                // `+ - * %` preserve int-ness (and const-ness) so a downstream
                // `/` sees it. Comparisons / others → notint.
                if (node.operator === '+' || node.operator === '-' || node.operator === '*' || node.operator === '%') {
                    if (lt === 'constint' && rt === 'constint') return 'constint';
                    return lt !== 'notint' && rt !== 'notint' ? 'int' : 'notint';
                }
                return 'notint';
            }

            case 'ConditionalExpression': {
                visit(node.test);
                const c = visit(node.consequent);
                const a = visit(node.alternate);
                // Never const: we don't track bool const-ness of the test, and a
                // missed truncation is safe while a wrong one is not.
                return join(c, a);
            }

            case 'LogicalExpression':
                visit(node.left);
                visit(node.right);
                return 'notint';

            case 'CallExpression': {
                // Visit callee's object subtree (may contain divisions) and every arg.
                if (node.callee?.type === 'MemberExpression') visit(node.callee.object);
                for (const arg of node.arguments || []) visit(arg);
                const name = calleeName(node.callee);
                return name && INT_RETURNING_CALLS.has(name) ? 'int' : 'notint';
            }

            case 'MemberExpression': {
                // Computed index / object may contain divisions.
                visit(node.object);
                if (node.computed) visit(node.property);
                return 'notint';
            }

            case 'VariableDeclaration': {
                for (const d of node.declarations || []) {
                    let t = d.init ? visit(d.init) : 'notint';
                    if (d.id?.type === 'Identifier') {
                        // Const-ness requires an immutable non-`var` binding:
                        // `var`/`varip` declarations and any name that is ever
                        // reassigned (incl. loop counters) are at best simple/
                        // series ints in Pine's qualifier model.
                        if (t === 'constint' && (node.kind === 'var' || mutatedNames.has(d.id.name))) {
                            t = 'int';
                        }
                        env.set(d.id.name, t);
                    }
                }
                return 'notint';
            }

            case 'AssignmentExpression': {
                const t = visit(node.right);
                // `x := ...` reassignment: JOIN with the existing type (never
                // upgrades a notint variable, never yields const — see Env.assign).
                if (node.left?.type === 'Identifier') env.assign(node.left.name, t);
                else visit(node.left);
                return t;
            }

            case 'FunctionDeclaration':
            case 'FunctionExpression':
            case 'ArrowFunctionExpression': {
                env.push();
                // Params default to notint (base param types are not yet threaded).
                for (const p of node.params || []) {
                    const pid = p.type === 'AssignmentPattern' ? p.left : p;
                    if (pid?.type === 'Identifier') env.set(pid.name, 'notint');
                }
                visit(node.body);
                env.pop();
                return 'notint';
            }

            default:
                // Generic recursion for statements / unhandled expressions so nested
                // divisions are still processed. Yields notint (no rewrite here).
                recurseChildren(node);
                return 'notint';
        }
    }

    function recurseChildren(node: any): void {
        for (const key in node) {
            if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'raw') continue;
            const child = node[key];
            if (Array.isArray(child)) {
                for (const c of child) if (c && typeof c.type === 'string') visit(c);
            } else if (child && typeof child.type === 'string') {
                visit(child);
            }
        }
    }

    visit(ast);
}
