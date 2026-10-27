// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../errors/PineRuntimeError';

/*
 * str.match follows TradingView, whose patterns use Java's regex flavor. JavaScript's RegExp is
 * neither that flavor nor interruptible, so patterns run on this backtracking matcher instead:
 * it reproduces Java's match order, and every step is charged so a pathological pattern stops
 * with a runtime error instead of hanging the run.
 */

export const MAX_REGEX_PATTERN_LENGTH = 256;
export const MAX_REGEX_SUBJECT_LENGTH = 4096;
/** Step ceiling for one match when the caller has no shared execution budget. */
const STANDALONE_STEP_LIMIT = 5_000_000;
const MAX_PROGRAM_SIZE = 50_000;
const STEP_CHUNK = 4096;

type Pred = (c: number) => boolean;
type AssertKind = 'start' | 'end' | 'mStart' | 'mEnd' | 'inputStart' | 'inputEnd' | 'wordB' | 'notWordB';
type Node =
    | { t: 'empty' }
    | { t: 'char'; pred: Pred }
    | { t: 'seq'; items: Node[] }
    | { t: 'alt'; branches: Node[] }
    | { t: 'group'; index: number; body: Node }
    | { t: 'repeat'; body: Node; min: number; max: number; mode: 'greedy' | 'lazy' | 'possessive' }
    | { t: 'assert'; kind: AssertKind }
    | { t: 'look'; behind: boolean; negate: boolean; body: Node }
    | { t: 'atomic'; body: Node }
    | { t: 'backref'; index: number; ci: boolean };

interface Flags {
    i: boolean;
    m: boolean;
    s: boolean;
    x: boolean;
    u: boolean;
    d: boolean;
}

function invalid(reason: string): never {
    throw new PineRuntimeError(`Invalid regular expression: ${reason}.`, 'str.match', 'INVALID_ARGUMENT');
}

const isLineTerminator = (c: number, unixLines: boolean) =>
    unixLines ? c === 10 : c === 10 || c === 13 || c === 0x85 || c === 0x2028 || c === 0x2029;
const isAsciiWord = (c: number) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95;
const WORD_BOUNDARY_CHAR = /[\p{L}\p{Nd}_]/u;
const isBoundaryWord = (c: number) => c >= 0 && (isAsciiWord(c) || (c > 127 && WORD_BOUNDARY_CHAR.test(String.fromCharCode(c))));

/** A one-character predicate that remembers its character, so it can start a class range. */
const exact = (code: number): Pred => Object.assign((c: number) => c === code, { code });
const codeOf = (p: Pred): number | null => (p as Pred & { code?: number }).code ?? null;
const range = (lo: number, hi: number): Pred => (c) => c >= lo && c <= hi;
const anyOf = (chars: string): Pred => {
    const set = new Set(Array.from(chars, (ch) => ch.charCodeAt(0)));
    return (c) => set.has(c);
};
const not = (p: Pred): Pred => (c) => !p(c);
const union = (ps: Pred[]): Pred => (c) => ps.some((p) => p(c));
const intersect = (ps: Pred[]): Pred => (c) => ps.every((p) => p(c));

const DIGIT = range(48, 57);
const WORD: Pred = isAsciiWord;
const SPACE = anyOf(' \t\n\x0B\f\r');
const HSPACE = (c: number) => c === 32 || c === 9 || c === 0xa0 || c === 0x1680 || c === 0x180e || (c >= 0x2000 && c <= 0x200a) || c === 0x202f || c === 0x205f || c === 0x3000;
const VSPACE = anyOf('\n\x0B\f\r\x85\u2028\u2029');

// java.util.regex POSIX classes are US-ASCII only.
const POSIX: Record<string, Pred> = {
    Lower: range(97, 122),
    Upper: range(65, 90),
    ASCII: range(0, 127),
    Alpha: (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122),
    Digit: DIGIT,
    Alnum: (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122),
    Punct: anyOf('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'),
    Graph: range(33, 126),
    Print: range(32, 126),
    Blank: anyOf(' \t'),
    Cntrl: (c) => c < 32 || c === 127,
    XDigit: (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102),
    Space: SPACE,
};

