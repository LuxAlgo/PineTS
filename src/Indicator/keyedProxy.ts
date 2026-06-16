// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Generic title/name-keyed Proxy with per-key validation. Shared backend for
 * both `Indicator.input` (keyed by input title) and `Indicator.prop` (keyed
 * by declaration arg name).
 *
 * Contract:
 *   - Read:    returns current value (default OR user-overridden) at the key.
 *   - Write:   validates against the entry's meta — type, options, minval,
 *              maxval — and stores the override. Invalid writes THROW with
 *              a tailored message.
 *   - Delete:  throws.
 *   - Unknown key write: throws, listing the known keys.
 *   - Object.keys() / spread / console.log show real keys with current values.
 */

export type KeyedType =
    | 'int' | 'float' | 'bool' | 'string'
    | 'source' | 'color' | 'enum'
    | 'price' | 'time' | 'session'
    | 'symbol' | 'timeframe' | 'text_area';

export interface KeyedSchemaEntry {
    key:      string;             // canonical key — input varId, or prop name
    type:     KeyedType;
    defval:   unknown;
    options?: unknown[];
    minval?:  number;
    maxval?:  number;
    /**
     * Secondary keys that also resolve to this entry (e.g. an input's title
     * aliasing its varId). The canonical `key` always takes priority; an alias
     * is registered only if not already claimed by a canonical key or an
     * earlier entry. Values/overrides are stored under the canonical key, so
     * reading or writing via an alias hits the same slot.
     */
    aliases?: string[];
}

export interface BuildKeyedProxyResult {
    proxy:       Record<string, unknown>;
    values:      Record<string, unknown>;
    entryByKey:  Map<string, KeyedSchemaEntry>;
}

/**
 * Build a keyed proxy view.
 *
 * @param entries  schema entries — defaults seeded into `values`
 * @param label    display label for error messages, e.g. 'Indicator.input' or 'Indicator.prop'
 * @param onSet    optional callback fired after a successful write (for explicit-override tracking)
 * @param seedValues  optional initial values overriding entry defvals (used by .prop to seed
 *                    source-code defaults on top of spec defaults)
 * @param keyNoun  noun for the unknown-key message, defaults to 'key'. Inputs use 'input title'.
 */
export function buildKeyedProxy(
    entries: KeyedSchemaEntry[],
    label: string,
    onSet?: (key: string) => void,
    seedValues?: Record<string, unknown>,
    keyNoun: string = 'key',
): BuildKeyedProxyResult {
    const values: Record<string, unknown> = {};
    const entryByKey = new Map<string, KeyedSchemaEntry>();

    // Canonical keys first (they win over any alias), values seeded under them.
    for (const e of entries) {
        entryByKey.set(e.key, e);
        values[e.key] = seedValues && e.key in seedValues ? seedValues[e.key] : e.defval;
    }
    // Then aliases — only where they don't shadow a canonical key or an
    // already-registered alias (first entry wins the alias).
    for (const e of entries) {
        for (const alias of e.aliases ?? []) {
            if (!alias || entryByKey.has(alias)) continue;
            entryByKey.set(alias, e);
        }
    }

    const proxy = new Proxy(values, {
        get(target, prop) {
            if (typeof prop === 'symbol') return (target as any)[prop];
            const entry = entryByKey.get(prop as string);
            if (entry) return target[entry.key]; // canonicalize alias → key
            return target[prop as string];
        },
        set(target, prop, value) {
            if (typeof prop !== 'string') return false;
            const entry = entryByKey.get(prop);
            if (!entry) {
                throw new Error(`[${label}] unknown ${keyNoun} "${prop}". Known: ${[...entryByKey.keys()].join(', ') || '(none)'}`);
            }
            validate(entry, value, label);
            target[entry.key] = value; // store under canonical key
            onSet?.(entry.key);
            return true;
        },
        deleteProperty(_target, prop) {
            throw new Error(`[${label}] cannot delete "${String(prop)}" — keys are fixed by the script's source.`);
        },
        defineProperty() {
            throw new Error(`[${label}] cannot define new properties — keys are fixed by the script's source.`);
        },
        ownKeys(target) { return Reflect.ownKeys(target); }, // canonical keys only
        getOwnPropertyDescriptor(target, prop) { return Reflect.getOwnPropertyDescriptor(target, prop); },
        has(_target, prop) { return typeof prop === 'string' && entryByKey.has(prop); },
    });

    return { proxy, values, entryByKey };
}

/**
 * Per-entry write validation. Throws on any rule violation.
 */
export function validate(entry: KeyedSchemaEntry, value: unknown, label: string): void {
    const k = entry.key;

    // Type gate
    switch (entry.type) {
        case 'int':
            if (typeof value !== 'number' || !Number.isInteger(value)) {
                throw new TypeError(`[${label}] "${k}" expects an int; got ${describe(value)}`);
            }
            break;
        case 'float':
        case 'price':
        case 'time':
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                throw new TypeError(`[${label}] "${k}" expects a number; got ${describe(value)}`);
            }
            break;
        case 'bool':
            if (typeof value !== 'boolean') {
                throw new TypeError(`[${label}] "${k}" expects a boolean; got ${describe(value)}`);
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
                throw new TypeError(`[${label}] "${k}" expects a string; got ${describe(value)}`);
            }
            break;
    }

    // options whitelist
    if (entry.options && !entry.options.some((opt) => optionEquals(opt, value))) {
        throw new RangeError(`[${label}] "${k}" value ${describe(value)} is not one of: ${entry.options.map(describe).join(', ')}`);
    }

    // Numeric bounds
    if (typeof value === 'number') {
        if (typeof entry.minval === 'number' && value < entry.minval) {
            throw new RangeError(`[${label}] "${k}" value ${value} is below minval ${entry.minval}`);
        }
        if (typeof entry.maxval === 'number' && value > entry.maxval) {
            throw new RangeError(`[${label}] "${k}" value ${value} is above maxval ${entry.maxval}`);
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
