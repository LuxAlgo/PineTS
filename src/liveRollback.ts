// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The part of a bar's starting state that `PineTS._snapshotVarState` does not cover by
 * itself (it saves each variable Series' length and last value).
 *
 * TradingView runs every tick of the realtime bar from the state the previous bar left; only
 * `varip` keeps what earlier ticks did. PineTS re-runs the forming bar on each tick after
 * restoring a snapshot taken before it, so that snapshot must also hold:
 *  - the contents of every collection and object a variable reaches (arrays, maps, matrices,
 *    UDT instances, drawings) and the drawing lists — restored in place, so references held
 *    anywhere else stay valid;
 *  - which variables, function-local scopes and `$.param` series existed — the ones the
 *    discarded run created are removed and created again by the next run;
 *  - plot point counts and request.security `gaps` positions.
 */

import { Context } from './Context.class';
import { Series } from './Series';

const SCOPES = ['const', 'var', 'let', 'params'];
/** Fields that point back into the runtime rather than holding script data. */
const RUNTIME_KEYS = ['context', '_helper', '_udt', '_definition'];

type Saved = [object, any];

export interface LiveState {
    objects: Saved[];
    scopes: Map<string, Record<string, Record<string, [number, any] | null>>>;
    drawings: [any, string, any[]][];
    plots: Record<string, number>;
    gaps: Record<string, number>;
}

function containersOf(context: any): [string, any][] {
    const out: [string, any][] = [['', context]];
    context.lctx?.forEach((lctx: any, id: string) => out.push([id, lctx]));
    return out;
}

export function captureLiveState(context: any): LiveState {
    const objects: Saved[] = [];
    const seen = new Set<object>();

    const visit = (v: any) => {
        if (v === null || typeof v !== 'object' || seen.has(v)) return;
        seen.add(v);
        if (v instanceof Series || v instanceof Context) return;
        if (Array.isArray(v)) {
            objects.push([v, v.slice()]);
            for (const x of v) visit(x);
            return;
        }
        if (v instanceof Map) {
            const entries = [...v];
            objects.push([v, entries]);
            for (const [k, x] of entries) {
                visit(k);
                visit(x);
            }
            return;
        }
        const fields: Record<string, any> = {};
        for (const k of Object.keys(v)) {
            const x = v[k];
            if (typeof x === 'function' || RUNTIME_KEYS.includes(k)) continue;
            fields[k] = x;
            visit(x);
        }
        objects.push([v, fields]);
    };

    const scopes = new Map<string, Record<string, Record<string, [number, any] | null>>>();
    for (const [id, container] of containersOf(context)) {
        const saved: Record<string, Record<string, [number, any] | null>> = {};
        for (const scope of SCOPES) {
            const vars = container[scope];
            if (!vars) continue;
            const keys: Record<string, [number, any] | null> = {};
            for (const key of Object.keys(vars)) {
                const item = vars[key];
                if (item instanceof Series) {
                    keys[key] = null;
                    if (!item.varip && item.data.length) visit(item.data[item.data.length - 1]);
                } else if (Array.isArray(item)) {
                    keys[key] = [item.length, item[item.length - 1]];
                    if (item.length) visit(item[item.length - 1]);
                }
            }
            saved[scope] = keys;
        }
        scopes.set(id, saved);
    }

    const drawings: [any, string, any[]][] = [];
    for (const helper of context._drawingHelpers ?? []) {
        for (const k of Object.keys(helper)) {
            const list = helper[k];
            if (!Array.isArray(list)) continue;
            drawings.push([helper, k, list.slice()]);
            for (const x of list) visit(x);
        }
    }

    const plots: Record<string, number> = {};
    for (const k of Object.keys(context.plots ?? {})) {
        if (!k.startsWith('__')) plots[k] = context.plots[k]?.data?.length ?? 0;
    }

    const gaps: Record<string, number> = {};
    for (const k of Object.keys(context.cache ?? {})) {
        if (typeof context.cache[k] === 'number') gaps[k] = context.cache[k];
    }

    return { objects, scopes, drawings, plots, gaps };
}

export function restoreLiveState(context: any, state: LiveState | undefined): void {
    if (!state) return;
    const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

    for (const id of [...(context.lctx?.keys() ?? [])]) {
        if (!state.scopes.has(id)) context.lctx.delete(id);
    }
    for (const [id, container] of containersOf(context)) {
        const saved = state.scopes.get(id)!;
        for (const scope of SCOPES) {
            const vars = container[scope];
            if (!vars) continue;
            const keys = saved[scope] ?? {};
            for (const key of Object.keys(vars)) {
                const item = vars[key];
                if (item instanceof Series) {
                    if (!own(keys, key) && !item.varip) delete vars[key];
                } else if (Array.isArray(item)) {
                    const info = keys[key];
                    if (!info) delete vars[key];
                    else {
                        item.length = info[0];
                        if (info[0]) item[info[0] - 1] = info[1];
                    }
                }
            }
        }
    }

    for (const [obj, saved] of state.objects) {
        if (Array.isArray(obj)) {
            obj.length = saved.length;
            for (let i = 0; i < saved.length; i++) obj[i] = saved[i];
        } else if (obj instanceof Map) {
            obj.clear();
            for (const [k, v] of saved) obj.set(k, v);
        } else {
            for (const k of Object.keys(obj)) {
                if (typeof (obj as any)[k] !== 'function' && !RUNTIME_KEYS.includes(k) && !own(saved, k)) delete (obj as any)[k];
            }
            for (const k of Object.keys(saved)) (obj as any)[k] = saved[k];
        }
    }

    for (const [helper, k, list] of state.drawings) helper[k] = list.slice();

    for (const k of Object.keys(context.plots ?? {})) {
        if (k.startsWith('__')) continue;
        if (!own(state.plots, k)) delete context.plots[k];
        else if (context.plots[k]?.data?.length > state.plots[k]) context.plots[k].data.length = state.plots[k];
    }

    for (const k of Object.keys(context.cache ?? {})) {
        if (typeof context.cache[k] !== 'number') continue;
        if (own(state.gaps, k)) context.cache[k] = state.gaps[k];
        else delete context.cache[k];
    }
}
