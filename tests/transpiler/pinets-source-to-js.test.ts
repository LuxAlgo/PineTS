import { describe, expect, it } from 'vitest';

import { transpile } from 'transpiler';

/**
 * The goal of this test is to ensure the stability of the transpiler.
 * Since it does some complex code transformations,
 * any update in the transpiler logic can lead to unexpected consequences.
 * If the modifier part breaks previously working logic, this test will fail.
 */
describe('Transpiler', () => {
    it('Native Types', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open, high, low, hlc3, volume } = context.data;
            const { plotchar, color, plot, na, nz } = context.core;

            const ta = context.ta;
            const math = context.math;

            let lowest_signaled_price = nz(open, na);
            let n_a = na;
            if (na(n_a)) {
                n_a = close;
            }
        };

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open, high, low, hlc3, volume} = $.data;
  const {plotchar, color, plot, na, nz} = $.core;
  const ta = $.ta;
  const math = $.math;
  const p0 = $.param(open, undefined, 'p0');
  const p1 = $.param(na.__value, undefined, 'p1');
  $.let.glb1_lowest_signaled_price = $.init($.let.glb1_lowest_signaled_price, nz(p0, p1));
  $.let.glb1_n_a = $.init($.let.glb1_n_a, na.__value);
  const p2 = na.param($.let.glb1_n_a, undefined, 'p2');
  const temp_1 = na.any(p2);
  if (temp_1) {
    $.set($.let.glb1_n_a, $.get(close, 0));
  }
}`;

        expect(result).toBe(expected_code);
    });

    it('Native Data', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open, high, low, hlc3, volume } = context.data;
            const { plotchar, color, plot, na, nz } = context.core;

            const ta = context.ta;
            const math = context.math;

            let lowest_signaled_price = nz(open, na);
            let n_a = na;
            if (na(n_a)) {
                n_a = close;
            }

            return {
                open,
                close,
                high,
                low,
                hlc3,
                volume,
                lowest_signaled_price,
                n_a,
            };
        };

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open, high, low, hlc3, volume} = $.data;
  const {plotchar, color, plot, na, nz} = $.core;
  const ta = $.ta;
  const math = $.math;
  const p0 = $.param(open, undefined, 'p0');
  const p1 = $.param(na.__value, undefined, 'p1');
  $.let.glb1_lowest_signaled_price = $.init($.let.glb1_lowest_signaled_price, nz(p0, p1));
  $.let.glb1_n_a = $.init($.let.glb1_n_a, na.__value);
  const p2 = na.param($.let.glb1_n_a, undefined, 'p2');
  const temp_1 = na.any(p2);
  if (temp_1) {
    $.set($.let.glb1_n_a, $.get(close, 0));
  }
  return {
    open,
    close: close,
    high: high,
    low: low,
    hlc3,
    volume,
    lowest_signaled_price: $.let.glb1_lowest_signaled_price,
    n_a: $.let.glb1_n_a
  };
}`;

        expect(result).toBe(expected_code);
    });

    it('Unwrapped PineTS Code', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        // we expect the transpiler to wrap the code in a context function and add missing namespaces
        const source = `
const ta = context.ta;
const math = context.math;

let lowest_signaled_price = nz(open, na);
let n_a = na;
if (na(n_a)) {
    n_a = close;
}
        `;

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {open, close} = $.data;
  const {na, nz} = $.pine;
  const ta = $.ta;
  const math = $.math;
  const p0 = $.param(open, undefined, 'p0');
  const p1 = $.param(na.__value, undefined, 'p1');
  $.let.glb1_lowest_signaled_price = $.init($.let.glb1_lowest_signaled_price, nz(p0, p1));
  $.let.glb1_n_a = $.init($.let.glb1_n_a, na.__value);
  const p2 = na.param($.let.glb1_n_a, undefined, 'p2');
  const temp_1 = na.any(p2);
  if (temp_1) {
    $.set($.let.glb1_n_a, $.get(close, 0));
  }
}`;

        expect(result).toBe(expected_code);
    });

    it('unary operator in expressions', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        // we expect the transpiler to wrap the code in a context function and add missing namespaces
        const source = `//@version=6
indicator("RSI Divergence Detector", overlay=false)


