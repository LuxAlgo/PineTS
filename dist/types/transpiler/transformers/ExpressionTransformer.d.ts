import ScopeManager from '../analysis/ScopeManager';
export declare function transformArrayIndex(node: any, scopeManager: ScopeManager): void;
export declare function addArrayAccess(node: any, scopeManager: ScopeManager): void;
export declare function transformIdentifier(node: any, scopeManager: ScopeManager): void;
export declare function transformMemberExpression(memberNode: any, originalParamName: string, scopeManager: ScopeManager): void;
export declare function transformFunctionArgument(arg: any, namespace: string, scopeManager: ScopeManager): any;
export declare function transformCallExpression(node: any, scopeManager: ScopeManager, namespace?: string): void;
