// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Run the script of a request.security / request.security_lower_tf secondary
 * context (`pineTS`, already built on the requested symbol + timeframe).
 *
 * It runs the transpile-time slice for this call site when there is one
 * (`context._ltfTruncatedBodies`, keyed by the bare static `pN`; for
 * fn-nested calls the runtime `expressionName` is the path-prefixed
 * `${$$.id}pN`, so the trailing `pN` is the key), else the parent's own
 * transpiled function (`context.transpiledFn`) — never a re-transpile of
 * the source, which a `runPretranspiled()` caller doesn't even have
 * (`context.pineTSCode` is null there). Either way the secondary gets the
 * parent's inputs, so input overrides reach the requested expression.
 *
 * A slice that ran without evaluating this call's expression (a call-graph
 * shape the slicer doesn't model) is not an answer: the whole script runs
 * instead.
 */
export async function runSecondary(context: any, pineTS: any, expressionName: unknown): Promise<any> {
    const exprNameStr = typeof expressionName === 'string' ? expressionName : '';
    const sliceKey = exprNameStr.match(/p\d+$/)?.[0] ?? exprNameStr;
    const slice = context._ltfTruncatedBodies?.[sliceKey];
    if (slice) {
        const secContext = await pineTS.runPretranspiled(slice, context.inputs);
        if (secContext.params?.[exprNameStr] !== undefined) return secContext;
    }
    return pineTS.runPretranspiled(context.transpiledFn, context.inputs);
}
