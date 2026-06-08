// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { transpile } from '../transpiler/index';
import { VIEWPORT_DEPENDENT_BUILTINS } from '../transpiler/settings';
import { scanInputs } from './scanInputs';
import { buildInputProxy } from './inputProxy';
import type { IPineInput, PreparedScript } from './types';

/**
 * The single owner of every per-script artifact. Holds the source, lazily
 * transpiles + scans inputs on first `prepare()`, and caches the result so
 * the same Indicator instance can be passed to multiple `pine.run()` calls
 * without re-transpiling.
 *
 * Roles:
 *   - `source`            — the original Pine string or JS callback.
 *   - `input`             — live, title-keyed view of input values. Read or
 *                            mutate per key; the container itself is frozen.
 *   - `inputs`            — LEGACY title-keyed override map (constructor
 *                            arg). Kept for back-compat; merged into the
 *                            prepared inputs by `prepare()`.
 *   - `prepare(opts?)`    — idempotent: transpiles, scans inputs, runs
 *                            visible-range static analysis. Caches result.
 *   - `usesVisibleRange()`— derived from the cached prepare() result.
 *
 * For JS-function source the AST scan returns `[]`, so `input` is empty and
 * per-key writes throw "unknown title". The legacy `inputs` field still
 * works for that path.
 */
export class Indicator {
    public readonly source: Function | string;
    public inputs: Record<string, unknown>;
    // `.input` is installed via Object.defineProperty in the constructor (lazy
    // getter + replacement-throws setter). `declare` keeps the public type
    // visible to TS without re-emitting a field initializer that would shadow
    // the getter.
    declare public readonly input: Record<string, unknown>;

    // Lazy artifacts — populated on first prepare() call.
    private _prepared: PreparedScript | null = null;
    private _inputMeta: IPineInput[] | null = null;
    private _inputValues: Record<string, unknown> = {};
    private _explicitOverrides = new Set<string>(); // titles the user wrote via .input.X = ...
    private _inputProxy: Record<string, unknown> | null = null;

    constructor(source: Function | string, inputs: Record<string, unknown> = {}) {
        this.source = source;
        this.inputs = inputs;

        // `.input` is a frozen container. The Proxy itself is lazy — built on
        // first access so we don't pay the AST scan when callers never touch it.
        Object.defineProperty(this, 'input', {
            get: () => this._getInputProxy(),
            set: () => {
                throw new Error('[Indicator] .input cannot be replaced — mutate individual keys (e.g. ind.input["My Title"] = 20).');
            },
            enumerable: true,
            configurable: false,
        });
    }

    /**
     * Normalize ANY accepted run() argument into an Indicator. Raw functions
     * and strings get wrapped in a throwaway Indicator; existing Indicators
     * pass through. This is the single entry point used by PineTS's run /
     * stream / update so the rest of the engine only deals with Indicators.
     */
    public static from(arg: Indicator | Function | string): Indicator {
        if (arg instanceof Indicator) return arg;
        return new Indicator(arg);
    }

    /**
     * Idempotent transpile + scan + viewport detection. The result is cached
     * on the instance, so passing the same Indicator to multiple `pine.run()`
     * calls produces a single transpilation pass.
     *
     * NB: cache is keyed by *instance identity*, not by options. If you need
     * different debug settings, create a new Indicator.
     */
    public prepare(opts: { debug?: boolean; ln?: boolean } = {}): PreparedScript {
        if (this._prepared) return this._prepared;

        const fn = transpile(this.source, { debug: !!opts.debug, ln: opts.ln });

        const usesVisibleRange = detectViewportUsage(fn);
        const ltfSlices = (fn as any)._ltfSlices;

        this._prepared = {
            fn,
            inputs: this.getRuntimeInputs(),
            usesVisibleRange,
            ltfSlices,
        };
        return this._prepared;
    }

    /** True iff the script references any built-in in `VIEWPORT_DEPENDENT_BUILTINS`. */
    public usesVisibleRange(): boolean {
        return this.prepare().usesVisibleRange;
    }

    /**
     * Title-keyed input map used by the runtime (read by
     * `input.utils.resolveInput`). Composed at call time so live mutations
     * to `.input` between `pine.run()` calls are picked up automatically.
     *
     * Precedence:
     *   1. Legacy constructor `inputs`            (back-compat)
     *   2. Explicit writes to `.input[...]`       (new API; takes priority)
     *
     * Defaults are NOT included — the runtime falls back to `defval` when a
     * title is absent.
     */
    public getRuntimeInputs(): Record<string, unknown> {
        const out: Record<string, unknown> = { ...(this.inputs ?? {}) };
        if (this._inputMeta) {
            for (const title of this._explicitOverrides) {
                out[title] = this._inputValues[title];
            }
        }
        return out;
    }

    /**
     * AST-parsed input metadata. Lazy. Empty array for JS-function source.
     */
    public getInputsMeta(): IPineInput[] {
        this._ensureInputsScanned();
        return this._inputMeta!;
    }

    // ── internals ───────────────────────────────────────────────────────

    private _ensureInputsScanned(): void {
        if (this._inputMeta) return;
        this._inputMeta = scanInputs(this.source);
        const built = buildInputProxy(this._inputMeta, (title) => this._explicitOverrides.add(title));
        this._inputValues = built.values;
        this._inputProxy = built.proxy;
    }

    private _getInputProxy(): Record<string, unknown> {
        this._ensureInputsScanned();
        return this._inputProxy!;
    }
}

/**
 * Static analysis on the transpiled function body: regex-scan for any of the
 * documented host-bound built-ins (currently visible-range; extensible via
 * VIEWPORT_DEPENDENT_BUILTINS). Comments are stripped during pine2js so this
 * scan is comment-safe.
 *
 * This used to live as `_detectViewportUsage` on PineTS; it's now owned by
 * the Indicator since it's purely a property of the script.
 */
function detectViewportUsage(fn: Function): boolean {
    const body = fn.toString();
    return VIEWPORT_DEPENDENT_BUILTINS.some((name) => {
        const escaped = name.replace(/\./g, '\\.');
        return new RegExp(`\\b${escaped}\\b`).test(body);
    });
}
