// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MockProvider } from '@pinets/marketData/Mock/MockProvider.class';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let dataDirectory: string;

function writeFixture(fileName: string, openTime: number): void {
    const bars = [{ openTime, open: 1, high: 2, low: 0.5, close: 1.5, volume: 1, closeTime: openTime + 1,
        quoteAssetVolume: 0, numberOfTrades: 1, takerBuyBaseAssetVolume: 0, takerBuyQuoteAssetVolume: 0, ignore: 0 }];
    fs.writeFileSync(path.join(dataDirectory, fileName), JSON.stringify(bars));
}

beforeEach(() => {
    dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pinets-mock-fixture-'));
});

afterEach(() => {
    for (const file of fs.readdirSync(dataDirectory)) fs.unlinkSync(path.join(dataDirectory, file));
    fs.rmdirSync(dataDirectory);
});

describe('MockProvider literal fixture names', () => {
    it('loads a symbol containing regex punctuation as literal text', async () => {
        writeFixture('A[.B-1h-1000-2000.json', 1500);

        const data = await new MockProvider(dataDirectory).getMarketData('A[.B', '60');

        expect(data.map((bar) => bar.openTime)).toEqual([1500]);
    });

    it('does not allow a dot in the symbol to match another fixture', async () => {
        writeFixture('ACB-1h-1000-2000.json', 1500);

        const data = await new MockProvider(dataDirectory).getMarketData('A.B', '60');

        expect(data).toEqual([]);
    });

    it('treats punctuation in a timeframe literally at the fixture lookup boundary', async () => {
        writeFixture('BTCUSDT-1[h-1000-2000.json', 1500);
        class ExposedMockProvider extends MockProvider {
            native(symbol: string, timeframe: string) {
                return this._getMarketDataNative(symbol, timeframe);
            }
        }

        const data = await new ExposedMockProvider(dataDirectory).native('BTCUSDT', '1[h');

        expect(data.map((bar) => bar.openTime)).toEqual([1500]);
    });

    it('finds the most recent containing fixture in a populated directory', async () => {
        for (let i = 0; i < 128; i++) writeFixture(`OTHER${i}-1h-1000-2000.json`, 1500);
        writeFixture('A.B-1h-1000-2000.json', 1500);
        writeFixture('A.B-1h-1000-3000.json', 2500);

        const data = await new MockProvider(dataDirectory).getMarketData('A.B', '60', undefined, 2400, 2600);

        expect(data.map((bar) => bar.openTime)).toEqual([2500]);
    });

    it('returns no candles when the fixture directory is missing', async () => {
        const missing = path.join(dataDirectory, 'missing');
        const data = await new MockProvider(missing).getMarketData('BTCUSDT', '60');

        expect(data).toEqual([]);
    });
});
