import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('Constants', () => {
    // Helper: create a PineTS instance with a short date range (only need 1 bar)
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

    // ── shape ──────────────────────────────────────────────────────────
    it('shape.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                arrowdown: shape.arrowdown,
                arrowup: shape.arrowup,
                circle: shape.circle,
                cross: shape.cross,
                diamond: shape.diamond,
                flag: shape.flag,
                labeldown: shape.labeldown,
                labelup: shape.labelup,
                square: shape.square,
                triangledown: shape.triangledown,
                triangleup: shape.triangleup,
                xcross: shape.xcross,
            };
        });

        expect(result.arrowdown[0]).toBe('shape_arrow_down');
        expect(result.arrowup[0]).toBe('shape_arrow_up');
        expect(result.circle[0]).toBe('shape_circle');
        expect(result.cross[0]).toBe('shape_cross');
        expect(result.diamond[0]).toBe('shape_diamond');
        expect(result.flag[0]).toBe('shape_flag');
        expect(result.labeldown[0]).toBe('shape_label_down');
        expect(result.labelup[0]).toBe('shape_label_up');
        expect(result.square[0]).toBe('shape_square');
        expect(result.triangledown[0]).toBe('shape_triangle_down');
        expect(result.triangleup[0]).toBe('shape_triangle_up');
        expect(result.xcross[0]).toBe('shape_xcross');
    });

    // ── location ───────────────────────────────────────────────────────
    it('location.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                abovebar: location.abovebar,
                belowbar: location.belowbar,
                absolute: location.absolute,
                bottom: location.bottom,
                top: location.top,
            };
        });

        expect(result.abovebar[0]).toBe('AboveBar');
        expect(result.belowbar[0]).toBe('BelowBar');
        expect(result.absolute[0]).toBe('Absolute');
        expect(result.bottom[0]).toBe('Bottom');
        expect(result.top[0]).toBe('Top');
    });

    // ── size ───────────────────────────────────────────────────────────
    it('size.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                auto: size.auto,
                tiny: size.tiny,
                small: size.small,
                normal: size.normal,
                large: size.large,
                huge: size.huge,
            };
        });

        expect(result.auto[0]).toBe('auto');
        expect(result.tiny[0]).toBe('tiny');
        expect(result.small[0]).toBe('small');
        expect(result.normal[0]).toBe('normal');
        expect(result.large[0]).toBe('large');
        expect(result.huge[0]).toBe('huge');
    });

    // ── format ─────────────────────────────────────────────────────────
    it('format.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                inherit: format.inherit,
                mintick: format.mintick,
                percent: format.percent,
                price: format.price,
                volume: format.volume,
            };
        });

        expect(result.inherit[0]).toBe('inherit');
        expect(result.mintick[0]).toBe('mintick');
        expect(result.percent[0]).toBe('percent');
        expect(result.price[0]).toBe('price');
        expect(result.volume[0]).toBe('volume');
    });

    // ── xloc ───────────────────────────────────────────────────────────
    it('xloc.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                bar_index: xloc.bar_index,
                bar_time: xloc.bar_time,
            };
        });

        expect(result.bar_index[0]).toBe('bi');
        expect(result.bar_time[0]).toBe('bt');
    });

    // ── yloc ───────────────────────────────────────────────────────────
    it('yloc.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                price: yloc.price,
                abovebar: yloc.abovebar,
                belowbar: yloc.belowbar,
            };
        });

        expect(result.price[0]).toBe('pr');
        expect(result.abovebar[0]).toBe('ab');
        expect(result.belowbar[0]).toBe('bl');
    });

    // ── text ───────────────────────────────────────────────────────────
    it('text.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                align_left: text.align_left,
                align_center: text.align_center,
                align_right: text.align_right,
                wrap_auto: text.wrap_auto,
                wrap_none: text.wrap_none,
            };
        });

        expect(result.align_left[0]).toBe('left');
        expect(result.align_center[0]).toBe('center');
        expect(result.align_right[0]).toBe('right');
        expect(result.wrap_auto[0]).toBe('auto');
        expect(result.wrap_none[0]).toBe('none');
    });

    // ── font ───────────────────────────────────────────────────────────
    it('font.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                family_default: font.family_default,
                family_monospace: font.family_monospace,
            };
        });

        expect(result.family_default[0]).toBe('default');
        expect(result.family_monospace[0]).toBe('monospace');
    });

    // ── adjustment ─────────────────────────────────────────────────────
    it('adjustment.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                none: adjustment.none,
                splits: adjustment.splits,
                dividends: adjustment.dividends,
            };
        });

        expect(result.none[0]).toBe('none');
        expect(result.splits[0]).toBe('splits');
        expect(result.dividends[0]).toBe('dividends');
    });

    // ── backadjustment ─────────────────────────────────────────────────
    it('backadjustment.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                inherit: backadjustment.inherit,
                off: backadjustment.off,
                on: backadjustment.on,
            };
        });

        expect(result.inherit[0]).toBe('inherit');
        expect(result.off[0]).toBe('off');
        expect(result.on[0]).toBe('on');
    });

    // ── earnings ───────────────────────────────────────────────────────
    it('earnings.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                actual: earnings.actual,
                estimate: earnings.estimate,
                standardized: earnings.standardized,
                future_eps: earnings.future_eps,
                future_period_end_time: earnings.future_period_end_time,
                future_revenue: earnings.future_revenue,
                future_time: earnings.future_time,
            };
        });

        expect(result.actual[0]).toBe('earnings_actual');
        expect(result.estimate[0]).toBe('earnings_estimate');
        expect(result.standardized[0]).toBe('earnings_standardized');
        expect(result.future_eps[0]).toBe('earnings_future_eps');
        expect(result.future_period_end_time[0]).toBe('earnings_future_period_end_time');
        expect(result.future_revenue[0]).toBe('earnings_future_revenue');
        expect(result.future_time[0]).toBe('earnings_future_time');
    });

    // ── dividends ──────────────────────────────────────────────────────
    it('dividends.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                gross: dividends.gross,
                net: dividends.net,
                future_amount: dividends.future_amount,
                future_ex_date: dividends.future_ex_date,
                future_pay_date: dividends.future_pay_date,
            };
        });

        expect(result.gross[0]).toBe('dividends_gross');
        expect(result.net[0]).toBe('dividends_net');
        expect(result.future_amount[0]).toBe('dividends_future_amount');
        expect(result.future_ex_date[0]).toBe('dividends_future_ex_date');
        expect(result.future_pay_date[0]).toBe('dividends_future_pay_date');
    });

    // ── splits ─────────────────────────────────────────────────────────
    it('splits.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                denominator: splits.denominator,
                numerator: splits.numerator,
            };
        });

        expect(result.denominator[0]).toBe('splits_denominator');
        expect(result.numerator[0]).toBe('splits_numerator');
    });

    // ── dayofweek ──────────────────────────────────────────────────────
    it('dayofweek.* constants have correct numeric values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                sunday: dayofweek.sunday,
                monday: dayofweek.monday,
                tuesday: dayofweek.tuesday,
                wednesday: dayofweek.wednesday,
                thursday: dayofweek.thursday,
                friday: dayofweek.friday,
                saturday: dayofweek.saturday,
            };
        });

        expect(result.sunday[0]).toBe(1);
        expect(result.monday[0]).toBe(2);
        expect(result.tuesday[0]).toBe(3);
        expect(result.wednesday[0]).toBe(4);
        expect(result.thursday[0]).toBe(5);
        expect(result.friday[0]).toBe(6);
        expect(result.saturday[0]).toBe(7);
    });

    // ── order ──────────────────────────────────────────────────────────
    it('order.* constants have correct numeric values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                ascending: order.ascending,
                descending: order.descending,
            };
        });

        expect(result.ascending[0]).toBe(1);
        expect(result.descending[0]).toBe(0);
    });

    // ── display ────────────────────────────────────────────────────────
    it('display.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                all: display.all,
                data_window: display.data_window,
                none: display.none,
                pane: display.pane,
                price_scale: display.price_scale,
                status_line: display.status_line,
            };
        });

        expect(result.all[0]).toBe('all');
        expect(result.data_window[0]).toBe('data_window');
        expect(result.none[0]).toBe('none');
        expect(result.pane[0]).toBe('pane');
        expect(result.price_scale[0]).toBe('price_scale');
        expect(result.status_line[0]).toBe('status_line');
    });

    // ── barmerge ───────────────────────────────────────────────────────
    it('barmerge.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                gaps_on: barmerge.gaps_on,
                gaps_off: barmerge.gaps_off,
                lookahead_on: barmerge.lookahead_on,
                lookahead_off: barmerge.lookahead_off,
            };
        });

        expect(result.gaps_on[0]).toBe('gaps_on');
        expect(result.gaps_off[0]).toBe('gaps_off');
        expect(result.lookahead_on[0]).toBe('lookahead_on');
        expect(result.lookahead_off[0]).toBe('lookahead_off');
    });

    // ── extend ────────────────────────────────────────────────────────
    it('extend.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                left: extend.left,
                right: extend.right,
                both: extend.both,
                none: extend.none,
            };
        });

        expect(result.left[0]).toBe('l');
        expect(result.right[0]).toBe('r');
        expect(result.both[0]).toBe('b');
        expect(result.none[0]).toBe('n');
    });

    // ── position ─────────────────────────────────────────────────────
    it('position.* constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                top_left: position.top_left,
                top_center: position.top_center,
                top_right: position.top_right,
                middle_left: position.middle_left,
                middle_center: position.middle_center,
                middle_right: position.middle_right,
                bottom_left: position.bottom_left,
                bottom_center: position.bottom_center,
                bottom_right: position.bottom_right,
            };
        });

        expect(result.top_left[0]).toBe('top_left');
        expect(result.top_center[0]).toBe('top_center');
        expect(result.top_right[0]).toBe('top_right');
        expect(result.middle_left[0]).toBe('middle_left');
        expect(result.middle_center[0]).toBe('middle_center');
        expect(result.middle_right[0]).toBe('middle_right');
        expect(result.bottom_left[0]).toBe('bottom_left');
        expect(result.bottom_center[0]).toBe('bottom_center');
        expect(result.bottom_right[0]).toBe('bottom_right');
    });

    // ── plot (style constants) ─────────────────────────────────────────
    it('plot.* style constants match TradingView values', async () => {
        const pineTS = makePineTS();

        const { result } = await pineTS.run((context) => {
            return {
                style_line: plot.style_line,
                style_linebr: plot.style_linebr,
                style_stepline: plot.style_stepline,
                style_stepline_diamond: plot.style_stepline_diamond,
                style_steplinebr: plot.style_steplinebr,
                style_area: plot.style_area,
                style_areabr: plot.style_areabr,
                style_columns: plot.style_columns,
                style_histogram: plot.style_histogram,
                style_circles: plot.style_circles,
                style_cross: plot.style_cross,
                linestyle_solid: plot.linestyle_solid,
                linestyle_dotted: plot.linestyle_dotted,
                linestyle_dashed: plot.linestyle_dashed,
            };
        });

        expect(result.style_line[0]).toBe('style_line');
        expect(result.style_linebr[0]).toBe('style_linebr');
        expect(result.style_stepline[0]).toBe('style_stepline');
        expect(result.style_stepline_diamond[0]).toBe('style_stepline_diamond');
        expect(result.style_steplinebr[0]).toBe('style_steplinebr');
        expect(result.style_area[0]).toBe('style_area');
        expect(result.style_areabr[0]).toBe('style_areabr');
        expect(result.style_columns[0]).toBe('style_columns');
        expect(result.style_histogram[0]).toBe('style_histogram');
        expect(result.style_circles[0]).toBe('style_circles');
        expect(result.style_cross[0]).toBe('style_cross');
        expect(result.linestyle_solid[0]).toBe('linestyle_solid');
        expect(result.linestyle_dotted[0]).toBe('linestyle_dotted');
        expect(result.linestyle_dashed[0]).toBe('linestyle_dashed');
    });
});
