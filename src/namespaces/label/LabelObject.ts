// SPDX-License-Identifier: AGPL-3.0-only

let _labelIdCounter = 0;

export function resetLabelIdCounter() {
    _labelIdCounter = 0;
}

export class LabelObject {
    public id: number;
    public x: number;
    public y: number;
    public text: string;
    public xloc: string;
    public yloc: string;
    public color: string;
    public style: string;
    public textcolor: string;
    public size: string;
    public textalign: string;
    public tooltip: string;
    public text_font_family: string;
    public force_overlay: boolean;
    public _deleted: boolean;
    public _helper: any;
    /** Bar index at which this object was created (for streaming rollback) */
    public _createdAtBar: number = -1;

    constructor(
        x: number,
        y: number,
        text: string = '',
        xloc: string = 'bi',
        yloc: string = 'pr',
        color: string = '',
        style: string = 'style_label_down',
        textcolor: string = '',
        size: string = 'normal',
        textalign: string = 'center',
        tooltip: string = '',
        text_font_family: string = 'default',
        force_overlay: boolean = false,
    ) {
        this.id = _labelIdCounter++;
        this.x = x;
        this.y = y;
        this.text = text;
        this.xloc = xloc;
        this.yloc = yloc;
        this.color = color;
        this.style = style;
        this.textcolor = textcolor;
        this.size = size;
        this.textalign = textalign;
        this.tooltip = tooltip;
        this.text_font_family = text_font_family;
        this.force_overlay = force_overlay;
        this._deleted = false;
        this._helper = null;
    }

    // --- Delegate methods for method-call syntax (e.g. myLabel.set_x(x)) ---

    set_x(x: number): void { if (this._helper) this._helper.set_x(this, x); else if (!this._deleted) this.x = x; }
    set_y(y: number): void { if (this._helper) this._helper.set_y(this, y); else if (!this._deleted) this.y = y; }
    set_xy(x: number, y: number): void { if (this._helper) this._helper.set_xy(this, x, y); else if (!this._deleted) { this.x = x; this.y = y; } }
    set_text(text: string): void { if (this._helper) this._helper.set_text(this, text); else if (!this._deleted) this.text = text; }
    set_color(color: string): void { if (this._helper) this._helper.set_color(this, color); else if (!this._deleted) this.color = color; }
    set_textcolor(textcolor: string): void { if (this._helper) this._helper.set_textcolor(this, textcolor); else if (!this._deleted) this.textcolor = textcolor; }
    set_size(size: string): void { if (this._helper) this._helper.set_size(this, size); else if (!this._deleted) this.size = size; }
    set_style(style: string): void { if (this._helper) this._helper.set_style(this, style); else if (!this._deleted) this.style = style; }
    set_textalign(textalign: string): void { if (this._helper) this._helper.set_textalign(this, textalign); else if (!this._deleted) this.textalign = textalign; }
    set_tooltip(tooltip: string): void { if (this._helper) this._helper.set_tooltip(this, tooltip); else if (!this._deleted) this.tooltip = tooltip; }
    set_xloc(xloc: string): void { if (this._helper) this._helper.set_xloc(this, xloc); else if (!this._deleted) this.xloc = xloc; }
    set_yloc(yloc: string): void { if (this._helper) this._helper.set_yloc(this, yloc); else if (!this._deleted) this.yloc = yloc; }
    set_point(point: any): void { if (this._helper) this._helper.set_point(this, point); }
    set_text_font_family(family: string): void { if (!this._deleted) this.text_font_family = family; }

    get_x(): number { return this.x; }
    get_y(): number { return this.y; }
    get_text(): string { return this.text; }

    delete(): void {
        this._deleted = true;
    }

    copy(): LabelObject {
        const lbl = new LabelObject(
            this.x,
            this.y,
            this.text,
            this.xloc,
            this.yloc,
            this.color,
            this.style,
            this.textcolor,
            this.size,
            this.textalign,
            this.tooltip,
            this.text_font_family,
            this.force_overlay,
        );
        return lbl;
    }

    toPlotData(): any {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            text: this.text,
            xloc: this.xloc,
            yloc: this.yloc,
            color: this.color,
            style: this.style,
            textcolor: this.textcolor,
            size: this.size,
            textalign: this.textalign,
            tooltip: this.tooltip,
            text_font_family: this.text_font_family,
            force_overlay: this.force_overlay,
        };
    }
}
