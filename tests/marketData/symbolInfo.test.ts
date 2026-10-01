// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { Provider } from '../../src/marketData/Provider.class';

describe('BinanceProvider.getSymbolInfo', () => {
    const binance = Provider.Binance;

    describe('Spot Market Symbols', () => {
        it('should return correct symbol info for BTCUSDT', async () => {
            const symbolInfo = await binance.getSymbolInfo('BTCUSDT');

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
            expect(symbolInfo.country).toBe('');
        });

        it('should return correct symbol info for ETHUSDT', async () => {
            const symbolInfo = await binance.getSymbolInfo('ETHUSDT');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.ticker).toBe('ETHUSDT');
            expect(symbolInfo.root).toBe('ETHUSDT');
            expect(symbolInfo.basecurrency).toBe('ETH');
            expect(symbolInfo.currency).toBe('USDT');
            expect(symbolInfo.type).toBe('crypto');
        });

        it('should have valid price filters', async () => {
            const symbolInfo = await binance.getSymbolInfo('BTCUSDT');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.mintick).toBeGreaterThan(0);
            expect(symbolInfo.pricescale).toBeGreaterThan(0);
            expect(symbolInfo.minmove).toBe(1);
            expect(symbolInfo.pointvalue).toBeGreaterThan(0);
            expect(symbolInfo.mincontract).toBeGreaterThan(0);
        });

        it('should calculate pricescale correctly from tickSize', async () => {
            const symbolInfo = await binance.getSymbolInfo('BTCUSDT');

            expect(symbolInfo).not.toBeNull();
            // pricescale should be inverse of tickSize
            const expectedPricescale = Math.round(1 / symbolInfo.mintick);
            expect(symbolInfo.pricescale).toBe(expectedPricescale);
        });
    });

    describe('Perpetual Futures Symbols', () => {
        it('should return correct symbol info for BTCUSDT.P', async () => {
            const symbolInfo = await binance.getSymbolInfo('BTCUSDT.P');

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
            const symbolInfo = await binance.getSymbolInfo('ETHUSDT.P');

            expect(symbolInfo).not.toBeNull();
            expect(symbolInfo.ticker).toBe('ETHUSDT.P');
            expect(symbolInfo.root).toBe('ETHUSDT.P');
            expect(symbolInfo.type).toBe('futures');
            expect(symbolInfo.current_contract).toBe('Perpetual');
        });
    });

    describe('Stock-specific fields (N/A for crypto)', () => {
        it('should set stock-specific fields to na, as on TradingView', async () => {
            const symbolInfo = await binance.getSymbolInfo('BTCUSDT');

            expect(symbolInfo).not.toBeNull();

            // Company Data
            expect(symbolInfo.employees).toBeNaN();
            expect(symbolInfo.industry).toBe('');
            expect(symbolInfo.sector).toBe('');
            expect(symbolInfo.shareholders).toBeNaN();
            expect(symbolInfo.shares_outstanding_float).toBeNaN();
            expect(symbolInfo.shares_outstanding_total).toBeNaN();

            // Analyst Ratings
            expect(symbolInfo.recommendations_buy).toBeNaN();
            expect(symbolInfo.recommendations_buy_strong).toBeNaN();
            expect(symbolInfo.recommendations_date).toBeNaN();
            expect(symbolInfo.recommendations_hold).toBeNaN();
            expect(symbolInfo.recommendations_sell).toBeNaN();
            expect(symbolInfo.recommendations_sell_strong).toBeNaN();
            expect(symbolInfo.recommendations_total).toBeNaN();

            // Price Targets
            expect(symbolInfo.target_price_average).toBeNaN();
            expect(symbolInfo.target_price_date).toBeNaN();
            expect(symbolInfo.target_price_estimates).toBeNaN();
            expect(symbolInfo.target_price_high).toBeNaN();
            expect(symbolInfo.target_price_low).toBeNaN();
            expect(symbolInfo.target_price_median).toBeNaN();

            // Other N/A fields
            expect(symbolInfo.isin).toBe('');
            expect(symbolInfo.expiration_date).toBeNaN();
        });
    });

    describe('Error Handling', () => {
        it('should return null for invalid symbol', async () => {
            const symbolInfo = await binance.getSymbolInfo('INVALIDSYMBOL123456');

            expect(symbolInfo).toBeNull();
        });

        it('should handle network errors gracefully', async () => {
            // Test with malformed symbol that might cause API errors
            const symbolInfo = await binance.getSymbolInfo('');

            expect(symbolInfo).toBeNull();
        });
    });
});
