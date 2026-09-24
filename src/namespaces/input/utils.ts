import { parseArgsForPineParams } from '../utils';
import { Series } from '../../Series';
import { InputOptions } from './types';

/**
 * Builtin source-series names a runtime `input.source` override may carry.
 * Overrides cross a serialization boundary (host constructor map, worker
 * postMessage), so a source override arrives as the series NAME — never the
 * series itself. Also used by the meta scanner (scanInputs) to type-detect
 * source defaults.
 */
export const SOURCE_BUILTINS = new Set(['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4', 'volume']);

/**
 * Dereference a builtin source NAME to the named series' current-bar value.
 * Returns `undefined` when the name is not a builtin or the series is absent —
 * callers fall back to the declared default. Reading `.get(0)` per bar matches
 * exactly what the transpiler's `input.param(<series>)` wrapping produces for
 * the un-overridden default, so both paths stay value-identical.
 */
export function resolveSourceName(context: any, name: string): number | undefined {
    if (!SOURCE_BUILTINS.has(name)) return undefined;
    const series = context?.data?.[name];
    if (series == null) return undefined;
    return Series.from(series).get(0);
}
const INPUT_SIGNATURES = [
    ['defval', 'title', 'tooltip', 'inline', 'group', 'display'],
    ['defval', 'title', 'tooltip', 'group', 'confirm', 'display'],
    ['defval', 'title', 'tooltip', 'inline', 'group', 'confirm', 'display'],
    ['defval', 'title', 'options', 'tooltip', 'inline', 'group', 'confirm', 'display'],
    ['defval', 'title', 'minval', 'maxval', 'step', 'tooltip', 'inline', 'group', 'confirm', 'display'],
];

const INPUT_ARGS_TYPES = {
    defval: 'primitive',
    title: 'string',
    tooltip: 'string',
    inline: 'string',
    group: 'string',
    display: 'string',
    confirm: 'boolean',
    options: 'array',
    minval: 'number',
    maxval: 'number',
    step: 'number',
};

const isSentinel = (arg: any) =>
    !!arg &&
    typeof arg === 'object' &&
    (Object.prototype.hasOwnProperty.call(arg, '__varId') || Object.prototype.hasOwnProperty.call(arg, '__inputId'));

export function parseInputOptions(args: any[]): Partial<InputOptions> {
    // Pop the transpiler-injected sentinels (always trailing raw object
    // literals): `{ __inputId, __varId }` from the Pine input analysis and
    // `{ __varId }` from the declaration tagging, added after param-wrapping.
    // A Series or a real options object won't carry these own properties.
    let varId: string | undefined;
    let inputId: string | undefined;
    while (args.length && isSentinel(args[args.length - 1])) {
        const s = args[args.length - 1];
        // The analysis sentinel (with `__inputId`) carries the Pine variable name; it wins.
        if (s.__inputId !== undefined) varId = s.__varId ?? varId;
        else varId ??= s.__varId;
        inputId ??= s.__inputId;
        args = args.slice(0, -1);
    }
    const options = parseArgsForPineParams<Partial<InputOptions>>(args, INPUT_SIGNATURES, INPUT_ARGS_TYPES);
    if (varId !== undefined) options.__varId = varId;
    if (inputId !== undefined) options.__inputId = inputId;
    return options;
}

export function resolveInput(context: any, options: Partial<InputOptions>) {
    // Override resolution, PRIMARY → fallback:
    //   0. by inputId — `in_N`, unique per declared input of a Pine script
    //   1. by varId   — the variable name; robust to empty/duplicate titles
    //   2. by title   — back-compat (legacy constructor `inputs` map and
    //                   title-keyed `.input` access both land here)
    //   3. source default
    if (options.__inputId && context.inputs && context.inputs[options.__inputId] !== undefined) {
        return context.inputs[options.__inputId];
    }
    if (options.__varId && context.inputs && context.inputs[options.__varId] !== undefined) {
        return context.inputs[options.__varId];
    }
    if (options.title && context.inputs && context.inputs[options.title] !== undefined) {
        return context.inputs[options.title];
    }
    return options.defval;
}
