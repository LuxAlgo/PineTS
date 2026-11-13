import { parseArgsForPineParams } from '../utils';
import { Series } from '../../Series';
import { InputOptions } from './types';
import { validate, type KeyedType } from '../../Indicator/keyedProxy';

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
    let inputType: InputOptions['__inputType'];
    while (args.length && isSentinel(args[args.length - 1])) {
        const s = args[args.length - 1];
        // The analysis sentinel (with `__inputId`) carries the Pine variable name; it wins.
        if (s.__inputId !== undefined) varId = s.__varId ?? varId;
        else varId ??= s.__varId;
        inputId ??= s.__inputId;
        inputType ??= s.__inputType;
        args = args.slice(0, -1);
    }
    const options = parseArgsForPineParams<Partial<InputOptions>>(args, INPUT_SIGNATURES, INPUT_ARGS_TYPES);
    if (varId !== undefined) options.__varId = varId;
    if (inputId !== undefined) options.__inputId = inputId;
    if (inputType !== undefined) options.__inputType = inputType;
    return options;
}

export function resolveInput(context: any, options: Partial<InputOptions>, type: KeyedType | 'any') {
    // Override resolution, PRIMARY → fallback:
    //   0. by inputId — `in_N`, unique per declared input of a Pine script
    //   1. by varId   — the variable name; robust to empty/duplicate titles
    //   2. by title   — back-compat (legacy constructor `inputs` map and
    //                   title-keyed `.input` access both land here)
    //   3. source default
    const inputs = context.inputs;
    for (const key of [options.__inputId, options.__varId, options.title]) {
        if (!key || !inputs || !Object.hasOwn(inputs, key)) continue;
        const value = inputs[key];
        if (value === undefined) continue;

        // Only primitive, declared input values may cross into the Pine runtime.
        // Check this before the schema validator formats an error value.
        if (value === null || !['string', 'number', 'boolean'].includes(typeof value)) {
            throw new TypeError(`input.${type} override must be a primitive value`);
        }
        let declaredType: KeyedType;
        if (type === 'any') {
            if (!options.__inputType && typeof options.defval === 'number' && typeof value === 'string' && SOURCE_BUILTINS.has(value)) {
                return value; // Direct JS compatibility: source defaults lack a static Pine type tag.
            }
            declaredType = options.__inputType
                ?? (typeof options.defval === 'number' ? 'float'
                    : typeof options.defval === 'boolean' ? 'bool' : 'string');
        } else {
            declaredType = type;
        }
        validate({
            key,
            type: declaredType,
            defval: options.defval,
            options: declaredType === 'source' ? undefined : options.options,
            minval: options.minval,
            maxval: options.maxval,
        }, value, 'input');
        return value;
    }
    return options.defval;
}

/**
 * `parseInputOptions` for inputs whose arguments are const by Pine's rules (every kind but
 * `input.source` / `input()`, whose defval is a series). The options of a call site never
 * change, so they are parsed on its first bar and reused: a script with many inputs would
 * otherwise re-parse every one of them on every bar.
 */
export function parseInputOptionsCached(context: any, args: any[]): Partial<InputOptions> {
    // The `{ __inputId }` sentinel may sit before a trailing `{ __varId }` one.
    let id: any;
    for (let i = args.length - 1; i >= 0 && isSentinel(args[i]); i--) id ??= args[i].__inputId;
    if (id === undefined) return parseInputOptions(args);
    const cache: Map<any, Partial<InputOptions>> = (context._inputOptionsCache ??= new Map());
    let options = cache.get(id);
    if (!options) {
        options = parseInputOptions(args);
        cache.set(id, options);
    }
    return options;
}
