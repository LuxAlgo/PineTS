// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Type tag for an `input.*()` declaration. Matches the method names on
 * the `input` namespace.
 */
export type PineInputType =
    | 'any'
    | 'bool'
    | 'color'
    | 'enum'
    | 'float'
    | 'int'
    | 'param'
    | 'price'
    | 'session'
    | 'source'
    | 'string'
    | 'symbol'
    | 'text_area'
    | 'time'
    | 'timeframe';

/**
 * A single `input.*(...)` declaration extracted from a Pine source.
 *
 * Field meanings track the parsed `InputOptions` shape used internally
 * by `parseInputOptions`. Type-specific fields (`options`, `minval`,
 * `maxval`, `step`) are present only when the declaration used them.
 */
export interface PineInputDeclaration {
    /**
     * Resolution: `title` if provided, otherwise a synthetic positional
     * name `input_<index>` so callers always get a stable key. Pine
     * scripts overwhelmingly use titles, so synthetic names are rare.
     */
    name: string;
    type: PineInputType;
    defval: unknown;
    title?: string;
    tooltip?: string;
    group?: string;
    inline?: string;
    options?: unknown[];
    minval?: number;
    maxval?: number;
    step?: number;
}

/**
 * Optional knobs for `PineTS.introspectInputs`.
 */
export interface IntrospectInputsOptions {
    /**
     * Throw on script errors during the introspection dry-run instead
     * of returning the partial result captured so far. Default `false`:
     * a malformed script returns whatever inputs were captured before
     * it threw, plus the captured `errors` array. Useful when the host
     * UI wants to be lenient with works-in-progress scripts.
     */
    throwOnError?: boolean;
}

/**
 * Return type of `PineTS.introspectInputs`. The `errors` array holds
 * any thrown error messages from the dry-run — present even on
 * successful introspections, where it's empty.
 */
export interface IntrospectInputsResult {
    inputs: PineInputDeclaration[];
    errors: string[];
}
