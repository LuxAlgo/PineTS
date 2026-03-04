// SPDX-License-Identifier: AGPL-3.0-only

export function findSecContextIdx(
    myOpenTime: number,
    myCloseTime: number,
    openTime: number[],
    closeTime: number[],
    lookahead: boolean = false
): number {
    for (let i = 0; i < openTime.length; i++) {
        // Match based on where the LTF bar opens, not requiring full containment.
        // This handles bars that straddle HTF boundaries (e.g. a weekly bar that
        // opens in July but closes in August).
        if (openTime[i] <= myOpenTime && myOpenTime < closeTime[i]) {
            if (lookahead) {
                return i;
            }
            // For lookahead=false (default):
            // If the HTF bar is closed (myCloseTime >= closeTime[i]), we can use its value (i).
            // If the HTF bar is still open, we must use the previous bar (i-1) to avoid future leak.
            return myCloseTime >= closeTime[i] ? i : i - 1;
        }
    }
    return -1;
}
