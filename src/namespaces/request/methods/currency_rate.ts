// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';
import { unsupportedRequest } from '../utils/unsupportedRequest';

/** request.param wraps each argument as `[value, name]`. */
function argValue(arg: any): any {
    const v = Array.isArray(arg) && arg.length === 2 && typeof arg[1] === 'string' ? arg[0] : arg;
    return v instanceof Series ? v.get(0) : v;
}

/**
 * request.currency_rate(from, to, ignore_invalid_currency): 1 for a currency
 * to itself (as on TradingView); otherwise there is no exchange-rate source,
 * so na with a warning (see unsupportedRequest).
 */
export function currency_rate(context: any) {
    return (...args: any[]) => {
        const from = argValue(args[0]);
        const to = argValue(args[1]);
        if (typeof from === 'string' && from !== '' && from.toUpperCase() === String(to).toUpperCase()) return 1;
        return unsupportedRequest(context, 'currency_rate');
    };
}
