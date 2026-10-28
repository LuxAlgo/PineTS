import { Provider } from '@pinets/index';
import PineTS from 'PineTS.class';
import { describe, expect, it } from 'vitest';

describe('Streaming', () => {
    it('Live stream test', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', 'D', 100);
        const indicator = (context: any) => {
            const { close } = context.data;
            const { ta, math, barstate, last_bar_time } = context.pine;
            const sma = ta.sma(close, 14);
            const ema = ta.ema(close, 14);
            let state = barstate.isnew;
            let spl = str.split('a,b,c', ',');
            log.info(str.tostring(last_bar_time));

            const sum10 = math.sum(close, 10);
            return { sma, ema, sum10, close, state };
        };

        const iterator = pineTS.run(indicator, undefined, 10, { sourceMode: 'trustedJavaScript' });

        let iterations = {
            close: [],
            sma: [],
            sum10: [],
        };

        let lastPrint = 0;
        let pageCount = 0;

        for await (const ctx of iterator) {
            console.log('===========================================================');
            // Handle "no data" signal (PineTS yields null when checking for updates but finding none)
            if (ctx === null) {
                const now = Date.now();
                if (now - lastPrint > 5000) {
                    process.stdout.write('.'); // Heartbeat every 5s
                    lastPrint = now;
                }
                await new Promise((r) => setTimeout(r, 1000)); // Wait 1s before polling again
                continue;
            }

            const { sma, ema, sum10, close, state } = ctx.result;
            // const fullContext = ctx.fullContext;
            // const state = fullContext?.result?.state;
            //console.log('state', state);

            // Get the last value from the arrays (current bar)
            const currentSma = Array.isArray(sma) ? sma[sma.length - 1] : sma;
            const currentSum = Array.isArray(sum10) ? sum10[sum10.length - 1] : sum10;
            const currentClose = Array.isArray(close) ? close[close.length - 1] : close;

            //console.log('state', state);

            // Check if this is historical data
            // Access the current candle using context.idx
            const currentCandle = ctx.marketData[ctx.idx];
            const isHistorical = currentCandle && currentCandle.closeTime < Date.now();

            const time = new Date().toLocaleTimeString();

            if (isHistorical) {
                pageCount++;
                // For history, just log a summary or nothing to fast-forward
                //console.log(`[${time} HISTORY] Page: ${pageCount}`);
                console.log('>>> EMA', ctx.result.ema);
            } else {
                iterations.close.push(currentClose);
                iterations.sma.push(currentSma);
                iterations.sum10.push(currentSum);

                if (iterations.close.length >= 5) {
                    break;
                }
                // Log the LIVE update
                // console.log(
                //     `[${time} LIVE] Close: ${currentClose?.toFixed(2)} | SMA(14): ${currentSma?.toFixed(2)} | Sum(10): ${currentSum?.toFixed(2)}`
                // );
                console.log('>>> Live EMA', ctx.result.ema);
                await new Promise((r) => setTimeout(r, 500)); // Wait 1s before polling again
            }
        }
        //expect pages to be greater than 0
        expect(pageCount).toEqual(9);

        //expect iterations to be equal to 5
        expect(iterations.close.length).toBe(5);
        expect(iterations.sma.length).toBe(5);
        expect(iterations.sum10.length).toBe(5);

        //expect iteration values of each array to be different
        expect(iterations.close.some((value, index, array) => value !== array[index + 1])).toBe(true);
        expect(iterations.sma.some((value, index, array) => value !== array[index + 1])).toBe(true);
        expect(iterations.sum10.some((value, index, array) => value !== array[index + 1])).toBe(true);
    }, 10000);

    it.skip('Live stream test with MACD', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', '1');
        const indicator = (context: any) => {
            const { close } = context.data;
            const { ta, math, barstate, last_bar_time } = context.pine;

            let fast_ma = ta.ema(close, 12);
            let slow_ma = ta.ema(close, 26);
            let macd = fast_ma - slow_ma;
            let signal = ta.ema(macd, 9);

            let hist = macd - signal;
            return { fast_ma, slow_ma, macd, signal, hist };
        };

        const iterator = pineTS.run(indicator, undefined, 10, { sourceMode: 'trustedJavaScript' });

        let iterations = {
            close: [],
            sma: [],
            sum10: [],
        };

        let lastPrint = 0;
        let pageCount = 0;

        for await (const ctx of iterator) {
            console.log('===========================================================');
            // Handle "no data" signal (PineTS yields null when checking for updates but finding none)
            if (ctx === null) {
                const now = Date.now();
                if (now - lastPrint > 5000) {
                    process.stdout.write('.'); // Heartbeat every 5s
                    lastPrint = now;
                }
                await new Promise((r) => setTimeout(r, 1000)); // Wait 1s before polling again
                continue;
            }

            const { sma, ema, sum10, close, state } = ctx.result;
            // const fullContext = ctx.fullContext;
            // const state = fullContext?.result?.state;
            //console.log('state', state);

            // Get the last value from the arrays (current bar)
            const currentSma = Array.isArray(sma) ? sma[sma.length - 1] : sma;
            const currentSum = Array.isArray(sum10) ? sum10[sum10.length - 1] : sum10;
            const currentClose = Array.isArray(close) ? close[close.length - 1] : close;

            //console.log('state', state);

            // Check if this is historical data
            // Access the current candle using context.idx
            const currentCandle = ctx.marketData[ctx.idx];
            const isHistorical = currentCandle && currentCandle.closeTime < Date.now();

            const time = new Date().toLocaleTimeString();

            if (isHistorical) {
                pageCount++;
                // For history, just log a summary or nothing to fast-forward
                //console.log(`[${time} HISTORY] Page: ${pageCount}`);
                console.log('>>> ', {
                    fast_ma: ctx.result.fast_ma,
                    slow_ma: ctx.result.slow_ma,
                    macd: ctx.result.macd,
                    signal: ctx.result.signal,
                    hist: ctx.result.hist,
                });
            } else {
                iterations.close.push(currentClose);
                iterations.sma.push(currentSma);
                iterations.sum10.push(currentSum);

                if (iterations.close.length >= 10) {
                    break;
                }
                // Log the LIVE update
                // console.log(
                //     `[${time} LIVE] Close: ${currentClose?.toFixed(2)} | SMA(14): ${currentSma?.toFixed(2)} | Sum(10): ${currentSum?.toFixed(2)}`
                // );
                console.log('>>> Live ', {
                    fast_ma: ctx.result.fast_ma,
                    slow_ma: ctx.result.slow_ma,
                    macd: ctx.result.macd,
                    signal: ctx.result.signal,
                    hist: ctx.result.hist,
                });
                await new Promise((r) => setTimeout(r, 3000)); // Wait 1s before polling again
            }
        }
    }, 50000);
});
