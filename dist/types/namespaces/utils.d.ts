import { Series } from '../Series';
export type PineTypeMap<T> = {
    [K in keyof T]-?: T[K] extends number ? 'number' : T[K] extends string ? 'string' : T[K] extends boolean ? 'boolean' : T[K] extends Series ? 'series' : T[K] extends Array<any> ? 'array' : never;
};
/**
 * This function is used to parse the arguments for a Pine params.
 * @param args - The arguments to parse.
 * @param signatures - The signatures to parse, each signature is an array of argument names.
 * @param types - The types to parse, each type is a string representing the type of the argument.
 * @returns The parsed arguments, the arguments are parsed according to the signatures and types.
 */
export declare function parseArgsForPineParams<T>(args: any[], signatures: any[], types: Record<string, string>, override?: Record<string, any>): Partial<T> & T & Record<string, any>;
