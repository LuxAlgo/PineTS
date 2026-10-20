// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { scanImports, type ImportSpec } from '../transpiler/pineToJS/imports';
import { extractPineScriptVersion } from '../transpiler/pineToJS/version';
import { toImportResolver } from './Function/FunctionImportResolver.class';
import type { IImportResolver, ImportResolverFn } from './IImportResolver';

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
): Promise<Record<string, string>> {
    const libraries: Record<string, string> = {};
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

    // Each library is fetched once; whoever starts a fetch awaits it, so a
    // circular import cannot make two fetches wait on each other.
    const started = new Set<string>();
    const load = async (spec: ImportSpec, importer?: string): Promise<void> => {
        if (started.has(spec.path)) return;
        started.add(spec.path);
        const { path, user, name, version } = spec;
        const library = await r.resolve(path, { path, user, name, version, importer });
        if (typeof library !== 'string') {
            if (importer === undefined) throw new Error(`Import "${path}" could not be resolved: the import resolver returned no source`);
            return;
        }
        libraries[path] = library;
        let nested: ImportSpec[];
        try {
            nested = scanImports(library);
        } catch (e) {
            throw new Error(`Library "${path}": ${(e as Error).message}`);
        }
        await Promise.all(nested.map((s) => load(s, path)));
    };
    await Promise.all(imports.map((s) => load(s)));
    return libraries;
}
