// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Alert events shared by `alert()`, `alertcondition()` and the order fills of strategies.
 *
 * TradingView triggers alerts on the realtime bar only; `setAlertMode('all')` lets PineTS emit them on
 * every bar. Messages may hold placeholders (`{{close}}`, `{{plot("RSI")}}`, `{{strategy.order.price}}`,
 * ...), replaced once the bar's script has run, so plot placeholders see the bar's plotted values.
 */

export interface AlertEvent {
    type: 'alert' | 'alertcondition' | 'order_fill';
    id: string;
    message: string;
    title?: string;
    freq?: string;
    /** order_fill: the order's `alert_message` (empty when none was given). */
    alert_message?: string;
    /** order_fill: the executed order, as the `{{strategy.order.*}}` placeholders report it. */
    order?: { id: string; action: 'buy' | 'sell'; contracts: number; price: number; comment: string };
    /** order_fill: the strategy position after the fill (signed). */
    position_size?: number;
    /** order_fill: the strategy position before the fill (signed). */
    prev_position_size?: number;
    bar_index: number;
    time: number;
}

type PendingRender = { event: AlertEvent; template: string; vars?: Record<string, string> };

/** Whether alert events fire on the current bar (realtime bar, or every bar in 'all' mode). */
export function alertsFireOnBar(context: any): boolean {
    if (context.isSecondaryContext) return false;
    if ((context._alertMode || 'realtime') === 'all') return true;
    return context.pine?.barstate?.isrealtime ?? context.idx === context.length - 1;
}

/** Record an alert event; its message is rendered from `template` at the end of the bar. */
export function pushAlert(context: any, event: AlertEvent, template?: string, vars?: Record<string, string>): void {
    context.alerts.push(event);
    if (template !== undefined && template.includes('{{')) {
        ((context._pendingAlertRenders ??= []) as PendingRender[]).push({ event, template, vars });
    }
}

/** Replace the placeholders of the alerts emitted on this bar. Called after the bar's script ran. */
export function renderBarAlerts(context: any): void {
    const pending: PendingRender[] | undefined = context._pendingAlertRenders;
    if (!pending || pending.length === 0) return;
    context._pendingAlertRenders = [];
    for (const p of pending) p.event.message = renderPlaceholders(context, p.template, p.vars);
}

const num = (v: any): string => (typeof v === 'number' ? String(Math.round(v * 1e10) / 1e10) : String(v ?? ''));

// `yyyy-MM-ddTHH:mm:ssZ`, UTC, to the second.
const isoSeconds = (ms: number): string => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');

/**
 * Value plots in order of appearance: plot(), plotchar(), plotshape(), plotarrow(). TradingView numbers
 * `{{plot_N}}` the same way: bgcolor() and alertcondition() take no number.
 */
function valuePlots(context: any): any[] {
    const skip = new Set(['hline', 'fill', 'background', 'barcolor', 'bar', 'candle']);
    return Object.entries(context.plots ?? {})
        .filter(([key, p]: [string, any]) => !key.startsWith('__') && p && Array.isArray(p.data) && !skip.has(p.options?.style))
        .map(([, p]) => p);
}

function plotValueOnBar(context: any, plot: any): string {
    const time = context.data.openTime?.data?.[context.idx];
    const data = plot?.data;
    if (!data || data.length === 0) return '';
    const last = data[data.length - 1];
    if (last.time !== time) return 'NaN';
    return num(last.value);
}

/**
 * One left-to-right pass: substituted values are not scanned again, so an `alert_message` holding
 * `{{close}}` is sent as written (TradingView expands placeholders in the alert's message, not in
 * the `alert_message` argument). Unknown placeholders are left as they are.
 */
export function renderPlaceholders(context: any, template: string, vars: Record<string, string> = {}): string {
    return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (whole, rawName: string) => {
        const name = rawName.trim();
        if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
        const plotByTitle = /^plot\(\s*"([^"]*)"\s*\)$/.exec(name);
        if (plotByTitle) {
            const plot = valuePlots(context).find((p) => p.title === plotByTitle[1]);
            return plot ? plotValueOnBar(context, plot) : whole;
        }
        const plotByIndex = /^plot_(\d+)$/.exec(name);
        if (plotByIndex) {
            // TradingView writes "null" for a plot number the script does not have.
            const plot = valuePlots(context)[Number(plotByIndex[1])];
            return plot ? plotValueOnBar(context, plot) : 'null';
        }
        const d = context.data;
        switch (name) {
            case 'open':
            case 'high':
            case 'low':
            case 'close':
            case 'volume':
                return num(d[name]?.data?.[context.idx]);
            case 'time':
                return isoSeconds(d.openTime?.data?.[context.idx] ?? 0);
            case 'timenow':
                return isoSeconds(Date.now());
            case 'ticker':
                return String(context.pine?.syminfo?.ticker ?? '');
            case 'exchange':
                return String(context.pine?.syminfo?.prefix ?? '');
            case 'interval':
                return String(context.pine?.timeframe?.period ?? context.timeframe ?? '');
            default:
                return whole;
        }
    });
}

const marketPosition = (size: number): string => (size > 1e-12 ? 'long' : size < -1e-12 ? 'short' : 'flat');

