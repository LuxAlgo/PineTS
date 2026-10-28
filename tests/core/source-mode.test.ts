import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';
import { Provider } from '../../src/marketData/Provider.class';
import { transpile } from '../../src/transpiler';
import { VerifiedArtifact, compileVerifiedArtifact } from '../../src/transpiler/analysis/VerifiedArtifact';

const PINE = '//@version=6\nindicator("source mode")\nplot(close)';
const JS_SOURCE = `($) => { const { plot } = $.pine; plot(1); }`;

function newPineTS() {
    return new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
}

describe('public source mode', () => {
    it('runs versioned Pine by default and rejects JavaScript strings and functions', async () => {
        await expect(newPineTS().run(PINE)).resolves.toBeDefined();
        await expect(newPineTS().run(JS_SOURCE)).rejects.toThrow(/version marker required/);
        await expect(newPineTS().run(($: any) => { const { plot } = $.pine; plot(1); })).rejects.toThrow(/JavaScript functions require/);
    });

    it('keeps trusted JavaScript available only with an explicit mode', async () => {
        const result = await newPineTS().run(JS_SOURCE, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(result).toBeDefined();
        const fromFunction = await newPineTS().run(($: any) => { const { plot } = $.pine; plot(1); }, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(fromFunction).toBeDefined();
    });

    it('does not reuse a trusted Indicator artifact in native mode', () => {
        const indicator = new Indicator(JS_SOURCE);
        expect(indicator.prepare({ sourceMode: 'trustedJavaScript' }).fn).toBeTypeOf('function');
        expect(() => indicator.prepare({ sourceMode: 'nativePine' })).toThrow(/version marker required/);
    });

    it('checks mode across pagination and update cache reuse', async () => {
        const pine = newPineTS();
        const pages = pine.run(JS_SOURCE, undefined, 1);
        await expect(pages.next()).rejects.toThrow(/version marker required/);

        const trusted = newPineTS();
        await trusted.update(JS_SOURCE, { sourceMode: 'trustedJavaScript' });
        await expect(trusted.update(undefined, { sourceMode: 'nativePine' })).rejects.toThrow(/version marker required/);
    });

    it('preserves trusted source provenance and the shared budget on paginated results', async () => {
        const pages = newPineTS().run(JS_SOURCE, undefined, 10, { sourceMode: 'trustedJavaScript' });
        const first = await pages.next();
        expect(first.done).toBe(false);
        expect(first.value.sourceMode).toBe('trustedJavaScript');
        expect(first.value.transpiledFn).toBeTypeOf('function');
        expect(first.value.executionBudget).toBe(first.value.fullContext.executionBudget);
        await pages.return(undefined as any);
    });

    it('sends a stream source rejection to the error listener', async () => {
        const stream = newPineTS().stream(JS_SOURCE, { live: false });
        const error = await new Promise<Error>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('stream did not reject markerless source')), 5000);
            stream.on('error', (cause: Error) => {
                clearTimeout(timer);
                resolve(cause);
            });
        });
        expect(error.message).toMatch(/version marker required/);
    });

    it('does not accept an arbitrary function through the internal pretranspiled path', async () => {
        await expect(newPineTS().runPretranspiled(async () => {})).rejects.toThrow(/compiled artifact/);
    });

    it('does not silently accept a trusted JavaScript artifact as native Pine', async () => {
        const trusted = transpile(JS_SOURCE, { debug: false, sourceMode: 'trustedJavaScript' });
        await expect(newPineTS().runPretranspiled(trusted)).rejects.toThrow(/trusted JavaScript/);
        await expect(newPineTS().runPretranspiled(trusted, {}, undefined, { sourceMode: 'trustedJavaScript' })).resolves.toBeDefined();
    });

    it('does not permit verify:false for versioned Pine through the low-level compiler', () => {
        expect(() => transpile(PINE, { debug: false, verify: false })).toThrow(/verification/);
    });

    it('also defaults the low-level compiler to native Pine', () => {
        expect(() => transpile(JS_SOURCE, { debug: false })).toThrow(/version marker required/);
        expect(() => transpile(JS_SOURCE, { debug: false, sourceMode: 'trustedJavaScript' })).not.toThrow();
    });

    it('preserves verified Pine provenance even when JavaScript input was permitted', async () => {
        const context = await newPineTS().run(PINE, undefined, undefined, { sourceMode: 'trustedJavaScript' });
        expect(context.sourceMode).toBe('nativePine');
    });

    it('does not trust a directly constructed VerifiedArtifact', () => {
        const forged = new (VerifiedArtifact as any)('async $ => {}');
        expect(() => compileVerifiedArtifact(forged)).toThrow(/verified final artifact/);
    });
});
