// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Result of a request.* function PineTS has no data source for: na, plus one
 * warning per function per run in `context.warnings` (method
 * `request.<name>`), so the rest of the script still runs.
 */
export function unsupportedRequest(context: any, name: string): number {
    const key = `__unsupportedRequest_${name}`;
    if (!context.cache[key]) {
        context.cache[key] = true;
        context.warn(`request.${name}() is not supported by PineTS: it returns na`, `request.${name}`);
    }
    return NaN;
}
