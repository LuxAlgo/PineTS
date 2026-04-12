import { Series } from '../Series';
import { alignToTimeframe, normalizeTimeframe as normalizeTFFromTime } from './Time';
const TF_UNITS = ['S', 'D', 'W', 'M'];

/**
 * Normalize a raw timeframe string to Pine Script canonical format.
 * Pine canonical: minutes as plain integers ("1", "60", "240"), "D", "W", "M", or seconds as "1S".
 * Common inputs: "1d", "1D", "4h", "1w", "1W", "1m" (1-minute), "1M" (1-month).
 */
const NORMALIZE_MAP: Record<string, string> = {
    '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', '45m': '45',
    '1h': '60', '2h': '120', '3h': '180', '4h': '240',
    '1d': 'D', '1w': 'W', '1M': 'M',
};

function normalizeTF(tf: string): string {
    if (!tf) return tf;

    // Already canonical minute integers?
    if (/^\d+$/.test(tf)) return tf;

    // Direct map (case-sensitive first for '1M' vs '1m')
    if (NORMALIZE_MAP[tf]) return NORMALIZE_MAP[tf];

    // Try lowercase (handles '1H', '4H', '1D', '1W' etc.)
    const lower = tf.toLowerCase();
    if (NORMALIZE_MAP[lower]) return NORMALIZE_MAP[lower];

    // Single letter: d→D, w→W, m→M, s→S
    if (tf.length === 1) {
        const upper = tf.toUpperCase();
        if (['D', 'W', 'M', 'S'].includes(upper)) return upper;
    }

    // Uppercase last char: "2D", "3W", "12M", "30S"
    const lastChar = tf.slice(-1).toUpperCase();
    if (['D', 'W', 'M', 'S'].includes(lastChar)) {
        const num = parseInt(tf);
        if (!isNaN(num)) return num + lastChar;
    }

    return tf;
}

export class Timeframe {
    private _normalized: string | null = null;

    constructor(private context: any) {}

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    /** Normalized canonical timeframe (cached) */
    private get normalized(): string {
        if (this._normalized === null) {
            this._normalized = normalizeTF(this.context.timeframe);
        }
        return this._normalized;
    }

    /** Last character of the normalized timeframe (uppercase) */
    private get unit(): string {
        return this.normalized.slice(-1).toUpperCase();
    }

    //Note : current PineTS implementation does not differentiate between main_period and period because the timeframe is always taken from the main execution context.
    //once we implement indicator() function, the main_period can be overridden by the indicator's timeframe.
    public get main_period() {
        return this.normalized;
    }
    public get period() {
        return this.normalized;
    }

    public get multiplier() {
        const val = parseInt(this.normalized);
        return isNaN(val) ? 1 : val;
    }

    public get isdwm() {
        return ['D', 'W', 'M'].includes(this.unit);
    }
    public get isdaily() {
        return this.unit === 'D';
    }
    public get isweekly() {
        return this.unit === 'W';
    }
    public get ismonthly() {
        return this.unit === 'M';
    }
    public get isseconds() {
        return this.unit === 'S';
    }
    public get isminutes() {
        //minutes timeframes are pure integers (no unit suffix)
        return /^\d+$/.test(this.normalized);
    }

    public get isintraday() {
        return !this.isdwm;
    }

    /**
     * Detects changes in the specified timeframe.
     * Returns true on the first bar of a new HTF period, false otherwise.
     *
     * Works by aligning current and previous bar timestamps to the target
     * timeframe and comparing — if they differ, a new period has started.
     */
    public change(timeframe: any): boolean {
        const tf = typeof timeframe === 'function' ? timeframe() : timeframe;
        const resolved = tf instanceof Series ? tf.get(0) : tf;
        const normalizedTarget = normalizeTFFromTime(resolved || '');
        if (!normalizedTarget) return false;

        const currentTime = Series.from(this.context.data.openTime).get(0);
        const prevTime = Series.from(this.context.data.openTime).get(1);

        if (isNaN(currentTime) || isNaN(prevTime)) return false;

        const currentAligned = alignToTimeframe(currentTime, normalizedTarget);
        const prevAligned = alignToTimeframe(prevTime, normalizedTarget);

        return currentAligned !== prevAligned;
    }
    public from_seconds(seconds: number) {
        if (seconds < 60) {
            //valid seconds timeframes are 1, 5, 15, 30, 45, everything in between should be rounded to the next valid timeframe
            const roundedSeconds = Math.ceil(seconds / 5) * 5;
            return roundedSeconds + 'S';
        }
        if (seconds < 60 * 60 * 24) {
            const roundedMinutes = Math.ceil(seconds / 60);
            return roundedMinutes;
        }
        //check whole weeks first
        if (seconds <= 60 * 60 * 24 * 7 * 52) {
            //is whole weeks ?
            if (seconds % (60 * 60 * 24 * 7) === 0) {
                const roundedWeeks = Math.ceil(seconds / (60 * 60 * 24 * 7));
                return roundedWeeks + 'W';
            }

            //whole days
            const roundedHours = Math.ceil(seconds / (60 * 60 * 24));
            return roundedHours + 'D';
        }

        return '12M';
    }
    public in_seconds(timeframe?: string) {
        if (timeframe === undefined || timeframe === null) {
            timeframe = this.normalized;
        } else {
            timeframe = normalizeTF(timeframe);
        }
        const unit = timeframe.slice(-1).toUpperCase();
        const multiplier = parseInt(timeframe);
        if (unit === 'S') {
            return isNaN(multiplier) ? 1 : multiplier;
        }
        if (unit === 'D') {
            return (isNaN(multiplier) ? 1 : multiplier) * 60 * 60 * 24;
        }
        if (unit === 'W') {
            return (isNaN(multiplier) ? 1 : multiplier) * 60 * 60 * 24 * 7;
        }
        if (unit === 'M') {
            return (isNaN(multiplier) ? 1 : multiplier) * 60 * 60 * 24 * 30;
        }
        // Minutes (no unit suffix or implicit minutes)
        if (!isNaN(multiplier)) {
            return multiplier * 60;
        }
        return 0;
    }
}
