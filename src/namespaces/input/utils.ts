import { parseArgsForPineParams } from '../utils';
import { InputOptions } from './types';
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

export function parseInputOptions(args: any[]): Partial<InputOptions> {
    // Pop the transpiler-injected `{ __varId }` sentinel if present (always the
    // last arg — added after param-wrapping, so it's a raw object literal). A
    // Series or a real options object won't carry an own `__varId` property.
    let varId: string | undefined;
    const last = args[args.length - 1];
    if (last && typeof last === 'object' && Object.prototype.hasOwnProperty.call(last, '__varId')) {
        varId = (last as any).__varId;
        args = args.slice(0, -1);
    }
    const options = parseArgsForPineParams<Partial<InputOptions>>(args, INPUT_SIGNATURES, INPUT_ARGS_TYPES);
    if (varId !== undefined) options.__varId = varId;
    return options;
}

export function resolveInput(context: any, options: Partial<InputOptions>) {
    // Override resolution, PRIMARY → fallback:
    //   1. by varId   — the variable name; robust to empty/duplicate titles
    //   2. by title   — back-compat (legacy constructor `inputs` map and
    //                   title-keyed `.input` access both land here)
    //   3. source default
    if (options.__varId && context.inputs && context.inputs[options.__varId] !== undefined) {
        return context.inputs[options.__varId];
    }
    if (options.title && context.inputs && context.inputs[options.title] !== undefined) {
        return context.inputs[options.title];
    }
    return options.defval;
}
