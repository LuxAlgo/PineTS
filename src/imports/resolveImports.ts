// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { scanImports, type ImportSpec } from '../transpiler/pineToJS/imports';
import { extractPineScriptVersion } from '../transpiler/pineToJS/version';
import { toImportResolver } from './Function/FunctionImportResolver.class';
import type { IImportResolver, ImportResolverFn } from './IImportResolver';
import type { ExecutionBudget } from '../security/ExecutionBudget';
import { PineRuntimeError } from '../errors/PineRuntimeError';
import { assertCompilerSourceBudget, assertCompilerLibrariesBudget, assertCompilerImportGraphBudget } from '../transpiler/analysis/CompilerBudget';

const MAX_IMPORT_RESOLUTION_MS = 30_000;

/**
 * Fetch the libraries a Pine Script source imports, and theirs, through
 * `resolver`. Returns `{ [path]: source }`, ready for the `libraries` option
 * of `transpile`.
 *
 * Every import of the script itself must resolve. A library's own import that
 * the resolver does not know is left out: transpiling fails only if the script
 * uses code of that library which needs it.
 */
export async function resolveImports(
    source: string,
    resolver: IImportResolver | ImportResolverFn | null | undefined,
    budget?: ExecutionBudget,
): Promise<Record<string, string>> {
    const libraries: Record<string, string> = {};
    assertCompilerSourceBudget(source);
    budget?.chargeWork(0);
    if (!/^import\s/m.test(source) || extractPineScriptVersion(source) === null) return libraries;
    const imports = scanImports(source);
    if (imports.length === 0) return libraries;
    if (!resolver) {
        throw new Error(
            `The script imports ${imports.map((s) => `"${s.path}"`).join(', ')} but no import resolver is configured. ` +
                `Call pineTS.setImportResolver(...) with a resolver that returns the library sources.`,
        );
    }
    const r = toImportResolver(resolver);
    const deadline = Math.min(Date.now() + MAX_IMPORT_RESOLUTION_MS, budget?.providerDeadline ?? Infinity);
    const controller = new AbortController();
    const parentSignal = budget?.providerSignal;
    const forwardAbort = () => controller.abort();
    if (parentSignal?.aborted) controller.abort();
    else parentSignal?.addEventListener('abort', forwardAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), Math.max(0, deadline - Date.now()));
    const interruptionError = (): Error => {
        try { budget?.checkProviderInterruption(); } catch (error) { return error as Error; }
        return new PineRuntimeError('Pine import resolution deadline exceeded.', 'compiler.budget', 'RESOURCE_LIMIT');
    };
    const awaitResolver = <T>(promise: Promise<T>): Promise<T> => new Promise<T>((resolve, reject) => {
        if (controller.signal.aborted) { reject(interruptionError()); return; }
        const onAbort = () => { controller.signal.removeEventListener('abort', onAbort); reject(interruptionError()); };
        controller.signal.addEventListener('abort', onAbort, { once: true });
        promise.then(
            (value) => { controller.signal.removeEventListener('abort', onAbort); controller.signal.aborted ? reject(interruptionError()) : resolve(value); },
            (error) => { controller.signal.removeEventListener('abort', onAbort); reject(error); },
        );
    });

    // Each library is fetched once; whoever starts a fetch awaits it, so a
    // circular import cannot make two fetches wait on each other.
    const started = new Set<string>();
    const load = async (spec: ImportSpec, importer?: string, depth = 1): Promise<void> => {
        if (started.has(spec.path)) return;
        assertCompilerImportGraphBudget(started.size + 1, depth);
        budget?.chargeWork(1, 'import.resolve');
        started.add(spec.path);
        const { path, user, name, version } = spec;
        const library = await awaitResolver(r.resolve(path, {
            path, user, name, version, importer, signal: controller.signal, deadline,
        }));
        budget?.chargeWork(0);
        if (typeof library !== 'string') {
            if (importer === undefined) throw new Error(`Import "${path}" could not be resolved: the import resolver returned no source`);
            return;
        }
        libraries[path] = library;
        assertCompilerLibrariesBudget(libraries);
        let nested: ImportSpec[];
        try {
            nested = scanImports(library);
        } catch (e) {
            throw new Error(`Library "${path}": ${(e as Error).message}`);
        }
        await Promise.all(nested.map((s) => load(s, path, depth + 1)));
    };
    try {
        await Promise.all(imports.map((s) => load(s)));
        return libraries;
    } finally {
        clearTimeout(timer);
        parentSignal?.removeEventListener('abort', forwardAbort);
        controller.abort();
    }
}
