// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../errors/PineRuntimeError';

export const MAX_REGEX_PATTERN_LENGTH = 256;
export const MAX_REGEX_SUBJECT_LENGTH = 4096;

type CharacterSet = Set<number> | 'any';

function rejected(): never {
    throw new PineRuntimeError('str.match pattern is outside the bounded regular-expression dialect.', 'str.match');
}

function characterSet(character: string): CharacterSet {
    return new Set([character.charCodeAt(0)]);
}

function escapeSet(character: string): CharacterSet {
    if (character === 'd' || character === 'w' || character === 's') {
        const set = new Set<number>();
        const chars = character === 'd'
            ? '0123456789'
            : character === 'w'
                ? '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                : ' \t\r\n\v\f';
        for (const char of chars) set.add(char.charCodeAt(0));
        return set;
    }
    if (character === 'n') return characterSet('\n');
    if (character === 'r') return characterSet('\r');
    if (character === 't') return characterSet('\t');
    if ('\\.*+?{}[]()|^$/-'.includes(character)) return characterSet(character);
    return rejected();
}

function overlaps(left: CharacterSet, right: CharacterSet): boolean {
    if (left === 'any' || right === 'any') return true;
    for (const char of left) if (right.has(char)) return true;
    return false;
}

/**
 * Deliberately small dialect for use with the synchronous JavaScript RegExp
 * engine. No groups, alternatives, lookarounds, backreferences, brace ranges,
 * optional quantifiers, or adjacent overlapping quantified atoms. Character
 * classes are allowed, but conservatively treated as overlapping any other
 * quantified atom in their run.
 */
export function assertBoundedRegex(pattern: string, subject: string): void {
    if (pattern.length > MAX_REGEX_PATTERN_LENGTH || subject.length > MAX_REGEX_SUBJECT_LENGTH) rejected();

    let index = 0;
    const quantifiedRun: CharacterSet[] = [];
    while (index < pattern.length) {
        const char = pattern[index];
        if ((char === '^' && index === 0) || (char === '$' && index === pattern.length - 1)) {
            index++;
            continue;
        }

        let atom: CharacterSet;
        if (char === '\\') {
            index++;
            if (index >= pattern.length) rejected();
            atom = escapeSet(pattern[index++]);
        } else if (char === '[') {
            // Preserve native class semantics, but classify it as broad for
            // conservative overlap checks. Reject malformed/unclosed classes.
            const start = ++index;
            while (index < pattern.length && pattern[index] !== ']') {
                if (pattern[index] === '\\') index++;
                index++;
            }
            if (index >= pattern.length || index === start) rejected();
            index++;
            atom = 'any';
        } else if (char === '.') {
            atom = 'any';
            index++;
        } else if ('()|?*+{}^$]'.includes(char)) {
            rejected();
        } else {
            atom = characterSet(char);
            index++;
        }

        if (pattern[index] === '?') rejected();
        if (pattern[index] === '*' || pattern[index] === '+') {
            const quantifier = pattern[index];
            index++;
            for (const previous of quantifiedRun) if (overlaps(previous, atom)) rejected();
            if (quantifier === '+') quantifiedRun.length = 0;
            quantifiedRun.push(atom);
        } else {
            // A mandatory literal only separates backtracking choices when
            // none of the preceding quantified atoms can consume it.
            if (quantifiedRun.every((previous) => !overlaps(previous, atom))) quantifiedRun.length = 0;
        }
    }
}
