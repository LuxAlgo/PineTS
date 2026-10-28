// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Opt-in, Node-only process boundary for native Pine. Import this subpath
 * directly; it must not be added to the browser-facing main entry point.
 *
 * This is a killable execution boundary, not a complete OS sandbox. The
 * process can still reach the filesystem/network unless the embedder adds
 * container/OS controls. See docs/isolation-node.md.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const HARD_MAX_MESSAGE_BYTES = 8 * 1024 * 1024;
const HARD_MAX_RESULT_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_UNITS = 262_144;
const MAX_BARS = 50_000;
const VERSION_LINE = /^\s*\/\/\s*@version\s*=\s*(\d+)\s*$/im;

export type IsolatedPineErrorCode =
    | 'INVALID_INPUT'
    | 'MESSAGE_TOO_LARGE'
    | 'RESULT_TOO_LARGE'
    | 'OUTPUT_TOO_LARGE'
    | 'TIMEOUT'
    | 'PROVIDER_DISABLED'
    | 'RUNTIME_ERROR'
    | 'PROTOCOL_ERROR'
    | 'CHILD_EXIT';

export class IsolatedPineError extends Error {
    constructor(public readonly code: IsolatedPineErrorCode, message: string) {
        super(message);
        this.name = 'IsolatedPineError';
    }
}

/** Host-owned, plain OHLCV data. No provider object or callback crosses IPC. */
export interface IsolatedBar {
    openTime: number;
    closeTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface IsolatedPineJob {
    source: string;
    bars: readonly IsolatedBar[];
    tickerId: string;
    timeframe: string;
    periods?: number;
    /** Total startup + compilation + execution deadline. Default: 5 seconds. */
    timeoutMs?: number;
    /** Node V8 old-space ceiling, not an OS RSS limit. Default: 256 MiB. */
    heapMb?: number;
    /** UTF-8 size of the serialized request. Default: 2 MiB. */
    maxMessageBytes?: number;
    /** UTF-8 size of the serialized response. Default: 2 MiB. */
    maxResultBytes?: number;
    /** Combined child stdout/stderr ceiling. Default: 32 KiB. */
    maxOutputBytes?: number;
}

export interface IsolatedPineResult {
    result: unknown;
    plots: Record<string, unknown>;
    alerts: unknown[];
    warnings: unknown[];
}

function boundedInteger(name: string, value: unknown, fallback: number, min: number, max: number): number {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
        throw new IsolatedPineError('INVALID_INPUT', `${name} must be an integer from ${min} to ${max}.`);
    }
    return value;
}

function ownFiniteNumber(object: object, key: string): number {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'number' || !Number.isFinite(descriptor.value)) {
        throw new IsolatedPineError('INVALID_INPUT', `bar.${key} must be an own finite number.`);
    }
    return descriptor.value;
}

function normalizeBars(bars: unknown): Required<IsolatedBar>[] {
    if (!Array.isArray(bars) || bars.length > MAX_BARS) {
        throw new IsolatedPineError('INVALID_INPUT', `bars must be an array of at most ${MAX_BARS} elements.`);
    }
    let previousOpenTime = Number.NEGATIVE_INFINITY;
    return bars.map((bar, index) => {
        if (!bar || typeof bar !== 'object' || (Object.getPrototypeOf(bar) !== Object.prototype && Object.getPrototypeOf(bar) !== null)) {
            throw new IsolatedPineError('INVALID_INPUT', `bars[${index}] must be a plain object.`);
        }
        const openTime = ownFiniteNumber(bar, 'openTime');
        const closeTime = ownFiniteNumber(bar, 'closeTime');
        if (!Number.isSafeInteger(openTime) || !Number.isSafeInteger(closeTime) || openTime <= previousOpenTime || closeTime <= openTime) {
            throw new IsolatedPineError('INVALID_INPUT', `bars[${index}] has invalid or unordered timestamps.`);
        }
        previousOpenTime = openTime;
        return {
            openTime,
            closeTime,
            open: ownFiniteNumber(bar, 'open'),
            high: ownFiniteNumber(bar, 'high'),
            low: ownFiniteNumber(bar, 'low'),
            close: ownFiniteNumber(bar, 'close'),
            volume: ownFiniteNumber(bar, 'volume'),
        };
    });
}

