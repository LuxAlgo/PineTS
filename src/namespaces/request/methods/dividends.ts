// SPDX-License-Identifier: AGPL-3.0-only

import { unsupportedRequest } from '../utils/unsupportedRequest';

/** No source of dividend data (request.dividends): na, with a warning (see unsupportedRequest). */
export function dividends(context: any) {
    return (..._args: any[]) => unsupportedRequest(context, 'dividends');
}
