// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { MapImportResolver } from './Map/MapImportResolver.class';
import { UrlImportResolver } from './Url/UrlImportResolver.class';
import { GitHubImportResolver } from './GitHub/GitHubImportResolver.class';
import { IImportResolver } from './IImportResolver';
// FileImportResolver is conditionally imported - excluded from browser builds via rollup plugin
// In browser builds, it will be replaced with a stub
import { FileImportResolver } from './File/FileImportResolver.class';

// Re-export resolver classes for direct instantiation
export { MapImportResolver } from './Map/MapImportResolver.class';
export { UrlImportResolver } from './Url/UrlImportResolver.class';
export { GitHubImportResolver } from './GitHub/GitHubImportResolver.class';
export { FileImportResolver } from './File/FileImportResolver.class';
export { ChainImportResolver } from './Chain/ChainImportResolver.class';
export { FunctionImportResolver } from './Function/FunctionImportResolver.class';
export { BaseImportResolver } from './BaseImportResolver';

type TImportResolver = {
    [key: string]: IImportResolver;
};

// FileImportResolver uses Node.js modules (fs) and is excluded from browser builds
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

let FileImportResolverInstance: IImportResolver | null = null;
if (isNodeEnvironment) {
    try {
        FileImportResolverInstance = new FileImportResolver();
    } catch (e) {
        FileImportResolverInstance = null;
    }
}

export const ImportResolver: TImportResolver = {
    Map: new MapImportResolver(),
    Url: new UrlImportResolver(),
    GitHub: new GitHubImportResolver(),
    // Only include the File resolver in Node.js environments (excluded from browser builds)
    ...(FileImportResolverInstance ? { File: FileImportResolverInstance } : {}),
};

export function registerImportResolver(name: string, resolver: IImportResolver) {
    ImportResolver[name] = resolver;
}
