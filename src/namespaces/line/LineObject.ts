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
    public _helper: any;
    /** Bar index at which this object was created (for streaming rollback) */
    public _createdAtBar: number = -1;

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
        this._helper = null;
    }

    // --- Delegate methods for method-call syntax (e.g. myLine.set_x2(x)) ---

    set_x1(x: number): void { if (this._helper) this._helper.set_x1(this, x); else if (!this._deleted) this.x1 = x; }
    set_y1(y: number): void { if (this._helper) this._helper.set_y1(this, y); else if (!this._deleted) this.y1 = y; }
    set_x2(x: number): void { if (this._helper) this._helper.set_x2(this, x); else if (!this._deleted) this.x2 = x; }
    set_y2(y: number): void { if (this._helper) this._helper.set_y2(this, y); else if (!this._deleted) this.y2 = y; }
    set_xy1(x: number, y: number): void { if (this._helper) this._helper.set_xy1(this, x, y); else if (!this._deleted) { this.x1 = x; this.y1 = y; } }
    set_xy2(x: number, y: number): void { if (this._helper) this._helper.set_xy2(this, x, y); else if (!this._deleted) { this.x2 = x; this.y2 = y; } }
    set_color(color: string): void { if (this._helper) this._helper.set_color(this, color); else if (!this._deleted) this.color = color; }
    set_width(width: number): void { if (this._helper) this._helper.set_width(this, width); else if (!this._deleted) this.width = width; }
    set_style(style: string): void { if (this._helper) this._helper.set_style(this, style); else if (!this._deleted) this.style = style; }
    set_extend(extend: string): void { if (this._helper) this._helper.set_extend(this, extend); else if (!this._deleted) this.extend = extend; }
    set_xloc(x1: number, x2: number, xloc: string): void { if (this._helper) this._helper.set_xloc(this, x1, x2, xloc); else if (!this._deleted) { this.x1 = x1; this.x2 = x2; this.xloc = xloc; } }
    set_first_point(point: any): void { if (this._helper) this._helper.set_first_point(this, point); }
    set_second_point(point: any): void { if (this._helper) this._helper.set_second_point(this, point); }

    get_x1(): number { return this.x1; }
    get_y1(): number { return this.y1; }
    get_x2(): number { return this.x2; }
    get_y2(): number { return this.y2; }
    get_price(x: number): number { if (this._helper) return this._helper.get_price(this, x); return NaN; }

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
