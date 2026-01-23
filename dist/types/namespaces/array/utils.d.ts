import { PineArrayType } from './PineArrayObject';
export declare function inferArrayType(values: any[]): PineArrayType;
export declare function inferValueType(value: any): PineArrayType;
export declare function isArrayOfType(array: any[], type: PineArrayType): boolean;
export declare function isValueOfType(value: any, type: PineArrayType): boolean;
