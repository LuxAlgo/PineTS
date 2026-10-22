// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import * as fs from 'fs';
import { BaseImportResolver } from '../BaseImportResolver';
import type { BaseImportResolverConfig, ImportInfo } from '../IImportResolver';
import { fillTemplate } from '../utils';

/** Configuration for FileImportResolver. */
export interface FileImportResolverConfig extends BaseImportResolverConfig {
    /**
     * Folder holding one file per library, named after the library, or a path
     * template with `{user}`, `{name}`, `{version}` and `{path}` placeholders.
     */
    dir: string;
    /** Suffixes tried in turn after the path. Default `['', '.pine', '.txt']`. */
    extensions?: string[];
}

/**
 * Library sources read from local files. Node.js only: excluded from browser
 * builds, where a stub throws instead.
 *
 * ## Usage
 *
 * ### Direct instantiation:
 * ```typescript
 * pineTS.setImportResolver(new FileImportResolver({ dir: './pine/libraries' }));
 * ```
 *
 * ### Via ImportResolver registry:
 * ```typescript
 * ImportResolver.File.configure({ dir: './pine/{user}/{name}-v{version}.pine', extensions: [''] });
 * pineTS.setImportResolver(ImportResolver.File);
 * ```
 */
export class FileImportResolver extends BaseImportResolver<FileImportResolverConfig> {
    private _dir: string | null = null;
    private _extensions = ['', '.pine', '.txt'];

    constructor(config?: FileImportResolverConfig) {
        super({ requiresConfig: true, resolverName: 'File' });
        if (config?.dir) {
            this.configure(config);
        }
    }

    configure(config: FileImportResolverConfig): void {
        super.configure(config);
        if (config.dir !== undefined) this._dir = config.dir;
        if (config.extensions) this._extensions = config.extensions;
    }

    protected _resolveNative(info: ImportInfo): Promise<string | null> {
        const dir = this._dir;
        if (!dir) throw new Error('The File import resolver has no "dir" configured');
        const base = dir.includes('{') ? fillTemplate(dir, info) : `${dir.replace(/[\\/]+$/, '')}/${info.name}`;
        return this.firstFound(base, this._extensions, async (file) => {
            try {
                return await fs.promises.readFile(file, 'utf8');
            } catch (e) {
                if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes((e as any)?.code)) return null;
                throw e;
            }
        });
    }
}
