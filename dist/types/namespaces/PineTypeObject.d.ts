export declare class PineTypeObject {
    private _definition;
    context: any;
    get __def__(): Record<string, string>;
    constructor(_definition: Record<string, string>, context: any);
    copy(): PineTypeObject;
    toString(): string;
}
