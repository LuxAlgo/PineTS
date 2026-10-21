// SPDX-License-Identifier: AGPL-3.0-only
// A live session runs the history once, then re-runs only the forming bar on every tick, after
// rolling back what the previous run of that bar did. TradingView runs every tick from the state
// the previous bar left (only `varip` keeps what earlier ticks did), so after any number of ticks
// the output must equal a from-scratch run over the same data.
//
// The rollback used to restore only each variable Series' length and last value. A Series holds
// a reference to a collection or object, so the contents of arrays, maps, matrices, UDT instances
// and drawings kept what the discarded runs did, plot points piled up (one per tick), and
// variables and function scopes first created on the forming bar survived it.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Indicator } from '../../src/Indicator';

const MIN = 60_000;
const DAY = 1440 * MIN;

function mulberry32(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const bucketOf = (tf: string, t: number) => {
    if (tf === 'D') return Math.floor(t / DAY) * DAY;
    if (tf === 'W') {
        const d = Math.floor(t / DAY) * DAY;
        return d - ((new Date(d).getUTCDay() + 6) % 7) * DAY;
    }
    if (tf === 'M') {
        const d = new Date(t);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    }
    const ms = Number(tf) * MIN;
    return Math.floor(t / ms) * ms;
};
const nextBucket = (tf: string, b: number) => {
    if (tf === 'D') return b + DAY;
    if (tf === 'W') return b + 7 * DAY;
    if (tf === 'M') {
        const d = new Date(b);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    }
    return b + Number(tf) * MIN;
};

/**
 * A synthetic 24x7 market of 5-minute base bars. Every timeframe is aggregated from the base
 * bars visible "now"; the last base bar can be pushed away by `spike` (a tick that moves price
 * and a later one that brings it back). Like some hosts, the bar still forming has no close time.
 */
class LiveMarket {
    base: any[] = [];
    visibleUntil: number;
    spike = 0;
    now: number;

    constructor(
        public end: number,
        days: number,
        seed = 7,
    ) {
        const rnd = mulberry32(seed);
        for (let t = end - days * DAY, p = 20000; t < end; t += 5 * MIN) {
            const o = p;
            const c = Math.max(1, o + (rnd() - 0.5) * 0.004 * p + Math.sin(t / (6 * 3600_000)) * 0.0004 * p);
            this.base.push({
                openTime: t,
                open: o,
                close: c,
                high: Math.max(o, c) + rnd() * 0.0015 * p,
                low: Math.min(o, c) - rnd() * 0.0015 * p,
                volume: 100 + rnd() * 900,
            });
            p = c;
        }
        this.visibleUntil = end;
        this.now = end;
    }

    series(tf: string) {
        const out: any[] = [];
        let cur: any = null;
        for (let i = 0; i < this.base.length && this.base[i].openTime < this.visibleUntil; i++) {
            let b = this.base[i];
            if (this.spike && (i + 1 === this.base.length || this.base[i + 1].openTime >= this.visibleUntil)) {
                const close = b.close * (1 + this.spike);
                b = { ...b, close, high: Math.max(b.high, close), low: Math.min(b.low, close) };
            }
            const k = bucketOf(tf, b.openTime);
            if (!cur || cur.openTime !== k) {
                cur = { openTime: k, closeTime: nextBucket(tf, k), open: b.open, high: b.high, low: b.low, close: b.close, volume: 0 };
                out.push(cur);
            }
            cur.high = Math.max(cur.high, b.high);
            cur.low = Math.min(cur.low, b.low);
            cur.close = b.close;
            cur.volume += b.volume;
        }
        if (out.length) delete out[out.length - 1].closeTime;
        return out;
    }

    provider() {
        return {
            getMarketData: async (_ticker: string, tf: string, limit?: number, sDate?: number, eDate?: number) => {
                // Each fetch takes a (simulated) second, so the live loop does not throttle.
                this.now += 1000;
                let rows = this.series(tf);
                if (sDate != null) rows = rows.filter((r) => r.openTime >= sDate);
                if (eDate != null) rows = rows.filter((r) => r.openTime < eDate);
                if (limit) rows = rows.slice(-limit);
                return rows.map((r) => ({ ...r }));
            },
            getSymbolInfo: async () => ({
                ticker: 'LIVE',
                tickerid: 'SYN:LIVE',
                prefix: 'SYN',
                root: 'LIVE',
                description: 'Synthetic',
                type: 'crypto',
                currency: 'USD',
                basecurrency: 'BTC',
                timezone: 'Etc/UTC',
                session: '24x7',
                mintick: 0.01,
                pricescale: 100,
                minmove: 1,
                pointvalue: 1,
                volumetype: 'base',
            }),
        };
    }
}

// Drawing ids come from a process-wide counter, so they differ between runs.
const norm = (v: any) =>
    JSON.stringify(v, (k, x) => (k === 'id' ? undefined : typeof x === 'number' ? (Number.isFinite(x) ? +x.toPrecision(12) : String(x)) : x));

function outputs(plots: any) {
    const out = new Map<string, string[]>();
    for (const [key, plot] of Object.entries<any>(plots ?? {})) {
        const data = plot?.data ?? [];
        // Drawing containers hold one point: the current set of objects.
        if (key.startsWith('__')) out.set(key, (data.at(-1)?.value ?? []).map(norm));
        else
            out.set(
                key,
                data.map((p: any) => norm([p.time, p.value, p.options ?? null])),
            );
    }
    return out;
}

/** Outputs that differ between a live session and a from-scratch run, as readable lines. */
function differences(live: Map<string, string[]>, fresh: Map<string, string[]>) {
    const problems: string[] = [];
    for (const key of new Set([...live.keys(), ...fresh.keys()])) {
        const a = live.get(key);
        const b = fresh.get(key);
        if (!a || !b) {
            problems.push(`${key}: only in ${a ? 'live' : 'fresh'}`);
            continue;
        }
        if (a.length !== b.length) {
            problems.push(`${key}: live ${a.length} entries, fresh ${b.length}`);
            continue;
        }
        const i = a.findIndex((x, j) => x !== b[j]);
        if (i >= 0) problems.push(`${key}: entry ${i}: live ${a[i].slice(0, 120)} / fresh ${b[i].slice(0, 120)}`);
    }
    return problems;
}

/**
 * Runs `source` as a live session over `market` and, after every tick, compares every plot point
 * and drawing with a from-scratch run over the same data. Returns the first tick's differences.
 */
async function liveParity(source: string, opts: { tf: string; bars: number; ticks: number; stepMin: number; market: LiveMarket }) {
    const { tf, bars, ticks, stepMin, market } = opts;
    const tfMs = Number(tf) * MIN;
    const liveStart = bucketOf(tf, market.end - ticks * stepMin * MIN - 2 * tfMs);
    const firstBar = liveStart - bars * tfMs;
    market.visibleUntil = liveStart + stepMin * MIN;
    market.now = market.visibleUntil;
    market.spike = 0;
    const spikes = [0, 0.03, -0.03, 0, 0.05, 0];
    const provider = market.provider();
    vi.spyOn(Date, 'now').mockImplementation(() => market.now);

    const fresh = async () => {
        const pine = new PineTS(provider as any, 'LIVE', tf, undefined, firstBar);
        return outputs((await pine.run(new Indicator(source))).plots);
    };

    const live = new PineTS(provider as any, 'LIVE', tf, undefined, firstBar);
    const pages = (live as any).run(new Indicator(source), undefined, bars * 4) as AsyncGenerator<any>;
    let tick = 0;
    for await (const ctx of pages) {
        if (ctx === null) continue;
        const problems = differences(outputs(ctx.plots), await fresh());
        if (problems.length) return { tick, problems };
        if (tick === ticks) break;
        tick++;
        market.spike = spikes[tick % spikes.length];
        if (market.spike === 0) market.visibleUntil += stepMin * MIN;
        market.now = market.visibleUntil;
    }
    await pages.return(undefined);
    return { tick, problems: [] as string[] };
}

const END = Date.UTC(2026, 8, 30, 20, 0);
const header = '//@version=6\nindicator("live", overlay = true, max_boxes_count = 100, max_lines_count = 100, max_labels_count = 100)\n';

// 60-minute chart, ticks every 10 minutes: same-bar updates (with price spikes that come back)
// and bar closes in between.
async function expectParity(body: string) {
    const result = await liveParity(header + body, { tf: '60', bars: 200, ticks: 12, stepMin: 10, market: new LiveMarket(END, 30) });
    expect(result.problems).toEqual([]);
    expect(result.tick).toBe(12);
}

describe('live ticks: rollback of the forming bar', () => {
    afterEach(() => vi.restoreAllMocks());

    it('plot points: one per bar', async () => {
        await expectParity('plot(close, "c")\nplot(ta.ema(close, 10), "ema")');
    });

    it('var array, map and matrix contents', async () => {
        await expectParity(`var closes = array.new_float()
var counts = map.new<string, int>()
var m = matrix.new<float>(2, 2, 0.0)
array.push(closes, close)
if array.size(closes) > 20
    array.shift(closes)
key = close > open ? "up" : "down"
map.put(counts, key, nz(map.get(counts, key)) + 1)
matrix.set(m, 0, 0, matrix.get(m, 0, 0) + close)
plot(array.size(closes), "size")
plot(array.sum(closes), "sum")
plot(nz(map.get(counts, "up")), "up")
plot(matrix.get(m, 0, 0), "m")`);
    });

    it('UDT fields and drawings held in a var array', async () => {
        await expectParity(`type Zone
    float top
    float bottom
    box b
var zones = array.new<Zone>()
if close > open and high - low > ta.atr(14) * 0.5
    array.push(zones, Zone.new(high, low, box.new(bar_index, high, bar_index + 1, low)))
if array.size(zones) > 0
    for i = array.size(zones) - 1 to 0
        z = array.get(zones, i)
        z.top := math.max(z.top, high)
        box.set_right(z.b, bar_index)
        if close < z.bottom
            box.delete(z.b)
            array.remove(zones, i)
plot(array.size(zones), "zones")`);
    });

    it('drawings: var label moved every bar, lines replaced, labels on the last bar', async () => {
        await expectParity(`var label hud = label.new(bar_index, high, "")
var line lastSwing = na
ph = ta.pivothigh(high, 3, 3)
if not na(ph)
    line.delete(lastSwing)
    lastSwing := line.new(bar_index - 3, ph, bar_index, ph)
label.set_xy(hud, bar_index, high)
label.set_text(hud, str.tostring(close))
if barstate.islast
    label.new(bar_index, low, str.tostring(close))
plot(close, "c")`);
    });

    it('function-local var and a var first reached on the forming bar', async () => {
        await expectParity(`f() =>
    var int calls = 0
    calls += 1
    calls
fc = f()
late = 0.0
if bar_index > 5 and close > ta.sma(close, 50)
    var float firstLate = close
    late := firstLate
plot(fc, "calls")
plot(late, "late")`);
    });
    it('a drawing deleted by a discarded tick comes back', async () => {
        // The -3% spike tick deletes the box; the tick after it brings the price back.
        await expectParity(`var box b = box.new(bar_index, high, bar_index + 1, low)
if close < open * 0.975
    box.delete(b)
box.set_right(b, bar_index)
plot(close, "c")`);
    });

    it('variables and function scopes first created by a discarded tick', async () => {
        // Only the +3% / +5% spike ticks reach these blocks: the first creates the var and the
        // function's local scope, which must not survive into the next tick.
        await expectParity(`g() =>
    var float seen = close
    seen
v = 0.0
w = 0.0
if close > open * 1.025
    var float first = close
    v := first
    w := g()
plot(v, "v")
plot(w, "w")`);
    });
});
