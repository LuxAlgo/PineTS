import ScopeManager from '../analysis/ScopeManager';
export declare function transformEqualityChecks(ast: any): void;
export declare function runTransformationPass(ast: any, scopeManager: ScopeManager, originalParamName: string, options?: {
    debug: boolean;
    ln?: boolean;
}, sourceLines?: string[]): void;