up = ta.rma(math.max(ta.change(close), 0), 14)
down = ta.rma(-math.min(ta.change(close), 0), 14)`;

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  const {ta, math, indicator} = $.pine;
  const p0 = $.param('RSI Divergence Detector', undefined, 'p0');
  const p1 = $.param({
    overlay: false
  }, undefined, 'p1');
  indicator(p0, p1);
  const p2 = ta.param(close, undefined, 'p2');
  const temp_1 = ta.change(p2, "_ta0");
  const p3 = math.param(temp_1, undefined, 'p3');
  const p4 = math.param(0, undefined, 'p4');
  const temp_2 = math.max(p3, p4);
  const p5 = ta.param(temp_2, undefined, 'p5');
  const p6 = ta.param(14, undefined, 'p6');
  const temp_3 = ta.rma(p5, p6, "_ta1");
  $.let.glb1_up = $.init($.let.glb1_up, temp_3);
  const p7 = ta.param(close, undefined, 'p7');
  const temp_4 = ta.change(p7, "_ta2");
  const p8 = math.param(temp_4, undefined, 'p8');
  const p9 = math.param(0, undefined, 'p9');
  const temp_5 = math.min(p8, p9);
  const p10 = ta.param(-temp_5, undefined, 'p10');
  const p11 = ta.param(14, undefined, 'p11');
  const temp_6 = ta.rma(p10, p11, "_ta3");
  $.let.glb1_down = $.init($.let.glb1_down, temp_6);
}`;

        expect(result).toBe(expected_code);
    });

    it('Inputs', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        // we expect the transpiler to wrap the code in a context function and add missing namespaces
        const source = `
let _int = input.int({title: 'Fast Length', defval: 12});

let _string = input.string({title: 'String Input', defval: "Hello"});
let _float = input.float(10.0, "float input", {minval: 0.0, maxval: 100.0, step: 0.1});

let src_close = input({ title: 'Close Source', defval: close });

let src_open = input.any({ title: 'Open Source', defval: open });
      `;

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {open, close} = $.data;
  const {input} = $.pine;
  const p0 = input.param({
    title: 'Fast Length',
    defval: 12
  }, undefined, 'p0');
  const temp_1 = input.int(p0);
  $.let.glb1__int = $.init($.let.glb1__int, temp_1);
  const p1 = input.param({
    title: 'String Input',
    defval: "Hello"
  }, undefined, 'p1');
  const temp_2 = input.string(p1);
  $.let.glb1__string = $.init($.let.glb1__string, temp_2);
  const p2 = input.param(10.0, undefined, 'p2');
  const p3 = input.param("float input", undefined, 'p3');
  const p4 = input.param({
    minval: 0.0,
    maxval: 100.0,
    step: 0.1
  }, undefined, 'p4');
  const temp_3 = input.float(p2, p3, p4);
  $.let.glb1__float = $.init($.let.glb1__float, temp_3);
  const p5 = input.param({
    title: 'Close Source',
    defval: close
  }, undefined, 'p5');
  const temp_4 = input.any(p5);
  $.let.glb1_src_close = $.init($.let.glb1_src_close, temp_4);
  const p6 = input.param({
    title: 'Open Source',
    defval: open
  }, undefined, 'p6');
  const temp_5 = input.any(p6);
  $.let.glb1_src_open = $.init($.let.glb1_src_open, temp_5);
}`;

        expect(result).toBe(expected_code);
    });

    it('Data and namespaces', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            //here ta, low and na are missing, but we expect the transpiler to inject them
            const { open } = context.data;
            const { plotchar, color, plot, nz } = context.pine;

            const sma = ta.sma(close, 14);

            if (low[0] == na) {
                const data3 = high[0];
            }
        };

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {high, low, close} = $.data;
  const {ta, na} = $.pine;
  const {open} = $.data;
  const {plotchar, color, plot, nz} = $.pine;
  const p0 = ta.param(close, undefined, 'p0');
  const p1 = ta.param(14, undefined, 'p1');
  const temp_1 = ta.sma(p0, p1, "_ta0");
  $.const.glb1_sma = $.init($.const.glb1_sma, temp_1);
  if ($.pine.math.__eq($.get(low, 0), $.get(na.__value, 0))) {
    $.const.if2_data3 = $.init($.const.if2_data3, $.get(high, 0));
  }
}`;

        expect(result).toBe(expected_code);
    });

    it('Variables and constants Initialization', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;
            const ta = context.ta;
            const math = context.math;
            const _close = close;
            const _close1 = close[1];
            const _myConst = 10;
            let sma = ta.sma(close, 20);

            let aa = 10;
            let _cc = close;
            let bb = 1;
            let cc = close;
            cc = close[1];
            cc = bb[2];
            cc = aa[bb];
            let dd = close[1];
            let ee = close[aa];
            let ff = close[aa[99]];

            let cc0 = _cc;
            let cc1 = _cc[1];
            let cc2 = _cc[aa];
            let cc3 = _cc[aa[99]];

            const tr1 = ta.ema(close, 14);
            const tr2 = ta.ema(close[199], 14);
            const tr3 = ta.ema(_cc, 14);
            const tr4 = ta.ema(_cc[1], 14);

            const tr5 = ta.ema(_cc[aa[99]], 14);

            let ap = close;
            let d = ta.ema(math.abs(ap - 99), 10);
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  const ta = $.ta;
  const math = $.math;
  $.const.glb1__close = $.init($.const.glb1__close, close);
  $.const.glb1__close1 = $.init($.const.glb1__close1, $.get(close, 1));
  $.const.glb1__myConst = $.init($.const.glb1__myConst, 10);
  const p0 = ta.param(close, undefined, 'p0');
  const p1 = ta.param(20, undefined, 'p1');
  const temp_1 = ta.sma(p0, p1, "_ta0");
  $.let.glb1_sma = $.init($.let.glb1_sma, temp_1);
  $.let.glb1_aa = $.init($.let.glb1_aa, 10);
  $.let.glb1__cc = $.init($.let.glb1__cc, close);
  $.let.glb1_bb = $.init($.let.glb1_bb, 1);
  $.let.glb1_cc = $.init($.let.glb1_cc, close);
  $.set($.let.glb1_cc, $.get(close, 1));
  $.set($.let.glb1_cc, $.get($.let.glb1_bb, 2));
  $.set($.let.glb1_cc, $.get($.let.glb1_aa, $.get($.let.glb1_bb, 0)));
  $.let.glb1_dd = $.init($.let.glb1_dd, $.get(close, 1));
  $.let.glb1_ee = $.init($.let.glb1_ee, $.get(close, $.get($.let.glb1_aa, 0)));
  $.let.glb1_ff = $.init($.let.glb1_ff, $.get(close, $.get($.let.glb1_aa, 99)));
  $.let.glb1_cc0 = $.init($.let.glb1_cc0, $.get($.let.glb1__cc, 0));
  $.let.glb1_cc1 = $.init($.let.glb1_cc1, $.get($.let.glb1__cc, 1));
  $.let.glb1_cc2 = $.init($.let.glb1_cc2, $.get($.let.glb1__cc, $.get($.let.glb1_aa, 0)));
  $.let.glb1_cc3 = $.init($.let.glb1_cc3, $.get($.let.glb1__cc, $.get($.let.glb1_aa, 99)));
  const p2 = ta.param(close, undefined, 'p2');
  const p3 = ta.param(14, undefined, 'p3');
  const temp_2 = ta.ema(p2, p3, "_ta1");
  $.const.glb1_tr1 = $.init($.const.glb1_tr1, temp_2);
  const p4 = ta.param(close, 199, 'p4');
  const p5 = ta.param(14, undefined, 'p5');
  const temp_3 = ta.ema(p4, p5, "_ta2");
  $.const.glb1_tr2 = $.init($.const.glb1_tr2, temp_3);
  const p6 = ta.param($.let.glb1__cc, undefined, 'p6');
  const p7 = ta.param(14, undefined, 'p7');
  const temp_4 = ta.ema(p6, p7, "_ta3");
  $.const.glb1_tr3 = $.init($.const.glb1_tr3, temp_4);
  const p8 = ta.param($.let.glb1__cc, 1, 'p8');
  const p9 = ta.param(14, undefined, 'p9');
  const temp_5 = ta.ema(p8, p9, "_ta4");
  $.const.glb1_tr4 = $.init($.const.glb1_tr4, temp_5);
  const p10 = ta.param($.let.glb1__cc, aa[99], 'p10');
  const p11 = ta.param(14, undefined, 'p11');
  const temp_6 = ta.ema(p10, p11, "_ta5");
  $.const.glb1_tr5 = $.init($.const.glb1_tr5, temp_6);
  $.let.glb1_ap = $.init($.let.glb1_ap, close);
  const p12 = math.param($.get($.let.glb1_ap, 0) - 99, undefined, 'p12');
  const temp_7 = math.abs(p12);
  const p13 = ta.param(temp_7, undefined, 'p13');
  const p14 = ta.param(10, undefined, 'p14');
  const temp_8 = ta.ema(p13, p14, "_ta6");
  $.let.glb1_d = $.init($.let.glb1_d, temp_8);
}`;

        expect(result).toBe(expected_code);
    });

    it('Variables Reassignments', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;
            const ta = context.ta;

            let sma = ta.sma(close, 20);
            sma = ta.sma(close, 22);
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  const ta = $.ta;
  const p0 = ta.param(close, undefined, 'p0');
  const p1 = ta.param(20, undefined, 'p1');
  const temp_1 = ta.sma(p0, p1, "_ta0");
  $.let.glb1_sma = $.init($.let.glb1_sma, temp_1);
  const p2 = ta.param(close, undefined, 'p2');
  const p3 = ta.param(22, undefined, 'p3');
  const temp_2 = ta.sma(p2, p3, "_ta1");
  $.set($.let.glb1_sma, temp_2);
}`;

        expect(result).toBe(expected_code);
    });

    it('Objects Props', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { ta, plot, na, bool } = context.pine;
            let highUsePivot = 10;
            plot(highUsePivot, {
                color: bool(ta.change(highUsePivot)) ? na : '#FF0000',
            });
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {ta, plot, na, bool} = $.pine;
  $.let.glb1_highUsePivot = $.init($.let.glb1_highUsePivot, 10);
  const p0 = plot.param($.let.glb1_highUsePivot, undefined, 'p0');
  const p1 = ta.param($.let.glb1_highUsePivot, undefined, 'p1');
  const temp_1 = ta.change(p1, "_ta0");
  const p2 = $.param(temp_1, undefined, 'p2');
  const p3 = plot.param(bool(p2) ? $.get(na.__value, 0) : "#FF0000", undefined, 'p3');
  const p4 = plot.param({
    color: p3
  }, undefined, 'p4');
  const temp_2 = plot.any(p0, p4, {
    __callsiteId: "#0"
  });
  temp_2;
}`;

        expect(result).toBe(expected_code);
    });

    it('Time Series annotations ', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;
            const { ta, fixnan } = context.pine;

            let sma = ta.sma(close, 20);
            sma = sma[1];

            const period = 14;
            sma = ta.sma(close, period);

            let leftBars = 15;
            let rightBars = 15;

            let highUsePivot = fixnan(ta.pivothigh(leftBars, rightBars)[1]);
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  const {ta, fixnan} = $.pine;
  const p0 = ta.param(close, undefined, 'p0');
  const p1 = ta.param(20, undefined, 'p1');
  const temp_1 = ta.sma(p0, p1, "_ta0");
  $.let.glb1_sma = $.init($.let.glb1_sma, temp_1);
  $.set($.let.glb1_sma, $.get($.let.glb1_sma, 1));
  $.const.glb1_period = $.init($.const.glb1_period, 14);
  const p2 = ta.param(close, undefined, 'p2');
  const p3 = ta.param($.const.glb1_period, undefined, 'p3');
  const temp_2 = ta.sma(p2, p3, "_ta1");
  $.set($.let.glb1_sma, temp_2);
  $.let.glb1_leftBars = $.init($.let.glb1_leftBars, 15);
  $.let.glb1_rightBars = $.init($.let.glb1_rightBars, 15);
  const p4 = ta.param($.let.glb1_leftBars, undefined, 'p4');
  const p5 = ta.param($.let.glb1_rightBars, undefined, 'p5');
  const temp_3 = ta.pivothigh(p4, p5, "_ta2");
  const p6 = $.param(temp_3, 1, 'p6');
  $.let.glb1_highUsePivot = $.init($.let.glb1_highUsePivot, fixnan(p6));
}`;

        expect(result).toBe(expected_code);
    });

    it('Binary Operators', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open } = context.data;
            const ta = context.ta;

            const green_candle = close > open;
            const red_candle = close < open;

            const previous_green_candle = green_candle[1];

            const ema9 = ta.ema(close[1], 9);
            const ema18 = ta.ema(close[1], 18);

            const bull_bias = ema9 > ema18;
            const bear_bias = ema9 < ema18;
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open} = $.data;
  const ta = $.ta;
  $.const.glb1_green_candle = $.init($.const.glb1_green_candle, $.get(close, 0) > $.get(open, 0));
  $.const.glb1_red_candle = $.init($.const.glb1_red_candle, $.get(close, 0) < $.get(open, 0));
  $.const.glb1_previous_green_candle = $.init($.const.glb1_previous_green_candle, $.get($.const.glb1_green_candle, 1));
  const p0 = ta.param(close, 1, 'p0');
  const p1 = ta.param(9, undefined, 'p1');
  const temp_1 = ta.ema(p0, p1, "_ta0");
  $.const.glb1_ema9 = $.init($.const.glb1_ema9, temp_1);
  const p2 = ta.param(close, 1, 'p2');
  const p3 = ta.param(18, undefined, 'p3');
  const temp_2 = ta.ema(p2, p3, "_ta1");
  $.const.glb1_ema18 = $.init($.const.glb1_ema18, temp_2);
  $.const.glb1_bull_bias = $.init($.const.glb1_bull_bias, $.get($.const.glb1_ema9, 0) > $.get($.const.glb1_ema18, 0));
  $.const.glb1_bear_bias = $.init($.const.glb1_bear_bias, $.get($.const.glb1_ema9, 0) < $.get($.const.glb1_ema18, 0));
}`;

        expect(result).toBe(expected_code);
    });

    it('Conditional Assignment', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open } = context.data;
            const ta = context.ta;

            const green_candle = close > open ? 1 : 0;

            const bull_bias = ta.ema(close, 9) > ta.ema(close, 18) ? 1 : 0;
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open} = $.data;
  const ta = $.ta;
  $.const.glb1_green_candle = $.init($.const.glb1_green_candle, $.get(close, 0) > $.get(open, 0) ? 1 : 0);
  const p0 = ta.param(close, undefined, 'p0');
  const p1 = ta.param(9, undefined, 'p1');
  const temp_1 = ta.ema(p0, p1, "_ta0");
  const p2 = ta.param(close, undefined, 'p2');
  const p3 = ta.param(18, undefined, 'p3');
  const temp_2 = ta.ema(p2, p3, "_ta1");
  $.const.glb1_bull_bias = $.init($.const.glb1_bull_bias, temp_1 > temp_2 ? 1 : 0);
}`;

        expect(result).toBe(expected_code);
    });

    it('Binary & Logical & Unary expression as arguments', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open } = context.data;
            const { plot } = context.core;

            const res = open;
            plot(close && open ? 1 : res, 'plot1', { color: 'white' });
            plot(close && open, 'plot2', { color: 'white' });
            plot(-res, 'plot3', { color: 'white' });
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open} = $.data;
  const {plot} = $.core;
  $.const.glb1_res = $.init($.const.glb1_res, open);
  const p0 = plot.param(close && open ? 1 : $.get($.const.glb1_res, 0), undefined, 'p0');
  const p1 = plot.param("plot1", undefined, 'p1');
  const p2 = plot.param({
    color: "white"
  }, undefined, 'p2');
  const temp_1 = plot.any(p0, p1, p2, {
    __callsiteId: "#0"
  });
  temp_1;
  const p3 = plot.param($.get(close, 0) && $.get(open, 0), undefined, 'p3');
  const p4 = plot.param("plot2", undefined, 'p4');
  const p5 = plot.param({
    color: "white"
  }, undefined, 'p5');
  const temp_2 = plot.any(p3, p4, p5, {
    __callsiteId: "#1"
  });
  temp_2;
  const p6 = plot.param(-$.get($.const.glb1_res, 0), undefined, 'p6');
  const p7 = plot.param("plot3", undefined, 'p7');
  const p8 = plot.param({
    color: "white"
  }, undefined, 'p8');
  const temp_3 = plot.any(p6, p7, p8, {
    __callsiteId: "#2"
  });
  temp_3;
}`;

        expect(result).toBe(expected_code);
    });

    it('Conditions', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;
            const _cc = close;

            let aa = 0;

            if (_cc > 1) {
                let bb = 1;
                let cc = close;
                let dd = close[1];
                let ee = close[aa];
                let ff = close[aa[99]];

                let cc0 = _cc;
                let cc1 = _cc[1];
                let cc2 = _cc[aa];
                let cc3 = _cc[aa[99]];

                aa = 1;
            }
            if (_cc[0] > 1) {
                aa = 2;
            }
            if (_cc[1] > 1) {
                aa = 3;
            }
            if (_cc[aa] > 1) {
                aa = 3;
            }
            if (_cc[aa[0]] > 1) {
                aa = 3;
            }
            if (_cc[aa[1]] > 1) {
                aa = 3;
            }
            if (close > 1) {
                aa = 4;
            }
            if (close[0] > 1) {
                aa = 5;
            }
            if (close[1] > 1) {
                aa = 6;
            }
            if (close[aa] > 1) {
                aa = 6;
            }
            if (close[aa[1]] > 1) {
                aa = 6;
            }
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  $.const.glb1__cc = $.init($.const.glb1__cc, close);
  $.let.glb1_aa = $.init($.let.glb1_aa, 0);
  if ($.get($.const.glb1__cc, 0) > 1) {
    $.let.if2_bb = $.init($.let.if2_bb, 1);
    $.let.if2_cc = $.init($.let.if2_cc, close);
    $.let.if2_dd = $.init($.let.if2_dd, $.get(close, 1));
    $.let.if2_ee = $.init($.let.if2_ee, $.get(close, $.get($.let.glb1_aa, 0)));
    $.let.if2_ff = $.init($.let.if2_ff, $.get(close, $.get($.let.glb1_aa, 99)));
    $.let.if2_cc0 = $.init($.let.if2_cc0, $.get($.const.glb1__cc, 0));
    $.let.if2_cc1 = $.init($.let.if2_cc1, $.get($.const.glb1__cc, 1));
    $.let.if2_cc2 = $.init($.let.if2_cc2, $.get($.const.glb1__cc, $.get($.let.glb1_aa, 0)));
    $.let.if2_cc3 = $.init($.let.if2_cc3, $.get($.const.glb1__cc, $.get($.let.glb1_aa, 99)));
    $.set($.let.glb1_aa, 1);
  }
  if ($.get($.const.glb1__cc, 0) > 1) {
    $.set($.let.glb1_aa, 2);
  }
  if ($.get($.const.glb1__cc, 1) > 1) {
    $.set($.let.glb1_aa, 3);
  }
  if ($.get($.const.glb1__cc, $.get($.let.glb1_aa, 0)) > 1) {
    $.set($.let.glb1_aa, 3);
  }
  if ($.get($.const.glb1__cc, $.let.glb1_aa[0]) > 1) {
    $.set($.let.glb1_aa, 3);
  }
  if ($.get($.const.glb1__cc, $.let.glb1_aa[1]) > 1) {
    $.set($.let.glb1_aa, 3);
  }
  if ($.get(close, 0) > 1) {
    $.set($.let.glb1_aa, 4);
  }
  if ($.get(close, 0) > 1) {
    $.set($.let.glb1_aa, 5);
  }
  if ($.get(close, 1) > 1) {
    $.set($.let.glb1_aa, 6);
  }
  if ($.get(close, $.get($.let.glb1_aa, 0)) > 1) {
    $.set($.let.glb1_aa, 6);
  }
  if ($.get(close, $.let.glb1_aa[1]) > 1) {
    $.set($.let.glb1_aa, 6);
  }
}`;

        expect(result).toBe(expected_code);
    });

    it('For Loops', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;

            let aa = 10;

            let _cc = close;

            for (let i = 0; i < _cc[1]; i++) {
                let bb = 1;
                let cc = close;
                cc = close[1];
                cc = bb[2];
                cc = aa[bb];
                let dd = close[1];
                let ee = close[aa];
                let ff = close[aa[99]];

                let cc0 = _cc;
                let cc1 = _cc[1];
                let cc2 = _cc[aa];
                let cc3 = _cc[aa[99]];
                aa = i;
            }

            for (let i = 0; i < 10; i++) {
                aa = i;
            }

            for (let i = 0; i < aa; i++) {
                _cc = _cc[i];
            }

            for (let i = 0; i < _cc; i++) {
                aa = i;
            }

            for (let i = 0; i < _cc[1]; i++) {
                aa = i;
            }

            for (let i = 0; i < _cc[aa]; i++) {
                aa = i;
            }
            for (let i = 0; i < _cc[aa[99]]; i++) {
                aa = i;
            }
            for (let i = 0; i < close; i++) {
                aa = i;
            }

            for (let i = 0; i < close[1]; i++) {
                aa = i;
            }

            for (let i = 0; i < close[aa]; i++) {
                aa = i;
            }
            for (let i = 0; i < close[aa[99]]; i++) {
                aa = i;
            }
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  $.let.glb1_aa = $.init($.let.glb1_aa, 10);
  $.let.glb1__cc = $.init($.let.glb1__cc, close);
  for (let i = 0; i < $.get($.let.glb1__cc, 1); i++) {
    $.let.for2_bb = $.init($.let.for2_bb, 1);
    $.let.for2_cc = $.init($.let.for2_cc, close);
    $.set($.let.for2_cc, $.get(close, 1));
    $.set($.let.for2_cc, $.get($.let.for2_bb, 2));
    $.set($.let.for2_cc, $.get($.let.glb1_aa, $.get($.let.for2_bb, 0)));
    $.let.for2_dd = $.init($.let.for2_dd, $.get(close, 1));
    $.let.for2_ee = $.init($.let.for2_ee, $.get(close, $.get($.let.glb1_aa, 0)));
    $.let.for2_ff = $.init($.let.for2_ff, $.get(close, $.get($.let.glb1_aa, 99)));
    $.let.for2_cc0 = $.init($.let.for2_cc0, $.get($.let.glb1__cc, 0));
    $.let.for2_cc1 = $.init($.let.for2_cc1, $.get($.let.glb1__cc, 1));
    $.let.for2_cc2 = $.init($.let.for2_cc2, $.get($.let.glb1__cc, $.get($.let.glb1_aa, 0)));
    $.let.for2_cc3 = $.init($.let.for2_cc3, $.get($.let.glb1__cc, $.get($.let.glb1_aa, 99)));
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < 10; i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get($.let.glb1_aa, 0); i++) {
    $.set($.let.glb1__cc, $.get($.let.glb1__cc, i));
  }
  for (let i = 0; i < $.get($.let.glb1__cc, 0); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get($.let.glb1__cc, 1); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get($.let.glb1__cc, $.get($.let.glb1_aa, 0)); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get($.let.glb1__cc, $.let.glb1_aa[99]); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get(close, 0); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get(close, 1); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get(close, $.get($.let.glb1_aa, 0)); i++) {
    $.set($.let.glb1_aa, i);
  }
  for (let i = 0; i < $.get(close, $.let.glb1_aa[99]); i++) {
    $.set($.let.glb1_aa, i);
  }
}`;

        expect(result).toBe(expected_code);
    });

    it('functions', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;
            const ta = context.ta;
            const math = context.math;
            const _cc = close;

            const aa = 1;
            function angle(src) {
                const rad2degree = 180 / Math.PI; //pi
                const ang: any = rad2degree * math.atan((src[0] - src[1]) / ta.atr(14));
                return ang;
            }
            function get_average(avg_src, avg_len) {
                let bb = 1;
                let cc = close;
                cc = close[1];
                cc = bb[2];
                cc = aa[bb];
                let dd = close[1];
                let ee = close[aa];
                let ff = close[aa[99]];

                let cc0 = _cc;
                let cc1 = _cc[1];
                let cc2 = _cc[aa];
                let cc3 = _cc[aa[99]];

                let ret_val = 0.0;
                for (let i = 1; i <= avg_len; i++) {
                    ret_val += avg_src[i];
                }

                if (avg_len === 0) {
                    ret_val = cc[1];
                }
                return ret_val / avg_len;
            }

            const r1 = get_average(close, 14);
            const r2 = get_average(close[1], 14);
            const r3 = get_average(_cc, 14);
            const r4 = get_average(_cc[1], 14);

            let ra = 0;
            ra = get_average(close, 14);
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  const ta = $.ta;
  const math = $.math;
  $.const.glb1__cc = $.init($.const.glb1__cc, close);
  $.const.glb1_aa = $.init($.const.glb1_aa, 1);
  function angle(src) {
    const $$ = $.peekCtx();
    $$.const.fn1_rad2degree = $.init($$.const.fn1_rad2degree, 180 / Math.PI);
    const p0 = ta.param(14, undefined, 'p0');
    const temp_1 = ta.atr(p0, $$.id + "_ta0");
    const p1 = math.param(($.get(src, 0) - $.get(src, 1)) / temp_1, undefined, 'p1');
    const temp_2 = math.atan(p1);
    $$.const.fn1_ang = $.init($$.const.fn1_ang, $.get($$.const.fn1_rad2degree, 0) * temp_2);
    return $.precision($.get($$.const.fn1_ang, 0));
  }
  function get_average(avg_src, avg_len) {
    const $$ = $.peekCtx();
    $$.let.fn2_bb = $.init($$.let.fn2_bb, 1);
    $$.let.fn2_cc = $.init($$.let.fn2_cc, close);
    $.set($$.let.fn2_cc, $.get(close, 1));
    $.set($$.let.fn2_cc, $.get($$.let.fn2_bb, 2));
    $.set($$.let.fn2_cc, $.get($.const.glb1_aa, $.get($$.let.fn2_bb, 0)));
    $$.let.fn2_dd = $.init($$.let.fn2_dd, $.get(close, 1));
    $$.let.fn2_ee = $.init($$.let.fn2_ee, $.get(close, $.get($.const.glb1_aa, 0)));
    $$.let.fn2_ff = $.init($$.let.fn2_ff, $.get(close, $.get($.const.glb1_aa, 99)));
    $$.let.fn2_cc0 = $.init($$.let.fn2_cc0, $.get($.const.glb1__cc, 0));
    $$.let.fn2_cc1 = $.init($$.let.fn2_cc1, $.get($.const.glb1__cc, 1));
    $$.let.fn2_cc2 = $.init($$.let.fn2_cc2, $.get($.const.glb1__cc, $.get($.const.glb1_aa, 0)));
    $$.let.fn2_cc3 = $.init($$.let.fn2_cc3, $.get($.const.glb1__cc, $.get($.const.glb1_aa, 99)));
    $$.let.fn2_ret_val = $.init($$.let.fn2_ret_val, 0);
    for (let i = 1; i <= $.get(avg_len, 0); i++) {
      $.set($$.let.fn2_ret_val, $.get($$.let.fn2_ret_val, 0) + $.get(avg_src, i));
    }
    if ($.pine.math.__eq($.get(avg_len, 0), 0)) {
      $.set($$.let.fn2_ret_val, $.get($$.let.fn2_cc, 1));
    }
    return $.precision($.get($$.let.fn2_ret_val, 0) / $.get(avg_len, 0));
  }
  const p2 = $.param(close, undefined, 'p2');
  const p3 = $.param(14, undefined, 'p3');
  $.const.glb1_r1 = $.init($.const.glb1_r1, $.call(get_average, "_fn0", p2, p3));
  const p4 = $.param(close, 1, 'p4');
  const p5 = $.param(14, undefined, 'p5');
  $.const.glb1_r2 = $.init($.const.glb1_r2, $.call(get_average, "_fn1", p4, p5));
  const p6 = $.param($.const.glb1__cc, undefined, 'p6');
  const p7 = $.param(14, undefined, 'p7');
  $.const.glb1_r3 = $.init($.const.glb1_r3, $.call(get_average, "_fn2", p6, p7));
  const p8 = $.param($.const.glb1__cc, 1, 'p8');
  const p9 = $.param(14, undefined, 'p9');
  $.const.glb1_r4 = $.init($.const.glb1_r4, $.call(get_average, "_fn3", p8, p9));
  $.let.glb1_ra = $.init($.let.glb1_ra, 0);
  const p10 = $.param(close, undefined, 'p10');
  const p11 = $.param(14, undefined, 'p11');
  $.set($.let.glb1_ra, $.call(get_average, "_fn4", p10, p11));
}`;

        expect(result).toBe(expected_code);
    });

    it('array method with series + inject missing data series', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { open, close } = context.data;
            const { array } = context.pine;

            let a = array.new_float(5);
            a.fill(close[1] - open);
            let res = a;
            let i = a.indexof(high);
        };

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {high} = $.data;
  const {open, close} = $.data;
  const {array} = $.pine;
  const p0 = array.param(5, undefined, 'p0');
  const temp_1 = array.new_float(p0);
  $.let.glb1_a = $.init($.let.glb1_a, temp_1);
  $.get($.let.glb1_a, 0).fill($.get(close, 1) - $.get(open, 0));
  $.let.glb1_res = $.init($.let.glb1_res, $.get($.let.glb1_a, 0));
  $.let.glb1_i = $.init($.let.glb1_i, $.get($.let.glb1_a, 0).indexof($.get(high, 0)));
}`;

        expect(result).toBe(expected_code);
    });

    it('tuples', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request, ta } = context.pine;

            function foo() {
                const oo = open;
                const cc = close;
                return [oo, cc];
            }

            const [res, data] = foo();

            plotchar(res, '_plotchar');

            return {
                res,
                data,
            };
        };

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open} = $.data;
  const {plot, plotchar, request, ta} = $.pine;
  function foo() {
    const $$ = $.peekCtx();
    $$.const.fn1_oo = $.init($$.const.fn1_oo, open);
    $$.const.fn1_cc = $.init($$.const.fn1_cc, close);
    return $.precision([[$.get($$.const.fn1_oo, 0), $.get($$.const.fn1_cc, 0)]]);
  }
  {
    $.const.glb1_temp_1 = $.init($.const.glb1_temp_1, $.call(foo, "_fn0"));
    $.const.glb1_res = $.init($.const.glb1_res, $.get($.const.glb1_temp_1, 0)[0]);
    $.const.glb1_data = $.init($.const.glb1_data, $.get($.const.glb1_temp_1, 0)[1]);
  }
  const p0 = $.param($.const.glb1_res, undefined, 'p0');
  const p1 = $.param("_plotchar", undefined, 'p1');
  plotchar(p0, p1);
  return {
    res: $.const.glb1_res,
    data: $.const.glb1_data
  };
}`;

        expect(result).toBe(expected_code);
    });

    it('arrow functions', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close } = context.data;
            const ta = context.ta;
            const _cc = close;

            const aa = 1;

            const get_average = (avg_src, avg_len) => {
                let bb = 1;
                let cc = close;
                cc = close[1];
                cc = bb[2];
                cc = aa[bb];
                let dd = close[1];
                let ee = close[aa];
                let ff = close[aa[99]];

                let cc0 = _cc;
                let cc1 = _cc[1];
                let cc2 = _cc[aa];
                let cc3 = _cc[aa[99]];

                let ret_val = 0.0;
                for (let i = 1; i <= avg_len; i++) {
                    ret_val += avg_src[i];
                }

                if (avg_len === 0) {
                    ret_val = cc[1];
                }
                return ret_val / avg_len;
            };

            const r1 = get_average(close, 14);
            const r2 = get_average(close[1], 14);
            const r3 = get_average(_cc, 14);
            const r4 = get_average(_cc[1], 14);

            let ra = 0;
            ra = get_average(close, 14);
        };
        let transpiled = transformer(source);

        const result = transpiled.toString().trim();
        console.log(result);

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close} = $.data;
  const ta = $.ta;
  $.const.glb1__cc = $.init($.const.glb1__cc, close);
  $.const.glb1_aa = $.init($.const.glb1_aa, 1);
  function get_average(avg_src, avg_len) {
    const $$ = $.peekCtx();
    $$.let.fn1_bb = $.init($$.let.fn1_bb, 1);
    $$.let.fn1_cc = $.init($$.let.fn1_cc, close);
    $.set($$.let.fn1_cc, $.get(close, 1));
    $.set($$.let.fn1_cc, $.get($$.let.fn1_bb, 2));
    $.set($$.let.fn1_cc, $.get($.const.glb1_aa, $.get($$.let.fn1_bb, 0)));
    $$.let.fn1_dd = $.init($$.let.fn1_dd, $.get(close, 1));
    $$.let.fn1_ee = $.init($$.let.fn1_ee, $.get(close, $.get($.const.glb1_aa, 0)));
    $$.let.fn1_ff = $.init($$.let.fn1_ff, $.get(close, $.get($.const.glb1_aa, 99)));
    $$.let.fn1_cc0 = $.init($$.let.fn1_cc0, $.get($.const.glb1__cc, 0));
    $$.let.fn1_cc1 = $.init($$.let.fn1_cc1, $.get($.const.glb1__cc, 1));
    $$.let.fn1_cc2 = $.init($$.let.fn1_cc2, $.get($.const.glb1__cc, $.get($.const.glb1_aa, 0)));
    $$.let.fn1_cc3 = $.init($$.let.fn1_cc3, $.get($.const.glb1__cc, $.get($.const.glb1_aa, 99)));
    $$.let.fn1_ret_val = $.init($$.let.fn1_ret_val, 0);
    for (let i = 1; i <= $.get(avg_len, 0); i++) {
      $.set($$.let.fn1_ret_val, $.get($$.let.fn1_ret_val, 0) + $.get(avg_src, i));
    }
    if ($.pine.math.__eq($.get(avg_len, 0), 0)) {
      $.set($$.let.fn1_ret_val, $.get($$.let.fn1_cc, 1));
    }
    return $.precision($.get($$.let.fn1_ret_val, 0) / $.get(avg_len, 0));
  }
  const p0 = $.param(close, undefined, 'p0');
  const p1 = $.param(14, undefined, 'p1');
  $.const.glb1_r1 = $.init($.const.glb1_r1, $.call(get_average, "_fn0", p0, p1));
  const p2 = $.param(close, 1, 'p2');
  const p3 = $.param(14, undefined, 'p3');
  $.const.glb1_r2 = $.init($.const.glb1_r2, $.call(get_average, "_fn1", p2, p3));
  const p4 = $.param($.const.glb1__cc, undefined, 'p4');
  const p5 = $.param(14, undefined, 'p5');
  $.const.glb1_r3 = $.init($.const.glb1_r3, $.call(get_average, "_fn2", p4, p5));
  const p6 = $.param($.const.glb1__cc, 1, 'p6');
  const p7 = $.param(14, undefined, 'p7');
  $.const.glb1_r4 = $.init($.const.glb1_r4, $.call(get_average, "_fn3", p6, p7));
  $.let.glb1_ra = $.init($.let.glb1_ra, 0);
  const p8 = $.param(close, undefined, 'p8');
  const p9 = $.param(14, undefined, 'p9');
  $.set($.let.glb1_ra, $.call(get_average, "_fn4", p8, p9));
}`;

        expect(result).toBe(expected_code);
    });

    it('User Defined Types - Property Access and Assignment', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { close, open, high } = context.data;
            const { Type, ta } = context.pine;

            const Trade = Type({ entry: 'float', stop: 'float', target: 'float', active: 'bool' });
            let trade = Trade.new(close, open, high, close > open);
            let trade2 = trade.copy();

            // Test property assignment
            trade2.active = false;

            // Test property access as function argument
            let res = ta.sma(trade.entry, 14);

            return { trade, trade2, res };
        };

        let transpiled = transformer(source);

        console.log(transpiled.toString());
        const result = transpiled.toString().trim();

        /* prettier-ignore */
        const expected_code = `async $ => {
  const {close, open, high} = $.data;
  const {Type, ta} = $.pine;
  const p0 = $.param({
    entry: "float",
    stop: "float",
    target: "float",
    active: "bool"
  }, undefined, 'p0');
  $.const.glb1_Trade = $.init($.const.glb1_Trade, Type(p0));
  $.let.glb1_trade = $.init($.let.glb1_trade, $.get($.const.glb1_Trade, 0).new($.get(close, 0), $.get(open, 0), $.get(high, 0), $.get(close, 0) > $.get(open, 0)));
  $.let.glb1_trade2 = $.init($.let.glb1_trade2, $.get($.let.glb1_trade, 0).copy());
  $.get($.let.glb1_trade2, 0).active = false;
  const p1 = ta.param($.get($.let.glb1_trade, 0).entry, undefined, 'p1');
  const p2 = ta.param(14, undefined, 'p2');
  const temp_1 = ta.sma(p1, p2, "_ta0");
  $.let.glb1_res = $.init($.let.glb1_res, temp_1);
  return {
    trade: $.let.glb1_trade,
    trade2: $.let.glb1_trade2,
    res: $.let.glb1_res
  };
}`;

        expect(result).toBe(expected_code);
    });

    it('Variable collision avoidance', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { open, close } = context.data;
            const { plot, fill, indicator, color } = context.pine;

            indicator({
                shorttitle: 'BB',
                title: 'Simple Bollinger Bands',
                overlay: true,
                timeframe: '',
                timeframe_gaps: true,
            });

            // User defines variables named p1, p2 which conflict with transpiler's internal naming
            let p1 = plot(close, 'Close', { color: '#F23645' });
            let p2 = plot(open, 'Open', { color: '#089981' });

            fill(p1, p2, { title: 'Background', color: color.rgb(33, 150, 243, 95) });
        };

        let transpiled = transformer(source);
        const result = transpiled.toString().trim();
        console.log(result);

        // The transpiler should generate different internal variable names (e.g. p3, p4, etc.)
        // to avoid collision with user's p1 and p2.
        // It should NOT try to redeclare p1 or p2 as const/internal params.

        expect(result).not.toContain('const p1 =');
        expect(result).not.toContain('const p2 =');
        // It should correctly initialize the user variables
        expect(result).toContain('$.let.glb1_p1 = $.init($.let.glb1_p1');
        expect(result).toContain('$.let.glb1_p2 = $.init($.let.glb1_p2');

        // It should use the user variables in the fill function
        expect(result).toContain('fill.param($.let.glb1_p1');
        expect(result).toContain('fill.param($.let.glb1_p2');
    });

    it('Logical expressions in function arguments - all variables transformed', async () => {
        const fakeContext = {};
        const transformer = transpile.bind(fakeContext);

        const source = (context) => {
            const { open, high, close } = context.data;
            const { ta, plotshape, indicator } = context.pine;

            indicator('test1');
            let [supertrend, direction] = ta.supertrend(3, 10);
            let buy = close > open;
            let xs = high;

            function foo(a) {
                return a;
            }

            // Complex logical expression with multiple variables as function argument
            plotshape(buy && xs != xs[1] && direction < 0, {
                title: 'Strong BUY',
            });

            // Same expression as user function argument
            foo(buy && xs != xs[1] && direction < 0);

            // Same expression in direct assignment
            const buyCond = buy && xs != xs[1] && direction < 0;
        };

        let transpiled = transformer(source);
        const result = transpiled.toString().trim();

        // All three usages should transform variables consistently
        const expectedPattern =
            /\$\.get\(\$\.let\.glb1_buy, 0\) && \$\.get\(\$\.let\.glb1_xs, 0\) != \$\.get\(\$\.let\.glb1_xs, 1\) && \$\.get\(\$\.let\.glb1_direction, 0\) < 0/g;
        const matches = result.match(expectedPattern);

        // Should appear 3 times: in plotshape arg, foo arg, and buyCond assignment
        expect(matches).not.toBeNull();
        expect(matches!.length).toBe(3);

        // Verify all variables are transformed (no bare 'buy', 'xs' identifiers)
        // Use word boundaries to avoid matching 'glb1_buy'
        expect(result).not.toMatch(/\bbuy && /);
        expect(result).not.toMatch(/&& xs !=/);
    });
});
