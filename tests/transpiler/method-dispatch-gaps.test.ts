import { describe, it, expect, vi, afterEach } from 'vitest';
import { PineTS, Provider } from 'index';

// Regression guard for user-method dispatch shapes that used to fail. The expected values were read
// from TradingView (BINANCE:BTCUSDT 1h) by running the same scripts there:
//   - a user method named like a namespace, called on a string literal (`'bull'.label(...)`)
//   - user methods on built-in scalars / series (`close.half()`, `close.prev(2)`)
//   - a user `method delete(UDT)` called on the result of `shift()` / `pop()` / `first()` / `get()`
//   - `.delete()` on a drawing field that is still na is a no-op
//   - overloads of one method name on different built-in receiver types (line / box, int[] / float[])
//   - methods on `float[]`, `int[]`, `array<chart.point>` and on float literals

const header = `//@version=6\nindicator("probe", overlay = true)\n`;

async function runLogs(body: string): Promise<string[]> {
    const lines: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
        lines.push(args.map(String).join(' '));
    });
    try {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());
        await pineTS.run(header + body);
    } finally {
        spy.mockRestore();
    }
    // strip the "[timestamp+tz] " prefix
    return lines.map((l) => l.replace(/^\[[^\]]*\]\s*/, ''));
}

describe('user method dispatch gaps', () => {
    afterEach(() => vi.restoreAllMocks());

    it('user method named like a namespace on a string literal, and methods on built-in scalars / series', async () => {
        const logs = await runLogs(`
method label(string dir, int state, float y) =>
    label.new(bar_index, y, dir + str.tostring(state))
method half(float v) => v / 2
method prev(float src, int n) => src[n]
p = close.prev(2)
q = close[2]
h = close.half()
if barstate.islast
    l = 'bull'.label(1, close)
    log.info("A " + l.get_text())
    log.info("B " + str.tostring(p == q))
    log.info("C " + str.tostring(h == close / 2))
    n = 0
    for x in label.all
        n += 1
    log.info("D " + str.tostring(n))
plot(close)`);
        expect(logs).toEqual(['A bull1', 'B true', 'C true', 'D 1']);
    });

    it('user `method delete(UDT)` on the result of shift() / pop() / first()', async () => {
        const logs = await runLogs(`
type Vis
    line top
method delete(Vis this) =>
    this.top.delete()
    log.info("deleted")
var array<Vis> hist = array.new<Vis>()
nl() =>
    n = 0
    for x in line.all
        n += 1
    n
if barstate.islast
    hist.push(Vis.new(line.new(bar_index - 1, low, bar_index, low)))
    hist.push(Vis.new(line.new(bar_index - 1, high, bar_index, high)))
    hist.push(Vis.new(line.new(bar_index - 1, close, bar_index, close)))
    hist.shift().delete()
    log.info("after shift size " + str.tostring(hist.size()) + " lines " + str.tostring(nl()))
    hist.pop().delete()
    log.info("after pop size " + str.tostring(hist.size()) + " lines " + str.tostring(nl()))
    hist.first().delete()
    log.info("after first size " + str.tostring(hist.size()) + " lines " + str.tostring(nl()))
plot(close)`);
        expect(logs).toEqual([
            'deleted',
            'after shift size 2 lines 2',
            'deleted',
            'after pop size 1 lines 1',
            'deleted',
            'after first size 1 lines 0',
        ]);
    });

    it('a built-in `delete` still runs when the receiver is not the user type', async () => {
        // `method delete(Vis)` exists, but `lines.shift()` yields a line: the built-in must run.
        const logs = await runLogs(`
type Vis
    line top
method delete(Vis this) =>
    this.top.delete()
    log.info("user delete")
var array<line> lines = array.new<line>()
nl() =>
    n = 0
    for x in line.all
        n += 1
    n
if barstate.islast
    lines.push(line.new(bar_index - 1, low, bar_index, low))
    lines.push(line.new(bar_index - 1, high, bar_index, high))
    lines.shift().delete()
    lines.get(0).delete()
    log.info("lines " + str.tostring(nl()))
plot(close)`);
        expect(logs).toEqual(['lines 0']);
    });

    it('two user types with the same method name are told apart at runtime', async () => {
        const logs = await runLogs(`
type A
    float v = 1.0
type B
    float v = 2.0
method delete(A this) =>
    log.info("A " + str.tostring(this.v))
method delete(B this) =>
    log.info("B " + str.tostring(this.v))
var array<A> xa = array.from(A.new())
var array<B> bs = array.from(B.new())
if barstate.islast
    xa.first().delete()
    bs.first().delete()
plot(close)`);
        expect(logs).toEqual(['A 1', 'B 2']);
    });

    it('.delete() on an na drawing field is a no-op', async () => {
        const logs = await runLogs(`
type Tk
    polyline pl = na
    line ln = na
    box b = na
    label lb = na
var array<Tk> arr = array.from(Tk.new(), Tk.new())
if barstate.islast
    for e in arr
        e.pl.delete()
        e.ln.delete()
        e.b.delete()
        e.lb.delete()
    log.info("ok " + str.tostring(arr.size()))
plot(close)`);
        expect(logs).toEqual(['ok 2']);
    });

    it('.delete() on the result of a user method that returns nothing (na) is a no-op', async () => {
        // `addLabel` pops (and returns) a label only from the second call on; the other calls return na.
        const logs = await runLogs(`
method addLabel(array<label> arr, label lab) =>
    arr.unshift(lab)
    if arr.size() > 1
        arr.pop()
var array<label> labs = array.new<label>()
nl() =>
    n = 0
    for x in label.all
        n += 1
    n
if barstate.islast
    labs.addLabel(label.new(bar_index, low, "a")).delete()
    log.info("after 1 " + str.tostring(nl()))
    labs.addLabel(label.new(bar_index, high, "b")).delete()
    log.info("after 2 " + str.tostring(nl()))
plot(close)`);
        expect(logs).toEqual(['after 1 1', 'after 2 1']);
    });

    it('.delete() on a drawing field set then deleted twice', async () => {
        const logs = await runLogs(`
type Tk
    line ln = na
var Tk t = Tk.new()
nl() =>
    n = 0
    for x in line.all
        n += 1
    n
if barstate.islast
    t.ln := line.new(bar_index - 1, low, bar_index, low)
    log.info("lines " + str.tostring(nl()))
    t.ln.delete()
    log.info("lines after " + str.tostring(nl()))
    t.ln.delete()
    log.info("twice ok")
plot(close)`);
        expect(logs).toEqual(['lines 1', 'lines after 0', 'twice ok']);
    });

    it('overloads of one method name on line / box receivers taken from arrays', async () => {
        const logs = await runLogs(`
method bump(line ln, float y) =>
    ln.set_y1(y)
    ln.set_y2(y)
method bump(box bx, float y) =>
    bx.set_top(y)
method set(line ln, float y) =>
    ln.set_y1(y + 1)
method set(box bx, float y) =>
    bx.set_top(y + 1)
var lines = array.new<line>()
var boxes = array.new<box>()
if barstate.islast
    lines.push(line.new(bar_index - 1, 1., bar_index, 1.))
    boxes.push(box.new(bar_index - 1, 5., bar_index, 1.))
    lines.get(0).bump(42.)
    boxes.get(0).bump(43.)
    log.info("bump " + str.tostring(lines.get(0).get_y1()) + " " + str.tostring(boxes.get(0).get_top()))
    lines.get(0).set(10.)
    boxes.get(0).set(20.)
    log.info("set " + str.tostring(lines.get(0).get_y1()) + " " + str.tostring(boxes.get(0).get_top()))
plot(close)`);
        expect(logs).toEqual(['bump 42 43', 'set 11 21']);
    });

    it('methods on float[] / int[] / array<chart.point> receivers and on float literals', async () => {
        const logs = await runLogs(`
method lastv(float[] xs) => xs.last()
method lastp(array<chart.point> pts) =>
    p = pts.last()
    p.price
method lastq(array<chart.point> pts) =>
    p = pts.first()
    p.price
method total(int[] xs) => xs.sum()
method dbl(float v) => v * 2
var float[] fa = array.from(1., 2., 3.)
var int[] ia = array.from(1, 2, 3)
var pts = array.from(chart.point.from_index(1, 10.), chart.point.from_index(2, 20.))
var array<chart.point> pts2 = array.from(chart.point.from_index(3, 30.), chart.point.from_index(4, 40.))
if barstate.islast
    log.info("lastv " + str.tostring(fa.lastv()))
    log.info("total " + str.tostring(ia.total()))
    log.info("lastp " + str.tostring(pts.lastp()))
    log.info("lastq " + str.tostring(pts2.lastq()) + " " + str.tostring(pts2.lastp()))
    log.info("dbl " + str.tostring(3.5.dbl()))
plot(close)`);
        expect(logs).toEqual(['lastv 3', 'total 6', 'lastp 20', 'lastq 30 40', 'dbl 7']);
    });

    it('overloads on int[] / float[] receivers', async () => {
        const logs = await runLogs(`
method inOut(int[] a, int val) =>
    a.unshift(val)
    a.pop()
method inOut(float[] a, float val) =>
    a.unshift(val)
    a.pop()
var ia = array.from(1, 2, 3)
var fa = array.from(1., 2., 3.)
if barstate.islast
    x = ia.inOut(9)
    y = fa.inOut(9.5)
    log.info("in " + str.tostring(x) + " " + str.tostring(ia.first()) + " float " + str.tostring(y) + " " + str.tostring(fa.first()))
plot(close)`);
        // TradingView (arrays print as [9, 1, 2] / [9.5, 1, 2]): the popped value is 3, the new first element is the pushed one.
        expect(logs).toEqual(['in 3 9 float 3 9.5']);
    });
});
