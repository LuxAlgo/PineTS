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
    }

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
