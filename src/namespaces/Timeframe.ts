import { Series } from '../Series';
const TF_UNITS = ['S', 'D', 'W', 'M'];
export class Timeframe {
    constructor(private context: any) {}
    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    //Note : current PineTS implementation does not differentiate between main_period and period because the timeframe is always taken from the main execution context.
    //once we implement indicator() function, the main_period can be overridden by the indicator's timeframe.
    public get main_period() {
        return this.context.timeframe;
    }
    public get period() {
        return this.context.timeframe;
    }

    public get multiplier() {
        const val = parseInt(this.context.timeframe);
        return isNaN(val) ? 1 : val;
    }

    public get isdwm() {
        return ['D', 'W', 'M'].includes(this.context.timeframe.slice(-1));
    }
    public get isdaily() {
        return this.context.timeframe.slice(-1) === 'D';
    }
    public get isweekly() {
        return this.context.timeframe.slice(-1) === 'W';
    }
    public get ismonthly() {
        return this.context.timeframe.slice(-1) === 'M';
    }
    public get isseconds() {
        return this.context.timeframe.slice(-1) === 'S';
    }
    public get isminutes() {
        //minutes timeframes does not have a specific unit character
        return parseInt(this.context.timeframe).toString() == this.context.timeframe.trim();
    }

    public get isintraday() {
        return !this.isdwm;
    }

    // public change(timeframe: string) {
    //     const prevOpenTime = this.context.data.openTime.get(this.context.data.openTime.length - 2);
    //     const currentOpenTime = this.context.data.openTime.get(this.context.data.openTime.length - 1);

    // }
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
        //wheck whole weeks first
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
            timeframe = this.context.timeframe;
        }
        const multiplier = parseInt(timeframe);
        const unit = timeframe.slice(-1);
        if (unit === 'S') {
            return multiplier;
        }
        if (unit === 'D') {
            return multiplier * 60 * 60 * 24;
        }
        if (unit === 'W') {
            return multiplier * 60 * 60 * 24 * 7;
        }
        if (unit === 'M') {
            return multiplier * 60 * 60 * 24 * 30;
        }
        // Minutes (no unit suffix or implicit minutes)
        if (!isNaN(multiplier)) {
            return multiplier * 60;
        }
        return 0;
    }
}
