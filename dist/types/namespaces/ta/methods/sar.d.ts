/**
 * Parabolic SAR (Stop and Reverse)
 *
 * Parabolic SAR is a method devised by J. Welles Wilder, Jr., to find potential reversals
 * in the market price direction.
 *
 * @param start - Start acceleration factor
 * @param inc - Increment acceleration factor
 * @param max - Maximum acceleration factor
 * @returns Parabolic SAR value
 */
export declare function sar(context: any): (_start: any, _inc: any, _max: any, _callId?: string) => any;