function unicodeProperty(name: string): Pred {
    if (POSIX[name]) return POSIX[name];
    const java: Record<string, string> = {
        javaLowerCase: 'Lowercase', javaUpperCase: 'Uppercase', javaAlphabetic: 'Alphabetic', javaLetter: 'L',
        javaDigit: 'Nd', javaLetterOrDigit: '', javaWhitespace: 'White_Space',
    };
    let jsName = name in java ? java[name] : name.replace(/^Is/, '');
    if (name === 'javaLetterOrDigit') {
        const letterOrDigit = /[\p{L}\p{Nd}]/u;
        return (c) => letterOrDigit.test(String.fromCharCode(c));
    }
    if (/^(general_category|gc)=/i.test(jsName)) jsName = jsName.replace(/^[^=]+=/, '');
    else if (/^(script|sc)=/i.test(jsName)) jsName = 'Script=' + jsName.replace(/^[^=]+=/, '');
    let re: RegExp;
    try {
        re = new RegExp(`^\\p{${jsName}}$`, 'u');
    } catch {
        try {
            re = new RegExp(`^\\p{Script=${jsName}}$`, 'u');
        } catch {
            invalid(`unknown character property {${name}}`);
        }
    }
    return (c) => re.test(String.fromCharCode(c));
}

function foldCase(pred: Pred, unicode: boolean): Pred {
    if (unicode) {
        return (c) => {
            if (pred(c)) return true;
            const ch = String.fromCharCode(c);
            const lo = ch.toLowerCase(), up = ch.toUpperCase();
            return (lo.length === 1 && pred(lo.charCodeAt(0))) || (up.length === 1 && pred(up.charCodeAt(0)));
        };
    }
    return (c) => pred(c) || (c >= 65 && c <= 90 && pred(c + 32)) || (c >= 97 && c <= 122 && pred(c - 32));
}

class Parser {
    private pos = 0;
    groupCount = 0;
    private readonly names = new Map<string, number>();
    private readonly pendingNamedRefs: Array<{ node: { index: number }; name: string }> = [];

    constructor(private readonly src: string) {}

    parse(): Node {
        const node = this.parseAlt({ i: false, m: false, s: false, x: false, u: false, d: false });
        if (this.pos < this.src.length) invalid(`unmatched closing ')' near index ${this.pos}`);
        for (const ref of this.pendingNamedRefs) {
            const index = this.names.get(ref.name);
            if (index === undefined) invalid(`named capturing group <${ref.name}> does not exist`);
            ref.node.index = index;
        }
        return node;
    }

    private peek(offset = 0): string {
        return this.src[this.pos + offset];
    }

    private skipExtended(flags: Flags): void {
        if (!flags.x) return;
        while (this.pos < this.src.length) {
            const ch = this.src[this.pos];
            if (/\s/.test(ch)) this.pos++;
            else if (ch === '#') {
                while (this.pos < this.src.length && this.src[this.pos] !== '\n') this.pos++;
            } else break;
        }
    }

    // Inline flags such as (?i) apply to the remainder of the enclosing group; branches share them.
    private parseAlt(flags: Flags): Node {
        const branches: Node[] = [];
        const shared = { ...flags };
        branches.push(this.parseSeq(shared));
        while (this.peek() === '|') {
            this.pos++;
            branches.push(this.parseSeq(shared));
        }
        return branches.length === 1 ? branches[0] : { t: 'alt', branches };
    }

    private parseSeq(flags: Flags): Node {
        const items: Node[] = [];
        for (;;) {
            this.skipExtended(flags);
            const ch = this.peek();
            if (ch === undefined || ch === '|' || ch === ')') break;
            const atom = this.parseAtom(flags);
            if (atom === null) continue;
            this.skipExtended(flags);
            items.push(this.parseQuantifier(atom));
        }
        return items.length === 1 ? items[0] : items.length === 0 ? { t: 'empty' } : { t: 'seq', items };
    }

