/**
 * Accumulation/Distribution (AccDist)
 *
 * Formula:
 * AD = cum(((close - low) - (high - close)) / (high - low) * volume)
 */
export declare function accdist(context: any): (_callId?: string) => any;