function prepareJob(job: IsolatedPineJob): {
    body: string;
    timeoutMs: number;
    heapMb: number;
    maxResultBytes: number;
    maxOutputBytes: number;
} {
    if (!job || typeof job !== 'object') throw new IsolatedPineError('INVALID_INPUT', 'A job object is required.');
    const timeoutMs = boundedInteger('timeoutMs', job.timeoutMs, 5_000, 1, 60_000);
    const heapMb = boundedInteger('heapMb', job.heapMb, 256, 16, 512);
    const maxMessageBytes = boundedInteger('maxMessageBytes', job.maxMessageBytes, 2 * 1024 * 1024, 1, HARD_MAX_MESSAGE_BYTES);
    const maxResultBytes = boundedInteger('maxResultBytes', job.maxResultBytes, 2 * 1024 * 1024, 1, HARD_MAX_RESULT_BYTES);
    const maxOutputBytes = boundedInteger('maxOutputBytes', job.maxOutputBytes, 32 * 1024, 1, 1024 * 1024);
    if (typeof job.source !== 'string' || job.source.length > MAX_SOURCE_UNITS || !VERSION_LINE.test(job.source) || Number(job.source.match(VERSION_LINE)?.[1]) < 5) {
        throw new IsolatedPineError('INVALID_INPUT', 'Only native Pine source with a //@version=5 or newer marker is accepted.');
    }
    if (typeof job.tickerId !== 'string' || job.tickerId.length < 1 || job.tickerId.length > 128 || /[\u0000-\u001f]/.test(job.tickerId)) {
        throw new IsolatedPineError('INVALID_INPUT', 'tickerId must be a nonempty bounded string without control characters.');
    }
    if (typeof job.timeframe !== 'string' || job.timeframe.length < 1 || job.timeframe.length > 32 || /[\u0000-\u001f]/.test(job.timeframe)) {
        throw new IsolatedPineError('INVALID_INPUT', 'timeframe must be a nonempty bounded string without control characters.');
    }
    const bars = normalizeBars(job.bars);
    const periods = job.periods === undefined ? undefined : boundedInteger('periods', job.periods, bars.length, 1, Math.max(1, bars.length));
    const body = JSON.stringify({ source: job.source, bars, tickerId: job.tickerId, timeframe: job.timeframe, periods, maxResultBytes });
    if (Buffer.byteLength(body, 'utf8') > maxMessageBytes) {
        throw new IsolatedPineError('MESSAGE_TOO_LARGE', `Serialized job exceeds ${maxMessageBytes} bytes.`);
    }
    return { body, timeoutMs, heapMb, maxResultBytes, maxOutputBytes };
}

/**
 * Execute one native-Pine job in a fresh child process. The parent never sends
 * a provider, function, environment variable, or host object to the child.
 */
