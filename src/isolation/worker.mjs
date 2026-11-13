// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// This file is copied verbatim next to the Node-only bundle. It is not an
// independent entry point: the parent owns its path and the runtime URL.
import { createWriteStream } from 'node:fs';

const runtimeUrl = process.argv[2];

function respond(payload, limit) {
    let body = JSON.stringify(payload);
    if (Buffer.byteLength(body, 'utf8') > limit) {
        body = JSON.stringify({ ok: false, code: 'RESULT_TOO_LARGE', message: 'Isolated result exceeds its byte limit.' });
    }
    const bytes = Buffer.from(body, 'utf8');
    const frame = Buffer.allocUnsafe(4);
    frame.writeUInt32BE(bytes.length, 0);
    const stream = createWriteStream(null, { fd: 3, autoClose: false });
    stream.on('error', () => process.exit(1));
    stream.write(frame);
    stream.end(bytes, () => process.exit(0));
}

async function readJob() {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of process.stdin) {
        bytes += chunk.byteLength;
        if (bytes > 8 * 1024 * 1024) throw new Error('Worker request exceeds 8 MiB.');
        chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks, bytes).toString('utf8'));
}

async function main() {
    let limit = 2 * 1024 * 1024;
    try {
        const job = await readJob();
        limit = Number.isSafeInteger(job.maxResultBytes) && job.maxResultBytes > 0 && job.maxResultBytes <= 8 * 1024 * 1024
            ? job.maxResultBytes : limit;
        if (typeof job.source !== 'string' || !Array.isArray(job.bars) || typeof job.tickerId !== 'string' || typeof job.timeframe !== 'string') {
            throw new Error('Invalid worker request fields.');
        }
        const runtime = await import(runtimeUrl);
        const { PineTS, PineRuntimeError } = runtime;
        if (typeof PineTS !== 'function' || typeof PineRuntimeError !== 'function') throw new Error('PineTS runtime unavailable.');

        // Only the initial primary chart load is served. A request.* secondary
        // context must not reach a credentialed/global provider before a real
        // parent-side broker with per-job quotas exists.
        let primaryServed = false;
        const provider = {
            configure() { throw new Error('Provider configuration is disabled in isolated execution.'); },
            async getMarketData(tickerId, timeframe) {
                if (primaryServed || tickerId !== job.tickerId || timeframe !== job.timeframe) {
                    const error = new PineRuntimeError('Secondary market-data requests require a parent capability broker.', 'isolation.provider');
                    error.code = 'PROVIDER_DISABLED';
                    throw error;
                }
                primaryServed = true;
                return job.bars;
            },
        };

        const pine = new PineTS(provider, job.tickerId, job.timeframe, job.bars.length);
        const context = await pine.run(job.source, job.periods);
        // JSON serialization removes prototypes and callbacks. Non-finite Pine
        // values become null, matching JSON semantics at this IPC boundary.
        respond({ ok: true, result: {
            result: context.result ?? null,
            plots: context.plots ?? {},
            alerts: context.alerts ?? [],
            warnings: context.warnings ?? [],
        } }, limit);
    } catch (error) {
        respond({ ok: false, code: error?.code === 'PROVIDER_DISABLED' ? error.code : 'RUNTIME_ERROR', message: String(error?.message ?? error).slice(0, 4096) }, limit);
    }
}

void main();
