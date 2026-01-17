/**
 * ALMA - Arnaud Legoux Moving Average
 *
 * ALMA uses a Gaussian distribution to weight the moving average,
 * reducing lag while maintaining smoothness.
 *
 * @param source - The data source (typically close price)
 * @param period - The number of periods (window size)
 * @param offset - Position of Gaussian peak (0-1, default 0.85). Higher = more responsive
 * @param sigma - Width of Gaussian curve (default 6). Higher = smoother
 *
 * Formula:
 * - m = offset * (period - 1)
 * - s = period / sigma
 * - weight[i] = exp(-((i - m)^2) / (2 * s^2))
 * - ALMA = sum(weight[i] * price[i]) / sum(weight[i])
 */
export declare function alma(context: any): (source: any, _period: any, _offset: any, _sigma: any, _callId?: string) => any;
