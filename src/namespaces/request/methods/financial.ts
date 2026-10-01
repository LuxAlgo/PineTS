// SPDX-License-Identifier: AGPL-3.0-only

import { unsupportedRequest } from '../utils/unsupportedRequest';

/** No source of financial data (request.financial): na, with a warning (see unsupportedRequest). */
export function financial(context: any) {
    return (..._args: any[]) => unsupportedRequest(context, 'financial');
}