export async function runIsolatedPine(job: IsolatedPineJob): Promise<IsolatedPineResult> {
    const prepared = prepareJob(job);
    const isSourceCheckout = import.meta.url.endsWith('/node.ts');
    const workerUrl = new URL(isSourceCheckout ? './worker.mjs' : './isolation-worker.mjs', import.meta.url);
    const runtimeUrl = new URL(isSourceCheckout ? '../../dist/pinets.dev.es.js' : './pinets.min.es.js', import.meta.url);
    const execArgv = [`--max-old-space-size=${prepared.heapMb}`];
    const workingDirectory = mkdtempSync(join(tmpdir(), 'pinets-isolated-'));
    if (resolve(dirname(workingDirectory)) !== resolve(tmpdir())) {
        throw new IsolatedPineError('PROTOCOL_ERROR', 'Unexpected worker directory.');
    }

    return new Promise<IsolatedPineResult>((resolveResult, rejectResult) => {
        let child: ReturnType<typeof spawn>;
        try {
            child = spawn(process.execPath, [...execArgv, fileURLToPath(workerUrl), runtimeUrl.href], {
                cwd: workingDirectory,
                env: {},
                stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
                windowsHide: true,
            });
        } catch (error) {
            try { rmSync(workingDirectory, { recursive: true, force: true }); } catch { /* retain the original launch error */ }
            rejectResult(new IsolatedPineError('CHILD_EXIT', `Could not start isolated Pine: ${(error as Error).message}`));
            return;
        }
        const response = child.stdio[3] as Readable;
        let outputBytes = 0;
        let outcome: { value: IsolatedPineResult } | { error: IsolatedPineError } | undefined;
        let exited = false;
        let settled = false;
        let exitFallback: ReturnType<typeof setTimeout> | undefined;
        let earlyExit: ReturnType<typeof setTimeout> | undefined;
        let deadline: ReturnType<typeof setTimeout>;
        const settle = () => {
            if (settled) return;
            settled = true;
            clearTimeout(deadline);
            clearTimeout(exitFallback);
            clearTimeout(earlyExit);
            child.stdin?.destroy();
            child.stdout?.destroy();
            child.stderr?.destroy();
            response.destroy();
            try {
                // This exact directory was just created under the OS temp root.
                rmSync(workingDirectory, { recursive: true, force: true });
            } catch {
                // A surviving descendant can retain the directory on Windows.
                // Never let cleanup failure escape an event handler into the host.
                if (outcome && 'value' in outcome) {
                    outcome = { error: new IsolatedPineError('CHILD_EXIT', `Worker directory could not be removed: ${workingDirectory}`) };
                } else if (outcome && 'error' in outcome) {
                    outcome.error.message += ` Worker directory could not be removed: ${workingDirectory}`;
                }
            }
            if (!outcome) outcome = { error: new IsolatedPineError('CHILD_EXIT', 'Worker exited before responding.') };
            if ('error' in outcome) rejectResult(outcome.error);
            else resolveResult(outcome.value);
        };
        const finish = (next: { value: IsolatedPineResult } | { error: IsolatedPineError }) => {
            if (outcome) return;
            outcome = next;
            clearTimeout(deadline);
            child.kill('SIGKILL');
            // Wait for the direct child, never for inherited descendant pipes.
            // A kill failure must not leave the parent Promise unresolved.
            exitFallback = setTimeout(settle, 1_000);
            if (exited) settle();
        };
        deadline = setTimeout(() => finish({ error: new IsolatedPineError('TIMEOUT', `Isolated Pine exceeded ${prepared.timeoutMs} ms.`) }), prepared.timeoutMs);
        const chargeOutput = (chunk: Buffer) => {
            outputBytes += chunk.byteLength;
            if (outputBytes > prepared.maxOutputBytes) finish({ error: new IsolatedPineError('OUTPUT_TOO_LARGE', 'Isolated Pine wrote too much to stdout/stderr.') });
        };
        child.stdout?.on('data', chargeOutput);
        child.stderr?.on('data', chargeOutput);
        let responseBytes = 0;
        const responseChunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => {
            if (outcome) return;
            responseBytes += chunk.byteLength;
            if (responseBytes > prepared.maxResultBytes + 4) {
                finish({ error: new IsolatedPineError('RESULT_TOO_LARGE', 'Worker response exceeded its byte limit.') });
                return;
            }
            responseChunks.push(chunk);
            if (responseBytes < 4) return;
            const frameBytes = Buffer.concat(responseChunks, 4).readUInt32BE(0);
            if (frameBytes > prepared.maxResultBytes) return finish({ error: new IsolatedPineError('RESULT_TOO_LARGE', 'Worker response exceeded its byte limit.') });
            if (responseBytes > frameBytes + 4) return finish({ error: new IsolatedPineError('PROTOCOL_ERROR', 'Worker sent extra response bytes.') });
            if (responseBytes < frameBytes + 4) return;
            try {
                const decoded = JSON.parse(Buffer.concat(responseChunks, responseBytes).subarray(4).toString('utf8'));
                if (!decoded || typeof decoded !== 'object' || typeof decoded.ok !== 'boolean') throw new Error('Invalid envelope');
                if (decoded.ok === false) {
                    const code: IsolatedPineErrorCode = decoded.code === 'PROVIDER_DISABLED' || decoded.code === 'RESULT_TOO_LARGE'
                        ? decoded.code : 'RUNTIME_ERROR';
                    finish({ error: new IsolatedPineError(code, String(decoded.message ?? 'Isolated Pine failed.').slice(0, 4096)) });
                } else if (decoded.result && typeof decoded.result === 'object' && decoded.result.plots && Array.isArray(decoded.result.alerts) && Array.isArray(decoded.result.warnings)) {
                    finish({ value: decoded.result as IsolatedPineResult });
                } else {
                    throw new Error('Invalid result');
                }
            } catch {
                finish({ error: new IsolatedPineError('PROTOCOL_ERROR', 'Invalid worker response body.') });
            }
        });
        response.on('end', () => {
            if (!outcome) finish({ error: new IsolatedPineError('PROTOCOL_ERROR', 'Worker closed the response before completing its frame.') });
        });
        response.on('error', (error) => finish({ error: new IsolatedPineError('PROTOCOL_ERROR', `Worker response pipe failed: ${error.message}`) }));
        child.on('error', (error) => finish({ error: new IsolatedPineError('CHILD_EXIT', `Could not start isolated Pine: ${error.message}`) }));
        child.on('exit', (code, signal) => {
            exited = true;
            if (outcome) settle();
            else earlyExit = setTimeout(() => finish({ error: new IsolatedPineError('CHILD_EXIT', `Worker exited before responding (${code ?? signal}).`) }), 100);
        });
        child.stdin?.on('error', (error) => finish({ error: new IsolatedPineError('CHILD_EXIT', `Could not send worker job: ${error.message}`) }));
        child.stdin?.end(prepared.body);
    });
}
