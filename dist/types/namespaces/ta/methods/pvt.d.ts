/**
 * Price-Volume Trend (PVT)
 *
 * The PVT function calculates the Price-Volume Trend, which is a cumulative
 * total of volume adjusted by the percentage change in price.
 *
 * Formula:
 * PVT = Previous PVT + ((Current Close - Previous Close) / Previous Close) * Volume
 *
 * @returns The PVT series
 */
export declare function pvt(context: any): (_callId?: string) => any;
