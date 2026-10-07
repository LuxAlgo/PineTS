import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

/**
 * Perf regression guard: a Pine script calling timestamp()/year()/month()/
 * dayofmonth()/dayofweek() with an IANA timezone runs those calls ONCE PER
 * BAR. PineTS must not construct a fresh Intl.DateTimeFormat per call — that
 * is ~0.3-1ms each and turned a real 10k-bar HTF_EMA execute into a 30s hang
 * (profiled: 58.6% _timestampFromIANA + 20.5% getDatePartsInTimezone).
 *
 * Correctness reference: a timestamp computed for calendar components in a
 * timezone, then read back in that same timezone, must round-trip (ECMAScript
 * TZ semantics; America/New_York in July is EDT = UTC-4, so 12:00 ET noon
 * reads back as hour 12 on the same calendar day).
 */
describe('timezone helper performance', () => {
    it('executes per-bar timestamp()+dayofweek() in an IANA tz quickly', async () => {
        // ~35k fifteen-minute bars over a year; the global-scope day-key
        // pattern runs 5 IANA-formatter calls per bar = the HTF_EMA shape.
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '15', null, new Date('2023-01-01').getTime(), new Date('2024-01-01').getTime());

        const t0 = performance.now();
        await pineTS.run(`
//@version=5
indicator("tz perf probe")
TZ = "America/New_York"
t = timestamp(TZ, year(time, TZ), month(time, TZ), dayofmonth(time, TZ), 12, 0)
dw = dayofweek(t, TZ)
plot(t + dw)`);
        const elapsed = performance.now() - t0;

        // Uncached (bug): ~175k fresh Intl.DateTimeFormat constructions at
        // ~60us each = ~2.9s measured in Node ICU (browser builds are ~10x
        // slower — a real HTF_EMA execute hung for 30s). Cached: ~200-400ms.
        // The 2000ms bound separates both sides with headroom.
        expect(elapsed).toBeLessThan(2000);
    });

    it('year/month/day round-trip through America/New_York (EDT = UTC-4)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-07-01').getTime(), new Date('2024-07-10').getTime());

        const { plots } = await pineTS.run(`
//@version=5
indicator("tz roundtrip probe")
TZ = "America/New_York"
// 2024-07-04 12:00 ET == 16:00 UTC (EDT, UTC-4)
t = timestamp(TZ, 2024, 7, 4, 12, 0)
h = hour(t, TZ)
y = year(t, TZ)
m = month(t, TZ)
d = dayofmonth(t, TZ)
plot(h * 1000000 + (y % 100) * 10000 + m * 100 + d, "roundtrip")`);

        const v = plots['roundtrip'].data[plots['roundtrip'].data.length - 1].value;
        // hour=12, year=2024, month=7, day=4
        expect(v).toBeCloseTo(12 * 1000000 + 24 * 10000 + 700 + 4, 6);
    });
});