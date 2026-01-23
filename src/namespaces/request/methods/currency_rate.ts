// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Helper to unwrap param tuple [value, name] from transpiler
 */
function unwrapParam(param: any): any {
    if (Array.isArray(param) && param.length === 2 && typeof param[1] === 'string') {
        return param[0];
    }
    return param;
}

/**
 * Provides the daily exchange rate between two currency pairs.
 * In Pine Script, this fetches actual forex data.
 * In PineTS, we provide a simplified implementation.
 *
 * @param context - The execution context
 * @returns A function that returns currency exchange rates
 */
export function currency_rate(context: any) {
    return (
        from: any,
        to: any,
        ignore_invalid_currency: boolean = false
    ): number => {
        // Unwrap param tuples from transpiler and Series values
        const rawFrom = unwrapParam(from);
        const rawTo = unwrapParam(to);
        const _from = (Series.from(rawFrom).get(0)?.toString() || '').toUpperCase();
        const _to = (Series.from(rawTo).get(0)?.toString() || '').toUpperCase();

        // Same currency returns 1.0
        if (_from === _to) {
            return 1.0;
        }

        // Common currency pairs with approximate rates (for basic functionality)
        // In a production environment, this would fetch real forex data
        const rates: Record<string, number> = {
            'USD_EUR': 0.92,
            'EUR_USD': 1.09,
            'USD_GBP': 0.79,
            'GBP_USD': 1.27,
            'USD_JPY': 149.5,
            'JPY_USD': 0.0067,
            'USD_CHF': 0.88,
            'CHF_USD': 1.14,
            'USD_CAD': 1.36,
            'CAD_USD': 0.74,
            'USD_AUD': 1.53,
            'AUD_USD': 0.65,
            'EUR_GBP': 0.86,
            'GBP_EUR': 1.16,
            'EUR_JPY': 163.0,
            'JPY_EUR': 0.0061,
            'BTC_USD': 100000,
            'USD_BTC': 0.00001,
            'ETH_USD': 3500,
            'USD_ETH': 0.000286,
        };

        const key = `${_from}_${_to}`;

        if (rates[key] !== undefined) {
            return rates[key];
        }

        // Try to calculate via USD as intermediate
        const fromUsdKey = `${_from}_USD`;
        const usdToKey = `USD_${_to}`;

        if (rates[fromUsdKey] !== undefined && rates[usdToKey] !== undefined) {
            return rates[fromUsdKey] * rates[usdToKey];
        }

        // Currency pair not found
        if (ignore_invalid_currency) {
            return NaN;
        }

        // In Pine Script, unknown currencies return na
        return NaN;
    };
}
