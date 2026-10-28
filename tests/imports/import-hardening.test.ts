import { describe, expect, it } from 'vitest';
import { resolveImports } from '../../src/imports/resolveImports';
import { fetchText } from '../../src/imports/utils';
import { transpile } from '../../src/transpiler';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { MAX_COMPILER_SOURCE_BYTES } from '../../src/transpiler/analysis/CompilerBudget';

const script = (imports: string) => `//@version=6\nindicator("x")\n${imports}\nplot(close)\n`;
const library = (name: string, body = 'export f() => 1') => `//@version=6\nlibrary("${name}")\n${body}\n`;

describe('import hardening', () => {
    it('verifies linked library code as part of the final native-Pine artifact', () => {
        const source = script('import u/Evil/1 as evil\nplot(evil.f())');
        expect(() => transpile(source, {
            debug: false,
            libraries: { 'u/Evil/1': library('Evil', 'export f() => process') },
        })).toThrow();
    });

    it('rejects an oversized source before calling the resolver', async () => {
        let called = false;
        const source = script('import u/A/1 as a') + 'x'.repeat(270_000);
        await expect(resolveImports(source, () => { called = true; return library('A'); })).rejects.toThrow(/source size/);
        expect(called).toBe(false);
    });

    it('limits the number and depth of nested imports', async () => {
        const many = script(Array.from({ length: 65 }, (_, i) => `import u/L${i}/1 as l${i}`).join('\n'));
        await expect(resolveImports(many, (path) => library(path.split('/')[1]))).rejects.toThrow(/import count/);

        const deep = script('import u/L1/1 as l');
        await expect(resolveImports(deep, (path) => {
            const n = Number(path.match(/L(\d+)/)?.[1]);
            return library(`L${n}`, `import u/L${n + 1}/1 as next\nexport f() => 1`);
        })).rejects.toThrow(/import depth/);
    });

    it('limits aggregate library size before linking', async () => {
        const body = ('// ' + 'x'.repeat(999) + '\n').repeat(230);
        const many = script(Array.from({ length: 5 }, (_, i) => `import u/L${i}/1 as l${i}`).join('\n'));
        await expect(resolveImports(many, (path) => library(path.split('/')[1], body))).rejects.toThrow(/import total size/);
    });

    it('stops waiting for a resolver when the run is cancelled', async () => {
        const abort = new AbortController();
        const budget = new ExecutionBudget(500_000, { signal: abort.signal });
        const pending = resolveImports(script('import u/A/1 as a'), () => new Promise<string>(() => {}), budget);
        abort.abort();
        await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    });

    it('bounds streamed HTTP responses before assembling source text', async () => {
        let textCalled = false;
        const fetch = (async () => ({
            ok: true,
            status: 200,
            body: { getReader: () => ({
                read: async () => ({ done: false, value: new Uint8Array(MAX_COMPILER_SOURCE_BYTES + 1) }),
                cancel: async () => {},
                releaseLock: () => {},
            }) },
            text: async () => { textCalled = true; return ''; },
        })) as any;
        await expect(fetchText(fetch, 'https://example.test/library')).rejects.toThrow(/source bytes/);
        expect(textCalled).toBe(false);
    });
});
