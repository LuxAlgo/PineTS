// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { joinElements } from '../format';
/**
 * Joins the elements of the array into a string, separated by the separator (default: none).
 * Float elements are printed like Java's Double.toString (`5.0`, `1.0E8`), as on TradingView.
 * @param context - The context of the array.
 * @returns The string of the joined elements.
 */
export function join(context: any) {
    return (id: PineArrayObject, separator: string = ''): string => {
        return joinElements(id).join(separator);
    };
}
