// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it, vi } from 'vitest';
import { BaseProvider } from '@pinets/marketData/BaseProvider';
import type { ISymbolInfo } from '@pinets/marketData/IProvider';
import type { Kline } from '@pinets/marketData/types';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { PineTS } from '../../src/PineTS.class';
import { requestProviderPage } from '../../src/marketData/requestProviderPage';
import { readBudgetedJson } from '../../src/marketData/readBudgetedJson';
import { FMPProvider } from '../../src/marketData/FMP/FMPProvider.class';

class CountingProvider extends BaseProvider {
    calls = 0;
    nextBars: Kline[] = [];
    byTicker = new Map<string, Kline[]>();

    constructor() {
        super({ requiresApiKey: false, providerName: 'Counting' });
    }

    protected getSupportedTimeframes(): Set<string> {
        return new Set(['1']);
    }

    protected async _getMarketDataNative(tickerId: string): Promise<Kline[]> {
        this.calls++;
        return this.byTicker.get(tickerId) ?? this.nextBars;
    }

    async getSymbolInfo(): Promise<ISymbolInfo> {
        return null as any;
    }
}

function bars(count: number): Kline[] {
    return Array.from({ length: count }, (_, i) => ({
        openTime: i * 60_000,
        closeTime: (i + 1) * 60_000,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 1,
    })) as Kline[];
}

describe('aggregate provider work budget', () => {
    it('rejects a huge minute aggregation before calling the native provider', async () => {
        const provider = new CountingProvider();
        await expect(provider.getMarketData('TEST', '1439', 100_000)).rejects.toThrow(/provider.*bars|raw bars/i);
        expect(provider.calls).toBe(0);
    });

    it('rejects a calendar-to-minute expansion before native fetch', async () => {
        const provider = new CountingProvider();
        provider.setAggregationSubTimeframe('1');
        await expect(provider.getMarketData('TEST', 'M', 3)).rejects.toThrow(/provider.*bars|raw bars/i);
        expect(provider.calls).toBe(0);
    });

    it('shares the raw-bar quota across provider fetches', async () => {
        const provider = new CountingProvider();
        const budget = new ExecutionBudget(500_000, { maxProviderRawBars: 5 });
        provider.nextBars = bars(3);

        await expect(provider.getMarketData('TEST', '1', 3, undefined, undefined, { budget })).resolves.toHaveLength(3);
        await expect(provider.getMarketData('TEST', '1', 3, undefined, undefined, { budget })).rejects.toThrow(/provider.*bars|raw bars/i);
        expect(provider.calls).toBe(1);
        expect(budget.providerRawBars).toBe(3);
    });

    it('rejects oversized native results even when the request omitted a limit', async () => {
        const provider = new CountingProvider();
        const budget = new ExecutionBudget(500_000, { maxProviderRawBars: 5 });
        provider.nextBars = bars(6);

        await expect(provider.getMarketData('TEST', '1', undefined, undefined, undefined, { budget })).rejects.toThrow(/provider.*bars|raw bars/i);
        expect(budget.providerRawBars).toBe(0);
    });

    it('preserves the legacy null-as-omitted limit', async () => {
        const provider = new CountingProvider();
        provider.nextBars = bars(2);
        await expect(provider.getMarketData('TEST', '1', null as any)).resolves.toHaveLength(2);
    });

    it('inherits the same budget before a secondary PineTS constructor starts loading', async () => {
        const provider = new CountingProvider();
        provider.nextBars = bars(2);
        const budget = new ExecutionBudget(500_000, { maxProviderRawBars: 2 });
        const first = new PineTS(provider, 'TEST', '1', 2, undefined, undefined, { executionBudget: budget });
        await first.ready();
        const second = new PineTS(provider, 'TEST', '1', 2, undefined, undefined, { executionBudget: budget });
        await expect(second.ready()).rejects.toThrow(/provider.*bars|raw bars/i);
        expect(provider.calls).toBe(1);
    });

    it('does not let ignore_invalid_symbol suppress a provider budget violation', async () => {
        const provider = new CountingProvider();
        provider.byTicker.set('CHART', bars(1));
        provider.byTicker.set('OTHER', bars(2));
        const budget = new ExecutionBudget(500_000, { maxProviderRawBars: 2 });
        const pine = new PineTS(provider, 'CHART', '1', undefined, undefined, undefined, { executionBudget: budget });
        const source = `//@version=5\nindicator("budget")\nx = request.security("OTHER", "1", close, ignore_invalid_symbol=true)\nplot(x)`;
        await expect(pine.run(source)).rejects.toThrow(/provider.*bars|raw bars/i);
        expect(provider.calls).toBe(2);
    });

    it('charges raw FMP bars before a provider trims its response to limit', async () => {
        const originalFetch = globalThis.fetch;
        const raw = Array.from({ length: 4 }, (_, i) => ({
            date: `2024-01-0${i + 1}`,
            open: 1, high: 1, low: 1, close: 1, volume: 1,
        }));
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(raw), { status: 200 }));
        globalThis.fetch = fetchMock as typeof fetch;
        try {
            const provider = new FMPProvider({ apiKey: 'test-key' });
            const budget = new ExecutionBudget(500_000, { maxProviderRawBars: 3 });
            await expect(provider.getMarketData('AAPL', 'D', 2, undefined, undefined, { budget }))
                .rejects.toThrow(/provider.*bars|raw bars/i);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it('counts pages and streamed response bytes before parsing', async () => {
        const originalFetch = globalThis.fetch;
        const fetchMock = vi.fn(async () => new Response('{"v":1}', { status: 200 }));
        globalThis.fetch = fetchMock as typeof fetch;
        try {
            const budget = new ExecutionBudget(500_000, { maxProviderPages: 1, maxProviderResponseBytes: 8 });
            const first = await requestProviderPage('https://example.test/bars', {}, { budget },
                (response) => readBudgetedJson(response, budget));
            expect(first).toEqual({ v: 1 });
            expect(budget.providerPages).toBe(1);
            expect(budget.providerResponseBytes).toBe(7);
            await expect(requestProviderPage('https://example.test/bars', {}, { budget },
                (response) => readBudgetedJson(response, budget))).rejects.toThrow(/provider pages/i);
            expect(fetchMock).toHaveBeenCalledTimes(1);

            const tiny = new ExecutionBudget(500_000, { maxProviderResponseBytes: 3 });
            await expect(requestProviderPage('https://example.test/bars', {}, { budget: tiny },
                (response) => readBudgetedJson(response, tiny))).rejects.toThrow(/provider response bytes/i);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it('honors cancellation and deadlines before an HTTP attempt', async () => {
        const originalFetch = globalThis.fetch;
        const fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
        try {
            const controller = new AbortController();
            controller.abort();
            await expect(requestProviderPage('https://example.test/bars', {}, { signal: controller.signal }, async () => 1))
                .rejects.toThrow(/cancelled/i);
            await expect(requestProviderPage('https://example.test/bars', {}, { deadline: Date.now() - 1 }, async () => 1))
                .rejects.toThrow(/deadline/i);
            expect(fetchMock).not.toHaveBeenCalled();
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it('terminates an in-flight provider wait when the caller aborts', async () => {
        const originalFetch = globalThis.fetch;
        const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
        globalThis.fetch = fetchMock as typeof fetch;
        try {
            const controller = new AbortController();
            const pending = requestProviderPage('https://example.test/bars', {}, { signal: controller.signal }, async () => 1);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            controller.abort();
            await expect(pending).rejects.toThrow(/cancelled/i);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
