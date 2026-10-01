// SPDX-License-Identifier: AGPL-3.0-only

import { unsupportedRequest } from '../utils/unsupportedRequest';

/** No source of Nasdaq Data Link / Quandl data (request.quandl): na, with a warning (see unsupportedRequest). */
export function quandl(context: any) {
    return (..._args: any[]) => unsupportedRequest(context, 'quandl');
}
