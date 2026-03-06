// SPDX-License-Identifier: AGPL-3.0-only

let _boxIdCounter = 0;

export function resetBoxIdCounter() {
    _boxIdCounter = 0;
}

export class BoxObject {
    public id: number;
    // Coordinates
    public left: number;
    public top: number;
    public right: number;
    public bottom: number;
    // Positioning
    public xloc: string;
    public extend: string;
    // Border styling
    public border_color: string;
    public border_style: string;
    public border_width: number;
    // Fill
    public bgcolor: string;
    // Text
    public text: string;
    public text_color: string;
    public text_size: string;
    public text_halign: string;
    public text_valign: string;
    public text_wrap: string;
    public text_font_family: string;
    public text_formatting: string;
    // Flags
    public force_overlay: boolean;
    public _deleted: boolean;
    public _helper: any;
    /** Bar index at which this object was created (for streaming rollback) */
    public _createdAtBar: number = -1;

    constructor(
        left: number,
        top: number,
        right: number,
        bottom: number,
        xloc: string = 'bi',
        extend: string = 'none',
        border_color: string = '#2962ff',
        border_style: string = 'style_solid',
        border_width: number = 1,
        bgcolor: string = '#2962ff',
        text: string = '',
        text_color: string = '#000000',
        text_size: string = 'auto',
        text_halign: string = 'center',
        text_valign: string = 'center',
        text_wrap: string = 'wrap_none',
        text_font_family: string = 'default',
        text_formatting: string = 'format_none',
        force_overlay: boolean = false,
    ) {
        this.id = _boxIdCounter++;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.xloc = xloc;
        this.extend = extend;
        this.border_color = border_color;
        this.border_style = border_style;
        this.border_width = border_width;
        this.bgcolor = bgcolor;
        this.text = text;
        this.text_color = text_color;
        this.text_size = text_size;
        this.text_halign = text_halign;
        this.text_valign = text_valign;
        this.text_wrap = text_wrap;
        this.text_font_family = text_font_family;
        this.text_formatting = text_formatting;
        this.force_overlay = force_overlay;
        this._deleted = false;
        this._helper = null;
    }

    // --- Delegate methods for method-call syntax (e.g. myBox.set_right(x)) ---

    set_left(left: number): void { if (this._helper) this._helper.set_left(this, left); else if (!this._deleted) this.left = left; }
    set_right(right: number): void { if (this._helper) this._helper.set_right(this, right); else if (!this._deleted) this.right = right; }
    set_top(top: number): void { if (this._helper) this._helper.set_top(this, top); else if (!this._deleted) this.top = top; }
    set_bottom(bottom: number): void { if (this._helper) this._helper.set_bottom(this, bottom); else if (!this._deleted) this.bottom = bottom; }
    set_lefttop(left: number, top: number): void { if (this._helper) this._helper.set_lefttop(this, left, top); else if (!this._deleted) { this.left = left; this.top = top; } }
    set_rightbottom(right: number, bottom: number): void { if (this._helper) this._helper.set_rightbottom(this, right, bottom); else if (!this._deleted) { this.right = right; this.bottom = bottom; } }
    set_top_left_point(point: any): void { if (this._helper) this._helper.set_top_left_point(this, point); }
    set_bottom_right_point(point: any): void { if (this._helper) this._helper.set_bottom_right_point(this, point); }
    set_xloc(left: number, right: number, xloc: string): void { if (this._helper) this._helper.set_xloc(this, left, right, xloc); else if (!this._deleted) { this.left = left; this.right = right; this.xloc = xloc; } }
    set_bgcolor(color: string): void { if (this._helper) this._helper.set_bgcolor(this, color); else if (!this._deleted) this.bgcolor = color; }
    set_border_color(color: string): void { if (this._helper) this._helper.set_border_color(this, color); else if (!this._deleted) this.border_color = color; }
    set_border_width(width: number): void { if (this._helper) this._helper.set_border_width(this, width); else if (!this._deleted) this.border_width = width; }
    set_border_style(style: string): void { if (this._helper) this._helper.set_border_style(this, style); else if (!this._deleted) this.border_style = style; }
    set_extend(extend: string): void { if (this._helper) this._helper.set_extend(this, extend); else if (!this._deleted) this.extend = extend; }
    set_text(text: string): void { if (this._helper) this._helper.set_text(this, text); else if (!this._deleted) this.text = text; }
    set_text_color(color: string): void { if (this._helper) this._helper.set_text_color(this, color); else if (!this._deleted) this.text_color = color; }
    set_text_size(size: string): void { if (this._helper) this._helper.set_text_size(this, size); else if (!this._deleted) this.text_size = size; }
    set_text_halign(align: string): void { if (this._helper) this._helper.set_text_halign(this, align); else if (!this._deleted) this.text_halign = align; }
    set_text_valign(align: string): void { if (this._helper) this._helper.set_text_valign(this, align); else if (!this._deleted) this.text_valign = align; }
    set_text_wrap(wrap: string): void { if (this._helper) this._helper.set_text_wrap(this, wrap); else if (!this._deleted) this.text_wrap = wrap; }
    set_text_font_family(family: string): void { if (this._helper) this._helper.set_text_font_family(this, family); else if (!this._deleted) this.text_font_family = family; }
    set_text_formatting(formatting: string): void { if (this._helper) this._helper.set_text_formatting(this, formatting); else if (!this._deleted) this.text_formatting = formatting; }

    get_left(): number { return this.left; }
    get_right(): number { return this.right; }
    get_top(): number { return this.top; }
    get_bottom(): number { return this.bottom; }

    delete(): void {
        this._deleted = true;
    }

    copy(): BoxObject {
        const b = new BoxObject(
            this.left, this.top, this.right, this.bottom,
            this.xloc, this.extend,
            this.border_color, this.border_style, this.border_width,
            this.bgcolor,
            this.text, this.text_color, this.text_size,
            this.text_halign, this.text_valign, this.text_wrap,
            this.text_font_family, this.text_formatting,
            this.force_overlay,
        );
        return b;
    }
}
