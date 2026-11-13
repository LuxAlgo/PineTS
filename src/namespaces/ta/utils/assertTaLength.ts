// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../../../errors/PineRuntimeError';

/** Maximum public TA window/period. Matches the runtime's 5,000-bar default history lookback. */
export const MAX_TA_LENGTH = 5_000;

/** Use at method entry when legacy invalid lengths should still produce `na`. */
export function validTaLength(length: number, method: string): boolean {
    if (!Number.isSafeInteger(length) || length < 1) return false;
    assertTaLength(length, method);
    return true;
}

/** Use before every length-driven allocation, backfill, or native iteration. */
export function assertTaLength(length: number, method: string): void {
    if (!Number.isSafeInteger(length) || length < 1 || length > MAX_TA_LENGTH) {
        throw new PineRuntimeError(`TA length must be a positive safe integer at most ${MAX_TA_LENGTH}.`, method, 'INVALID_ARGUMENT');
    }
}

/** Predicted native work is charged to the shared per-run budget before it starts. */
export function chargeTaWork(context: any, units: number, method: string): void {
    context.executionBudget?.chargeWork(units, method);
}

/** New buffers are charged before allocation, including changing-length replacements. */
export function chargeTaMemory(context: any, bytes: number, method: string): void {
    context.executionBudget?.chargeMemory(bytes, method);
}
