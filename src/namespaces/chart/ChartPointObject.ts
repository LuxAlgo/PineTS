// SPDX-License-Identifier: AGPL-3.0-only

export class ChartPointObject {
    public time: number | undefined;
    public index: number | undefined;
    public price: number;

    constructor(time: number | undefined, index: number | undefined, price: number) {
        this.time = time;
        this.index = index;
        this.price = price;
    }

    copy(): ChartPointObject {
        return new ChartPointObject(this.time, this.index, this.price);
    }

    toString(): string {
        return JSON.stringify({ time: this.time, index: this.index, price: this.price });
    }
}
