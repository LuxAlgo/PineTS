// SPDX-License-Identifier: AGPL-3.0-only

import { unsupportedRequest } from '../utils/unsupportedRequest';

/** No source of earnings data (request.earnings): na, with a warning (see unsupportedRequest). */
export function earnings(context: any) {
    return (..._args: any[]) => unsupportedRequest(context, 'earnings');
}
