export declare class Barstate {
    private context;
    private _live;
    constructor(context: any);
    setLive(): void;
    get isnew(): boolean;
    get islast(): boolean;
    get isfirst(): boolean;
    get ishistory(): boolean;
    get isrealtime(): boolean;
    get isconfirmed(): boolean;
    get islastconfirmedhistory(): boolean;
}
