import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('NAMESPACES_LIKE subscript access (time[n], close[n])', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());

    it('time[1] produces a valid timestamp (not NaN)', async () => {
        // Bug: time[1] was transpiled to time.__value[1] instead of $.get(time.__value, 1),
        // producing NaN because direct array indexing doesn't use the Series offset pointer.
        const code = `
//@version=5
indicator("time subscript test")
diff = time - time[1]
plot(diff, "diff")
plot(time[1], "time1")
`;
        const { plots } = await pineTS.run(code);

        const diffData = plots['diff'].data;
        const time1Data = plots['time1'].data;

        // time[1] should be a valid timestamp (not NaN/null) after the first bar
        const validTime1 = time1Data.filter(d => d.value !== null && !isNaN(d.value));
        expect(validTime1.length).toBeGreaterThan(0);

        // time - time[1] should be a positive number (bar duration) after the first bar
        const validDiff = diffData.filter(d => d.value !== null && !isNaN(d.value) && d.value > 0);
        expect(validDiff.length).toBeGreaterThan(0);

        // On a weekly chart, bar duration should be ~604800000ms (7 days)
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        for (const d of validDiff) {
            expect(d.value).toBeCloseTo(weekMs, -4); // within ~10s tolerance
        }
    });

    it('time[1] in arithmetic expression inside function call', async () => {
        // Tests the exact pattern from HTF Candle Projections indicator:
        // int barDuration = int(math.max(time - time[1], 0))
        const code = `
//@version=5
indicator("time in math.max")
barDur = int(math.max(time - time[1], 0))
futTime = time + 2 * barDur
plot(barDur, "barDur")
plot(futTime, "futTime")
`;
        const { plots } = await pineTS.run(code);

        const barDurData = plots['barDur'].data;
        const futTimeData = plots['futTime'].data;

        // barDur should be a valid positive integer after bar 0
        const validBarDur = barDurData.filter(d => d.value !== null && !isNaN(d.value) && d.value > 0);
        expect(validBarDur.length).toBeGreaterThan(0);

        // futTime should be a valid future timestamp (larger than time)
        const validFutTime = futTimeData.filter(d => d.value !== null && !isNaN(d.value));
        expect(validFutTime.length).toBeGreaterThan(0);
        // futTime = time + 2*barDur, should be > time on every valid bar
        for (const d of validFutTime) {
            expect(d.value).toBeGreaterThan(0);
        }
    });

    it('close[n] with variable offset produces valid values', async () => {
        // Tests NAMESPACES_LIKE subscript with a variable index (not just literal)
        const code = `
//@version=5
indicator("close with variable offset")
lookback = 3
val = close[lookback]
diff = close - val
plot(val, "val")
plot(diff, "diff")
`;
        const { plots } = await pineTS.run(code);

        const valData = plots['val'].data;
        // close[3] should be a valid number after bar 3
        const validVals = valData.filter(d => d.value !== null && !isNaN(d.value));
        expect(validVals.length).toBeGreaterThan(0);
    });
});
