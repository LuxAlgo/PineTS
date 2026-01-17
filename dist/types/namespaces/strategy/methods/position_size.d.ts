/**
 * strategy.position_size - Current position size
 *
 * Returns the direction and the number of contracts/shares/lots/units in the current position.
 * - Positive value: Long position
 * - Negative value: Short position
 * - Zero: No position (flat)
 */
export declare function position_size(context: any): () => any;
