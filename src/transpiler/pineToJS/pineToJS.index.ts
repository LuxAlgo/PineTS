// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// PineScript to JavaScript Converter
// Converts PineScript files to JavaScript using the parser and code generator

import { Lexer } from './lexer';
import { Parser } from './parser';
import { CodeGenerator } from './codegen';

/**
 * Extract Pine Script version from source code
 * Looks for //@version=X comment on its own line (can be anywhere in the file)
 * The line must start with // and contain only @version=X (with optional whitespace)
 * Returns the version number or null if not found
 */
export function extractPineScriptVersion(sourceCode: string): number | null {
    // Match //@version=X where:
    // - Line starts with optional whitespace, then //
    // - Followed by optional whitespace, then @version
    // - Then = with optional whitespace around it
    // - Then the version number
    // - Then optional whitespace until end of line
    // - Nothing else allowed on the line
    const versionRegex = /^\s*\/\/\s*@version\s*=\s*(\d+)\s*$/im;
    const match = sourceCode.match(versionRegex);

    if (match && match[1]) {
        return parseInt(match[1], 10);
    }

    return null;
}

export function pineToJS(sourceCode: string, options: any = {}) {
    // Step 0: Detect Pine Script version
    const version = extractPineScriptVersion(sourceCode);
    if (version === null) {
        return {
            success: false,
            version: null,
            error: 'Pine Script version not found. Please add //@version=X comment to your script.',
        };
    }
    // Check if version is supported (must be 5 or above)
    if (version < 5) {
        return {
            success: false,
            version: version,
            error: `Pine Script version ${version} is not supported. Only version 5 and above are supported.`,
        };
    }

    try {
        // Step 1: Tokenize
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();

        // Step 2: Parse to AST
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // Step 3: Generate JavaScript (pass source code for comments)
        const codegenOptions = { ...options, sourceCode };
        const codegen = new CodeGenerator(codegenOptions);
        const jsCode = codegen.generate(ast);

        return {
            success: true,
            version: version,
            code: jsCode,
            ast: ast,
            tokens: tokens,
        };
    } catch (error) {
        return {
            success: false,
            version,
            error: error.message,
            stack: error.stack,
        };
    }
}
