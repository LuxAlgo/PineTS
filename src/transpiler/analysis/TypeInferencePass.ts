// SPDX-License-Identifier: AGPL-3.0-only

/**
 * TypeInferencePass — Pine base-type inference (RC2b P0).
 *
 * Runs BEFORE the main lowering pass, on the clean AST (operands are still bare
 * identifiers, `input.int(...)` calls, and literals — not yet `$.get(...)`).
 *
 * Purpose: replicate Pine's `int / int → int` semantics. JavaScript `/` is always
 * float division (`11 / 2 === 5.5`), but Pine truncates toward zero when both
 * operands are integers (`11 / 2 === 5`, `-11 / 2 === -5`). Int-ness is a
 * compile-time fact — a `float` series holding `4.0` is an ordinary JS number at
 * runtime — so a static pass is the only correct discriminator.
 *
 * When a `/` BinaryExpression has BOTH operands provably `int`, it is rewritten in
 * place to `$.pine.math.__idiv(left, right)`; the main pass then lowers the operand
 * subtrees inside the call args. Anything not provably int keeps native `/`, so
 * partial coverage never corrupts a genuine float division — the worst case is a
 * missed truncation.
 *
 * Scope note (P0): the ONLY consumer of type info is the `/` rewrite, so we track
 * a minimal lattice — `int` vs `notint` (float / string / bool / na / unknown).
 * `notint` simply means "not provably int", which is all the rewrite needs. A
 * fuller int/float/bool/string lattice (for str.tostring formatting, casts, etc.)
 * can be layered on later without changing this rewrite.
 */
import * as walk from 'acorn-walk';
import ScopeManager from './ScopeManager';
import { ASTFactory } from '../utils/ASTFactory';

type T = 'int' | 'notint';

/**
 * Built-in variables that are `int`-typed in Pine. Their divisions (`bar_index / 2`)
 * are integer division even though at runtime they are plain JS numbers.
 */
const INT_BUILTIN_VARS = new Set<string>([
    'bar_index', 'last_bar_index',
    'time', 'time_close', 'timenow',
    'year', 'month', 'weekofyear', 'dayofmonth', 'dayofweek', 'hour', 'minute', 'second',
]);

/**
 * Built-in calls that RETURN `int` (dotted callee name). CONSERVATIVE subset —
 * only functions whose result is unambiguously an int (counts, indices, bar
 * offsets). Anything absent defaults to `notint` (no truncation), so an omission
 * is a safe missed-truncation, never a wrong one.
 *
 * Deliberately EXCLUDED (fail-safe on uncertainty):
 * - `ta.pivothigh` / `ta.pivotlow` — return the pivot PRICE (float), not a bar
 *   count. (Listing them as int caused a real over-truncation regression.)
 * - `math.round` — overloaded (1-arg → int, 2-arg → float).
 * - `math.sign`, `str.pos`, `input.time` — return type uncertain; excluded until
 *   verified rather than risk truncating a float.
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
     * Reassignment (`x := ...`): JOIN with the existing type. A variable is `int`
     * only if EVERY value it holds is `int`; once it takes a `notint` value (its
     * `na`/float initializer, or any float assignment) it stays `notint` forever.
     * This mirrors Pine's "type is fixed at declaration" — a `var float x = na`
     * reassigned to a float pivot stays float — and fails safe: a mis-typed
     * signature can never upgrade a float variable to int and truncate it.
     */
    assign(name: string, t: T): void {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].has(name)) {
                const cur = this.stack[i].get(name);
                this.stack[i].set(name, cur === 'int' && t === 'int' ? 'int' : 'notint');
                return;
            }
        }
        this.stack[this.stack.length - 1].set(name, t);
    }
}

export function runTypeInferencePass(ast: any, _scopeManager: ScopeManager): void {
    const env = new Env();

    // Visit a node; for expressions, return its inferred type AND rewrite any
    // provably-int `/` inside it. Every child is visited exactly once so no
    // division is missed. Unknown/unhandled shapes fall back to generic child
    // recursion and yield `notint` (safe: no rewrite).
    function visit(node: any): T {
        if (!node || typeof node !== 'object') return 'notint';

        switch (node.type) {
            case 'Literal':
                if (typeof node.value === 'number') return isIntLiteral(node) ? 'int' : 'notint';
                return 'notint';

            case 'Identifier':
                if (INT_BUILTIN_VARS.has(node.name)) return 'int';
                return env.get(node.name) ?? 'notint';

            case 'UnaryExpression':
                // Unary +/- preserve numeric type (`-11` is int); `!`/`~` are notint.
                if (node.operator === '-' || node.operator === '+') return visit(node.argument);
                visit(node.argument);
                return 'notint';

            case 'BinaryExpression': {
                const lt = visit(node.left);
                const rt = visit(node.right);
                const bothInt = lt === 'int' && rt === 'int';
                if (node.operator === '/') {
                    if (bothInt) {
                        // int / int → int (truncated toward zero). Rewrite in place;
                        // the main pass lowers node.left / node.right in the args.
                        const call = ASTFactory.createMathIntDivCall(node.left, node.right);
                        Object.assign(node, call);
                        return 'int';
                    }
                    return 'notint';
                }
                // `+ - * %` preserve int when both operands are int (so a downstream
                // `/` sees the propagated int-ness). Comparisons / others → notint.
                if (node.operator === '+' || node.operator === '-' || node.operator === '*' || node.operator === '%') {
                    return bothInt ? 'int' : 'notint';
                }
                return 'notint';
            }

            case 'ConditionalExpression': {
                visit(node.test);
                const c = visit(node.consequent);
                const a = visit(node.alternate);
                return c === 'int' && a === 'int' ? 'int' : 'notint';
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
                    const t = d.init ? visit(d.init) : 'notint';
                    if (d.id?.type === 'Identifier') env.set(d.id.name, t);
                }
                return 'notint';
            }

            case 'AssignmentExpression': {
                const t = visit(node.right);
                // `x := ...` reassignment: JOIN with the existing type (never
                // upgrades a notint variable to int — see Env.assign).
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
