// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { LineObject } from './LineObject';

/**
 * Represents a linefill drawing object in PineTS.
 * Linefills fill the area between two lines.
 */
export class LinefillObject {
    private _id: number;
    private _line1: LineObject;
    private _line2: LineObject;
    private _color: string;

    private static _nextId = 1;

    constructor(
        private context: any,
        options: {
            line1: LineObject;
            line2: LineObject;
            color?: string;
        }
    ) {
        this._id = LinefillObject._nextId++;
        this._line1 = options.line1;
        this._line2 = options.line2;
        this._color = options.color ?? 'rgba(33, 150, 243, 0.5)';
    }

    // Getters
    get_line1(): LineObject {
        return this._line1;
    }

    get_line2(): LineObject {
        return this._line2;
    }

    // Setters
    set_color(color: string): void {
        this._color = Series.from(color).get(0);
    }

    /**
     * Deletes the linefill (removes from rendering)
     */
    delete(): void {
        (this as any)._deleted = true;
    }

    /**
     * Gets the linefill's properties for rendering
     */
    toJSON(): object {
        return {
            id: this._id,
            line1: this._line1?.toJSON(),
            line2: this._line2?.toJSON(),
            color: this._color,
        };
    }
}
