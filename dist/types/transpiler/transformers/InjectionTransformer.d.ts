/**
 * Injects implicit imports for missing context variables (data and pine namespaces)
 * This ensures that users don't have to manually destructure context.data or context.pine
 * @param ast The AST to transform
 */
export declare function injectImplicitImports(ast: any): void;
