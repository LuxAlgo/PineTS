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
    }

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
