import { Context } from '..';
export declare class Log {
    private context;
    constructor(context: Context);
    private logFormat;
    param(source: any, index?: number, name?: string): any;
    warning(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
}
