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
        return !this.isrealtime;
    }

    // The last loaded bar is the realtime bar; with live updates, so is every bar from the one that was
    // last when they began — including the execution that closes a bar after the next one has arrived.
    public get isrealtime() {
        const liveFrom = this.context._liveFromIdx;
        if (liveFrom !== undefined && this.context.idx >= liveFrom) return true;
        // Use context.length (total bar count) instead of the incrementally-built
        // context.data series, which only hold bars 0..idx during execution.
        return this.context.idx === this.context.length - 1;
    }

    public get isconfirmed() {
        // Check if the CURRENT bar (not the last bar) has closed.
        // Historical bars are always confirmed; only the live bar is unconfirmed.
        // closeTime is a Series object — access .data[] for raw array indexing.
        const closeTime = this.context.data.closeTime.data[this.context.idx];
        return closeTime <= Date.now();
    }

    public get islastconfirmedhistory() {
        // True on exactly ONE bar: the last confirmed historical bar.
        // Per Pine Script docs: "Returns true if script is executing on the
        // dataset's last bar when market is closed, or on the bar immediately
        // preceding the real-time bar if market is open."
        //
        // Uses context.length (total bar count, set before iteration) instead
        // of the incrementally-built context.data arrays, which only contain
        // bars 0..idx during execution and would falsely return true on every bar.
        const idx = this.context.idx;
        const totalBars = this.context.length;

        if (idx === totalBars - 1) {
            // Last bar in the dataset — true only if market is closed
            // (i.e., this bar's close time is in the past → it's confirmed)
            const closeTime = this.context.data.closeTime.data[idx];
            return closeTime <= Date.now();
        }

        if (idx === totalBars - 2) {
            // Second-to-last bar — true if the last bar is a live/realtime bar
            // (i.e., the last bar's close time is still in the future).
            // Read from context.marketData (full raw candle array, available
            // before iteration starts) to peek at the last bar's close time.
            const lastCloseTime = this.context.marketData?.[totalBars - 1]?.closeTime;
            if (lastCloseTime !== undefined) {
                return lastCloseTime > Date.now();
            }
            return false;
        }

        return false;
    }
}