    private parseQuantifier(atom: Node): Node {
        let min: number, max: number;
        const ch = this.peek();
        if (ch === '*') [min, max] = [0, Infinity];
        else if (ch === '+') [min, max] = [1, Infinity];
        else if (ch === '?') [min, max] = [0, 1];
        else if (ch === '{') {
            const m = /^\{(\d+)(,(\d*))?\}/.exec(this.src.slice(this.pos));
            if (!m) invalid(`illegal repetition near index ${this.pos}`);
            min = Number(m[1]);
            max = m[2] === undefined ? min : m[3] === '' ? Infinity : Number(m[3]);
            if (max < min) invalid(`illegal repetition range near index ${this.pos}`);
            this.pos += m[0].length - 1;
        } else return atom;
        this.pos++;
        let mode: 'greedy' | 'lazy' | 'possessive' = 'greedy';
        if (this.peek() === '?') {
            mode = 'lazy';
            this.pos++;
        } else if (this.peek() === '+') {
            mode = 'possessive';
            this.pos++;
        }
        if (this.peek() === '*' || this.peek() === '+' || this.peek() === '?' || this.peek() === '{') {
            invalid(`dangling meta character '${this.peek()}' near index ${this.pos}`);
        }
        return { t: 'repeat', body: atom, min, max, mode };
    }

    private literal(c: number, flags: Flags): Node {
        const pred = exact(c);
        return { t: 'char', pred: flags.i ? foldCase(pred, flags.u) : pred };
    }

    private parseAtom(flags: Flags): Node | null {
        const ch = this.src[this.pos];
        switch (ch) {
            case '(':
                return this.parseGroup(flags);
            case '[':
                this.pos++;
                return { t: 'char', pred: this.parseClass(flags) };
            case '.': {
                this.pos++;
                const dotall = flags.s, unix = flags.d;
                return { t: 'char', pred: dotall ? () => true : (c) => !isLineTerminator(c, unix) };
            }
            case '^':
                this.pos++;
                return { t: 'assert', kind: flags.m ? 'mStart' : 'start' };
            case '$':
                this.pos++;
                return { t: 'assert', kind: flags.m ? 'mEnd' : 'end' };
            case '\\':
                return this.parseEscape(flags);
            case '*':
            case '+':
            case '?':
                invalid(`dangling meta character '${ch}' near index ${this.pos}`);
            case '{':
                invalid(`illegal repetition near index ${this.pos}`);
            default:
                this.pos++;
                return this.literal(ch.charCodeAt(0), flags);
        }
    }

