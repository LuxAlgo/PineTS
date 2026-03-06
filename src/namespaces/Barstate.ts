import { Series } from '../Series';

export class Barstate {
    private _live: boolean = false;

    constructor(private context: any) { }
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
        return this.context.idx < this.context.length - 1;
    }

    public get isrealtime() {
        return this.context.idx === this.context.length - 1;
    }

    public get isconfirmed() {
        return this.context.data.closeTime.data[this.context.idx] <= new Date().getTime();
    }

    public get islastconfirmedhistory() {
        //FIXME : this is a temporary solution to get the islastconfirmedhistory value,
        //we need to implement a better way to handle it based on market data
        return (
            // this is the last and isconfirmed
            this.context.idx === this.context.length - 1 && this.isconfirmed ||
            // this is the second to last and the last is not confirmed
            this.context.idx === this.context.length - 2 && this.context.data.closeTime.data[this.context.length - 1] > new Date().getTime());
    }
}