const DEFAULT_ORDER_FILL_TEXT = 'order {{strategy.order.action}} @ {{strategy.order.contracts}} filled on {{ticker}}. New strategy position is {{strategy.position_size}}';

/**
 * The message TradingView's "Create alert" dialog proposes for a strategy without `//@strategy_alert_message`:
 * `<title> (<inputs>): order {{strategy.order.action}} @ … New strategy position is {{strategy.position_size}}`.
 * The inputs are the values shown in the status line (bool, color, time, text_area and `display.none` inputs
 * are left out); the parentheses are dropped when there are none.
 */
function defaultStrategyAlertMessage(context: any): string {
    if (context._defaultStrategyAlertMessage !== undefined) return context._defaultStrategyAlertMessage;
    const title = String(context.strategy?.config?.title ?? '');
    let shown: string[] = [];
    try {
        shown = (context._inputsMeta?.() ?? [])
            .filter((m: any) => m.display === 'all' || m.display === 'status_line')
            .map((m: any) => statusLineValue(m, inputValue(context, m)))
            .filter((v: string | null): v is string => v !== null && v !== '');
    } catch {
        shown = [];
    }
    const head = shown.length ? `${title} (${shown.join(', ')})` : title;
    return (context._defaultStrategyAlertMessage = `${head}: ${DEFAULT_ORDER_FILL_TEXT}`);
}

function inputValue(context: any, meta: any): unknown {
    const overrides = context.inputs ?? {};
    for (const key of [meta.id, meta.varId, meta.title]) {
        if (key !== undefined && Object.prototype.hasOwnProperty.call(overrides, key) && overrides[key] !== undefined) return overrides[key];
    }
    return meta.defval;
}

function statusLineValue(meta: any, value: unknown): string | null {
    switch (meta.type) {
        case 'bool':
        case 'color':
            return null;
        case 'symbol': {
            // "BINANCE:ETHUSDT" is shown as "ETHUSDT · Binance".
            const s = String(value ?? '');
            const i = s.indexOf(':');
            if (i < 0) return s;
            const prefix = s.slice(0, i);
            return `${s.slice(i + 1)} · ${prefix.charAt(0).toUpperCase()}${prefix.slice(1).toLowerCase()}`;
        }
        default:
            return typeof value === 'number' ? num(value) : String(value ?? '');
    }
}

/**
 * An order fill of the broker emulator. TradingView triggers a strategy's order-fill alert on each fill
 * (on realtime bars), unless the order was created with `disable_alert = true`. The `alert_message`
 * replaces `{{strategy.order.alert_message}}` in the alert's message: the script's
 * `//@strategy_alert_message` annotation when present, else the dialog's default message.
 */
export function orderFillAlert(
    context: any,
    fill: { id: string; direction: number; qty: number; price: number; comment?: string; alertMessage?: string; disabled?: boolean },
): void {
    const strategy = context.strategy;
    if (!strategy || !(fill.qty > 0)) return;
    // Numbered in the strategy state, which a live-bar re-execution restores: a fill replayed by a
    // re-execution gets the number it had and is not alerted twice.
    const seq = (strategy._fillAlertSeq = (strategy._fillAlertSeq ?? 0) + 1);
    if (fill.disabled === true || !alertsFireOnBar(context)) return;
    const action: 'buy' | 'sell' = fill.direction > 0 ? 'buy' : 'sell';
    const key = `${seq}:${fill.id}:${action}`;
    const fired: Set<string> = (context._orderFillAlertKeys ??= new Set());
    if (fired.has(key)) return;
    fired.add(key);

    const positionSize = Math.round(strategy.position_size * 1e10) / 1e10;
    const prevSize = Math.round((strategy.position_size - fill.direction * fill.qty) * 1e10) / 1e10;
    const alertMessage = fill.alertMessage === undefined || fill.alertMessage === null ? '' : String(fill.alertMessage);
    const comment = fill.comment === undefined || fill.comment === null || fill.comment === '' ? String(fill.id) : String(fill.comment);
    const order = { id: String(fill.id), action, contracts: fill.qty, price: fill.price, comment };
    const event: AlertEvent = {
        type: 'order_fill',
        id: order.id,
        message: alertMessage,
        alert_message: alertMessage,
        order,
        position_size: positionSize,
        prev_position_size: prevSize,
        bar_index: context.idx,
        time: context.data.openTime?.data?.[context.idx] ?? 0,
    };
    const template: string = context.transpiledFn?._strategyAlertMessage ?? defaultStrategyAlertMessage(context);
    event.message = template;
    pushAlert(context, event, template, {
        'strategy.order.alert_message': alertMessage,
        'strategy.order.action': action,
        'strategy.order.contracts': num(fill.qty),
        'strategy.order.price': num(fill.price),
        'strategy.order.id': order.id,
        'strategy.order.comment': comment,
        'strategy.position_size': num(positionSize),
        'strategy.market_position': marketPosition(positionSize),
        'strategy.market_position_size': num(Math.abs(positionSize)),
        'strategy.prev_market_position': marketPosition(prevSize),
        'strategy.prev_market_position_size': num(Math.abs(prevSize)),
    });
}
