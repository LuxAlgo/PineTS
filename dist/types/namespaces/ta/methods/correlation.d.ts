/**
 * Correlation Coefficient
 *
 * Describes the degree to which two series tend to deviate from their ta.sma() values.
 * r = cov(X, Y) / (stdev(X) * stdev(Y))
 */
export declare function correlation(context: any): (source1: any, source2: any, _length: any, _callId?: string) => any;
