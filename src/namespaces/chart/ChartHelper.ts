// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../Series';
import { ChartPointObject } from './ChartPointObject';

export class ChartHelper {
    public point: {
        new: (time?: number, index?: number, price?: number) => ChartPointObject;
        from_index: (index: number, price: number) => ChartPointObject;
        from_time: (time: number, price: number) => ChartPointObject;
        copy: (point: ChartPointObject) => ChartPointObject;
        now: (price: number) => ChartPointObject;
    };

    constructor(private context: any) {
        const ctx = this.context;
        this.point = {
            new(time?: number, index?: number, price?: number): ChartPointObject {
                return new ChartPointObject(time, index, price ?? NaN);
            },
            from_index(index: number, price: number): ChartPointObject {
                return new ChartPointObject(undefined, index, price);
            },
            from_time(time: number, price: number): ChartPointObject {
                return new ChartPointObject(time, undefined, price);
            },
            copy(point: ChartPointObject): ChartPointObject {
                return point.copy();
            },
            now(price: number): ChartPointObject {
                const idx = ctx.idx;
                const time = ctx.marketData[idx]?.openTime;
                return new ChartPointObject(time, idx, price);
            },
        };
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    //FIXME : The values below are hardcoded to match the Pine Script default values, we need to implement a better way to handle chart data
    bg_color(): string {
        return '#1e293b';
    }

    fg_color(): string {
        return '#ffffff';
    }

    is_standard(): boolean {
        return true;
    }

    is_heikinashi(): boolean {
        return false;
    }

    is_kagi(): boolean {
        return false;
    }

    is_linebreak(): boolean {
        return false;
    }

    is_pnf(): boolean {
        return false;
    }

    is_range(): boolean {
        return false;
    }

    is_renko(): boolean {
        return false;
    }
}