    private parseGroup(flags: Flags): Node | null {
        this.pos++; // (
        let node: Node;
        if (this.peek() === '?') {
            this.pos++;
            const kind = this.peek();
            if (kind === ':') {
                this.pos++;
                node = this.parseAlt(flags);
            } else if (kind === '=' || kind === '!') {
                this.pos++;
                node = { t: 'look', behind: false, negate: kind === '!', body: this.parseAlt(flags) };
            } else if (kind === '>') {
                this.pos++;
                node = { t: 'atomic', body: this.parseAlt(flags) };
            } else if (kind === '<' && (this.peek(1) === '=' || this.peek(1) === '!')) {
                const negate = this.peek(1) === '!';
                this.pos += 2;
                const body = this.parseAlt(flags);
                if (!Number.isFinite(maxLength(body))) invalid('look-behind group does not have an obvious maximum length');
                node = { t: 'look', behind: true, negate, body };
            } else if (kind === '<') {
                const m = /^<([a-zA-Z][a-zA-Z0-9]*)>/.exec(this.src.slice(this.pos));
                if (!m) invalid(`invalid capturing group name near index ${this.pos}`);
                if (this.names.has(m[1])) invalid(`named capturing group <${m[1]}> is already defined`);
                this.pos += m[0].length;
                const index = ++this.groupCount;
                this.names.set(m[1], index);
                node = { t: 'group', index, body: this.parseAlt(flags) };
            } else {
                const m = /^([imsxud]*)(?:-([imsxud]*))?([:)])/.exec(this.src.slice(this.pos));
                if (!m) invalid(`unknown inline modifier near index ${this.pos}`);
                this.pos += m[0].length;
                const set = (target: Flags) => {
                    for (const f of m[1]) target[f as keyof Flags] = true;
                    for (const f of m[2] ?? '') target[f as keyof Flags] = false;
                };
                if (m[3] === ')') {
                    set(flags);
                    return null;
                }
                const scoped = { ...flags };
                set(scoped);
                node = this.parseAlt(scoped);
            }
        } else {
            const index = ++this.groupCount;
            node = { t: 'group', index, body: this.parseAlt(flags) };
        }
        if (this.peek() !== ')') invalid(`unclosed group near index ${this.pos}`);
        this.pos++;
        return node;
    }

    private parseEscape(flags: Flags): Node {
        this.pos++; // backslash
        const ch = this.src[this.pos];
        if (ch === undefined) invalid('unexpected internal error near the end of the pattern');
        const assertions: Record<string, AssertKind> = { b: 'wordB', B: 'notWordB', A: 'inputStart', z: 'inputEnd', Z: 'end', G: 'inputStart' };
        if (ch in assertions) {
            this.pos++;
            return { t: 'assert', kind: assertions[ch] };
        }
        if (ch === 'Q') {
            const end = this.src.indexOf('\\E', this.pos + 1);
            const text = this.src.slice(this.pos + 1, end < 0 ? undefined : end);
            this.pos = end < 0 ? this.src.length : end + 2;
            const items = Array.from(text, (c) => this.literal(c.charCodeAt(0), flags));
            return items.length === 1 ? items[0] : { t: 'seq', items };
        }
        if (ch === 'k') {
            const m = /^k<([a-zA-Z][a-zA-Z0-9]*)>/.exec(this.src.slice(this.pos));
            if (!m) invalid(`\\k is not followed by '<' for named capturing group near index ${this.pos}`);
            this.pos += m[0].length;
            const node = { t: 'backref' as const, index: -1, ci: flags.i };
            this.pendingNamedRefs.push({ node, name: m[1] });
            return node;
        }
        if (ch >= '1' && ch <= '9') {
            // Java takes further digits only while they still name an existing group.
            let index = Number(ch);
            this.pos++;
            while (/\d/.test(this.peek() ?? '') && index * 10 + Number(this.peek()) <= this.groupCount) {
                index = index * 10 + Number(this.peek());
                this.pos++;
            }
            if (index > this.groupCount) invalid(`reference to undefined group ${index}`);
            return { t: 'backref', index, ci: flags.i };
        }
        if (ch === 'R') {
            this.pos++;
            const crlf: Node = { t: 'seq', items: [this.literal(13, { ...flags, i: false }), this.literal(10, { ...flags, i: false })] };
            return { t: 'atomic', body: { t: 'alt', branches: [crlf, { t: 'char', pred: VSPACE }] } };
        }
        const pred = this.escapePred(flags);
        return { t: 'char', pred: flags.i ? foldCase(pred, flags.u) : pred };
    }

    /** Escapes valid both inside and outside a character class; `this.pos` is on the char after `\`. */
    private escapePred(flags: Flags): Pred {
        const ch = this.src[this.pos++];
        switch (ch) {
            case 'd': return DIGIT;
            case 'D': return not(DIGIT);
            case 'w': return WORD;
            case 'W': return not(WORD);
            case 's': return SPACE;
            case 'S': return not(SPACE);
            case 'h': return HSPACE;
            case 'H': return not(HSPACE);
            case 'v': return VSPACE;
            case 'V': return not(VSPACE);
            case 't': return exact(9);
            case 'n': return exact(10);
            case 'r': return exact(13);
            case 'f': return exact(12);
            case 'a': return exact(7);
            case 'e': return exact(27);
            case 'p':
            case 'P': {
                let name: string;
                if (this.peek() === '{') {
                    const end = this.src.indexOf('}', this.pos);
                    if (end < 0) invalid(`unclosed character family near index ${this.pos}`);
                    name = this.src.slice(this.pos + 1, end);
                    this.pos = end + 1;
                } else {
                    name = this.src[this.pos++] ?? '';
                }
                const pred = unicodeProperty(name);
                return ch === 'P' ? not(pred) : pred;
            }
            case 'x': {
                let hex: string;
                if (this.peek() === '{') {
                    const end = this.src.indexOf('}', this.pos);
                    hex = this.src.slice(this.pos + 1, end);
                    this.pos = end + 1;
                } else {
                    hex = this.src.slice(this.pos, this.pos + 2);
                    this.pos += 2;
                }
                if (!/^[0-9a-fA-F]+$/.test(hex)) invalid(`illegal hexadecimal escape sequence near index ${this.pos}`);
                return exact(parseInt(hex, 16));
            }
            case 'u': {
                const hex = this.src.slice(this.pos, this.pos + 4);
                if (!/^[0-9a-fA-F]{4}$/.test(hex)) invalid(`illegal Unicode escape sequence near index ${this.pos}`);
                this.pos += 4;
                return exact(parseInt(hex, 16));
            }
            case '0': {
                const m = /^[0-7]{1,3}/.exec(this.src.slice(this.pos));
                if (!m) invalid(`illegal octal escape sequence near index ${this.pos}`);
                let digits = m[0];
                if (digits.length === 3 && Number(digits[0]) > 3) digits = digits.slice(0, 2);
                this.pos += digits.length;
                return exact(parseInt(digits, 8));
            }
            case 'c': {
                if (this.pos >= this.src.length) invalid('illegal control escape sequence');
                return exact(this.src.charCodeAt(this.pos++) ^ 64);
            }
            default:
                if (ch === undefined) invalid('unexpected end of pattern');
                if (/[a-zA-Z]/.test(ch)) invalid(`illegal or unsupported escape sequence \\${ch}`);
                return exact(ch.charCodeAt(0));
        }
    }

    /** `this.pos` is just after `[`. Java classes support unions, nested classes and `&&` intersections. */
    private parseClass(flags: Flags): Pred {
        let negate = false;
        if (this.peek() === '^') {
            negate = true;
            this.pos++;
        }
        const intersections: Pred[] = [];
        let items: Pred[] = [];
        let first = true;
        for (;;) {
            const ch = this.peek();
            if (ch === undefined) invalid('unclosed character class');
            if (ch === ']' && !first) {
                this.pos++;
                break;
            }
            first = false;
            if (ch === '&' && this.peek(1) === '&') {
                this.pos += 2;
                intersections.push(union(items));
                items = [];
                continue;
            }
            if (ch === '[') {
                this.pos++;
                items.push(this.parseClass(flags));
                continue;
            }
            let lo: number | null = null;
            let pred: Pred;
            if (ch === '\\') {
                this.pos++;
                if (this.peek() === 'Q') {
                    const end = this.src.indexOf('\\E', this.pos + 1);
                    const text = this.src.slice(this.pos + 1, end < 0 ? undefined : end);
                    this.pos = end < 0 ? this.src.length : end + 2;
                    items.push(anyOf(text));
                    continue;
                }
                pred = this.escapePred(flags);
                lo = codeOf(pred);
            } else {
                this.pos++;
                lo = ch.charCodeAt(0);
                pred = exact(lo);
            }
            if (lo !== null && this.peek() === '-' && this.peek(1) !== ']' && this.peek(1) !== undefined && this.peek(1) !== '[') {
                this.pos++;
                let hi: number;
                if (this.peek() === '\\') {
                    this.pos++;
                    const code = codeOf(this.escapePred(flags));
                    if (code === null) invalid('illegal character range');
                    hi = code;
                } else {
                    hi = this.src.charCodeAt(this.pos++);
                }
                if (hi < lo) invalid('illegal character range');
                items.push(range(lo, hi));
            } else {
                items.push(pred);
            }
        }
        intersections.push(union(items));
        let pred = intersections.length === 1 ? intersections[0] : intersect(intersections);
        // Java folds case before negating: (?i)[^a] rejects 'A'.
        if (flags.i) pred = foldCase(pred, flags.u);
        return negate ? not(pred) : pred;
    }
}

