export declare enum PineArrayType {
    any = "",
    box = "box",
    bool = "bool",
    color = "color",
    float = "float",
    int = "int",
    label = "label",
    line = "line",
    linefill = "linefill",
    string = "string",
    table = "table"
}
export declare class PineArrayObject {
    array: any;
    type: PineArrayType;
    context: any;
    private _abs;
    private _avg;
    private _binary_search;
    private _binary_search_leftmost;
    private _binary_search_rightmost;
    private _clear;
    private _concat;
    private _copy;
    private _covariance;
    private _every;
    private _fill;
    private _first;
    private _get;
    private _includes;
    private _indexof;
    private _insert;
    private _join;
    private _last;
    private _lastindexof;
    private _max;
    private _median;
    private _min;
    private _mode;
    private _percentile_linear_interpolation;
    private _percentile_nearest_rank;
    private _percentrank;
    private _pop;
    private _push;
    private _range;
    private _remove;
    private _reverse;
    private _set;
    private _shift;
    private _size;
    private _slice;
    private _some;
    private _sort;
    private _sort_indices;
    private _standardize;
    private _stdev;
    private _sum;
    private _unshift;
    private _variance;
    constructor(array: any, type: PineArrayType, context: any);
    toString(): string;
    abs(...args: any[]): any;
    avg(...args: any[]): any;
    binary_search(...args: any[]): any;
    binary_search_leftmost(...args: any[]): any;
    binary_search_rightmost(...args: any[]): any;
    clear(...args: any[]): any;
    concat(...args: any[]): any;
    copy(...args: any[]): any;
    covariance(...args: any[]): any;
    every(...args: any[]): any;
    fill(...args: any[]): any;
    first(...args: any[]): any;
    get(...args: any[]): any;
    includes(...args: any[]): any;
    indexof(...args: any[]): any;
    insert(...args: any[]): any;
    join(...args: any[]): any;
    last(...args: any[]): any;
    lastindexof(...args: any[]): any;
    max(...args: any[]): any;
    median(...args: any[]): any;
    min(...args: any[]): any;
    mode(...args: any[]): any;
    percentile_linear_interpolation(...args: any[]): any;
    percentile_nearest_rank(...args: any[]): any;
    percentrank(...args: any[]): any;
    pop(...args: any[]): any;
    push(...args: any[]): any;
    range(...args: any[]): any;
    remove(...args: any[]): any;
    reverse(...args: any[]): any;
    set(...args: any[]): any;
    shift(...args: any[]): any;
    size(...args: any[]): any;
    slice(...args: any[]): any;
    some(...args: any[]): any;
    sort(...args: any[]): any;
    sort_indices(...args: any[]): any;
    standardize(...args: any[]): any;
    stdev(...args: any[]): any;
    sum(...args: any[]): any;
    unshift(...args: any[]): any;
    variance(...args: any[]): any;
}
