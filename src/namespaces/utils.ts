import { Series } from '../Series';
import { ChartPointObject } from './chart/ChartPointObject';

//TODO : we should use a more robust way to check if an argument is a plot.
function isPlot(arg: any) {
    return typeof arg === 'object' && arg && (arg.title !== undefined || arg._plotKey !== undefined) && arg.data !== undefined && arg.options !== undefined;
}
// Dual-use helper standing for a scalar (`strategy.closedtrades`, `na`); Series.from resolves it.
export function isScalarHelper(arg: any) {
    return arg !== null && typeof arg === 'object' && '__value' in arg && (arg.__value === null || typeof arg.__value !== 'object');
}
const TYPE_CHECK = {
    series: (arg) => arg instanceof Series || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'boolean' || isScalarHelper(arg),
    string: (arg) => typeof arg === 'string',
    // Pine Script color params accept both color strings and `na` (NaN).
    // Using 'color' instead of 'string' prevents NaN from invalidating the signature.
    color: (arg) => typeof arg === 'string' || arg === null || (typeof arg === 'number' && isNaN(arg)) || arg instanceof Series,
    number: (arg) => typeof arg === 'number',
    // Pine v6 text sizes: a size.* constant or a font size in points.
    size: (arg) => typeof arg === 'string' || typeof arg === 'number',
    boolean: (arg) => typeof arg === 'boolean',
    array: (arg) => Array.isArray(arg),
    object: (arg) => typeof arg === 'object',
    point: (arg) => arg instanceof ChartPointObject,
    primitive: (arg) => typeof arg === null || (typeof arg !== 'object' && typeof arg !== 'function'),
    function: (arg) => typeof arg === 'function',
    undefined: (arg) => arg === undefined,
    null: (arg) => arg === null,
    NaN: (arg) => isNaN(arg),
    // Permissive type: matches any value. Use sparingly — for slots like
    // request.security's `expression` that legitimately accept anything
    // (primitives, tuples, objects, Series, ...).
    any: () => true,

    // Named-args bags emitted by the transpiler are always plain `{key: val}`
    // objects — never arrays. Excluding arrays here lets functions like
    // request.security accept tuple expressions (e.g. `[o, c]`) as a positional
    // arg without misinterpreting them as the options bag.
    remaining_options: (arg) =>
        arg !== null && typeof arg === 'object' && !Array.isArray(arg) && !(arg instanceof Series) && !(arg instanceof ChartPointObject) && !isPlot(arg) && !isScalarHelper(arg),
};

export type PineTypeMap<T> = {
    [K in keyof T]-?: T[K] extends number
        ? 'number'
        : T[K] extends string
        ? 'string'
        : T[K] extends boolean
        ? 'boolean'
        : T[K] extends Series
        ? 'series'
        : T[K] extends Array<any>
        ? 'array'
        : never;
};

const SCALAR_TYPES = new Set(['number', 'string', 'boolean', 'size']);

/** True for the trailing named-arguments object the transpiler emits (`f(a, title="x")` → `f(a, {title: "x"})`). */
export function isNamedArgsBag(arg: any): boolean {
    return TYPE_CHECK.remaining_options(arg);
}

/**
 * Extract a transpiler-injected callsite ID from the end of an arguments array.
 * The transpiler appends { __callsiteId: "_pN" } as the last argument for
 * plot/hline/fill calls to uniquely identify each call-site.
 * Returns the ID string and removes the sentinel object from the array.
 */
export function extractCallsiteId(args: any[]): string | undefined {
    const last = args[args.length - 1];
    if (last && typeof last === 'object' && '__callsiteId' in last) {
        return args.pop().__callsiteId;
    }
    return undefined;
}

/**
 * This function is used to parse the arguments for a Pine params.
 * @param args - The arguments to parse.
 * @param signatures - The signatures to parse, each signature is an array of argument names.
 * @param types - The types to parse, each type is a string representing the type of the argument.
 * @returns The parsed arguments, the arguments are parsed according to the signatures and types.
 */
export function parseArgsForPineParams<T>(args: any[], signatures: any[], types: Record<string, string>, override?: Record<string, any>) {
    if (Array.isArray(signatures) && typeof signatures[0] === 'string') {
        signatures = [signatures];
    }
    const options: T = {} as T;

    let options_arg: Partial<T> = {};

    // A variable can arrive as its Series: positional arguments are wrapped by `param()`, and
    // named values aren't unwrapped at all. Read it at the current bar unless the parameter takes
    // a series. Without this a positional number / string / bool failed its type check and dropped
    // every argument after it, and a named plot handle or title was stored as a Series.
    const isSeriesValue = (value: any) => value instanceof Series || isScalarHelper(value);
    const readScalar = (value: any, type: string) => (SCALAR_TYPES.has(type) && isSeriesValue(value) ? Series.from(value).get(0) : value);
    const readNamed = (value: any, type: string) =>
        type !== undefined && type !== 'series' && type !== 'any' && isSeriesValue(value) ? Series.from(value).get(0) : value;

    const valid = new Array(signatures.length).fill(true);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        // A parameter skipped by named arguments (`f(a, c = 1)` compiles to `f(a, undefined, 1)`)
        if (arg === undefined) continue;

        if (TYPE_CHECK.remaining_options(arg)) {
            options_arg = {};
            for (const key of Object.keys(arg)) options_arg[key] = readNamed(arg[key], types[key]);
            break;
        }

        const curOptions = signatures.map((e, idx) => (valid[idx] ? e[i] : undefined));

        for (let o = 0; o < curOptions.length; o++) {
            const optionName = curOptions[o];
            if (optionName === undefined) {
                valid[o] = false;
                continue;
            }

            // NaN represents Pine Script's `na` — accept it for numeric and color
            // parameters (where na is a valid "no value"). For string/boolean/point
            // parameters, NaN should invalidate the signature to prevent multi-sig
            // conflicts (e.g., line.new(na,na,na,na) where sig2 maps pos 2 to xloc).
            const expectedType = types[optionName];
            if (typeof arg === 'number' && isNaN(arg) && (expectedType === 'number' || expectedType === 'series')) {
                options[optionName] = arg;
            } else {
                const typeChecker = TYPE_CHECK[types[optionName]];
                const value = typeof typeChecker === 'function' && !typeChecker(arg) ? readScalar(arg, expectedType) : arg;
                if (typeof typeChecker === 'function' && typeChecker(value)) {
                    options[optionName] = value;
                } else {
                    valid[o] = false;
                }
            }
        }
    }

    // Named args (options_arg) take precedence over positional matches (options).
    // Without this order, multi-signature matching can produce spurious positional
    // entries (e.g., NaN at position 2 matching 'border_color' in a secondary
    // signature) that overwrite explicit named arguments.
    return { ...options, ...options_arg, ...override };
}