function minLength(n: Node): number {
    switch (n.t) {
        case 'char': return 1;
        case 'seq': return n.items.reduce((s, x) => s + minLength(x), 0);
        case 'alt': return Math.min(...n.branches.map(minLength));
        case 'group': case 'atomic': return minLength(n.body);
        case 'repeat': return n.min * minLength(n.body);
        default: return 0;
    }
}

function maxLength(n: Node): number {
    switch (n.t) {
        case 'char': return 1;
        case 'seq': return n.items.reduce((s, x) => s + maxLength(x), 0);
        case 'alt': return Math.max(...n.branches.map(maxLength));
        case 'group': case 'atomic': return maxLength(n.body);
        case 'repeat': return n.max === 0 ? 0 : n.max * maxLength(n.body);
        case 'backref': return Infinity;
        default: return 0;
    }
}

// ── compiled backtracking program ───────────────────────────────────────────

const enum Op { Char, Split, Jmp, Save, Assert, Backref, Look, Atomic, Mark, Progress, Match }
type Instr =
    | { op: Op.Char; pred: Pred }
    | { op: Op.Split; a: number; b: number }
    | { op: Op.Jmp; to: number }
    | { op: Op.Save; slot: number }
    | { op: Op.Assert; kind: AssertKind }
    | { op: Op.Backref; index: number; ci: boolean }
    | { op: Op.Look; sub: number; behind: boolean; negate: boolean; min: number; max: number }
    | { op: Op.Atomic; sub: number }
    | { op: Op.Mark; reg: number }
    | { op: Op.Progress; reg: number }
    | { op: Op.Match };

