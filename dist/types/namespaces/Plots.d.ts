export declare class PlotHelper {
    private context;
    constructor(context: any);
    private extractPlotOptions;
    get linestyle_dashed(): string;
    get linestyle_dotted(): string;
    get linestyle_solid(): string;
    get style_area(): string;
    get style_areabr(): string;
    get style_circles(): string;
    get style_columns(): string;
    get style_cross(): string;
    get style_histogram(): string;
    get style_line(): string;
    get style_linebr(): string;
    get style_stepline(): string;
    get style_stepline_diamond(): string;
    get style_steplinebr(): string;
    param(source: any, index?: number, name?: string): any;
    plotchar(...args: any[]): any;
    any(...args: any[]): any;
    plotshape(...args: any[]): any;
    plotarrow(...args: any[]): any;
    plotbar(...args: any[]): void;
    plotcandle(...args: any[]): any;
    bgcolor(...args: any[]): void;
    barcolor(...args: any[]): any;
}
export declare class HlineHelper {
    private context;
    constructor(context: any);
    get style_dashed(): string;
    get style_solid(): string;
    get style_dotted(): string;
    param(source: any, index?: number, name?: string): any;
    any(price: any, title: any, color: any, linestyle: any, linewidth: any, editable: any, display: any): any;
}
export declare class FillHelper {
    private context;
    constructor(context: any);
    param(source: any, index?: number, name?: string): any;
    any(...args: any[]): void;
}
