// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../errors/PineRuntimeError';

export const MAX_DRAWING_CREATIONS_PER_BAR = 5_000;

const DECLARED_DRAWING_MAXIMA = {
    max_lines_count: 500,
    max_labels_count: 500,
    max_boxes_count: 500,
    max_polylines_count: 100,
} as const;

type DrawingMaximumName = keyof typeof DECLARED_DRAWING_MAXIMA;

export function validateDrawingMaximum(name: DrawingMaximumName, value: unknown): number {
    const maximum = DECLARED_DRAWING_MAXIMA[name];
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > maximum) {
        throw new PineRuntimeError(`The ${name} declaration must be an integer from 1 to ${maximum}.`, 'indicator', 'INVALID_ARGUMENT');
    }
    return value;
}

export function validateDrawingOptions(options: Record<string, unknown>): void {
    for (const name of Object.keys(DECLARED_DRAWING_MAXIMA) as DrawingMaximumName[]) {
        validateDrawingMaximum(name, options[name]);
    }
}

interface BarDrawingCount {
    bar: unknown;
    execution: unknown;
    count: number;
}

// Private host-side state prevents scripts from resetting the quota by mutating
// a context property. The execution tick distinguishes live-bar re-executions.
const creationCounts = new WeakMap<object, BarDrawingCount>();

export function consumeDrawingCreation(context: object, method: string): void {
    const bar = (context as any).idx;
    const execution = (context as any)._execTick;
    let state = creationCounts.get(context);
    if (!state || state.bar !== bar || state.execution !== execution) {
        state = { bar, execution, count: 0 };
        creationCounts.set(context, state);
    }
    if (state.count >= MAX_DRAWING_CREATIONS_PER_BAR) {
        throw new PineRuntimeError(`The script created too many drawings on one bar (limit ${MAX_DRAWING_CREATIONS_PER_BAR}).`, method, 'RESOURCE_LIMIT');
    }
    state.count++;
}

/** Insertion-ordered active set: append, explicit deletion, and FIFO eviction are O(1). */
export class DrawingStore<T extends { _deleted: boolean; _createdAtBar: number }> {
    private readonly active = new Map<T, T>();

    get size(): number {
        return this.active.size;
    }

    /** Preserve the previous helpers' array-like inspection contract. */
    get length(): number {
        return this.active.size;
    }

    add(item: T, maximum: number): T | undefined {
        this.active.set(item, item);
        if (this.active.size <= maximum) return;
        const oldest = this.active.keys().next().value as T;
        this.active.delete(oldest);
        oldest._deleted = true;
        return oldest;
    }

    delete(item: T): void {
        item._deleted = true;
        this.active.delete(item);
    }

    values(): T[] {
        // Also tolerate a trusted JavaScript caller that assigned `_deleted`
        // directly, without going through the Pine drawing.delete() API.
        this.compactDeleted();
        return Array.from(this.active.keys());
    }

    compactDeleted(): void {
        for (const item of this.active.keys()) {
            if (item._deleted) this.active.delete(item);
        }
    }

    rollbackFromBar(barIdx: number): void {
        for (const item of this.active.keys()) {
            if (item._createdAtBar >= barIdx) this.active.delete(item);
        }
    }
}
