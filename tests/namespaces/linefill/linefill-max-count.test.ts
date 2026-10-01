import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

// Linefills are capped at max_lines_count, oldest first. On TradingView, a script creating
// two lines and one linefill per bar ends with 103 linefills for max_lines_count = 100, 52
// for the default 50 and 502 for 500: its garbage collection runs a few objects late (its
// lines overshoot the same way, 104 for 100). PineTS applies the cap exactly, as for lines.

async function finalDrawings(decl: string) {
    const src = `//@version=6
indicator("linefill cap", overlay = true${decl})
a = line.new(bar_index, high, bar_index + 1, high)
b = line.new(bar_index, low, bar_index + 1, low)
linefill.new(a, b, color.new(color.blue, 80))
plot(bar_index, "bi")`;
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-15').getTime());
    const { plots } = await pineTS.run(src);
    const live = (key: string) => (plots[key].data[0].value as any[]).filter((o) => !o._deleted);
    return { linefills: live('__linefills__'), lines: live('__lines__'), lastBar: plots['bi'].data[plots['bi'].data.length - 1].value };
}

describe('linefill max count', () => {
    it('keeps at most max_lines_count linefills, dropping the oldest', async () => {
        const r = await finalDrawings(', max_lines_count = 100');
        expect(r.lastBar).toBeGreaterThan(200);
        expect(r.lines.length).toBe(100);
        expect(r.linefills.length).toBe(100);
        // the survivors are the linefills of the last 100 bars
        const firstBars = r.linefills.map((lf) => lf.line1.x1).sort((x, y) => x - y);
        expect(firstBars[0]).toBe(r.lastBar - 99);
        expect(firstBars[firstBars.length - 1]).toBe(r.lastBar);
    });

    it('uses the default of 50 when max_lines_count is not set', async () => {
        const r = await finalDrawings('');
        expect(r.lines.length).toBe(50);
        expect(r.linefills.length).toBe(50);
    });
});
