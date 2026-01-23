/**
 * On-Balance Volume (OBV)
 * Cumulative indicator that adds volume on up days and subtracts on down days
 *
 * Logic:
 * - If close > close[1]: OBV = OBV[1] + volume
 * - If close < close[1]: OBV = OBV[1] - volume
 * - If close == close[1]: OBV = OBV[1]
 *
 * Note: OBV starts at 0 on the first bar (when there's no previous close to compare)
 */
export declare function obv(context: any): () => any;
