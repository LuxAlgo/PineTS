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

    delete(): void {
        this._deleted = true;
    }
}
