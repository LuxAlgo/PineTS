// SPDX-License-Identifier: AGPL-3.0-only

import { BinanceProvider } from './Binance/BinanceProvider.class';
import { FMPProvider } from './FMP/FMPProvider.class';
import { AlpacaProvider } from './Alpaca/AlpacaProvider.class';
import { IProvider } from './IProvider';
import { BaseProvider } from './BaseProvider';
// MockProvider is conditionally imported - excluded from browser builds via rollup plugin
// In browser builds, it will be replaced with a stub
import { MockProvider } from './Mock/MockProvider.class';

// Re-export provider classes for direct instantiation
export { BinanceProvider } from './Binance/BinanceProvider.class';
export { FMPProvider } from './FMP/FMPProvider.class';
export { AlpacaProvider } from './Alpaca/AlpacaProvider.class';
export { BaseProvider } from './BaseProvider';

type TProvider = {
    [key: string]: IProvider;
};

// MockProvider uses Node.js modules (fs, path) and is excluded from browser builds
// In browser builds, MockProvider will be a stub that returns empty arrays
// We check if we're in Node.js by checking for process or trying to access fs module
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

let MockProviderInstance: IProvider | null = null;
if (isNodeEnvironment) {
    try {
        // Only instantiate MockProvider in Node.js environments
        // In browser builds, this will use the stub which is safe
        MockProviderInstance = new MockProvider();
    } catch (e) {
        // If instantiation fails, don't include Mock provider
        MockProviderInstance = null;
    }
}

export const Provider: TProvider = {
    Binance: new BinanceProvider(),
    FMP: new FMPProvider(),
    Alpaca: new AlpacaProvider(),
    // Only include Mock provider in Node.js environments (excluded from browser builds)
    ...(MockProviderInstance ? { Mock: MockProviderInstance } : {}),
};

export function registerProvider(name: string, provider: IProvider) {
    Provider[name] = provider;
}
