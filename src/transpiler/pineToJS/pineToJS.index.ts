// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// PineScript to JavaScript Converter
// Converts PineScript files to JavaScript using the parser and code generator

import { Lexer } from './lexer';
import { Parser } from './parser';
import { CodeGenerator } from './codegen';
import { analyzeInputs } from './inputs/analyzeInputs';
import { linkLibraries } from './linker';
import { extractPineScriptVersion } from './version';

export { extractPineScriptVersion };

/**
 * `options.libraries` maps import paths (`user/library/version`) to library
 * sources; the libraries the script imports are linked into its code. Imports
 * without a source are listed in `unresolvedImports` and left out of the code.
 */
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

        // Step 2a: Link imported libraries
        const { libraries, ...codegenRest } = options;
        const link = linkLibraries(ast, libraries);

        // Step 2b: Declare inputs (ids, labels, compile-time folded arguments)
        const inputs = analyzeInputs(ast, { version });

        // Step 3: Generate JavaScript (pass source code for comments)
        const codegenOptions = { ...codegenRest, sourceCode };
        const codegen = new CodeGenerator(codegenOptions);
        const jsCode = codegen.generate(ast);

        return {
            success: true,
            version: version,
            code: jsCode,
            ast: ast,
            tokens: tokens,
            inputs,
            imports: link.imports,
            unresolvedImports: link.unresolved,
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
