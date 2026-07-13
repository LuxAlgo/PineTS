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
        // Resolve Series/function args to their current scalar value, so a point
        // built from a bare series (e.g. chart.point.from_index(bar_index, close))
        // captures the creation-bar value instead of storing the live series.
        const res = (v: any): any => {
            if (v === null || v === undefined) return v;
            if (typeof v === 'object' && Array.isArray(v.data) && typeof v.get === 'function') return v.get(0);
            if (typeof v === 'function') return v();
            return v;
        };
        this.point = {
            new(time?: number, index?: number, price?: number): ChartPointObject {
                return new ChartPointObject(res(time), res(index), res(price) ?? NaN);
            },
            from_index(index: number, price: number): ChartPointObject {
                return new ChartPointObject(undefined, res(index), res(price));
            },
            from_time(time: number, price: number): ChartPointObject {
                return new ChartPointObject(res(time), undefined, res(price));
            },
            copy(point: ChartPointObject): ChartPointObject {
                return point.copy();
            },
            now(price: number): ChartPointObject {
                const idx = ctx.idx;
                const time = ctx.marketData[idx]?.openTime;
                return new ChartPointObject(time, idx, res(price));
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
        return '#d1d4dc';
    }

    is_standard(): boolean {
        const style = this.context?.chartStyle;
        return style == null || style === 'standard';
    }

    is_heikinashi(): boolean {
        return this.context?.chartStyle === 'heikinashi';
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
