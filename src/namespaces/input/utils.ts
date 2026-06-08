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
    return parseArgsForPineParams<Partial<InputOptions>>(args, INPUT_SIGNATURES, INPUT_ARGS_TYPES);
}

export function resolveInput(context: any, options: Partial<InputOptions>) {
    // Consume this declaration's positional index, then advance the
    // per-iteration counter for the next `input.*()` call. Mirrors the
    // index assignment in `PineTS.introspectInputs` so GET (introspection)
    // and PASS (override) resolve by the exact same key.
    const index = context._inputCallIndex ?? 0;
    context._inputCallIndex = index + 1;

    const overrides = context.inputs;
    if (overrides) {
        // Primary key: stable positional name (`title ?? input_<index>`),
        // matching `PineInputDeclaration.name`. Survives title renames and
        // covers untitled inputs.
        const name = typeof options.title === 'string' ? options.title : `input_${index}`;
        if (overrides[name] !== undefined) {
            return overrides[name];
        }
        // Back-compat: hosts that keyed overrides by raw title still work.
        if (options.title && overrides[options.title] !== undefined) {
            return overrides[options.title];
        }
    }

    // Otherwise return default value
    return options.defval;
}
