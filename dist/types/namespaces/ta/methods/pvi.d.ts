/**
 * Positive Volume Index (PVI)
 *
 * Formula:
 * If close or close[1] is 0, pvi = pvi[1]
 * Else if volume > volume[1], pvi = pvi[1] + ((close - close[1]) / close[1]) * pvi[1]
 * Else pvi = pvi[1]
 * Initial value is 1.0
 */
export declare function pvi(context: any): (_callId?: string) => any;
