import { describe, expect, it } from 'vitest';
import { PineTS } from 'PineTS.class';
import { getKlines, arrayPrecision } from '../utils';

describe('Pagination', () => {
    it('should calculate SMA over 100 periods in 10 pages', async () => {
        const klines = await getKlines('BTCUSDT', '1h', 500, 0, 1736071200000 - 1);
        const pineTS = new PineTS(klines);

        const sourceCode = (context) => {
            const { close } = context.data;
            const { plotchar, ta } = context.pine;            

            const sma = ta.sma(close, 14);
            plotchar(sma, 'data');

            return {
                sma,
            };
        };

        const periods = 100;
        const pageSize = 10;
        const accumulatedSma: number[] = [];

        // Collect all pages and accumulate results
        const iterator = pineTS.run(sourceCode, periods, pageSize, { sourceMode: 'trustedJavaScript' }) as AsyncGenerator<any>;
        let pageNumber = 0;
        for await (const pageContext of iterator) {
            pageNumber++;

            // Verify each page contains only the new results
            expect(pageContext.result.sma.length).toBe(pageSize);

            // Accumulate the page results
            accumulatedSma.push(...pageContext.result.sma);

            console.log(`Page ${pageNumber}: received ${pageContext.result.sma.length} results, total accumulated: ${accumulatedSma.length}`);
        }

        const data = await iterator.next();
        console.log('data', data);

        // Verify we got 10 pages
        expect(pageNumber).toBe(10);

        // Verify accumulated results length
        expect(accumulatedSma.length).toBe(100);

        // Run non-paginated version for comparison
        const completeContext = (await pineTS.run(sourceCode, periods, undefined, { sourceMode: 'trustedJavaScript' })) as any;
        const completeSma = completeContext.result.sma;

        // Verify the complete result has the same length
        expect(completeSma.length).toBe(100);

        // Compare the entire accumulated array with the non-paginated result
        expect(accumulatedSma).toEqual(completeSma);

        // Additional verification: compare first, middle, and last values
        expect(accumulatedSma[0]).toBe(completeSma[0]);
        expect(accumulatedSma[49]).toBe(completeSma[49]);
        expect(accumulatedSma[99]).toBe(completeSma[99]);

        console.log('\n✅ Pagination test completed successfully');
        console.log(`   Total pages: ${pageNumber}`);
        console.log(`   Accumulated SMA length: ${accumulatedSma.length}`);
        console.log(`   Non-paginated SMA length: ${completeSma.length}`);
        console.log(`   First SMA value: ${accumulatedSma[0]}`);
        console.log(`   Last SMA value: ${accumulatedSma[99]}`);
        console.log(`   Results match: ${JSON.stringify(accumulatedSma) === JSON.stringify(completeSma)}`);
    });

    it('should handle partial last page correctly (100 periods with 30 per page)', async () => {
        const klines = await getKlines('BTCUSDT', '1h', 500, 0, 1736071200000 - 1);
        const pineTS = new PineTS(klines);

        const sourceCode = (context) => {
            const { close } = context.data;
            const ta = context.ta;

            const sma = ta.sma(close, 14);

            return {
                sma,
            };
        };

        const periods = 100;
        const pageSize = 30;
        const accumulatedSma: number[] = [];
        const pageSizes: number[] = [];

        // Collect all pages and accumulate results
        const iterator = pineTS.run(sourceCode, periods, pageSize, { sourceMode: 'trustedJavaScript' }) as AsyncGenerator<any>;
        let pageNumber = 0;
        for await (const pageContext of iterator) {
            pageNumber++;
            const currentPageSize = pageContext.result.sma.length;
            pageSizes.push(currentPageSize);

            // Accumulate the page results
            accumulatedSma.push(...pageContext.result.sma);

            console.log(`Page ${pageNumber}: received ${currentPageSize} results, total accumulated: ${accumulatedSma.length}`);
        }

        // Verify we got 4 pages (3 full + 1 partial)
        expect(pageNumber).toBe(4);

        // Verify page sizes
        expect(pageSizes[0]).toBe(30); // First page: full
        expect(pageSizes[1]).toBe(30); // Second page: full
        expect(pageSizes[2]).toBe(30); // Third page: full
        expect(pageSizes[3]).toBe(10); // Fourth page: partial (100 - 90 = 10)

        // Verify accumulated results length
        expect(accumulatedSma.length).toBe(100);

        // Run non-paginated version for comparison
        const completeContext = (await pineTS.run(sourceCode, periods, undefined, { sourceMode: 'trustedJavaScript' })) as any;
        const completeSma = completeContext.result.sma;

        // Verify the complete result has the same length
        expect(completeSma.length).toBe(100);

        // Compare the entire accumulated array with the non-paginated result
        expect(accumulatedSma).toEqual(completeSma);

        console.log('\n✅ Partial page test completed successfully');
        console.log(`   Total pages: ${pageNumber}`);
        console.log(`   Page sizes: [${pageSizes.join(', ')}]`);
        console.log(`   Accumulated SMA length: ${accumulatedSma.length}`);
        console.log(`   Non-paginated SMA length: ${completeSma.length}`);
        console.log(`   Results match: ${JSON.stringify(accumulatedSma) === JSON.stringify(completeSma)}`);
    });

    it('should support live streaming with mock provider', async () => {
        // Create a mock provider that simulates live data
        let callCount = 0;
        const baseKlines = await getKlines('BTCUSDT', '1h', 100, 0, 1736071200000 - 1);

        const mockProvider = {
            async getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number) {
                // First call returns initial data
                if (callCount === 0) {
                    callCount++;
                    return baseKlines.slice(0, 20);
                }

                // Simulate fetching from a specific start time
                if (sDate) {
                    // Find the index where openTime matches sDate
                    const startIdx = baseKlines.findIndex((k) => k.openTime === sDate);
                    if (startIdx === -1) {
                        return [];
                    }

                    // Simulate new candles becoming available
                    // Return the matching candle + a few more (simulating new data)
                    callCount++;
                    const endIdx = Math.min(startIdx + 5, baseKlines.length);
                    return baseKlines.slice(startIdx, endIdx);
                }

                return baseKlines;
            },
        };

        const pineTS = new PineTS(mockProvider, 'BTCUSDT', '1h');
        await pineTS.ready();

        const sourceCode = (context) => {
            const { close } = context.data;
            const { ta } = context.pine;

            const sma = ta.sma(close, 5);

            return {
                sma,
            };
        };

        const periods = 20;
        const pageSize = 10;
        const accumulatedSma: number[] = [];
        let pageCount = 0;

        // Use live streaming mode
        const iterator = pineTS.run(sourceCode, periods, pageSize, { sourceMode: 'trustedJavaScript' }) as AsyncGenerator<any>;

        // Process historical pages (should get 2 pages)
        for await (const pageContext of iterator) {
            pageCount++;

            if (pageContext === null) {
                // No new data signal - in a real scenario, we'd wait and continue
                console.log(`Page ${pageCount}: No new data, stopping test`);
                break;
            }

            accumulatedSma.push(...pageContext.result.sma);
            console.log(`Page ${pageCount}: received ${pageContext.result.sma.length} results, total: ${accumulatedSma.length}`);

            // Stop after getting 3 pages (2 historical + 1 live)
            if (pageCount >= 3) {
                console.log('Stopping after 3 pages for test purposes');
                break;
            }
        }

        // Verify we got at least the historical pages
        expect(pageCount).toBeGreaterThanOrEqual(2);

        // Verify we accumulated results
        expect(accumulatedSma.length).toBeGreaterThan(0);

        console.log('\n✅ Live streaming test completed successfully');
        console.log(`   Total pages processed: ${pageCount}`);
        console.log(`   Total SMA values: ${accumulatedSma.length}`);
        console.log(`   Mock provider called: ${callCount} times`);
    });

    it('should continue fetching new data after historical pages are exhausted (live Binance data)', async () => {
        // Use real Binance provider that implements IProvider interface
        const binanceProvider = {
            async getMarketData(tickerId: string, timeframe: string, limit?: number, sDate?: number, eDate?: number) {
                return await getKlines(tickerId, timeframe, limit, sDate, eDate);
            },
        };

        const pineTS = new PineTS(binanceProvider, 'BTCUSDT', '1m'); // Use 1-minute candles for faster test
        await pineTS.ready();

        const sourceCode = (context) => {
            const { close } = context.data;
            const { ta } = context.pine;
            const sma = ta.sma(close, 5);
            return { sma };
        };

        const periods = 30;
        const pageSize = 10;
        const accumulatedSma: number[] = [];

        const iterator = pineTS.run(sourceCode, periods, pageSize, { sourceMode: 'trustedJavaScript' }) as AsyncGenerator<any>;

        // Process all historical pages (should be 3 pages of 10 each)
        console.log('--- Processing Historical Pages ---');
        let historicalPages = 0;

        // Process exactly 3 historical pages
        for (let i = 0; i < 3; i++) {
            const result = await iterator.next();
            if (result.done || result.value === null) break;

            historicalPages++;
            const pageContext = result.value;
            accumulatedSma.push(...pageContext.result.sma);
            console.log(`   Historical page ${historicalPages}: ${pageContext.result.sma.length} results`);
        }

        expect(historicalPages).toBe(3);
        expect(accumulatedSma.length).toBe(30);
        console.log(`✓ Historical pages complete: ${historicalPages} pages, ${accumulatedSma.length} results`);

        // Now call iterator.next() again - should attempt to fetch new live data
        console.log('\n--- Calling iterator.next() for live data ---');
        const beforeLength = accumulatedSma.length;

        const nextResult = await iterator.next();

        console.log(`   Next result: done=${nextResult.done}, hasValue=${nextResult.value !== null}`);

        if (nextResult.value === null) {
            // No new data available yet (normal for live streaming when no new candles)
            console.log('   No new data available (this is normal for live streaming)');
            console.log('✓ Live streaming mode is active and waiting for new data');
        } else if (!nextResult.done) {
            // Got new data!
            const newPageContext = nextResult.value;
            const newResults = newPageContext.result.sma;
            accumulatedSma.push(...newResults);

            console.log(`   Received ${newResults.length} new results`);
            console.log(`   Total accumulated: ${accumulatedSma.length}`);

            // Verify we got results (could be just recalculated last candle or new candles)
            expect(newResults.length).toBeGreaterThan(0);
            console.log(`✓ Got ${newResults.length} result(s) from live fetch`);
        }

        // Verify the iterator is not done (it should continue forever in live mode)
        expect(nextResult.done).toBe(false);
        console.log('✓ Iterator remains active (not done)');

        console.log('\n✅ Live streaming continuation test passed');
        console.log(`   Final SMA count: ${accumulatedSma.length}`);
        console.log(`   Iterator continues to be available for more data`);
    }, 60000); // Increase timeout to 10 seconds for live API calls
});
