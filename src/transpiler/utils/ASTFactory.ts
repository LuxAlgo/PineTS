// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

export const CONTEXT_NAME = '$';

export const ASTFactory = {
    createIdentifier(name: string): any {
        return {
            type: 'Identifier',
            name,
        };
    },

    createLiteral(value: any): any {
        return {
            type: 'Literal',
            value,
        };
    },

    createMemberExpression(object: any, property: any, computed: boolean = false): any {
        return {
            type: 'MemberExpression',
            object,
            property,
            computed,
        };
    },

    createContextIdentifier(): any {
        return this.createIdentifier(CONTEXT_NAME);
    },

    createLocalContextIdentifier(): any {
        return this.createIdentifier('$$');
    },

    // Create $.kind.name
    createContextVariableReference(kind: string, name: string): any {
        const context = this.createContextIdentifier();
        const kindId = this.createIdentifier(kind);
        const nameId = this.createIdentifier(name);

        return this.createMemberExpression(this.createMemberExpression(context, kindId, false), nameId, false);
    },

    // Create $$.kind.name
    createLocalContextVariableReference(kind: string, name: string): any {
        const context = this.createLocalContextIdentifier();
        const kindId = this.createIdentifier(kind);
        const nameId = this.createIdentifier(name);

        return this.createMemberExpression(this.createMemberExpression(context, kindId, false), nameId, false);
    },

    // Create $.kind[dynamicKey]
    createDynamicContextVariableReference(kind: string, dynamicKey: any): any {
        const context = this.createContextIdentifier();
        const kindId = this.createIdentifier(kind);
        
        return this.createMemberExpression(this.createMemberExpression(context, kindId, false), dynamicKey, true);
    },

    // Create $.get($.kind.name, 0)
    createContextVariableAccess0(kind: string, name: string): any {
        const varRef = this.createContextVariableReference(kind, name);
        return this.createGetCall(varRef, 0);
    },

    // Create $.get($.kind[dynamicKey], 0)
    createDynamicContextVariableAccess0(kind: string, dynamicKey: any): any {
        const varRef = this.createDynamicContextVariableReference(kind, dynamicKey);
        return this.createGetCall(varRef, 0);
    },

    createArrayAccess(object: any, index: any): any {
        const indexNode = typeof index === 'number' ? this.createLiteral(index) : index;
        return this.createMemberExpression(object, indexNode, true);
    },

    createCallExpression(callee: any, args: any[]): any {
        return {
            type: 'CallExpression',
            callee,
            arguments: args,
        };
    },

    createAssignmentExpression(left: any, right: any, operator: string = '='): any {
        return {
            type: 'AssignmentExpression',
            operator,
            left,
            right,
        };
    },

    createExpressionStatement(expression: any): any {
        return {
            type: 'ExpressionStatement',
            expression,
        };
    },

    createInitCall(targetVarRef: any, value: any, lookbehind?: any): any {
        // $.init(target, value, lookbehind?)
        const initMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('init'), false);

        const args = [targetVarRef, value];
        if (lookbehind) {
            args.push(lookbehind);
        }

        return this.createCallExpression(initMethod, args);
    },

    createInitVarCall(targetVarRef: any, value: any): any {
        // $.initVar(target, value)
        const initMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('initVar'), false);
        const args = [targetVarRef, value];
        return this.createCallExpression(initMethod, args);
    },

    // Create $.get(source, index)
    createGetCall(source: any, index: any): any {
        const getMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('get'), false);
        const indexNode = typeof index === 'number' ? this.createLiteral(index) : index;
        return this.createCallExpression(getMethod, [source, indexNode]);
    },

    // Create $.set(target, value)
    createSetCall(target: any, value: any): any {
        const setMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('set'), false);
        return this.createCallExpression(setMethod, [target, value]);
    },

    // Create $.pine.math.__eq(left, right)
    createMathEqCall(left: any, right: any): any {
        const pineObj = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('pine'), false);
        const mathObj = this.createMemberExpression(pineObj, this.createIdentifier('math'), false);
        const eqMethod = this.createMemberExpression(mathObj, this.createIdentifier('__eq'), false);
        return this.createCallExpression(eqMethod, [left, right]);
    },

    // Create $.pine.math.__neq(left, right)
    createMathNeqCall(left: any, right: any): any {
        const pineObj = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('pine'), false);
        const mathObj = this.createMemberExpression(pineObj, this.createIdentifier('math'), false);
        const neqMethod = this.createMemberExpression(mathObj, this.createIdentifier('__neq'), false);
        return this.createCallExpression(neqMethod, [left, right]);
    },

    // Create $.pine.math.<method>(left, right) — na-aware comparison helpers
    // (__eq/__neq/__lt/__le/__gt/__ge). Routes relational/equality operators
    // through the runtime so `na` propagates and the 1e-10 tolerance applies.
    createMathCompareCall(method: string, left: any, right: any): any {
        const pineObj = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier('pine'), false);
        const mathObj = this.createMemberExpression(pineObj, this.createIdentifier('math'), false);
        const fn = this.createMemberExpression(mathObj, this.createIdentifier(method), false);
        return this.createCallExpression(fn, [left, right]);
    },

    createWrapperFunction(body: any): any {
        return {
            type: 'FunctionDeclaration',
            id: null,
            params: [this.createIdentifier('context')],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: body,
                    },
                ],
            },
        };
    },

    createVariableDeclaration(name: string, init: any): any {
        return {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: this.createIdentifier(name),
                    init,
                },
            ],
        };
    },

    createAwaitExpression(argument: any): any {
        return {
            type: 'AwaitExpression',
            argument,
        };
    },
};
