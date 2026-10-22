// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { PineRuntimeError } from '../errors/PineRuntimeError';
import { MAX_COLLECTION_ELEMENTS } from './limits';

/** One Pine collection entry is conservatively accounted as at least one JS slot. */
export const COLLECTION_SLOT_BYTES = 8;
export const MAP_ENTRY_BYTES = 32;

export function assertCollectionSize(size: number, method: string): void {
    if (!Number.isSafeInteger(size) || size < 0 || size > MAX_COLLECTION_ELEMENTS) {
        throw new PineRuntimeError(`The requested size exceeds the ${MAX_COLLECTION_ELEMENTS} element limit.`, method,
            Number.isSafeInteger(size) && size > MAX_COLLECTION_ELEMENTS ? 'RESOURCE_LIMIT' : 'INVALID_ARGUMENT');
    }
}

/** Check dimensions separately; a zero product must not conceal an invalid dimension. */
export function assertMatrixDimensions(rows: number, cols: number, method: string): number {
    assertCollectionSize(rows, method);
    assertCollectionSize(cols, method);
    if (rows !== 0 && cols > Math.floor(MAX_COLLECTION_ELEMENTS / rows)) {
        throw new PineRuntimeError(`The requested size exceeds the ${MAX_COLLECTION_ELEMENTS} element limit.`, method, 'RESOURCE_LIMIT');
    }
    return rows * cols;
}

/** Preflight an entire bulk operation so a later capacity/budget error cannot leave a partial result. */
export function preflightCollectionGrowth(context: any, current: number, next: number, method: string, bytesPerElement = COLLECTION_SLOT_BYTES): void {
    assertCollectionSize(current, method);
    assertCollectionSize(next, method);
    if (next < current) return;
    const budget = context?.executionBudget;
    if (!budget) return;
    budget.chargeWork(0, method); // Also observes cancellation and the deadline.
    const bytes = (next - current) * bytesPerElement;
    if (!Number.isSafeInteger(bytes) || bytes > budget.maxMemoryBytes - budget.chargedMemoryBytes) {
        throw new PineRuntimeError('Script execution budget exceeded: memory bytes.', method, 'RESOURCE_LIMIT');
    }
}

/** Charge before retaining or enlarging a collection. The run-wide budget is shared by secondary contexts. */
export function chargeCollectionAllocation(context: any, count: number, method: string, bytesPerElement = COLLECTION_SLOT_BYTES): void {
    assertCollectionSize(count, method);
    context?.executionBudget?.chargeMemory(count * bytesPerElement, method);
}

export function chargeCollectionWork(context: any, units: number, method: string): void {
    context?.executionBudget?.chargeWork(units, method);
}
