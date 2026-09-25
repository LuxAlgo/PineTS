export class Series {
    constructor(public data: any[], public offset: number = 0) { }

    public get(index: number): any {
        // Pine reads an `na` offset as 0: `close[na]` is the current bar.
        if (index == null || Number.isNaN(index)) index = 0;
        // Pine history offsets are integers by definition; a fractional lookback
        // only arises from int-division divergence (e.g. `src[depth/2]`: Pine
        // computes int 5, JS `/` yields 5.5 — see RC2). Truncate the combined
        // lookback toward zero so the access resolves to a real bar instead of a
        // fractional array key (→ undefined). The general int/int→int fix belongs
        // in the transpiler; this is the boundary safety net.
        let lookback = this.offset + index;
        if (!Number.isInteger(lookback)) lookback = Math.trunc(lookback);
        const realIndex = this.data.length - 1 - lookback;
        if (realIndex < 0 || realIndex >= this.data.length) {
            return NaN;
        }
        return this.data[realIndex];
    }

    public set(index: number, value: any): void {
        const realIndex = this.data.length - 1 - (this.offset + index);
        if (realIndex >= 0 && realIndex < this.data.length) {
            this.data[realIndex] = value;
        }
    }

    public get length(): number {
        return this.data.length;
    }

    public toArray(): any[] {
        return this.data;
    }

    static from(source: any): Series {
        if (source instanceof Series) return source;
        if (Array.isArray(source)) return new Series(source);
        if (source != null && typeof source === 'object' && '__value' in source) {
            const inner = source.__value;
            // Dual-use helpers (time, time_close, ...) expose their backing Series.
            if (inner instanceof Series) return inner;
            // The `na` helper (NAHelper) exposes a scalar NaN. Resolve it so that
            // `nz(na)`, UDT field defaults like `float x = na`, and any other
            // consumer that goes through Series.from() see a real NaN instead of
            // the helper object itself.
            if (inner === null || typeof inner !== 'object') return new Series([inner]);
        }
        return new Series([source]); // Treat scalar as single-element array? Or handle differently?
        // Ideally, scalar should be treated as a series where get(0) returns the value, and get(>0) might be undefined or NaN?
        // But for now, let's wrap in array.
    }
}
