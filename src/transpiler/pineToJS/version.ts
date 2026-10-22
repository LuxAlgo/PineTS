// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Extract Pine Script version from source code
 * Looks for //@version=X comment on its own line (can be anywhere in the file)
 * The line must start with // and contain only @version=X (with optional whitespace)
 * Returns the version number or null if not found
 */
export function extractPineScriptVersion(sourceCode: string): number | null {
    // Match //@version=X where:
    // - Line starts with optional whitespace, then //
    // - Followed by optional whitespace, then @version
    // - Then = with optional whitespace around it
    // - Then the version number
    // - Then optional whitespace until end of line
    // - Nothing else allowed on the line
    const versionRegex = /^\s*\/\/\s*@version\s*=\s*(\d+)\s*$/im;
    const match = sourceCode.match(versionRegex);

    if (match && match[1]) {
        return parseInt(match[1], 10);
    }

    return null;
}
