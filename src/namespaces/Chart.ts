// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';

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
export class Chart {
    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values for the transpiler.
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    // ============================================================
    // Chart Properties
    // ============================================================

    /**
     * Background color of the chart.
     * Returns the chart's background color setting.
     */
    get bg_color(): string {
        return this.context.chartSettings?.bg_color || '#131722';
    }

    /**
     * Foreground color of the chart.
     * Returns the chart's foreground (text) color setting.
     */
    get fg_color(): string {
        return this.context.chartSettings?.fg_color || '#B2B5BE';
    }

    // ============================================================
    // Chart Type Detection
    // ============================================================

    /**
     * Returns true if the chart type is Heikin-Ashi.
     */
    get is_heikinashi(): boolean {
        return this.context.chartType === 'heikinashi';
    }

    /**
     * Returns true if the chart type is Kagi.
     */
    get is_kagi(): boolean {
        return this.context.chartType === 'kagi';
    }

    /**
     * Returns true if the chart type is Line Break.
     */
    get is_linebreak(): boolean {
        return this.context.chartType === 'linebreak';
    }

    /**
     * Returns true if the chart type is Point & Figure.
     */
    get is_pnf(): boolean {
        return this.context.chartType === 'pnf';
    }

    /**
     * Returns true if the chart type is Range.
     */
    get is_range(): boolean {
        return this.context.chartType === 'range';
    }

    /**
     * Returns true if the chart type is Renko.
     */
    get is_renko(): boolean {
        return this.context.chartType === 'renko';
    }

    /**
     * Returns true if the chart type is Standard (candlestick/OHLC).
     */
    get is_standard(): boolean {
        return !this.context.chartType || this.context.chartType === 'standard';
    }

    // ============================================================
    // Visible Bar Range
    // ============================================================

    /**
     * Returns the bar_time of the leftmost visible bar on the chart.
     */
    get left_visible_bar_time(): number {
        // In a real trading platform, this would come from the chart's viewport
        // For PineTS, we return the first bar's time as a default
        return this.context.data?.openTime?.get(this.context.data.openTime.length - 1) || NaN;
    }

    /**
     * Returns the bar_time of the rightmost visible bar on the chart.
     */
    get right_visible_bar_time(): number {
        // In a real trading platform, this would come from the chart's viewport
        // For PineTS, we return the current bar's time as a default
        return this.context.data?.openTime?.get(0) || NaN;
    }

    // ============================================================
    // chart.point Functions
    // ============================================================

    /**
     * The point sub-namespace containing chart.point functions
     */
    public point = {
        /**
         * Creates a copy of a chart.point object.
         * @param point - The chart.point to copy
         * @returns A new chart.point with the same values
         */
        copy: (point: ChartPoint): ChartPoint => {
            return {
                index: point.index,
                time: point.time,
                price: point.price,
            };
        },

        /**
         * Creates a chart.point from a bar_index and price.
         * @param index - The bar index
         * @param price - The price level
         * @returns A chart.point object
         */
        from_index: (index: number, price: number): ChartPoint => {
            const context = this.context;
            // Get the time for this bar index
            const barIndex = Series.from(index).get(0);
            const priceVal = Series.from(price).get(0);

            // Calculate the time from bar_index
            let time = NaN;
            if (context.data?.openTime) {
                // bar_index is how many bars back from current
                // In PineTS, data is ordered newest first (index 0 = current)
                const dataLength = context.data.openTime.length;
                const actualIndex = dataLength - 1 - barIndex;
                if (actualIndex >= 0 && actualIndex < dataLength) {
                    time = context.data.openTime.data[actualIndex];
                }
            }

            return {
                index: barIndex,
                time: time,
                price: priceVal,
            };
        },

        /**
         * Creates a chart.point from a time and price.
         * @param time - The timestamp
         * @param price - The price level
         * @returns A chart.point object
         */
        from_time: (time: number, price: number): ChartPoint => {
            const context = this.context;
            const timeVal = Series.from(time).get(0);
            const priceVal = Series.from(price).get(0);

            // Find the bar_index for this time
            let index = NaN;
            if (context.data?.openTime) {
                const times = context.data.openTime.data;
                for (let i = 0; i < times.length; i++) {
                    if (times[i] >= timeVal) {
                        // Convert to bar_index (how many bars back from current)
                        index = times.length - 1 - i;
                        break;
                    }
                }
            }

            return {
                index: index,
                time: timeVal,
                price: priceVal,
            };
        },

        /**
         * Creates a new chart.point with specified values.
         * @param time - The timestamp (optional)
         * @param index - The bar index (optional)
         * @param price - The price level
         * @returns A chart.point object
         */
        new: (
            price: number,
            options?: { time?: number; index?: number }
        ): ChartPoint => {
            const context = this.context;
            const priceVal = Series.from(price).get(0);

            let timeVal: number;
            let indexVal: number;

            if (options?.time !== undefined) {
                timeVal = Series.from(options.time).get(0);
                // Calculate index from time
                indexVal = NaN;
                if (context.data?.openTime) {
                    const times = context.data.openTime.data;
                    for (let i = 0; i < times.length; i++) {
                        if (times[i] >= timeVal) {
                            indexVal = times.length - 1 - i;
                            break;
                        }
                    }
                }
            } else if (options?.index !== undefined) {
                indexVal = Series.from(options.index).get(0);
                // Calculate time from index
                timeVal = NaN;
                if (context.data?.openTime) {
                    const dataLength = context.data.openTime.length;
                    const actualIndex = dataLength - 1 - indexVal;
                    if (actualIndex >= 0 && actualIndex < dataLength) {
                        timeVal = context.data.openTime.data[actualIndex];
                    }
                }
            } else {
                // Default to current bar
                indexVal = context.idx || 0;
                timeVal = context.data?.openTime?.get(0) || NaN;
            }

            return {
                index: indexVal,
                time: timeVal,
                price: priceVal,
            };
        },

        /**
         * Creates a chart.point at the current bar with current price.
         * @param price - The price level (optional, defaults to close)
         * @returns A chart.point object for the current bar
         */
        now: (price?: number): ChartPoint => {
            const context = this.context;
            const priceVal = price !== undefined
                ? Series.from(price).get(0)
                : context.data?.close?.get(0) || NaN;

            return {
                index: context.idx || 0,
                time: context.data?.openTime?.get(0) || NaN,
                price: priceVal,
            };
        },
    };
}
