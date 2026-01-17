// SPDX-License-Identifier: AGPL-3.0-only

/**
 * strategy.position_size - Current position size
 *
 * Returns the direction and the number of contracts/shares/lots/units in the current position.
 * - Positive value: Long position
 * - Negative value: Short position
 * - Zero: No position (flat)
 */
export function position_size(context: any) {
    return () => {
        const engine = context._strategyEngine;
        if (!engine) {
            return 0;
        }
        return engine.getPositionSize();
    };
}
