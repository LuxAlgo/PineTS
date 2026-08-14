// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * `@silentInSecondary` — method decorator.
 *
 * Marks a helper method as a no-op when invoked on a secondary context
 * (i.e. the auxiliary PineTS instance that `request.security` /
 * `request.security_lower_tf` spawns to compute the captured expression
 * at another symbol/timeframe).
 *
 * Drawings, plots, alerts and similar side-effect-only operations are
 * never observable from a secondary context — its sole job is to populate
 * `secContext.params[expression_name]` with the value of the captured
 * expression bar-by-bar. Silencing those operations on secondaries cuts
 * the per-bar work substantially without changing the captured value
 * (the only output that callers ever read).
 *
 * Constructor-style methods (e.g. `label.new`, `line.new`, `box.new`)
 * return `null`; setters / mutators / deletes return `undefined`. The
 * existing helper code is null-safe end-to-end:
 *   - `get_*` methods already return `NaN`/`""` when the receiver is null.
 *   - The transpiler emits method calls on UDT-typed receivers as
 *     `obj?.method?.(...)`, so `null?.set_x1?.(...)` short-circuits.
 *   - Built-in setters like `LineHelper.set_x1(id, x)` already guard
 *     `if (id && !id._deleted) ...` and no-op on null.
 *
 * Pre-condition: target classes use the conventional
 *   `constructor(private context: any) {}`
 * shape, so `this.context.isSecondaryContext` is uniformly accessible.
 * (`Core.ts` `AlertHelper`, `Plots.ts` `PlotHelper`/`HlineHelper`/
 * `FillHelper`, and the drawing helpers all conform.)
 */
export function silentInSecondary(
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
): PropertyDescriptor {
    const original = descriptor.value;
    if (typeof original !== 'function') return descriptor;

    descriptor.value = function (...args: any[]) {
        if (this && this.context && this.context.isSecondaryContext) {
            return null;
        }
        return original.apply(this, args);
    };

    return descriptor;
}
