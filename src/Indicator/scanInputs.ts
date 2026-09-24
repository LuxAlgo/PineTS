// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { pineToJS } from '../transpiler/pineToJS/pineToJS.index';
import type { InputSite } from '../transpiler/pineToJS/inputs/analyzeInputs';
import { SOURCE_BUILTINS } from '../namespaces/input/utils';
import type { IPineInput, PineInputType, PineInputDisplay } from './types';

/**
 * Harvest every input a Pine script declares into an `IPineInput[]`, in
 * declaration order. Returns `[]` for invalid Pine or for source that's a JS
 * function.
 *
 * Discovery, ids, labels and argument folding come from the pine2js input
 * analysis (transpiler/pineToJS/inputs), the same pass that tags the call
 * sites for the runtime — so the `id` reported here is the key the runtime
 * resolves. Inputs are found wherever TradingView declares them: global or
 * local scope, function bodies, and directly as call arguments.
 *
 * Inputs without an explicit `title=` keep `title === undefined`; `name` is
 * the label TradingView shows instead (the assigned variable, the enclosing
 * function, or "untitled").
 */

// Inferred type tag for each typed `input.<fn>(...)`. Bare `input(...)` is
// detected from the folded defval (see inferAutoType).
const TYPE_BY_FN: Record<string, PineInputType> = {
    bool: 'bool',
    color: 'color',
    enum: 'enum',
    float: 'float',
    int: 'int',
    price: 'price',
    session: 'session',
    source: 'source',
    string: 'string',
    symbol: 'symbol',
    text_area: 'text_area',
    time: 'time',
    timeframe: 'timeframe',
};

// Input types TradingView leaves out of the status line unless `display` says otherwise.
const HIDDEN_BY_DEFAULT = new Set<PineInputType>(['bool', 'color', 'time', 'text_area']);

// The source dropdown (`volume` is a valid default but not listed).
const SOURCE_OPTIONS = ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'hlcc4', 'ohlc4'];

/**
 * Public entry point. Returns `[]` for invalid Pine or for non-string source.
 */
export function scanInputs(source: unknown): IPineInput[] {
    if (typeof source !== 'string') return [];

    const parsed: any = pineToJS(source);
    if (!parsed.success || !parsed.inputs) return [];

    const inputs: IPineInput[] = [];
    for (const site of parsed.inputs as InputSite[]) {
        const meta = toMeta(site);
        if (meta) inputs.push(meta);
    }
    return inputs;
}

function toMeta(site: InputSite): IPineInput | null {
    const a = site.args;
    const type = site.fn === '' ? inferAutoType(a.defval, site.defvalType) : TYPE_BY_FN[site.fn];
    if (!type) return null;

    const meta: IPineInput = { id: site.id, name: site.name, type, defval: a.defval };
    if (site.varId !== undefined) meta.varId = site.varId;
    if (a.title !== undefined) meta.title = String(a.title);
    if (a.tooltip !== undefined) meta.tooltip = String(a.tooltip);
    if (a.group !== undefined) meta.group = String(a.group);
    if (a.inline !== undefined) meta.inline = String(a.inline);
    if (a.confirm !== undefined) meta.confirm = Boolean(a.confirm);
    if (a.active !== undefined) meta.active = Boolean(a.active);
    meta.display = (a.display !== undefined ? normalizeDisplay(a.display) : undefined) ?? (HIDDEN_BY_DEFAULT.has(type) ? 'none' : 'all');
    if (Array.isArray(a.options)) meta.options = a.options;
    else if (type === 'source') meta.options = [...SOURCE_OPTIONS];
    if (typeof a.minval === 'number') meta.minval = a.minval;
    if (typeof a.maxval === 'number') meta.maxval = a.maxval;
    if (typeof a.step === 'number') meta.step = a.step;
    return meta;
}

/**
 * Type tag of the bare `input(defval, ...)` wrapper. Uses the static type of
 * the folded defval when known (`input(14.0)` is float, `input(7 / 2)` is
 * int), else sniffs the value.
 */
function inferAutoType(defval: unknown, staticType?: string): PineInputType | null {
    switch (staticType) {
        case 'int':
        case 'float':
        case 'bool':
        case 'string':
        case 'color':
        case 'source':
            return staticType;
    }
    if (typeof defval === 'boolean') return 'bool';
    if (typeof defval === 'number') return Number.isInteger(defval) ? 'int' : 'float';
    if (typeof defval === 'string') {
        if (SOURCE_BUILTINS.has(defval)) return 'source';
        if (defval.startsWith('#')) return 'color';
        return 'string';
    }
    return null;
}

function normalizeDisplay(v: unknown): PineInputDisplay | undefined {
    if (typeof v !== 'string') return undefined;
    const m = v.startsWith('display.') ? v.slice(8) : v;
    if (m === 'none' || m === 'data_window' || m === 'status_line' || m === 'all') return m;
    return undefined;
}
