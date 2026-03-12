export class Series {
    constructor(public data: any[], public offset: number = 0) { }

    public get(index: number): any {
        const realIndex = this.data.length - 1 - (this.offset + index);
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
        if (source != null && typeof source === 'object' && '__value' in source && source.__value instanceof Series) return source.__value;
        return new Series([source]); // Treat scalar as single-element array? Or handle differently?
        // Ideally, scalar should be treated as a series where get(0) returns the value, and get(>0) might be undefined or NaN?
        // But for now, let's wrap in array.
    }
}
