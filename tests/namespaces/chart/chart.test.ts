import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('CHART Namespace', () => {
    describe('chart.point', () => {
        it('chart.point.new() creates point with given properties', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var myPoint = chart.point.new(1000, 5, 50000);
                var pt_time = myPoint.time;
                var pt_index = myPoint.index;
                var pt_price = myPoint.price;
                return { pt_time, pt_index, pt_price };
            });

            expect(result.pt_time[0]).toBe(1000);
            expect(result.pt_index[0]).toBe(5);
            expect(result.pt_price[0]).toBe(50000);
        });

        it('chart.point.from_index() creates point from bar index', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var myPoint = chart.point.from_index(42, 75000);
                var pt_index = myPoint.index;
                var pt_price = myPoint.price;
                var hasTime = myPoint.time !== undefined;
                return { pt_index, pt_price, hasTime };
            });

            expect(result.pt_index[0]).toBe(42);
            expect(result.pt_price[0]).toBe(75000);
            expect(result.hasTime[0]).toBe(false);
        });

        it('chart.point.from_time() creates point from timestamp', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var myPoint = chart.point.from_time(1700000000000, 80000);
                var pt_time = myPoint.time;
                var pt_price = myPoint.price;
                var hasIndex = myPoint.index !== undefined;
                return { pt_time, pt_price, hasIndex };
            });

            expect(result.pt_time[0]).toBe(1700000000000);
            expect(result.pt_price[0]).toBe(80000);
            expect(result.hasIndex[0]).toBe(false);
        });

        it('chart.point.now() creates point at current bar', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var myPoint = chart.point.now(65000);
                var pt_index = myPoint.index;
                var pt_price = myPoint.price;
                var hasTime = myPoint.time !== undefined;
                var matchesBarIndex = myPoint.index === bar_index;
                return { pt_index, pt_price, hasTime, matchesBarIndex };
            });

            expect(result.pt_price[0]).toBe(65000);
            expect(result.pt_index[0]).toBe(0);
            expect(result.hasTime[0]).toBe(true);
            expect(result.matchesBarIndex[0]).toBe(true);
        });

        it('chart.point.copy() creates independent clone', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var orig = chart.point.new(1000, 5, 50000);
                var cp = chart.point.copy(orig);
                var origPrice = orig.price;
                var copyPrice = cp.price;

                cp.price = 99999;
                var origPriceAfter = orig.price;
                var copyPriceAfter = cp.price;

                return { origPrice, copyPrice, origPriceAfter, copyPriceAfter };
            });

            expect(result.origPrice[0]).toBe(50000);
            expect(result.copyPrice[0]).toBe(50000);
            expect(result.origPriceAfter[0]).toBe(50000);
            expect(result.copyPriceAfter[0]).toBe(99999);
        });
    });

    describe('chart properties', () => {
        it('chart.bg_color() returns a color string', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var bgColor = chart.bg_color();
                return { bgColor };
            });

            expect(typeof result.bgColor[0]).toBe('string');
            expect(result.bgColor[0].length).toBeGreaterThan(0);
        });

        it('chart.fg_color() returns a color string', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var fgColor = chart.fg_color();
                return { fgColor };
            });

            expect(typeof result.fgColor[0]).toBe('string');
            expect(result.fgColor[0].length).toBeGreaterThan(0);
        });

        it('chart.is_standard() returns true', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var isStandard = chart.is_standard();
                return { isStandard };
            });

            expect(result.isStandard[0]).toBe(true);
        });
    });

    describe('chart.point integration with label', () => {
        it('label.set_point() uses chart.point from_index coordinates', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var myLabel = label.new(bar_index, close, 'PointInteg');
                var myPoint = chart.point.from_index(55, 90000);
                label.set_point(myLabel, myPoint);
                var lblX = myLabel.x;
                var lblY = myLabel.y;
                var lblXloc = myLabel.xloc;
                return { lblX, lblY, lblXloc };
            });

            expect(result.lblX[0]).toBe(55);
            expect(result.lblY[0]).toBe(90000);
            expect(result.lblXloc[0]).toBe('bar_index');
        });

        it('label.set_point() with time-based point sets xloc to bar_time', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-11-20').getTime());

            const { result } = await pineTS.run((context) => {
                var myLabel = label.new(bar_index, close, 'TimePoint');
                var myPoint = chart.point.from_time(1700000000000, 85000);
                label.set_point(myLabel, myPoint);
                var lblX = myLabel.x;
                var lblXloc = myLabel.xloc;
                return { lblX, lblXloc };
            });

            expect(result.lblX[0]).toBe(1700000000000);
            expect(result.lblXloc[0]).toBe('bar_time');
        });
    });
});
