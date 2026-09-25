// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { MockProvider } from '@pinets/marketData/Mock/MockProvider.class';
import { PineTS } from '../../src/PineTS.class';
import path from 'path';
import { fileURLToPath } from 'url';

// Regression: normalizeCloseTime() used to run on the file cache's own candle objects,
// so every request ending on the same candle bumped its closeTime by 1ms. The drifted
// daily closeTime then widened the intrabar window of request.security_lower_tf and a
// second run of the same script got 25 hourly intrabars in the last daily bar.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(path.resolve(__dirname, '../../'), 'tests', 'compatibility', '_data');

const START = new Date('2024-01-01').getTime();
const END = new Date('2024-03-01').getTime();

describe('MockProvider returns the same candles on every request', () => {
    // Snapshot the values: returned candles must not be objects a later request can mutate.
    const closeTimes = async (provider: MockProvider, end: number) =>
        (await provider.getMarketData('BTCUSDC', '60', undefined, START, end)).map((k) => k.closeTime);

    it('repeated requests for the same range do not drift the last candle closeTime', async () => {
        const provider = new MockProvider(dataDirectory);
        const first = await closeTimes(provider, END);
        const second = await closeTimes(provider, END);
        const third = await closeTimes(provider, END);

        expect(second).toEqual(first);
        expect(third).toEqual(first);
    });

    it('a request for a shorter range does not change the candles of a longer one', async () => {
        const provider = new MockProvider(dataDirectory);
        const before = await closeTimes(provider, END);
        await closeTimes(provider, new Date('2024-01-10').getTime());
        const after = await closeTimes(provider, END);

        expect(after).toEqual(before);
    });

    it('running the same request.security_lower_tf script twice gives identical intrabar arrays', async () => {
        const provider = new MockProvider(dataDirectory);
        const source = [
            '//@version=6',
            'indicator("ltf repeatability")',
            'hs = request.security_lower_tf(syminfo.tickerid, "60", high)',
            'f() => [high, low]',
            '[uh, ul] = request.security_lower_tf(syminfo.tickerid, "60", f())',
            'plot(hs.size(), "pure")',
            'plot(ul.size(), "udf")',
        ].join('\n');

        const run = async () => {
            const { plots } = await new PineTS(provider, 'BTCUSDC', 'D', null, START, END).run(source);
            return { pure: plots['pure'].data.map((d: any) => d.value), udf: plots['udf'].data.map((d: any) => d.value) };
        };

        const a = await run();
        const b = await run();
        expect(b).toEqual(a);
        // A daily crypto bar holds 24 hourly intrabars (TradingView: 24 on BINANCE:BTCUSDT).
        expect(new Set([...a.pure, ...a.udf])).toEqual(new Set([24]));
    });
});
