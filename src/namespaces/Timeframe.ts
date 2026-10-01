import { Series } from '../Series';
import { PineRuntimeError } from '../errors/PineRuntimeError';
import { ParsedTimeframe, formatTimeframe, parseTimeframe, timeframeBarStart, timeframeFromSeconds, timeframeSeconds } from '../timeframe';

const unwrap = (v: any) => (typeof v === 'function' ? v() : v instanceof Series ? v.get(0) : v);

export class Timeframe {
    private _chart: ParsedTimeframe | null | undefined = undefined;

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    /** Parsed chart timeframe (cached); null when the context timeframe is not a valid timeframe string. */
    private get chart(): ParsedTimeframe | null {
        if (this._chart === undefined) this._chart = parseTimeframe(this.context.timeframe);
        return this._chart;
    }

    /** A timeframe argument; "" / na means the chart timeframe. Throws like TradingView on anything else. */
    private resolve(timeframe: any, fn: string, message: (tf: string) => string): ParsedTimeframe {
        const tf = unwrap(timeframe);
        if (tf === undefined || tf === null || tf === '' || (typeof tf === 'number' && isNaN(tf))) {
            return this.chart ?? { unit: 'D', multiplier: 1 };
        }
        const parsed = parseTimeframe(tf);
        if (!parsed) throw new PineRuntimeError(message(String(tf)), fn);
        return parsed;
    }

    // Pine v6 writes the multiplier of calendar units ("1D"); v5 and PineTS syntax write "D".
    private get periodString(): string {
        const chart = this.chart;
        if (!chart) return this.context.timeframe;
        return formatTimeframe(chart, this.context.pineVersion >= 6);
    }

    //Note : current PineTS implementation does not differentiate between main_period and period because the timeframe is always taken from the main execution context.
    //once we implement indicator() function, the main_period can be overridden by the indicator's timeframe.
    public get main_period() {
        return this.periodString;
    }
    public get period() {
        return this.periodString;
    }

    public get multiplier() {
        return this.chart?.multiplier ?? 1;
    }

    public get isdwm() {
        const unit = this.chart?.unit;
        return unit === 'D' || unit === 'W' || unit === 'M';
    }
    public get isdaily() {
        return this.chart?.unit === 'D';
    }
    public get isweekly() {
        return this.chart?.unit === 'W';
    }
    public get ismonthly() {
        return this.chart?.unit === 'M';
    }
    // Tick charts ("1T") are not supported, so the chart is never a tick chart.
    public get isticks() {
        return false;
    }
    public get isseconds() {
        return this.chart?.unit === 'S';
    }
    public get isminutes() {
        return this.chart?.unit === '';
    }

    public get isintraday() {
        return !this.isdwm;
    }

    /**
     * True on the first bar of a new `timeframe` period: the current and previous bar
     * opens fall in different bars of that timeframe.
     */
    public change(timeframe: any): boolean {
        const tf = this.resolve(timeframe, 'timeframe.change', (s) => `Cannot parse resolution '${s}'. - Invalid format`);

        const currentTime = Series.from(this.context.data.openTime).get(0);
        const prevTime = Series.from(this.context.data.openTime).get(1);

        if (isNaN(currentTime) || isNaN(prevTime)) return false;

        return timeframeBarStart(currentTime, tf) !== timeframeBarStart(prevTime, tf);
    }

    public from_seconds(seconds: any) {
        const s = unwrap(seconds);
        if (s === null || s === undefined || isNaN(s)) return NaN;
        return timeframeFromSeconds(s);
    }

    public in_seconds(timeframe?: any) {
        const tf = this.resolve(
            timeframe,
            'timeframe.in_seconds',
            (s) => `Invalid value of the 'period' argument ('${s}') in the 'timeframe.in_seconds()' function.`
        );
        return timeframeSeconds(tf);
    }
}