class Compiler {
    readonly programs: Instr[][] = [];
    registers = 0;
    private size = 0;

    compileProgram(node: Node): number {
        const prog: Instr[] = [];
        const id = this.programs.length;
        this.programs.push(prog);
        this.emit(prog, node);
        this.push(prog, { op: Op.Match });
        return id;
    }

    private push(prog: Instr[], instr: Instr): number {
        if (++this.size > MAX_PROGRAM_SIZE) {
            throw new PineRuntimeError('str.match pattern expands beyond the supported size.', 'str.match', 'RESOURCE_LIMIT');
        }
        prog.push(instr);
        return prog.length - 1;
    }

    private emit(prog: Instr[], n: Node): void {
        switch (n.t) {
            case 'empty':
                return;
            case 'char':
                this.push(prog, { op: Op.Char, pred: n.pred });
                return;
            case 'seq':
                for (const item of n.items) this.emit(prog, item);
                return;
            case 'alt': {
                const jumps: number[] = [];
                for (let i = 0; i < n.branches.length; i++) {
                    if (i < n.branches.length - 1) {
                        const split = this.push(prog, { op: Op.Split, a: 0, b: 0 });
                        (prog[split] as any).a = prog.length;
                        this.emit(prog, n.branches[i]);
                        jumps.push(this.push(prog, { op: Op.Jmp, to: 0 }));
                        (prog[split] as any).b = prog.length;
                    } else {
                        this.emit(prog, n.branches[i]);
                    }
                }
                for (const j of jumps) (prog[j] as any).to = prog.length;
                return;
            }
            case 'group':
                this.push(prog, { op: Op.Save, slot: n.index * 2 });
                this.emit(prog, n.body);
                this.push(prog, { op: Op.Save, slot: n.index * 2 + 1 });
                return;
            case 'assert':
                this.push(prog, { op: Op.Assert, kind: n.kind });
                return;
            case 'backref':
                this.push(prog, { op: Op.Backref, index: n.index, ci: n.ci });
                return;
            case 'look': {
                const sub = this.compileProgram(n.body);
                this.push(prog, { op: Op.Look, sub, behind: n.behind, negate: n.negate, min: minLength(n.body), max: maxLength(n.body) });
                return;
            }
            case 'atomic':
                this.push(prog, { op: Op.Atomic, sub: this.compileProgram(n.body) });
                return;
            case 'repeat': {
                if (n.mode === 'possessive') {
                    const sub = this.compileProgram({ ...n, mode: 'greedy' });
                    this.push(prog, { op: Op.Atomic, sub });
                    return;
                }
                const lazy = n.mode === 'lazy';
                for (let i = 0; i < n.min; i++) this.emit(prog, n.body);
                if (n.max === Infinity) {
                    // loop: split(body, exit); body must consume input to iterate again.
                    const reg = this.registers++;
                    const split = this.push(prog, { op: Op.Split, a: 0, b: 0 });
                    const bodyStart = prog.length;
                    this.push(prog, { op: Op.Mark, reg });
                    this.emit(prog, n.body);
                    this.push(prog, { op: Op.Progress, reg });
                    this.push(prog, { op: Op.Jmp, to: split });
                    const exit = prog.length;
                    Object.assign(prog[split], lazy ? { a: exit, b: bodyStart } : { a: bodyStart, b: exit });
                } else {
                    const splits: number[] = [];
                    for (let i = n.min; i < n.max; i++) {
                        splits.push(this.push(prog, { op: Op.Split, a: 0, b: 0 }));
                        this.emit(prog, n.body);
                    }
                    const exit = prog.length;
                    for (const s of splits) Object.assign(prog[s], lazy ? { a: exit, b: s + 1 } : { a: s + 1, b: exit });
                }
                return;
            }
        }
    }
}

