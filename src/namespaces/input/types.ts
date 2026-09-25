// SPDX-License-Identifier: AGPL-3.0-only

export type InputOptions = {
    defval?: any;
    title?: string;
    options?: any[];
    tooltip?: string;
    minval?: number;
    maxval?: number;
    step?: number;
    inline?: string;
    group?: string;
    confirm?: boolean;
    display?: string;
    active?: boolean;
    /**
     * Transpiler-injected handle: the variable the input is assigned to
     * (`len = input.int(…)` → "len"). Popped from the call args by
     * parseInputOptions and used as the PRIMARY override key by resolveInput
     * (title is the secondary fallback). Absent for non-transpiled JS calls.
     */
    __varId?: string;
    /**
     * Transpiler-injected declaration id (`in_0`, `in_1`, …) assigned to every
     * input call site of a Pine script, in declaration order. Checked before
     * `__varId` by resolveInput; it is the only key that tells apart untitled
     * inputs and inputs sharing a variable name.
     */
    __inputId?: string;
};
