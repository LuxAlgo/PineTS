// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { LineObject } from './LineObject';
import { LinefillObject } from './LinefillObject';

/**
 * Pine Script linefill namespace implementation.
 * Provides functions for creating and managing linefill drawing objects.
 */
export class Linefill {
    private _linefills: LinefillObject[] = [];

    constructor(private context: any) {}

    /**
     * Helper method to unwrap Series values
     */
    param(source: any, index: number = 0): any {
        return Series.from(source).get(index);
    }

    /**
     * Returns an array of all linefill objects on the chart.
     */
    get all(): LinefillObject[] {
        return this._linefills.filter((l: any) => !l._deleted);
    }

    /**
     * Creates a new linefill object.
     */
    new(line1: LineObject, line2: LineObject, color?: string): LinefillObject {
        const linefill = new LinefillObject(this.context, {
            line1: line1,
            line2: line2,
            color: color ? Series.from(color).get(0) : undefined,
        });

        this._linefills.push(linefill);
        return linefill;
    }

    /**
     * Deletes a linefill object.
     */
    delete(id: LinefillObject): void {
        if (id) {
            id.delete();
        }
    }

    // Getter wrappers
    get_line1(id: LinefillObject): LineObject | null {
        return id?.get_line1() ?? null;
    }

    get_line2(id: LinefillObject): LineObject | null {
        return id?.get_line2() ?? null;
    }

    // Setter wrapper
    set_color(id: LinefillObject, color: string): void {
        id?.set_color(color);
    }
}
