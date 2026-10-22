import { describe, expect, it } from 'vitest';
import { transpile } from '../../src/transpiler';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';

const H = '//@version=6\nindicator("budget")\n';

describe('compiler structural budget', () => {
    it('rejects oversized source before lexing', () => {
        expect(() => transpile(H + `//${'a'.repeat(262_145)}\nplot(close)`)).toThrow(PineRuntimeError);
        const multibyte = H + (`//${'界'.repeat(1_000)}\n`).repeat(180) + 'plot(close)';
        expect(() => transpile(multibyte)).toThrow(/source bytes/);
    });

    it('rejects excessive line count and line length', () => {
        expect(() => transpile(H + '\n'.repeat(10_001) + 'plot(close)')).toThrow(PineRuntimeError);
        expect(() => transpile(H + `//${'a'.repeat(16_385)}\nplot(close)`)).toThrow(PineRuntimeError);
    });

    it('rejects excessive source nesting before recursive parsing', () => {
        const source = H + `plot(${'('.repeat(257)}close${')'.repeat(257)})`;
        expect(() => transpile(source)).toThrow(PineRuntimeError);
    });

    it('rejects excessive tokens before Pine parsing', () => {
        const source = H + ('x=1;'.repeat(1_000) + '\n').repeat(13);
        expect(() => transpile(source)).toThrow(/token count/);
    });

    it('continues to compile ordinary Pine', () => {
        expect(() => transpile(H + 'plot(close)')).not.toThrow();
    });
});
