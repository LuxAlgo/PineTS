export declare class Timeframe {
    private context;
    constructor(context: any);
    param(source: any, index?: number, name?: string): any;
    get main_period(): any;
    get period(): any;
    get multiplier(): number;
    get isdwm(): boolean;
    get isdaily(): boolean;
    get isweekly(): boolean;
    get ismonthly(): boolean;
    get isseconds(): boolean;
    get isminutes(): boolean;
    get isintraday(): boolean;
    from_seconds(seconds: number): string | number;
    in_seconds(timeframe: string): number;
}
