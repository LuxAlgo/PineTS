// SPDX-License-Identifier: AGPL-3.0-only

import type { ProviderRequestOptions } from './IProvider';
import { PineRuntimeError } from '../errors/PineRuntimeError';

/** One bounded HTTP attempt, including response consumption inside the timeout. */
export async function requestProviderPage<T>(
    url: string,
    init: RequestInit,
    options: ProviderRequestOptions | undefined,
    consume: (response: Response) => Promise<T>,
): Promise<T> {
    const budget = options?.budget;
    const signals = [...new Set([init.signal, options?.signal, budget?.providerSignal]
        .filter((signal): signal is AbortSignal => signal !== undefined && signal !== null))];
    if (signals.some((signal) => signal.aborted)) {
        throw new PineRuntimeError('Provider request cancelled.', 'request.provider.cancelled', 'CANCELLED');
    }

    const deadline = Math.min(options?.deadline ?? Infinity, budget?.providerDeadline ?? Infinity);
    const remaining = deadline === Infinity ? 15_000 : Math.min(15_000, deadline - Date.now());
    if (remaining <= 0) throw new PineRuntimeError('Provider request deadline exceeded.', 'request.provider.deadline', 'DEADLINE_EXCEEDED');
    budget?.chargeProviderPage();

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancel: ((error: Error) => void) | undefined;
    const cancelled = new Promise<never>((_, reject) => { cancel = reject; });
    const onAbort = () => {
        controller.abort();
        cancel?.(new PineRuntimeError('Provider request cancelled.', 'request.provider.cancelled', 'CANCELLED'));
    };
    for (const signal of signals) signal.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => {
        controller.abort();
        cancel?.(new PineRuntimeError('Provider request deadline exceeded.', 'request.provider.deadline', 'DEADLINE_EXCEEDED'));
    }, remaining);

    try {
        if (signals.some((signal) => signal.aborted)) onAbort();
        return await Promise.race([fetch(url, { ...init, signal: controller.signal }).then(consume), cancelled]);
    } finally {
        if (timer !== undefined) clearTimeout(timer);
        for (const signal of signals) signal.removeEventListener('abort', onAbort);
    }
}
