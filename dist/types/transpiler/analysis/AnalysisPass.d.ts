import ScopeManager from './ScopeManager';
export declare function transformNestedArrowFunctions(ast: any): void;
export declare function preProcessContextBoundVars(ast: any, scopeManager: ScopeManager): void;
export declare function transformArrowFunctionParams(node: any, scopeManager: ScopeManager, isRootFunction?: boolean): void;
export declare function runAnalysisPass(ast: any, scopeManager: ScopeManager): string | undefined;
