export declare class Series {
    data: any[];
    offset: number;
    constructor(data: any[], offset?: number);
    get(index: number): any;
    set(index: number, value: any): void;
    get length(): number;
    toArray(): any[];
    static from(source: any): Series;
}
