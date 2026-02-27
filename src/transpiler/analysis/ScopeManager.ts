// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * JavaScript global literals and objects that should never be treated as user variables
 */
const JS_GLOBAL_LITERALS = new Set(['Infinity', 'NaN', 'undefined', 'null', 'true', 'false']);

/**
 * JavaScript global objects that should not be transformed
 */
const JS_GLOBAL_OBJECTS = new Set([
    'Math',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Date',
    'RegExp',
    'Error',
    'JSON',
    'Promise',
    'Set',
    'Map',
    'WeakSet',
    'WeakMap',
    'Symbol',
    'BigInt',
    'Proxy',
    'Reflect',
    'console',
    'isNaN',
    'isFinite',
    'parseInt',
    'parseFloat',
    'encodeURI',
    'decodeURI',
    'encodeURIComponent',
    'decodeURIComponent',
]);

export class ScopeManager {
    private scopes: Map<string, string>[] = [];
    private scopeTypes: string[] = [];
    private scopeCounts: Map<string, number> = new Map();
    private contextBoundVars: Set<string> = new Set();
    private arrayPatternElements: Set<string> = new Set();
    private rootParams: Set<string> = new Set();
    private localSeriesVars: Set<string> = new Set();
    private varKinds: Map<string, string> = new Map();
    private loopVars: Set<string> = new Set();
    private loopVarNames: Map<string, string> = new Map(); // Map original names to transformed names
    private paramIdCounter: number = 0;
    private cacheIdCounter: number = 0;
    private tempVarCounter: number = 0;
    private taCallIdCounter: number = 0;
    private userCallIdCounter: number = 0;
    private plotCallIdCounter: number = 0;
    private hoistingStack: any[][] = [];
    private suppressHoisting: boolean = false;
    private reservedNames: Set<string> = new Set();
    private userFunctions: Set<string> = new Set();

    public get nextParamIdArg(): any {
        return {
            type: 'Identifier',
            name: `'p${this.paramIdCounter++}'`,
        };
    }

    public get nextCacheIdArg(): any {
        return {
            type: 'Identifier',
            name: `'cache_${this.cacheIdCounter++}'`,
        };
    }

    public getNextTACallId(): any {
        return {
            type: 'Literal',
            value: `_ta${this.taCallIdCounter++}`,
        };
    }

    public getNextUserCallId(): any {
        return {
            type: 'Literal',
            value: `_fn${this.userCallIdCounter++}`,
        };
    }

    public getNextPlotCallId(): any {
        return {
            type: 'Literal',
            value: `#${this.plotCallIdCounter++}`,
        };
    }
    constructor() {
        // Initialize global scope
        this.pushScope('glb');
    }

    pushScope(type: string): void {
        // Add a new scope of the given type
        this.scopes.push(new Map());
        this.scopeTypes.push(type);
        this.scopeCounts.set(type, (this.scopeCounts.get(type) || 0) + 1);
    }

    popScope(): void {
        // Remove the current scope
        this.scopes.pop();
        this.scopeTypes.pop();
    }

    getCurrentScopeType(): string {
        return this.scopeTypes[this.scopeTypes.length - 1];
    }

    getCurrentScopeCount(): number {
        return this.scopeCounts.get(this.getCurrentScopeType()) || 1;
    }

    addLocalSeriesVar(name: string): void {
        this.localSeriesVars.add(name);
    }

    removeLocalSeriesVar(name: string): void {
        this.localSeriesVars.delete(name);
    }

    isLocalSeriesVar(name: string): boolean {
        return this.localSeriesVars.has(name);
    }

    addContextBoundVar(name: string, isRootParam: boolean = false): void {
        // Register a variable as context-bound, with optional root parameter flag
        this.contextBoundVars.add(name);
        if (isRootParam) {
            this.rootParams.add(name);
        }
    }
    removeContextBoundVar(name): void {
        // Remove a variable from the context-bound variables set
        if (this.contextBoundVars.has(name)) {
            this.contextBoundVars.delete(name);

            // If it's also a root parameter, remove it from there too
            if (this.rootParams.has(name)) {
                this.rootParams.delete(name);
            }
        }
    }
    addArrayPatternElement(name: string): void {
        this.arrayPatternElements.add(name);
    }

