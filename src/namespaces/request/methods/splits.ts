// SPDX-License-Identifier: AGPL-3.0-only

import { unsupportedRequest } from '../utils/unsupportedRequest';

/** No source of split data (request.splits): na, with a warning (see unsupportedRequest). */
export function splits(context: any) {
    return (..._args: any[]) => unsupportedRequest(context, 'splits');
}
