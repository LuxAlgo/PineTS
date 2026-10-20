// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/** A library import, as passed to an import resolver. */
export interface ImportInfo {
    /** `user/library/version`, as written in the import statement. */
    path: string;
    user: string;
    /** Library name, the title passed to its `library()` declaration. */
    name: string;
    version: number;
    /** Path of the library holding the import; undefined for the script being run. */
    importer?: string;
}

/**
 * Returns the Pine Script source of a library, or `null` / `undefined` when
 * it does not know the library.
 */
export type ImportResolverFn = (path: string, info: ImportInfo) => string | null | undefined | Promise<string | null | undefined>;

export type ImportResolverLike = ImportResolverFn | { resolve: ImportResolverFn };
