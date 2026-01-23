/**
 * Pine Script session namespace implementation.
 * Provides session-related properties and constants.
 */
export declare class Session {
    private context;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values for the transpiler.
     */
    param(source: any, index?: number): any;
    /**
     * Constant for extended session type.
     * Used with request.security() to request extended hours data.
     */
    readonly extended: string;
    /**
     * Constant for regular session type.
     * Used with request.security() to request regular hours data only.
     */
    readonly regular: string;
    /**
     * Returns true if the current bar is the first bar of the session.
     * A session starts at the beginning of the trading day.
     */
    get isfirstbar(): boolean;
    /**
     * Returns true if the current bar is the first bar of the regular session.
     * Similar to isfirstbar but only considers regular trading hours.
     */
    get isfirstbar_regular(): boolean;
    /**
     * Returns true if the current bar is the last bar of the session.
     */
    get islastbar(): boolean;
    /**
     * Returns true if the current bar is the last bar of the regular session.
     * Similar to islastbar but only considers regular trading hours.
     */
    get islastbar_regular(): boolean;
    /**
     * Returns true if the current bar is during regular market hours.
     * Market hours are typically 9:30 AM - 4:00 PM for US markets.
     */
    get ismarket(): boolean;
    /**
     * Returns true if the current bar is during post-market hours.
     * Post-market is typically 4:00 PM - 8:00 PM for US markets.
     */
    get ispostmarket(): boolean;
    /**
     * Returns true if the current bar is during pre-market hours.
     * Pre-market is typically 4:00 AM - 9:30 AM for US markets.
     */
    get ispremarket(): boolean;
}
