import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runIsolatedPine, IsolatedPineError } from '../../src/isolation/node';

beforeAll(() => {
    // The child loads the built Node runtime, not TypeScript/tsx from the
    // temporary working directory. Always rebuild: a stale bundle can make
    // source-level security regressions appear to pass.
    execFileSync(process.execPath, [fileURLToPath(new URL('../../node_modules/rollup/dist/bin/rollup', import.meta.url)), '-c', 'rollup.config.js'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        stdio: 'pipe',
        env: { ...process.env, BUILD: 'dev', FORMAT: 'es' },
    });
}, 30_000);

const bars = [
    { openTime: 1_700_000_000_000, closeTime: 1_700_000_060_000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
    { openTime: 1_700_000_060_000, closeTime: 1_700_000_120_000, open: 11, high: 13, low: 10, close: 12, volume: 120 },
];

const source = '//@version=5\nindicator("isolated")\nplot(close, "close")';

describe('opt-in Node child execution', () => {
    it('returns a plain, serializable result from native Pine without a host provider', async () => {
        const output = await runIsolatedPine({ source, bars, tickerId: 'TEST', timeframe: '1' });
        const closePlot = output.plots.close as { data: Array<{ value: number }> };
        expect(closePlot.data.map((point) => point.value)).toEqual([11, 12]);
        expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
        expect(JSON.parse(JSON.stringify(output))).toEqual(output);
    });

    it('rejects JavaScript and malformed market data before launching a child', async () => {
        await expect(runIsolatedPine({ source: '($) => 1', bars, tickerId: 'TEST', timeframe: '1' }))
            .rejects.toMatchObject({ code: 'INVALID_INPUT' });
        await expect(runIsolatedPine({ source: (() => 1) as any, bars, tickerId: 'TEST', timeframe: '1' }))
            .rejects.toMatchObject({ code: 'INVALID_INPUT' });
        await expect(runIsolatedPine({ source, bars: [{ ...bars[0], close: Number.POSITIVE_INFINITY }], tickerId: 'TEST', timeframe: '1' }))
            .rejects.toMatchObject({ code: 'INVALID_INPUT' });
        await expect(runIsolatedPine({ source, bars: [{ ...bars[0], closeTime: undefined } as any], tickerId: 'TEST', timeframe: 'D' }))
            .rejects.toMatchObject({ code: 'INVALID_INPUT' });
    });

    it('enforces the input IPC size limit', async () => {
        await expect(runIsolatedPine({ source, bars, tickerId: 'TEST', timeframe: '1', maxMessageBytes: 32 }))
            .rejects.toMatchObject({ code: 'MESSAGE_TOO_LARGE' });
    });

    it('enforces result and stdout limits inside the child boundary', async () => {
        await expect(runIsolatedPine({ source, bars, tickerId: 'TEST', timeframe: '1', maxResultBytes: 100 }))
            .rejects.toMatchObject({ code: 'RESULT_TOO_LARGE' });
        const loggingSource = '//@version=5\nindicator("logging")\nlog.info("hello")\nplot(close, "close")';
        await expect(runIsolatedPine({ source: loggingSource, bars, tickerId: 'TEST', timeframe: '1', maxOutputBytes: 1 }))
            .rejects.toMatchObject({ code: 'OUTPUT_TOO_LARGE' });
    });

    it('terminates an overdue child and remains able to run the next job', async () => {
        await expect(runIsolatedPine({ source, bars, tickerId: 'TEST', timeframe: '1', timeoutMs: 1 }))
            .rejects.toMatchObject({ code: 'TIMEOUT' });
        const output = await runIsolatedPine({ source, bars, tickerId: 'TEST', timeframe: '1' });
        const closePlot = output.plots.close as { data: Array<{ value: number }> };
        expect(closePlot.data.at(-1)?.value).toBe(12);
    });

    it('fails closed for secondary market-data requests without a parent broker', async () => {
        const requestingSource = '//@version=5\nindicator("request")\nx = request.security("OTHER", "D", close)\nplot(x, "x")';
        await expect(runIsolatedPine({ source: requestingSource, bars, tickerId: 'TEST', timeframe: '1' }))
            .rejects.toMatchObject({ code: 'PROVIDER_DISABLED' });
        const ignoredSource = '//@version=5\nindicator("request")\nx = request.security("OTHER", "D", close, ignore_invalid_symbol = true)\nplot(x, "x")';
        await expect(runIsolatedPine({ source: ignoredSource, bars, tickerId: 'TEST', timeframe: '1' }))
            .rejects.toMatchObject({ code: 'PROVIDER_DISABLED' });
    });

    it('uses a distinct error type for child-boundary failures', () => {
        const error = new IsolatedPineError('TIMEOUT', 'Deadline exceeded');
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe('TIMEOUT');
    });
});
