import { LineObject } from './LineObject';
/**
 * Represents a linefill drawing object in PineTS.
 * Linefills fill the area between two lines.
 */
export declare class LinefillObject {
    private context;
    private _id;
    private _line1;
    private _line2;
    private _color;
    private static _nextId;
    constructor(context: any, options: {
        line1: LineObject;
        line2: LineObject;
        color?: string;
    });
    get_line1(): LineObject;
    get_line2(): LineObject;
    set_color(color: string): void;
    /**
     * Deletes the linefill (removes from rendering)
     */
    delete(): void;
    /**
     * Gets the linefill's properties for rendering
     */
    toJSON(): object;
}
