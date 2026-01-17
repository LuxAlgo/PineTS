/**
 * Normalizes imports from context.data and context.pine to prevent renaming of native symbols.
 * This ensures that symbols like 'close' or 'na' are always named 'close' and 'na' in the local scope,
 * satisfying the transpiler's expectation for exact naming of context-bound variables.
 *
 * Transforms:
 * const { close: close2 } = context.data;
 * to
 * const { close } = context.data;
 *
 * And renames all usages of 'close2' to 'close' within the scope.
 *
 * @param ast The AST to transform
 */
export declare function normalizeNativeImports(ast: any): void;
