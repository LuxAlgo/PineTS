/**
 * Interface for chart.point objects in Pine Script
 */
export interface ChartPoint {
    index: number;
    time: number;
    price: number;
}
/**
 * Pine Script chart namespace implementation.
 * Provides chart properties and chart.point functions.
 */
export declare class Chart {
    private context;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values for the transpiler.
     */
    param(source: any, index?: number): any;
    /**
     * Background color of the chart.
     * Returns the chart's background color setting.
     */
    get bg_color(): string;
    /**
     * Foreground color of the chart.
     * Returns the chart's foreground (text) color setting.
     */
    get fg_color(): string;
    /**
     * Returns true if the chart type is Heikin-Ashi.
     */
    get is_heikinashi(): boolean;
    /**
     * Returns true if the chart type is Kagi.
     */
    get is_kagi(): boolean;
    /**
     * Returns true if the chart type is Line Break.
     */
    get is_linebreak(): boolean;
    /**
     * Returns true if the chart type is Point & Figure.
     */
    get is_pnf(): boolean;
    /**
     * Returns true if the chart type is Range.
     */
    get is_range(): boolean;
    /**
     * Returns true if the chart type is Renko.
     */
    get is_renko(): boolean;
    /**
     * Returns true if the chart type is Standard (candlestick/OHLC).
     */
    get is_standard(): boolean;
    /**
     * Returns the bar_time of the leftmost visible bar on the chart.
     */
    get left_visible_bar_time(): number;
    /**
     * Returns the bar_time of the rightmost visible bar on the chart.
     */
    get right_visible_bar_time(): number;
    /**
     * The point sub-namespace containing chart.point functions
     */
    point: {
        /**
         * Creates a copy of a chart.point object.
         * @param point - The chart.point to copy
         * @returns A new chart.point with the same values
         */
        copy: (point: ChartPoint) => ChartPoint;
        /**
         * Creates a chart.point from a bar_index and price.
         * @param index - The bar index
         * @param price - The price level
         * @returns A chart.point object
         */
        from_index: (index: number, price: number) => ChartPoint;
        /**
         * Creates a chart.point from a time and price.
         * @param time - The timestamp
         * @param price - The price level
         * @returns A chart.point object
         */
        from_time: (time: number, price: number) => ChartPoint;
        /**
         * Creates a new chart.point with specified values.
         * @param time - The timestamp (optional)
         * @param index - The bar index (optional)
         * @param price - The price level
         * @returns A chart.point object
         */
        new: (price: number, options?: {
            time?: number;
            index?: number;
        }) => ChartPoint;
        /**
         * Creates a chart.point at the current bar with current price.
         * @param price - The price level (optional, defaults to close)
         * @returns A chart.point object for the current bar
         */
        now: (price?: number) => ChartPoint;
    };
}
