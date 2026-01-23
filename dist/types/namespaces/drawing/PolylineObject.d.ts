import { ChartPoint } from '../Chart';
/**
 * Represents a polyline drawing object in PineTS.
 * Polylines are multi-point lines drawn on the chart.
 */
export declare class PolylineObject {
    private context;
    private _id;
    private _points;
    private _curved;
    private _closed;
    private _xloc;
    private _line_color;
    private _fill_color;
    private _line_style;
    private _line_width;
    private static _nextId;
    constructor(context: any, options?: {
        points?: ChartPoint[];
        curved?: boolean;
        closed?: boolean;
        xloc?: string;
        line_color?: string;
        fill_color?: string;
        line_style?: string;
        line_width?: number;
    });
    /**
     * Deletes the polyline (removes from rendering)
     */
    delete(): void;
    /**
     * Gets the polyline's properties for rendering
     */
    toJSON(): object;
}
