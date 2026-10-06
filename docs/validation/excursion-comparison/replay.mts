// SPDX-License-Identifier: AGPL-3.0-only
// Run from the pinned PineTS checkout with its locked dependencies installed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PineTS } from '../../../src/PineTS.class';
const file = process.argv[2];
assert(file, 'Usage: node --import tsx docs/validation/excursion-comparison/replay.mts /absolute/native-capture.json');
const capture = JSON.parse(fs.readFileSync(file, 'utf8'));
const source = fs.readFileSync(new URL('./probe.pine', import.meta.url), 'utf8');
const hash = crypto.createHash('sha256').update(source).digest('hex');
assert.equal(capture.sourceSha256, hash, 'Source differs from frozen probe');
assert.equal(capture.chartType, 'ordinary_candles');
assert.equal(capture.reportScope, 'chart');
const contract = JSON.parse(fs.readFileSync(new URL('./capture-contract.json', import.meta.url), 'utf8'));
for (const [key, value] of Object.entries(contract.settings)) assert.equal(capture.settings[key], value, `Native property ${key} differs`);
assert.equal(capture.metadata.tickerid, 'CME_MINI:MNQ1!');
assert.equal(capture.metadata.pointvalue, 2);
assert.equal(capture.metadata.mincontract, 1);
assert.equal(capture.metadata.mintick, 0.25);
assert.equal(capture.timeframe, 'D');
assert(capture.candles.length > 0 && capture.trades.length > 0);
assert(capture.candles.every((c: any, i: number, a: any[]) => ['open','high','low','close','openTime','closeTime'].every(k => Number.isFinite(c[k])) && (i === 0 || c.openTime > a[i-1].openTime)));
const provider = { configure() {}, async getMarketData() { return capture.candles; }, async getSymbolInfo() { return capture.metadata; } };
const result = await new PineTS(provider as any, capture.metadata.tickerid, capture.timeframe).run(source);
const actual = result.strategy.closedtrades.map((t: any) => ({ entryTime:t.entry_time, exitTime:t.exit_time, entryPrice:t.entry_price, exitPrice:t.exit_price, size:t.size, commission:t.commission, profit:t.profit, maxDrawdown:t.max_drawdown, maxRunup:t.max_runup }));
assert.equal(actual.length, capture.trades.length, 'Closed trade count differs');
const mismatches: any[] = [];
actual.forEach((trade: any, i: number) => {
    for (const key of Object.keys(trade)) {
        const expected = capture.trades[i][key];
        assert(Number.isFinite(expected), `Native row ${i} lacks numeric ${key}`);
        assert(Number.isFinite(trade[key]), `PineTS row ${i} lacks numeric ${key}`);
        if (Math.abs(trade[key] - expected) > 1e-8) mismatches.push({row:i,field:key,expected,actual:trade[key]});
    }
});
const aggregate = {maxDrawdown:result.strategy.max_drawdown,maxRunup:result.strategy.max_runup,netProfit:result.strategy.netprofit};
if (capture.aggregate !== null && capture.aggregate !== undefined) {
    assert.deepEqual(Object.keys(capture.aggregate).sort(), Object.keys(aggregate).sort(), 'Aggregate reference must contain exactly maxDrawdown, maxRunup and netProfit');
}
const aggregateMismatches = Object.entries(capture.aggregate ?? {}).filter(([key, expected]) => !Number.isFinite(expected) || !Number.isFinite(aggregate[key]) || Math.abs(aggregate[key] - Number(expected)) > 1e-8).map(([field,expected]) => ({field,expected,actual:aggregate[field]}));
console.log(JSON.stringify({sourceSha256:hash,candles:capture.candles.length,trades:actual.length,perTradeMatch:mismatches.length===0,mismatches,aggregate,aggregateReference:capture.aggregate,aggregateMatch:capture.aggregate ? aggregateMismatches.length===0 : null,aggregateMismatches,aggregateScope:'Fixture comparison only; general native parity unverified'},null,2));
if (mismatches.length || aggregateMismatches.length) process.exitCode=1;
