// SPDX-License-Identifier: AGPL-3.0-only

import { unsupportedRequest } from '../utils/unsupportedRequest';

/** No source of Pine Seeds data (request.seed): na, with a warning (see unsupportedRequest). */
export function seed(context: any) {
    return (..._args: any[]) => unsupportedRequest(context, 'seed');
}
