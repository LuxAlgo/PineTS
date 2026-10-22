// Regression guard: the loop guard halts EVERY loop shape at setMaxLoops, and
// does so with a PineRuntimeError (not a plain Error) so a host can tell a
// loop-limit kill from a general engine fault by `instanceof`.
//
// Native Pine only ever emits block-bodied for / while / for-of loops, which
// were already guarded. The do…while, for…in and braceless-body shapes below are
// reachable only through PineTS-syntax (function) input; they were unguarded and
// could ignore setMaxLoops. See the security advisory "minor" findings.

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';

function newPineTS() {
    const p = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    p.setMaxLoops(1000);
    return p;
}

describe('loop guard halts every loop shape with a PineRuntimeError', () => {
    it('native Pine for-loop over the limit → PineRuntimeError (not a plain Error)', async () => {
        const p = newPineTS();
        await expect(
            p.run(`//@version=6\nindicator("t")\nx = 0.0\nfor i = 0 to 100000\n    x := x + 1\nplot(x)`)
        ).rejects.toBeInstanceOf(PineRuntimeError);
    });

    it('PineTS-syntax do…while is guarded', async () => {
        await expect(
            newPineTS().run(($: any) => {
                const { close } = $.data;
                const { plot } = $.pine;
                let i = 0;
                do {
                    i = i + 1;
                } while (true);
                plot(close);
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' })
        ).rejects.toBeInstanceOf(PineRuntimeError);
    });

    it('PineTS-syntax for…in with an inner unbounded loop is guarded', async () => {
        await expect(
            newPineTS().run(($: any) => {
                const { close } = $.data;
                const { plot } = $.pine;
                for (const k in { a: 1 }) {
                    while (true) {
                        /* spin */
                    }
                }
                plot(close);
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' })
        ).rejects.toBeInstanceOf(PineRuntimeError);
    });

    it('PineTS-syntax braceless while is guarded', async () => {
        await expect(
            newPineTS().run(($: any) => {
                const { close } = $.data;
                const { plot } = $.pine;
                let n = 0;
                while (true) n = n + 1;
                plot(close);
            }, undefined, undefined, { sourceMode: 'trustedJavaScript' })
        ).rejects.toBeInstanceOf(PineRuntimeError);
    });

    it('a bounded loop still completes normally', async () => {
        const { plots } = await newPineTS().run(`//@version=6\nindicator("t")\nx = 0.0\nfor i = 1 to 10\n    x := x + i\nplot(x, "s")`);
        expect(plots['s'].data.at(-1).value).toBe(55);
    });
});
