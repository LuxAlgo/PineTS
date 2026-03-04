//Pinescript formatted logs example:

import { Series } from '../Series';
import { Context } from '..';

function formatWithTimezone(date = new Date(), offset?: number) {
    const _offset = offset ?? -date.getTimezoneOffset();
    const sign = _offset >= 0 ? '+' : '-';
    const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');

    const tz = sign + pad(_offset / 60) + ':' + pad(_offset % 60);

    return `[${date.toISOString().slice(0, -1)}${tz}]`;
}

export class Log {
    constructor(private context: Context) {}

    private logFormat(message: string, ...args: any[]) {
        return message.replace(/{(\d+)}/g, (match, index) => args[index]);
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }
    warning(message: string, ...args: any[]) {
        // Suppress log output in secondary contexts (created by request.security)
        // to match TradingView behavior — only the main chart context produces logs.
        if (this.context.isSecondaryContext) return;

        const _timestamp = this.context.data['openTime'].data[this.context.idx];
        //FIXME : we are forcing UTC for now, we need to handle the timezone properly
        const _time = formatWithTimezone(new Date(_timestamp), 0);

        console.warn(`${_time} ${this.logFormat(message, ...args)}`);
    }
    error(message: string, ...args: any[]) {
        if (this.context.isSecondaryContext) return;

        const _timestamp = this.context.data['openTime'].data[this.context.idx];
        //FIXME : we are forcing UTC for now, we need to handle the timezone properly
        const _time = formatWithTimezone(new Date(_timestamp), 0);

        console.error(`${_time} ${this.logFormat(message, ...args)}`);
    }
    info(message: string, ...args: any[]) {
        if (this.context.isSecondaryContext) return;

        const _timestamp = this.context.data['openTime'].data[this.context.idx];
        //FIXME : we are forcing UTC for now, we need to handle the timezone properly
        const _time = formatWithTimezone(new Date(_timestamp), 0);

        console.log(`${_time} ${this.logFormat(message, ...args)}`);
    }
}
