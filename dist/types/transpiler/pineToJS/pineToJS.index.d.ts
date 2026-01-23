/**
 * Extract Pine Script version from source code
 * Looks for //@version=X comment on its own line (can be anywhere in the file)
 * The line must start with // and contain only @version=X (with optional whitespace)
 * Returns the version number or null if not found
 */
export declare function extractPineScriptVersion(sourceCode: string): number | null;
export declare function pineToJS(sourceCode: string, options?: any): {
    success: boolean;
    version: number;
    error: string;
    code?: undefined;
    ast?: undefined;
    tokens?: undefined;
    stack?: undefined;
} | {
    success: boolean;
    version: number;
    code: string;
    ast: import("./ast").Program;
    tokens: import("./tokens").Token[];
    error?: undefined;
    stack?: undefined;
} | {
    success: boolean;
    version: number;
    error: any;
    stack: any;
    code?: undefined;
    ast?: undefined;
    tokens?: undefined;
};
