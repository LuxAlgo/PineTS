// SPDX-License-Identifier: AGPL-3.0-only

import { compiledArtifactKind } from '../../../transpiler/analysis/VerifiedArtifact';

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
 */
export async function runSecondary(context: any, pineTS: any, expressionName: unknown): Promise<any> {
    const exprNameStr = typeof expressionName === 'string' ? expressionName : '';
    const sliceKey = exprNameStr.match(/p\d+$/)?.[0] ?? exprNameStr;
    const slice = context._ltfTruncatedBodies?.[sliceKey];
    const compiled = slice ?? context.transpiledFn;
    // A trusted-JavaScript run can still produce a verified Pine artifact.
    // Its provenance, not the parent's requested mode, selects native Pine.
    const sourceMode = compiledArtifactKind(compiled) === 'verifiedPine' ? 'nativePine' : context.sourceMode;
    return pineTS.runPretranspiled(compiled, context.inputs, undefined, { sourceMode });
}
