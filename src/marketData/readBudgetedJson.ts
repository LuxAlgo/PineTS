// SPDX-License-Identifier: AGPL-3.0-only

import type { ExecutionBudget } from '../security/ExecutionBudget';

/** Bound bytes while streaming a real HTTP response, before parsing. */
export async function readBudgetedText(response: Response, budget?: ExecutionBudget): Promise<string> {
    if (!budget) return response.text();
    const reader = response.body?.getReader?.();
    if (!reader) {
        const text = await response.text();
        budget.chargeProviderResponseBytes(new TextEncoder().encode(text).byteLength);
        return text;
    }

    const decoder = new TextDecoder();
    const parts: string[] = [];
    try {
        for (;;) {
            budget.checkProviderInterruption();
            const { done, value } = await reader.read();
            if (done) break;
            budget.chargeProviderResponseBytes(value.byteLength);
            parts.push(decoder.decode(value, { stream: true }));
        }
        parts.push(decoder.decode());
        return parts.join('');
    } catch (error) {
        // A hostile stream's cancel() need not settle; rejection must remain
        // immediate once the byte budget is exceeded.
        try { void reader.cancel().catch(() => {}); } catch { /* ignore cancellation failure */ }
        throw error;
    } finally {
        try { reader.releaseLock(); } catch { /* cancellation may still be settling */ }
    }
}

/** Parse JSON only after a streamed byte budget check. */
export async function readBudgetedJson<T = unknown>(response: Response, budget?: ExecutionBudget): Promise<T> {
    if (!budget) return response.json() as Promise<T>;
    if (!response.body?.getReader && typeof response.text !== 'function') {
        // Some test adapters implement json() alone. Account after parsing;
        // a real Response takes the streaming path above.
        const parsed = await response.json();
        budget.chargeProviderResponseBytes(new TextEncoder().encode(JSON.stringify(parsed)).byteLength);
        return parsed as T;
    }
    return JSON.parse(await readBudgetedText(response, budget)) as T;
}
