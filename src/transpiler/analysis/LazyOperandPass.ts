// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Lazy-operand marking pass.
 *
 * Pine evaluates some operands lazily, and PineTS must not execute them when
 * TradingView would not:
 *
 *   - `cond ? a : b`  — only the taken branch is evaluated (every Pine version).
 *   - `a and b`, `a or b` — the right operand is skipped once the result is
 *     known in Pine v6+ (and in JavaScript). Pine v5 evaluates both operands
 *     strictly, so for v5 sources `lazyLogical` must be `false`.
 *
 * Reference: TradingView, "To Pine Script version 6" migration guide,
 * "Lazy evaluation of conditions".
 *
 * The transformation pass normally hoists every namespace call it meets into
 * a `const temp_N = ...` statement emitted *before* the enclosing statement.
 * That is fine for eager positions, but for a lazy operand it turns
 * `size(a) > 0 ? array.get(a, 0) : na` into an unconditional `array.get`
 * that throws on an empty array, and makes stateful `ta.*` calls in an
 * untaken branch run on every bar.
 *
 * This pass runs on the clean AST (before transformation) and tags every node
 * that sits inside a lazy operand with `_lazyOperand = true`. The call
 * transformer then keeps such calls inline (hoisting suppressed) so they are
 * evaluated exactly when the surrounding JS expression evaluates them.
 *
 * Function bodies (IIFEs generated for Pine `if`/`switch` expressions) reset
 * the flag: statements inside them get their own hoisting scope, which is
 * already lazy because the IIFE itself only runs when its branch is taken.
 *
 * Two refinements, both verified against TradingView output:
 *   - `request.*` calls are never lazy (see `isRequestCall` below).
 *   - For Pine v5 sources, an `and` / `or` sitting inside a lazy operand is
 *     tagged `_strictLogical` so that both of its operands still run when the
 *     branch is taken (v5 `and`/`or` are strict in every position).
 */
export interface LazyOperandOptions {
    /** Treat the right operand of `&&` / `||` / `??` as lazy. */
    lazyLogical: boolean;
}

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration']);
const LAZY_LOGICAL_OPERATORS = new Set(['&&', '||', '??']);

function isNode(value: any): boolean {
    return value !== null && typeof value === 'object' && typeof value.type === 'string';
}

function isRequestCall(node: any): boolean {
    return (
        node.type === 'CallExpression' &&
        node.callee?.type === 'MemberExpression' &&
        node.callee.object?.type === 'Identifier' &&
        node.callee.object.name === 'request'
    );
}

function visit(node: any, lazy: boolean, opts: LazyOperandOptions): void {
    if (!isNode(node)) return;

    if (lazy) node._lazyOperand = true;

    if (FUNCTION_TYPES.has(node.type)) {
        // Parameters/defaults are evaluated with the call; the body has its own
        // hoisting scope and is therefore already lazy relative to its caller.
        if (Array.isArray(node.params)) node.params.forEach((p: any) => visit(p, lazy, opts));
        visit(node.body, false, opts);
        return;
    }

    if (isRequestCall(node)) {
        // `request.*` is never lazy on TradingView: the requested expression is
        // computed on every bar of the *other* context whatever chart-side
        // condition wraps the call, and the chart context merely reads the
        // value. It must stay hoisted here too — the secondary context runs
        // this same script, so an inlined `cond ? request.security(s, tf, expr)
        // : na` would evaluate `expr`'s request.param only on secondary bars
        // where the *secondary's* `cond` holds, misaligning the values the
        // main context reads back. Arguments restart as eager; a `?:` inside
        // `expr` still gets its own lazy branches below.
        node._lazyOperand = false;
        node.arguments.forEach((a: any) => visit(a, false, opts));
        return;
    }

    if (node.type === 'ConditionalExpression') {
        visit(node.test, lazy, opts);
        visit(node.consequent, true, opts);
        visit(node.alternate, true, opts);
        return;
    }

    if (node.type === 'LogicalExpression' && LAZY_LOGICAL_OPERATORS.has(node.operator)) {
        if (opts.lazyLogical) {
            visit(node.left, lazy, opts);
            visit(node.right, true, opts);
            return;
        }
        // Pine v5: `and` / `or` evaluate BOTH operands. In an eager position the
        // right operand's calls are hoisted ahead of the statement, which is
        // strict by construction. Inside a lazy operand hoisting is suppressed
        // and native `&&` / `||` would short-circuit, so the expression is
        // rewritten to `$.pine.math.__and/__or(left, right)` afterwards
        // (transformStrictLogicalOperators): both operands run, but only when
        // the enclosing branch does.
        if (lazy && node.operator !== '??') node._strictLogical = true;
    }

    for (const key of Object.keys(node)) {
        if (key === 'parent' || key.startsWith('_')) continue;
        const child = node[key];
        if (Array.isArray(child)) {
            child.forEach((c) => visit(c, lazy, opts));
        } else if (isNode(child)) {
            visit(child, lazy, opts);
        }
    }
}

export function markLazyOperands(ast: any, opts: LazyOperandOptions): void {
    visit(ast, false, opts);
}
