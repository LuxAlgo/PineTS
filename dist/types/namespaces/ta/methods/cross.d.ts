/**
 * Cross Detection
 *
 * Detects when two series cross each other (either direction).
 * Returns true if series1 crosses series2 (either above or below).
 *
 * Formula:
 * cross = (source1[0] > source2[0] && source1[1] <= source2[1]) ||
 *         (source1[0] < source2[0] && source1[1] >= source2[1])
 *
 * @param source1 - First data series
 * @param source2 - Second data series
 * @returns true if the series have crossed, false otherwise
 */
export declare function cross(context: any): (source1: any, source2: any, _callId?: string) => boolean;
