import { Series } from '../Series';
import { ChartPointObject } from './chart/ChartPointObject';

//TODO : we should use a more robust way to check if an argument is a plot.
function isPlot(arg: any) {
    return typeof arg === 'object' && arg && (arg.title !== undefined || arg._plotKey !== undefined) && arg.data !== undefined && arg.options !== undefined;
}
const TYPE_CHECK = {
    series: (arg) => arg instanceof Series || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'boolean',
    string: (arg) => typeof arg === 'string',
    // Pine Script color params accept both color strings and `na` (NaN).
    // Using 'color' instead of 'string' prevents NaN from invalidating the signature.
    color: (arg) => typeof arg === 'string' || arg === null || (typeof arg === 'number' && isNaN(arg)) || arg instanceof Series,
    number: (arg) => typeof arg === 'number',
    boolean: (arg) => typeof arg === 'boolean',
    array: (arg) => Array.isArray(arg),
    object: (arg) => typeof arg === 'object',
    point: (arg) => arg instanceof ChartPointObject,
    primitive: (arg) => typeof arg === null || (typeof arg !== 'object' && typeof arg !== 'function'),
    function: (arg) => typeof arg === 'function',
    undefined: (arg) => arg === undefined,
    null: (arg) => arg === null,
    NaN: (arg) => isNaN(arg),

    remaining_options: (arg) => arg !== null && typeof arg === 'object' && !(arg instanceof Series) && !(arg instanceof ChartPointObject) && !isPlot(arg),
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

    const valid = new Array(signatures.length).fill(true);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (TYPE_CHECK.remaining_options(arg)) {
            options_arg = arg;
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
                if (typeof typeChecker === 'function' && typeChecker(arg)) {
                    options[optionName] = arg;
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
