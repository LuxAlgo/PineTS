import ScopeManager from '../analysis/ScopeManager';
export declare function transformAssignmentExpression(node: any, scopeManager: ScopeManager): void;
export declare function transformVariableDeclaration(varNode: any, scopeManager: ScopeManager): void;
export declare function transformForStatement(node: any, scopeManager: ScopeManager, c: any): void;
export declare function transformWhileStatement(node: any, scopeManager: ScopeManager, c: any): void;
export declare function transformExpression(node: any, scopeManager: ScopeManager): void;
export declare function transformIfStatement(node: any, scopeManager: ScopeManager, c: any): void;
export declare function transformReturnStatement(node: any, scopeManager: ScopeManager): void;
export declare function transformFunctionDeclaration(node: any, scopeManager: ScopeManager, c: any): void;
