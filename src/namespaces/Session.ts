// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';

/**
 * Pine Script session namespace implementation.
 * Provides session-related properties and constants.
 */
export class Session {
    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values for the transpiler.
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    // ============================================================
    // Session Constants
    // ============================================================

    /**
     * Constant for extended session type.
     * Used with request.security() to request extended hours data.
     */
    public readonly extended: string = 'extended';

    /**
     * Constant for regular session type.
     * Used with request.security() to request regular hours data only.
     */
    public readonly regular: string = 'regular';

    // ============================================================
    // Session Bar Flags
    // ============================================================

    /**
     * Returns true if the current bar is the first bar of the session.
     * A session starts at the beginning of the trading day.
     */
    get isfirstbar(): boolean {
        const context = this.context;

        // Get current bar time and previous bar time
        const currentTime = context.data?.openTime?.get(0);
        const prevTime = context.data?.openTime?.get(1);

        if (isNaN(currentTime)) return false;
        if (isNaN(prevTime)) return true; // First bar overall

        // Check if we've crossed into a new trading day
        const currentDate = new Date(currentTime);
        const prevDate = new Date(prevTime);

        // Compare trading days (UTC date)
        return (
            currentDate.getUTCFullYear() !== prevDate.getUTCFullYear() ||
            currentDate.getUTCMonth() !== prevDate.getUTCMonth() ||
            currentDate.getUTCDate() !== prevDate.getUTCDate()
        );
    }

    /**
     * Returns true if the current bar is the first bar of the regular session.
     * Similar to isfirstbar but only considers regular trading hours.
     */
    get isfirstbar_regular(): boolean {
        // For now, treat regular session same as main session
        // A more complete implementation would check against market hours
        return this.isfirstbar && this.ismarket;
    }

    /**
     * Returns true if the current bar is the last bar of the session.
     */
    get islastbar(): boolean {
        const context = this.context;

        // Get current bar time and next bar time
        const currentTime = context.data?.openTime?.get(0);

        // If this is the last bar in the data, it's the last bar
        if (context.idx === context.data?.close?.length - 1) {
            return true;
        }

        // Check if next bar starts a new session
        const nextIdx = context.idx + 1;
        if (nextIdx < context.data?.openTime?.length) {
            // We need to look at the next bar's time
            // Since data is ordered with current at index 0, next bar is at -1 offset
            const dataLength = context.data.openTime.data.length;
            const currentActualIdx = dataLength - 1 - context.idx;
            const nextActualIdx = currentActualIdx + 1;

            if (nextActualIdx < dataLength) {
                const nextTime = context.data.openTime.data[nextActualIdx];
                const currentDate = new Date(currentTime);
                const nextDate = new Date(nextTime);

                // If next bar is a new day, current bar is last of session
                return (
                    currentDate.getUTCFullYear() !== nextDate.getUTCFullYear() ||
                    currentDate.getUTCMonth() !== nextDate.getUTCMonth() ||
                    currentDate.getUTCDate() !== nextDate.getUTCDate()
                );
            }
        }

        return false;
    }

    /**
     * Returns true if the current bar is the last bar of the regular session.
     * Similar to islastbar but only considers regular trading hours.
     */
    get islastbar_regular(): boolean {
        // For now, treat regular session same as main session
        return this.islastbar && this.ismarket;
    }

    /**
     * Returns true if the current bar is during regular market hours.
     * Market hours are typically 9:30 AM - 4:00 PM for US markets.
     */
    get ismarket(): boolean {
        const context = this.context;
        const currentTime = context.data?.openTime?.get(0);

        if (isNaN(currentTime)) return false;

        // For crypto markets (24/7), always return true
        const syminfo = context.pine?.syminfo;
        if (syminfo?.type === 'crypto') {
            return true;
        }

        // For stock markets, check if within regular hours
        // Default to US market hours: 9:30 AM - 4:00 PM ET (14:30 - 21:00 UTC)
        const date = new Date(currentTime);
        const utcHour = date.getUTCHours();
        const utcMinute = date.getUTCMinutes();
        const utcTime = utcHour * 60 + utcMinute;

        // US market regular hours in UTC (approximately)
        // Note: This doesn't account for DST changes
        const marketOpen = 14 * 60 + 30; // 14:30 UTC = 9:30 AM ET
        const marketClose = 21 * 60; // 21:00 UTC = 4:00 PM ET

        return utcTime >= marketOpen && utcTime < marketClose;
    }

    /**
     * Returns true if the current bar is during post-market hours.
     * Post-market is typically 4:00 PM - 8:00 PM for US markets.
     */
    get ispostmarket(): boolean {
        const context = this.context;
        const currentTime = context.data?.openTime?.get(0);

        if (isNaN(currentTime)) return false;

        // Crypto markets don't have post-market
        const syminfo = context.pine?.syminfo;
        if (syminfo?.type === 'crypto') {
            return false;
        }

        const date = new Date(currentTime);
        const utcHour = date.getUTCHours();
        const utcMinute = date.getUTCMinutes();
        const utcTime = utcHour * 60 + utcMinute;

        // US post-market hours in UTC
        const postMarketStart = 21 * 60; // 21:00 UTC = 4:00 PM ET
        const postMarketEnd = 24 * 60; // Midnight UTC = 8:00 PM ET (approximately)

        return utcTime >= postMarketStart && utcTime < postMarketEnd;
    }

    /**
     * Returns true if the current bar is during pre-market hours.
     * Pre-market is typically 4:00 AM - 9:30 AM for US markets.
     */
    get ispremarket(): boolean {
        const context = this.context;
        const currentTime = context.data?.openTime?.get(0);

        if (isNaN(currentTime)) return false;

        // Crypto markets don't have pre-market
        const syminfo = context.pine?.syminfo;
        if (syminfo?.type === 'crypto') {
            return false;
        }

        const date = new Date(currentTime);
        const utcHour = date.getUTCHours();
        const utcMinute = date.getUTCMinutes();
        const utcTime = utcHour * 60 + utcMinute;

        // US pre-market hours in UTC
        const preMarketStart = 9 * 60; // 9:00 UTC = 4:00 AM ET (approximately)
        const preMarketEnd = 14 * 60 + 30; // 14:30 UTC = 9:30 AM ET

        return utcTime >= preMarketStart && utcTime < preMarketEnd;
    }
}
