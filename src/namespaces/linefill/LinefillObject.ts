// SPDX-License-Identifier: AGPL-3.0-only

import { LineObject } from '../line/LineObject';

let _linefillIdCounter = 0;

export function resetLinefillIdCounter() {
    _linefillIdCounter = 0;
}

export class LinefillObject {
    public id: number;
    public line1: LineObject;
    public line2: LineObject;
    public color: string;
    public _deleted: boolean;
    /** Bar index at which this object was created (for streaming rollback) */
    public _createdAtBar: number = -1;

    constructor(line1: LineObject, line2: LineObject, color: string) {
        this.id = _linefillIdCounter++;
        this.line1 = line1;
        this.line2 = line2;
        this.color = color;
        this._deleted = false;
    }

    // Instance methods — mirror the static methods on LinefillHelper
    // so that instance-method syntax works when linefill is a UDT field.

    get_line1(): LineObject {
        return this.line1;
    }

    get_line2(): LineObject {
        return this.line2;
    }

    set_color(color: any): void {
        if (!this._deleted) {
            // Resolve Series/thunks — instance methods receive raw transpiler
            // values that may still be wrapped (unlike LinefillHelper.set_color
            // which calls _resolve()).
            if (typeof color === 'function') color = color();
            if (color && typeof color === 'object' && Array.isArray(color.data) && typeof color.get === 'function') {
                color = color.get(0);
            }
            this.color = color || '';
        }
    }

    delete(): void {
        this._deleted = true;
    }

    toPlotData(): any {
        // Inline line data so consumers don't need raw LineObject references
        const serializeLine = (ln: LineObject | null) => {
            if (!ln) return null;
            return {
                id: ln.id, x1: ln.x1, y1: ln.y1, x2: ln.x2, y2: ln.y2,
                xloc: ln.xloc, extend: ln.extend, color: ln.color,
                style: ln.style, width: ln.width, _deleted: ln._deleted,
            };
        };
        // Inherit force_overlay from lines: if either line is force_overlay, the fill is too
        const forceOverlay = !!(this.line1?.force_overlay || this.line2?.force_overlay);
        return {
            id: this.id,
            line1: serializeLine(this.line1),
            line2: serializeLine(this.line2),
            color: this.color,
            force_overlay: forceOverlay,
            _deleted: this._deleted,
        };
    }
}
