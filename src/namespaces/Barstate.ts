import { Series } from '../Series';

export class Barstate {
    private _live: boolean = false;

    constructor(private context: any) {}
    public setLive() {
        this._live = true;
    }
    public get isnew() {
        return !this._live;
    }

    public get islast() {
        return this.context.idx === this.context.length - 1;
    }

    public get isfirst() {
        return this.context.idx === 0;
    }

    public get ishistory() {
        return this.context.idx < this.context.data.close.data.length - 1;
    }

    public get isrealtime() {
        return this.context.idx === this.context.data.close.data.length - 1;
    }

    public get isconfirmed() {
        // Check if the CURRENT bar (not the last bar) has closed.
        // Historical bars are always confirmed; only the live bar is unconfirmed.
        // closeTime is a Series object — access .data[] for raw array indexing.
        const closeTime = this.context.data.closeTime.data[this.context.idx];
        return closeTime <= Date.now();
    }

    public get islastconfirmedhistory() {
        // True when this is the last bar whose close time is in the past
        // (the bar right before the current live bar).
        const closeTime = this.context.data.closeTime.data[this.context.idx];
        const nextCloseTime = this.context.data.closeTime.data[this.context.idx + 1];
        return closeTime <= Date.now() && (nextCloseTime === undefined || nextCloseTime > Date.now());
    }
}
