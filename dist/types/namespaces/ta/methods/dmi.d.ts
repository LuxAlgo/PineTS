/**
 * Directional Movement Index (DMI)
 *
 * The DMI function returns the directional movement index.
 *
 * Formula:
 * up = high - high[1]
 * down = low[1] - low
 * plusDM = (up > down && up > 0) ? up : 0
 * minusDM = (down > up && down > 0) ? down : 0
 * tr = ta.tr
 * tru = rma(tr, diLength)
 * plus = rma(plusDM, diLength)
 * minus = rma(minusDM, diLength)
 * plusDI = 100 * plus / tru
 * minusDI = 100 * minus / tru
 * dx = 100 * abs(plusDI - minusDI) / (plusDI + minusDI)
 * adx = rma(dx, adxSmoothing)
 *
 * @param diLength - DI Period
 * @param adxSmoothing - ADX Smoothing Period
 * @returns Tuple of three DMI series: [+DI, -DI, ADX]
 */
export declare function dmi(context: any): (_diLength: any, _adxSmoothing: any, _callId?: string) => any[][];
