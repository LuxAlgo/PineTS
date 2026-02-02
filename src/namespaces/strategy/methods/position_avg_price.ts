// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Returns the average entry price of the current position
 * Returns NaN if there is no open position
 */
export function position_avg_price(context: any) {
    return () => {
        const position = context.strategy?.position;
        if (!position || position.size === 0) {
            return NaN;
        }
        return position.avgPrice || NaN;
    };
}
