// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import * as acorn from 'acorn';
import { verifyClosedWorld } from './ClosedWorldVerifier';
import { assertCompilerAstBudget, assertGeneratedCodeBudget } from './CompilerBudget';

export type CompiledArtifactKind = 'verifiedPine' | 'trustedJavaScript';
const compiledArtifacts = new WeakMap<Function, CompiledArtifactKind>();
const verifiedArtifacts = new WeakSet<VerifiedArtifact>();

function compile(code: string, kind: CompiledArtifactKind): Function {
    assertGeneratedCodeBudget(code);
    const fn = new Function('', `var _r = ${code}\n; return _r;`)();
    if (typeof fn !== 'function') {
        throw new TypeError('Transpiled source must produce a function');
    }
    compiledArtifacts.set(fn, kind);
    return fn;
}

export function compiledArtifactKind(fn: unknown): CompiledArtifactKind | undefined {
    return typeof fn === 'function' ? compiledArtifacts.get(fn) : undefined;
}

/** The immutable, exact source that passed the final Pine verification pass. */
export class VerifiedArtifact {
    private constructor(public readonly code: string) {
        Object.freeze(this);
    }

    public static fromFinalCode(code: string): VerifiedArtifact {
        assertGeneratedCodeBudget(code);
        const ast = acorn.parse(code, { ecmaVersion: 'latest' });
        assertCompilerAstBudget(ast);
        verifyClosedWorld(ast);
        const artifact = new VerifiedArtifact(code);
        verifiedArtifacts.add(artifact);
        return artifact;
    }
}

export function compileVerifiedArtifact(artifact: VerifiedArtifact): Function {
    if (!(artifact instanceof VerifiedArtifact) || !verifiedArtifacts.has(artifact)) {
        throw new TypeError('Pine compilation requires a verified final artifact');
    }
    return compile(artifact.code, 'verifiedPine');
}

export function compilePineArtifact(code: string): Function {
    return compileVerifiedArtifact(VerifiedArtifact.fromFinalCode(code));
}

/** Explicit compatibility path for first-party JavaScript input. */
export function compileTrustedJavaScript(code: string): Function {
    return compile(code, 'trustedJavaScript');
}
