// SPDX-License-Identifier: AGPL-3.0-only

import { ChartPointObject } from '../chart/ChartPointObject';

let _polylineIdCounter = 0;

export function resetPolylineIdCounter() {
    _polylineIdCounter = 0;
}

export class PolylineObject {
    public id: number;
    public points: ChartPointObject[];
    public curved: boolean;
    public closed: boolean;
    public xloc: string;
    public line_color: string;
    public fill_color: string;
    public line_style: string;
    public line_width: number;
    public force_overlay: boolean;
    public _deleted: boolean;

    constructor(
        points: ChartPointObject[],
        curved: boolean = false,
        closed: boolean = false,
        xloc: string = 'bi',
        line_color: string = '#2962ff',
        fill_color: string = '',
        line_style: string = 'style_solid',
        line_width: number = 1,
        force_overlay: boolean = false,
    ) {
        this.id = _polylineIdCounter++;
        this.points = points;
        this.curved = curved;
        this.closed = closed;
        this.xloc = xloc;
        this.line_color = line_color;
        this.fill_color = fill_color;
        this.line_style = line_style;
        this.line_width = line_width;
        this.force_overlay = force_overlay;
        this._deleted = false;
    }

    delete(): void {
        this._deleted = true;
    }
}
