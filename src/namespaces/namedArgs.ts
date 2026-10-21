// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Named arguments for built-ins that take positional parameters only.
 *
 * The transpiler turns `f(a, name = b)` into `f(a, {name: b})`. For the functions and
 * methods listed in a parameter table (each function's parameters by their Pine names,
 * in the TradingView reference order), `spreadNamedArgs` moves that trailing bag onto
 * the parameter positions before the call. A positional argument goes through the
 * namespace's `param()` (a variable's Series → its current value); a value in the bag
 * doesn't, so it is read at the current bar here.
 */

import { Series } from '../Series';

// The transpiler's bag is an object literal. Pine values never are: arrays, maps, matrices,
// drawings, chart points and UDT instances are class instances, enum values are strings.
const isBag = (a: any) => a !== null && typeof a === 'object' && Object.getPrototypeOf(a) === Object.prototype;

/**
 * `args` with a trailing named-arguments bag moved onto the positions of `params`.
 * `skip` is the number of leading parameters not in `args` (1 for a method's receiver).
 * Calls without a bag, or whose bag names none of `params`, are returned unchanged.
 */
export function spreadNamedArgs(args: any[], params: readonly string[] | undefined, skip = 0): any[] {
    if (!params) return args;
    // Fixed-arity wrappers forward unfilled parameters as trailing `undefined`s
    // (`l.set_xy1({x, y})` → `helper.set_xy1(l, {x, y}, undefined)`).
    let end = args.length;
    while (end > 0 && args[end - 1] === undefined) end--;
    const bag = args[end - 1];
    if (!isBag(bag)) return args;
    const keys = Object.keys(bag);
    if (!keys.some((k) => params.indexOf(k) >= skip)) return args;
    const out = args.slice(0, end - 1);
    for (const key of keys) {
        const i = params.indexOf(key) - skip;
        if (i >= 0) out[i] = bag[key] instanceof Series ? bag[key].get(0) : bag[key];
    }
    return out;
}

/** `fn` with a trailing named-arguments bag spread onto `params` positions. */
export function withNamedArgs(fn: (...args: any[]) => any, params: readonly string[] | undefined): (...args: any[]) => any {
    if (!params) return fn;
    return (...args: any[]) => fn(...spreadNamedArgs(args, params));
}
