// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { MockProvider } from '@pinets/marketData/Mock/MockProvider.class';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MockProvider.getSymbolInfo', () => {
    // Use absolute path to ensure correct directory
    const projectRoot = path.resolve(__dirname, '../../');
    const dataDirectory = path.join(projectRoot, 'tests', 'compatibility', '_data');
    const mockProvider = new MockProvider(dataDirectory);

    describe('Spot Market Symbols', () => {
        it('should return correct symbol info for BTCUSDT', async () => {
            const symbolInfo = await mockProvider.getSymbolInfo('BTCUSDT');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.ticker).toBe('BTCUSDT');
            expect(symbolInfo.tickerid).toBe('BINANCE:BTCUSDT');
            expect(symbolInfo.prefix).toBe('BINANCE');
            expect(symbolInfo.root).toBe('BTCUSDT');
            expect(symbolInfo.basecurrency).toBe('BTC');
            expect(symbolInfo.currency).toBe('USDT');
            expect(symbolInfo.type).toBe('crypto');
            expect(symbolInfo.current_contract).toBe('');
            expect(symbolInfo.session).toBe('regular');
            expect(symbolInfo.timezone).toBe('Etc/UTC');
        });

        it('should return correct symbol info for ETHUSDT', async () => {
            const symbolInfo = await mockProvider.getSymbolInfo('ETHUSDT');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.ticker).toBe('ETHUSDT');
            expect(symbolInfo.root).toBe('ETHUSDT');
            expect(symbolInfo.basecurrency).toBe('ETH');
            expect(symbolInfo.currency).toBe('USDT');
            expect(symbolInfo.type).toBe('crypto');
        });

        it('should have valid price filters', async () => {
            const symbolInfo = await mockProvider.getSymbolInfo('BTCUSDT');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.mintick).toBeGreaterThan(0);
            expect(symbolInfo.pricescale).toBeGreaterThan(0);
            expect(symbolInfo.minmove).toBe(1);
            expect(symbolInfo.pointvalue).toBeGreaterThan(0);
            expect(symbolInfo.mincontract).toBeGreaterThan(0);
        });
    });

    describe('Perpetual Futures Symbols', () => {
        it('should return correct symbol info for BTCUSDT.P', async () => {
            const symbolInfo = await mockProvider.getSymbolInfo('BTCUSDT.P');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.ticker).toBe('BTCUSDT.P'); // Should preserve .P suffix
            expect(symbolInfo.tickerid).toBe('BINANCE:BTCUSDT.P'); // Should include .P
            expect(symbolInfo.prefix).toBe('BINANCE');
            expect(symbolInfo.root).toBe('BTCUSDT.P'); // TradingView: root is the ticker itself
            expect(symbolInfo.basecurrency).toBe('BTC');
            expect(symbolInfo.currency).toBe('USDT');
            expect(symbolInfo.type).toBe('futures'); // Should be futures, not crypto
            expect(symbolInfo.current_contract).toBe('Perpetual');
            expect(symbolInfo.description).toContain('Perpetual');
            expect(symbolInfo.session).toBe('regular');
        });

        it('should return correct symbol info for ETHUSDT.P', async () => {
            const symbolInfo = await mockProvider.getSymbolInfo('ETHUSDT.P');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.ticker).toBe('ETHUSDT.P');
            expect(symbolInfo.root).toBe('ETHUSDT.P');
            expect(symbolInfo.type).toBe('futures');
            expect(symbolInfo.current_contract).toBe('Perpetual');
        });
    });

    describe('Error Handling', () => {
        it('should return null for invalid symbol', async () => {
            const symbolInfo = await mockProvider.getSymbolInfo('INVALIDSYMBOL123456');

            expect(symbolInfo).toBeNull();
        });
    });

    describe('Data Consistency', () => {
        it('should match spot and futures data format', async () => {
            const spotSymbol = await mockProvider.getSymbolInfo('BTCUSDT');
            const futuresSymbol = await mockProvider.getSymbolInfo('BTCUSDT.P');

            expect(spotSymbol).not.toBeNull();
            expect(futuresSymbol).not.toBeNull();

            // Both should have same base currency
            expect(spotSymbol.basecurrency).toBe(futuresSymbol.basecurrency);
            expect(spotSymbol.currency).toBe(futuresSymbol.currency);

            // But different types and contracts
            expect(spotSymbol.type).toBe('crypto');
            expect(futuresSymbol.type).toBe('futures');
            expect(spotSymbol.current_contract).toBe('');
            expect(futuresSymbol.current_contract).toBe('Perpetual');
        });
    });
});

