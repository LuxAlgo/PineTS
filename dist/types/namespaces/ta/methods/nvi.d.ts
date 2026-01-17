/**
 * Negative Volume Index (NVI)
 *
 * Formula:
 * If close or close[1] is 0, nvi = nvi[1]
 * Else if volume < volume[1], nvi = nvi[1] + ((close - close[1]) / close[1]) * nvi[1]
 * Else nvi = nvi[1]
 * Initial value is 1.0
 */
export declare function nvi(context: any): (_callId?: string) => any;
