import { LineObject } from './LineObject';
import { LinefillObject } from './LinefillObject';
/**
 * Pine Script linefill namespace implementation.
 * Provides functions for creating and managing linefill drawing objects.
 */
export declare class Linefill {
    private context;
    private _linefills;
    constructor(context: any);
    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index?: number): any;
    /**
     * Returns an array of all linefill objects on the chart.
     */
    get all(): LinefillObject[];
    /**
     * Creates a new linefill object.
     */
    new(line1: LineObject, line2: LineObject, color?: string): LinefillObject;
    /**
     * Deletes a linefill object.
     */
    delete(id: LinefillObject): void;
    get_line1(id: LinefillObject): LineObject | null;
    get_line2(id: LinefillObject): LineObject | null;
    set_color(id: LinefillObject, color: string): void;
}
