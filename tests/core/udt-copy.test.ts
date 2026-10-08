import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

// Expected values were taken from TradingView (BINANCE:BTCUSDT, 60) running the same scripts.
describe('UDT copy', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-03').getTime());

    const plotValues = (plots: any, title: string) => (plots[title]?.data ?? []).map((d: any) => d.value);

    it('copies a field assigned after construction', async () => {
        const code = `
//@version=6
indicator("udt copy")
type P
    float lon
p = P.new()
p.lon := 12.5
q = p.copy()
plot(q.lon, "q_lon")
`;
        const { plots } = await makePineTS().run(code);

        const values = plotValues(plots, 'q_lon');
        expect(values.length).toBeGreaterThan(0);
        expect(values.every((v: number) => v === 12.5)).toBe(true);
    });

    it('copies a reassigned field whatever its initial value came from', async () => {
        const code = `
//@version=6
indicator("udt copy issue variants")
type A
    float lon
type B
    float lon = 1.0
a = A.new()
a.lon := 12.5
b = B.new()
b.lon := 12.5
c = A.new(1.0)
c.lon := 12.5
plot(a.copy().lon, "no_initial_value")
plot(b.copy().lon, "default_value")
plot(c.copy().lon, "constructor_value")
`;
        const { plots } = await makePineTS().run(code);

        for (const title of ['no_initial_value', 'default_value', 'constructor_value']) {
            const values = plotValues(plots, title);
            expect(values.length, title).toBeGreaterThan(0);
            expect(new Set(values), title).toEqual(new Set([12.5]));
        }
    });

    it('copies current field values, keeps copies independent, and shares nested references', async () => {
        const code = `
//@version=6
indicator("udt copy cases")
type P
    float lon
    float a = 1
    array<float> xs
p = P.new()
p.lon := 12.5
p.a := 5
p.xs := array.new<float>()
p.xs.push(1)
q = p.copy()
r = P.copy(p)
q.lon := 3
p.a := 7
q.xs.push(2)
plot(r.lon, "r_lon")
plot(q.lon, "q_lon")
plot(p.lon, "p_lon")
plot(q.a, "q_a")
plot(r.a, "r_a")
plot(p.a, "p_a")
plot(p.xs.size(), "p_xs_size")
plot(r.xs.size(), "r_xs_size")
`;
        const { plots } = await makePineTS().run(code);

        const expected: Record<string, number> = {
            r_lon: 12.5,
            q_lon: 3,
            p_lon: 12.5,
            q_a: 5,
            r_a: 5,
            p_a: 7,
            p_xs_size: 2,
            r_xs_size: 2,
        };
        for (const [title, value] of Object.entries(expected)) {
            const values = plotValues(plots, title);
            expect(values.length, title).toBeGreaterThan(0);
            expect(new Set(values), title).toEqual(new Set([value]));
        }
    });
});
