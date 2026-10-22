// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { boundedArrayJoin } from '../format';
import { MAX_STRING_CODE_UNITS } from '../../limits';
/**
 * Joins the elements of the array into a string, separated by the separator (default: none).
 * Float elements are printed like Java's Double.toString (`5.0`, `1.0E8`), as on TradingView.
 * @param context - The context of the array.
 * @returns The string of the joined elements.
 */
export function join(context: any) {
    return (id: PineArrayObject, separator: string = ''): string => {
        return boundedArrayJoin(id, separator, MAX_STRING_CODE_UNITS, 'array.join', (work, bytes) => {
            context?.executionBudget?.chargeWork(work, 'array.join');
            context?.executionBudget?.chargeMemory(bytes, 'array.join');
        });
    };
}
