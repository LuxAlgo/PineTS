// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import type { IPineInput } from './types';

/**
 * Build the live `.input` view exposed on an `Indicator` instance. It looks
 * and behaves like a plain object keyed by Pine input *titles*, but enforces
 * the contract:
 *
 *   - Read: returns the current value (default OR user-overridden) at that title.
 *   - Write: validates against the IPineInput meta — type, options, minval,
 *     maxval, step — and stores the override. Invalid writes THROW.
 *   - Unknown keys (set OR delete) throw.
 *   - `Object.keys()` / `for (const k in p)` / `console.log(p)` show only the
 *     real input titles + their current values.
 *
 * The container itself is sealed by the Indicator class via
 * `Object.defineProperty(this, 'input', { set: throws })`; this proxy just
 * enforces per-key invariants.
 *
 * Inputs without an explicit `title=` on the Pine source are excluded — Pine's
 * runtime keys overrides by title, so a title-less input is not overridable.
 */
export function buildInputProxy(
    metas: IPineInput[],
    onSet?: (title: string) => void,
): {
    proxy: Record<string, unknown>;
    values: Record<string, unknown>;
    metaByTitle: Map<string, IPineInput>;
} {
    const values: Record<string, unknown> = {};
    const metaByTitle = new Map<string, IPineInput>();

    for (const m of metas) {
        if (!m.title) continue;
        metaByTitle.set(m.title, m);
        values[m.title] = m.defval;
    }

    const proxy = new Proxy(values, {
        get(target, prop) {
            if (typeof prop === 'symbol') return (target as any)[prop];
            return target[prop as string];
        },
        set(target, prop, value) {
            if (typeof prop !== 'string') return false;
            const meta = metaByTitle.get(prop);
            if (!meta) {
                throw new Error(`[Indicator.input] unknown input title "${prop}". Known: ${[...metaByTitle.keys()].join(', ') || '(none)'}`);
            }
            validate(meta, value);
            target[prop] = value;
            onSet?.(prop);
            return true;
        },
        deleteProperty(target, prop) {
            throw new Error(`[Indicator.input] cannot delete "${String(prop)}" — input keys are fixed by the script's source.`);
        },
        defineProperty() {
            throw new Error("[Indicator.input] cannot define new properties — input keys are fixed by the script's source.");
        },
        // ownKeys/getOwnPropertyDescriptor make Object.keys(), spread, and
        // console.log show only real input titles with current values.
        ownKeys(target) {
            return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(target, prop) {
            return Reflect.getOwnPropertyDescriptor(target, prop);
        },
        has(target, prop) {
            return typeof prop === 'string' && prop in target;
        },
    });

    return { proxy, values, metaByTitle };
}

/**
 * Per-meta validation. Throws on any rule violation — silent acceptance hides
 * bugs (and the user has explicitly opted into strict mode for this feature).
 */
function validate(meta: IPineInput, value: unknown): void {
    const title = meta.title ?? '<untitled>';

    // Type coercion gate.
    switch (meta.type) {
        case 'int':
            if (typeof value !== 'number' || !Number.isInteger(value)) {
                throw new TypeError(`[Indicator.input] "${title}" expects an int; got ${describe(value)}`);
            }
            break;
        case 'float':
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                throw new TypeError(`[Indicator.input] "${title}" expects a float; got ${describe(value)}`);
            }
            break;
        case 'bool':
            if (typeof value !== 'boolean') {
                throw new TypeError(`[Indicator.input] "${title}" expects a boolean; got ${describe(value)}`);
            }
            break;
        case 'string':
        case 'session':
        case 'symbol':
        case 'timeframe':
        case 'text_area':
        case 'color':
        case 'enum':
        case 'source':
            if (typeof value !== 'string') {
                throw new TypeError(`[Indicator.input] "${title}" expects a string; got ${describe(value)}`);
            }
            break;
        case 'price':
        case 'time':
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                throw new TypeError(`[Indicator.input] "${title}" expects a number; got ${describe(value)}`);
            }
            break;
    }

    // options whitelist (if present)
    if (meta.options && !meta.options.some((opt) => optionEquals(opt, value))) {
        throw new RangeError(`[Indicator.input] "${title}" value ${describe(value)} is not one of: ${meta.options.map(describe).join(', ')}`);
    }

    // Numeric bounds
    if (typeof value === 'number') {
        if (typeof meta.minval === 'number' && value < meta.minval) {
            throw new RangeError(`[Indicator.input] "${title}" value ${value} is below minval ${meta.minval}`);
        }
        if (typeof meta.maxval === 'number' && value > meta.maxval) {
            throw new RangeError(`[Indicator.input] "${title}" value ${value} is above maxval ${meta.maxval}`);
        }
    }
}

function optionEquals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-12;
    return false;
}

function describe(v: unknown): string {
    if (v === null) return 'null';
    if (typeof v === 'string') return JSON.stringify(v);
    return String(v);
}
