/**
 * Wraps unwrapped code in a context arrow function.
 * If the code is already wrapped in a function:
 *   - If async, returns it as-is
 *   - If not async, converts it to async
 * Otherwise, wraps it in: async (context) => { ... }
 *
 * @param code The input code string
 * @returns The wrapped code string (always async)
 */
export declare function wrapInContextFunction(code: string): string;
