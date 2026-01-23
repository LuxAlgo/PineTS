/**
 * Williams Variable Accumulation/Distribution (WVAD)
 *
 * Formula:
 * (close - open) / (high - low) * volume
 */
export declare function wvad(context: any): (_callId?: string) => any;
