// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// ── Import resolver configuration types ─────────────────────────────────

/** Base config — all import resolvers extend this. */
export interface BaseImportResolverConfig {
    /** How long a resolved library is kept, in milliseconds. Default: as long as the resolver lives. */
    cacheDuration?: number;
}

// ── Import info ─────────────────────────────────────────────────────────

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
 * Library source resolver: returns the Pine Script source of the library an
 * `import <user>/<library>/<version>` statement names, or `null` when it does
 * not know that library.
 */
export interface IImportResolver {
    resolve(path: string, info: ImportInfo): Promise<string | null>;
    configure(config: any): void;
}

/**
 * A plain function resolver. `PineTS.setImportResolver` and
 * `ChainImportResolver` accept one in place of an `IImportResolver`.
 */
export type ImportResolverFn = (path: string, info: ImportInfo) => string | null | undefined | Promise<string | null | undefined>;