export interface CompiledRegex {
    programs: Instr[][];
    main: number;
    groups: number;
    registers: number;
    unixLines: boolean;
}

const compiledCache = new Map<string, CompiledRegex>();

export function compileJavaRegex(pattern: string): CompiledRegex {
    const cached = compiledCache.get(pattern);
    if (cached) return cached;
    const parser = new Parser(pattern);
    const ast = parser.parse();
    const compiler = new Compiler();
    const main = compiler.compileProgram(ast);
    const compiled = { programs: compiler.programs, main, groups: parser.groupCount, registers: compiler.registers, unixLines: false };
    if (compiledCache.size >= 128) compiledCache.delete(compiledCache.keys().next().value!);
    compiledCache.set(pattern, compiled);
    return compiled;
}

/**
 * Leftmost match of `pattern` in `subject`, as Java's Matcher.find() returns it, or null.
 * `charge(steps)` is called every few thousand steps and may throw to stop the search.
 */
export function javaRegexFind(pattern: string, subject: string, charge?: (steps: number) => void): string | null {
    if (pattern.length > MAX_REGEX_PATTERN_LENGTH || subject.length > MAX_REGEX_SUBJECT_LENGTH) {
        throw new PineRuntimeError('str.match pattern or subject exceeds the supported length.', 'str.match', 'RESOURCE_LIMIT');
    }
    const re = compileJavaRegex(pattern);
    const n = subject.length;
    const code = (i: number) => subject.charCodeAt(i);
    let steps = 0;
    let uncharged = 0;
    const step = () => {
        steps++;
        if (++uncharged >= STEP_CHUNK) {
            if (charge) charge(uncharged);
            uncharged = 0;
            if (!charge && steps > STANDALONE_STEP_LIMIT) {
                throw new PineRuntimeError('str.match pattern needs too many steps on this input.', 'str.match', 'RESOURCE_LIMIT');
            }
        }
    };

    const isLT = (c: number) => isLineTerminator(c, re.unixLines);
    const atEndOrFinalTerminator = (pos: number) =>
        pos === n || (pos === n - 1 && isLT(code(pos))) || (pos === n - 2 && code(pos) === 13 && code(pos + 1) === 10);
    const assertion = (kind: AssertKind, pos: number): boolean => {
        switch (kind) {
            case 'start':
            case 'inputStart':
                return pos === 0;
            case 'inputEnd':
                return pos === n;
            case 'end':
                return atEndOrFinalTerminator(pos);
            case 'mStart':
                return pos === 0 || (pos < n && isLT(code(pos - 1)) && !(code(pos - 1) === 13 && code(pos) === 10));
            case 'mEnd':
                return pos === n || (isLT(code(pos)) && !(pos > 0 && code(pos - 1) === 13 && code(pos) === 10));
            case 'wordB':
            case 'notWordB': {
                const boundary = isBoundaryWord(pos > 0 ? code(pos - 1) : -1) !== isBoundaryWord(pos < n ? code(pos) : -1);
                return kind === 'wordB' ? boundary : !boundary;
            }
        }
    };
    const same = (a: number, b: number, ci: boolean) => {
        if (a === b) return true;
        if (!ci) return false;
        return String.fromCharCode(a).toLowerCase() === String.fromCharCode(b).toLowerCase();
    };

    // Frames on the backtrack stack: [kind, x, y]. kind 0 = branch (pc, pos), 1 = restore capture, 2 = restore register.
    const run = (progId: number, start: number, caps: number[], regs: number[], requireEnd: number): number => {
        const prog = re.programs[progId];
        const stack: number[] = [];
        let pc = 0;
        let pos = start;
        for (;;) {
            step();
            const ins = prog[pc];
            let ok = true;
            switch (ins.op) {
                case Op.Char:
                    if (pos < n && ins.pred(code(pos))) {
                        pos++;
                        pc++;
                    } else ok = false;
                    break;
                case Op.Split:
                    stack.push(0, ins.b, pos);
                    pc = ins.a;
                    break;
                case Op.Jmp:
                    pc = ins.to;
                    break;
                case Op.Save:
                    stack.push(1, ins.slot, caps[ins.slot]);
                    caps[ins.slot] = pos;
                    pc++;
                    break;
                case Op.Mark:
                    stack.push(2, ins.reg, regs[ins.reg]);
                    regs[ins.reg] = pos;
                    pc++;
                    break;
                case Op.Progress:
                    if (pos === regs[ins.reg]) ok = false;
                    else pc++;
                    break;
                case Op.Assert:
                    if (assertion(ins.kind, pos)) pc++;
                    else ok = false;
                    break;
                case Op.Backref: {
                    const s = caps[ins.index * 2], e = caps[ins.index * 2 + 1];
                    if (s < 0 || e < 0) {
                        ok = false;
                        break;
                    }
                    const len = e - s;
                    if (pos + len > n) {
                        ok = false;
                        break;
                    }
                    for (let i = 0; i < len; i++) {
                        step();
                        if (!same(code(s + i), code(pos + i), ins.ci)) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        pos += len;
                        pc++;
                    }
                    break;
                }
                case Op.Atomic: {
                    const trial = caps.slice();
                    const end = run(ins.sub, pos, trial, regs.slice(), -1);
                    if (end < 0) {
                        ok = false;
                        break;
                    }
                    for (let i = 0; i < caps.length; i++) {
                        if (trial[i] !== caps[i]) {
                            stack.push(1, i, caps[i]);
                            caps[i] = trial[i];
                        }
                    }
                    pos = end;
                    pc++;
                    break;
                }
                case Op.Look: {
                    const trial = caps.slice();
                    let found = false;
                    if (!ins.behind) {
                        found = run(ins.sub, pos, trial, regs.slice(), -1) >= 0;
                    } else {
                        for (let k = ins.min; k <= Math.min(ins.max, pos) && !found; k++) {
                            const attempt = caps.slice();
                            if (run(ins.sub, pos - k, attempt, regs.slice(), pos) >= 0) {
                                found = true;
                                for (let i = 0; i < trial.length; i++) trial[i] = attempt[i];
                            }
                        }
                    }
                    if (found === ins.negate) {
                        ok = false;
                        break;
                    }
                    if (!ins.negate) {
                        for (let i = 0; i < caps.length; i++) {
                            if (trial[i] !== caps[i]) {
                                stack.push(1, i, caps[i]);
                                caps[i] = trial[i];
                            }
                        }
                    }
                    pc++;
                    break;
                }
                case Op.Match:
                    if (requireEnd < 0 || pos === requireEnd) return pos;
                    ok = false;
                    break;
            }
            if (ok) continue;
            // Backtrack: undo state changes until the most recent branch point.
            let resumed = false;
            while (stack.length) {
                const y = stack.pop()!, x = stack.pop()!, kind = stack.pop()!;
                if (kind === 0) {
                    pc = x;
                    pos = y;
                    resumed = true;
                    break;
                }
                if (kind === 1) caps[x] = y;
                else regs[x] = y;
            }
            if (!resumed) return -1;
        }
    };

    try {
        for (let start = 0; start <= n; start++) {
            const caps = new Array((re.groups + 1) * 2).fill(-1);
            const end = run(re.main, start, caps, new Array(re.registers).fill(-1), -1);
            if (end >= 0) return subject.slice(start, end);
        }
        return null;
    } finally {
        if (charge && uncharged) charge(uncharged);
    }
}
