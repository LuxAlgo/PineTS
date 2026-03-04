// SPDX-License-Identifier: AGPL-3.0-only

let _lineIdCounter = 0;

export function resetLineIdCounter() {
    _lineIdCounter = 0;
}

export class LineObject {
    public id: number;
    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;
    public xloc: string;
    public extend: string;
    public color: string;
    public style: string;
    public width: number;
    public force_overlay: boolean;
    public _deleted: boolean;

    constructor(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        xloc: string = 'bi',
        extend: string = 'none',
        color: string = '',
        style: string = 'style_solid',
        width: number = 1,
        force_overlay: boolean = false,
    ) {
        this.id = _lineIdCounter++;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.xloc = xloc;
        this.extend = extend;
        this.color = color;
        this.style = style;
        this.width = width;
        this.force_overlay = force_overlay;
        this._deleted = false;
    }

    delete(): void {
        this._deleted = true;
    }

    copy(): LineObject {
        const ln = new LineObject(
            this.x1,
            this.y1,
            this.x2,
            this.y2,
            this.xloc,
            this.extend,
            this.color,
            this.style,
            this.width,
            this.force_overlay,
        );
        return ln;
    }

    toPlotData(): any {
        return {
            id: this.id,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            xloc: this.xloc,
            extend: this.extend,
            color: this.color,
            style: this.style,
            width: this.width,
            force_overlay: this.force_overlay,
        };
    }
}