    isContextBound(name: string): boolean {
        // JavaScript global literals and objects should never be treated as context-bound
        if (JS_GLOBAL_LITERALS.has(name) || JS_GLOBAL_OBJECTS.has(name)) {
            return false;
        }
        // Check if a variable is context-bound
        return this.contextBoundVars.has(name);
    }
    isArrayPatternElement(name: string): boolean {
        return this.arrayPatternElements.has(name);
    }

    isRootParam(name: string): boolean {
        // Check if a variable is a root function parameter
        return this.rootParams.has(name);
    }

    addLoopVariable(originalName: string, transformedName: string): void {
        this.loopVars.add(originalName);
        this.loopVarNames.set(originalName, transformedName);
    }

    getLoopVariableName(name: string): string | undefined {
        return this.loopVarNames.get(name);
    }

    isLoopVariable(name: string): boolean {
        return this.loopVars.has(name);
    }

    addReservedName(name: string): void {
        this.reservedNames.add(name);
    }

    addUserFunction(name: string): void {
        this.userFunctions.add(name);
    }

    isUserFunction(name: string): boolean {
        return this.userFunctions.has(name);
    }

    addVariable(name: string, kind: string): string {
        // Regular variable handling
        if (this.isContextBound(name)) {
            return name;
        }
        const currentScope = this.scopes[this.scopes.length - 1];
        const scopeType = this.scopeTypes[this.scopeTypes.length - 1];
        const scopeCount = this.scopeCounts.get(scopeType) || 1;

        const newName = `${scopeType}${scopeCount}_${name}`;
        currentScope.set(name, newName);
        this.varKinds.set(newName, kind);
        return newName;
    }

    getVariable(name: string): [string, string] {
        // If it's a loop variable, return it as is
        if (this.loopVars.has(name)) {
            const transformedName = this.loopVarNames.get(name);
            if (transformedName) {
                return [transformedName, 'let'];
            }
        }

        // Regular variable handling
        if (this.isContextBound(name)) {
            return [name, 'let'];
        }
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (scope.has(name)) {
                const scopedName = scope.get(name)!;
                const kind = this.varKinds.get(scopedName) || 'let';
                return [scopedName, kind];
            }
        }
        return [name, 'let'];
    }

    public generateTempVar(): string {
        return `temp_${++this.tempVarCounter}`;
    }

    // Hoisting Logic
    enterHoistingScope(): void {
        this.hoistingStack.push([]);
    }

    exitHoistingScope(): any[] {
        return this.hoistingStack.pop() || [];
    }

    addHoistedStatement(stmt: any): void {
        if (this.hoistingStack.length > 0 && !this.suppressHoisting) {
            this.hoistingStack[this.hoistingStack.length - 1].push(stmt);
        }
    }

    getCurrentHoistingScope(): any[] | null {
        if (this.hoistingStack.length === 0) return null;
        return this.hoistingStack[this.hoistingStack.length - 1];
    }

    setSuppressHoisting(suppress: boolean): void {
        this.suppressHoisting = suppress;
    }

    shouldSuppressHoisting(): boolean {
        return this.suppressHoisting;
    }

    // Helper method to check if a variable exists in any scope
    hasVariableInScope(name: string): boolean {
        // Check reserved names (all user variables encountered in analysis pass)
        if (this.reservedNames.has(name)) {
            return true;
        }
        // Check regular scopes
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) {
                return true;
            }
        }
        // Check context bound vars
        if (this.contextBoundVars.has(name)) {
            return true;
        }
        // Check loop vars
        if (this.loopVars.has(name)) {
            return true;
        }
        // Check local series vars
        if (this.localSeriesVars.has(name)) {
            return true;
        }
        return false;
    }

    // Param ID Generator Helper (for hoisting)
    public generateParamId(): string {
        let candidate = `p${this.paramIdCounter++}`;
        // Loop until we find a name that is NOT in the current scope
        while (this.hasVariableInScope(candidate)) {
            candidate = `p${this.paramIdCounter++}`;
        }
        // Reserve this name in the current scope to prevent future collisions
        // We use a dummy scope entry to mark it as taken
        const currentScope = this.scopes[this.scopes.length - 1];
        if (currentScope) {
            currentScope.set(candidate, candidate);
        }
        return candidate;
    }
}

export default ScopeManager;
