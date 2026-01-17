import { ChartPoint } from '../Chart';
import { PolylineObject } from './PolylineObject';
/**
 * Pine Script polyline namespace implementation.
 * Provides functions for creating and managing polyline drawing objects.
 */
export declare class Polyline {
    private context;
    private _polylines;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index?: number): any;
    /**
     * Returns an array of all polyline objects on the chart.
     */
    get all(): PolylineObject[];
    /**
     * Creates a new polyline object.
     */
    new(points: ChartPoint[], curved?: boolean, closed?: boolean, xloc?: string, line_color?: string, fill_color?: string, line_style?: string, line_width?: number): PolylineObject;
    /**
     * Deletes a polyline object.
     */
    delete(id: PolylineObject): void;
}
