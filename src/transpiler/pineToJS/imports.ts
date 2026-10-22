// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// Pine Script `import` statements: `import <user>/<library>/<version> [as <alias>]`.

import { Lexer } from './lexer';
import { Token, TokenType } from './tokens';

export interface ImportSpec {
    /** `user/library/version`, the key a library source is resolved by. */
    path: string;
    user: string;
    name: string;
    version: number;
    /** Namespace the importing script uses; the library name when `as` is omitted. */
    alias: string;
}

/** Split `user/library/version`; throws on any other shape. */
export function parseImportPath(path: string): { user: string; name: string; version: number } {
    const parts = path.split('/');
    const version = Number(parts[2]);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !/^\d+$/.test(parts[2] ?? '') || !Number.isSafeInteger(version)) {
        throw new Error(`Invalid import path "${path}". Expected <user>/<library>/<version>, e.g. "TradingView/ta/7"`);
    }
    return { user: parts[0], name: parts[1], version };
}

const ENDS_IMPORT = new Set<string>([TokenType.NEWLINE, TokenType.COMMENT, TokenType.EOF, TokenType.INDENT, TokenType.DEDENT]);

/**
 * Read the import statement whose `import` keyword is `tokens[start]`.
 * Returns the spec and the index of the first token after the statement.
 *
 * The path is rebuilt from the token texts: it holds no whitespace, and user
 * names may contain characters that lex as operators (`-`, `.`).
 */
export function readImportStatement(tokens: Token[], start: number): { spec: ImportSpec; next: number } {
    const keyword = tokens[start];
    const at = `${keyword.line}:${keyword.column - 'import'.length}`;
    let i = start + 1;
    let path = '';
    while (i < tokens.length && !ENDS_IMPORT.has(tokens[i].type) && !(tokens[i].type === TokenType.KEYWORD && tokens[i].value === 'as')) {
        const t = tokens[i++];
        path += t.raw ?? String(t.value);
    }
    if (!path) throw new Error(`Missing library path after "import" at ${at}`);

    let parsed: { user: string; name: string; version: number };
    try {
        parsed = parseImportPath(path);
    } catch (e) {
        throw new Error(`${(e as Error).message} at ${at}`);
    }

    let alias = parsed.name;
    if (tokens[i]?.type === TokenType.KEYWORD && tokens[i].value === 'as') {
        const name = tokens[i + 1];
        if (name?.type !== TokenType.IDENTIFIER) throw new Error(`Expected an alias after "as" at ${at}`);
        alias = name.value;
        i += 2;
    }
    if (i < tokens.length && !ENDS_IMPORT.has(tokens[i].type)) {
        throw new Error(`Unexpected token '${tokens[i].value}' in import statement at ${at}`);
    }
    return { spec: { path, ...parsed, alias }, next: i };
}

/**
 * The imports of a Pine Script source, read from its tokens alone so that
 * resolving a library's own imports does not need a full parse.
 */
export function scanImports(source: string): ImportSpec[] {
    const tokens = new Lexer(source).tokenize();
    const specs: ImportSpec[] = [];
    let depth = 0;
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type === TokenType.INDENT) depth++;
        else if (t.type === TokenType.DEDENT) depth--;
        if (depth !== 0 || t.type !== TokenType.KEYWORD || t.value !== 'import') continue;
        const prev = tokens[i - 1];
        if (prev && prev.type !== TokenType.NEWLINE && prev.type !== TokenType.DEDENT && prev.type !== TokenType.COMMENT) continue;
        // `import = 1`, `import(x) => x`: the keyword used as a (rejected) name.
        const next = tokens[i + 1]?.type;
        if (next !== TokenType.IDENTIFIER && next !== TokenType.NUMBER) continue;
        specs.push(readImportStatement(tokens, i).spec);
    }
    return specs;
}
