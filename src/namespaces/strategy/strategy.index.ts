// SPDX-License-Identifier: AGPL-3.0-only

import { avg_losing_trade } from './methods/avg_losing_trade';
import { avg_trade } from './methods/avg_trade';
import { avg_winning_trade } from './methods/avg_winning_trade';
import { cancel } from './methods/cancel';
import { cancel_all } from './methods/cancel_all';
import { close } from './methods/close';
import { close_all } from './methods/close_all';
import { closedtrades } from './methods/closedtrades';
import { closedtrades_commission } from './methods/closedtrades_commission';
import { closedtrades_entry_bar_index } from './methods/closedtrades_entry_bar_index';
import { closedtrades_entry_price } from './methods/closedtrades_entry_price';
import { closedtrades_exit_bar_index } from './methods/closedtrades_exit_bar_index';
import { closedtrades_exit_price } from './methods/closedtrades_exit_price';
import { closedtrades_max_drawdown } from './methods/closedtrades_max_drawdown';
import { closedtrades_max_runup } from './methods/closedtrades_max_runup';
import { closedtrades_profit } from './methods/closedtrades_profit';
import { closedtrades_size } from './methods/closedtrades_size';
import { entry } from './methods/entry';
import { equity } from './methods/equity';
import { eventrades } from './methods/eventrades';
import { exit } from './methods/exit';
import { grossloss } from './methods/grossloss';
import { grossprofit } from './methods/grossprofit';
import { initial_capital } from './methods/initial_capital';
import { losstrades } from './methods/losstrades';
import { max_drawdown } from './methods/max_drawdown';
import { max_runup } from './methods/max_runup';
import { netprofit } from './methods/netprofit';
import { openprofit } from './methods/openprofit';
import { opentrades } from './methods/opentrades';
import { opentrades_entry_bar_index } from './methods/opentrades_entry_bar_index';
import { opentrades_entry_id } from './methods/opentrades_entry_id';
import { opentrades_entry_price } from './methods/opentrades_entry_price';
import { opentrades_entry_time } from './methods/opentrades_entry_time';
import { opentrades_profit } from './methods/opentrades_profit';
import { opentrades_size } from './methods/opentrades_size';
import { order } from './methods/order';
import { param } from './methods/param';
import { position_avg_price } from './methods/position_avg_price';
import { position_size } from './methods/position_size';
import { profit_factor } from './methods/profit_factor';
import { sharpe_ratio } from './methods/sharpe_ratio';
import { strategy } from './methods/strategy';
import { win_rate } from './methods/win_rate';
import { wintrades } from './methods/wintrades';

import { StrategyEngine } from './StrategyEngine';
import {
    direction,
    oca_type,
    commission_type,
    position,
    cash,
    fixed,
    percent_of_equity,
} from './types';

const actionMethods = {
    cancel,
    cancel_all,
    close,
    close_all,
    entry,
    exit,
    order,
    param,
    strategy,
};

const propertyMethods = {
    avg_losing_trade,
    avg_trade,
    avg_winning_trade,
    equity,
    eventrades,
    grossloss,
    grossprofit,
    initial_capital,
    losstrades,
    max_drawdown,
    max_runup,
    netprofit,
    openprofit,
    position_avg_price,
    position_size,
    profit_factor,
    sharpe_ratio,
    win_rate,
    wintrades,
};

const subNamespaceCountMethods = {
    closedtrades,
    opentrades,
};

const opentradesMethods = {
    opentrades_entry_bar_index,
    opentrades_entry_id,
    opentrades_entry_price,
    opentrades_entry_time,
    opentrades_profit,
    opentrades_size,
};

const closedtradesMethods = {
    closedtrades_commission,
    closedtrades_entry_bar_index,
    closedtrades_entry_price,
    closedtrades_exit_bar_index,
    closedtrades_exit_price,
    closedtrades_max_drawdown,
    closedtrades_max_runup,
    closedtrades_profit,
    closedtrades_size,
};

// Type for opentrades sub-namespace (callable with methods)
interface OpentradesNamespace {
    (): number;
    entry_bar_index: ReturnType<typeof opentradesMethods.opentrades_entry_bar_index>;
    entry_id: ReturnType<typeof opentradesMethods.opentrades_entry_id>;
    entry_price: ReturnType<typeof opentradesMethods.opentrades_entry_price>;
    entry_time: ReturnType<typeof opentradesMethods.opentrades_entry_time>;
    profit: ReturnType<typeof opentradesMethods.opentrades_profit>;
    size: ReturnType<typeof opentradesMethods.opentrades_size>;
}

// Type for closedtrades sub-namespace (callable with methods)
interface ClosedtradesNamespace {
    (): number;
    commission: ReturnType<typeof closedtradesMethods.closedtrades_commission>;
    entry_bar_index: ReturnType<typeof closedtradesMethods.closedtrades_entry_bar_index>;
    entry_price: ReturnType<typeof closedtradesMethods.closedtrades_entry_price>;
    exit_bar_index: ReturnType<typeof closedtradesMethods.closedtrades_exit_bar_index>;
    exit_price: ReturnType<typeof closedtradesMethods.closedtrades_exit_price>;
    max_drawdown: ReturnType<typeof closedtradesMethods.closedtrades_max_drawdown>;
    max_runup: ReturnType<typeof closedtradesMethods.closedtrades_max_runup>;
    profit: ReturnType<typeof closedtradesMethods.closedtrades_profit>;
    size: ReturnType<typeof closedtradesMethods.closedtrades_size>;
}

// Strategy interface - callable function with all namespace properties
export interface PineStrategyFunction {
    // Callable - strategy(title, ...)
    (
        title: string,
        shorttitle?: string,
        overlay?: boolean,
        format?: string,
        precision?: number,
        scale?: string,
        pyramiding?: number,
        calc_on_order_fills?: boolean,
        calc_on_every_tick?: boolean,
        max_bars_back?: number,
        backtest_fill_limits_assumption?: number,
        default_qty_type?: string,
        default_qty_value?: number,
        initial_capital?: number,
        currency?: string,
        slippage?: number,
        commission_type?: string,
        commission_value?: number,
        process_orders_on_close?: boolean,
        close_entries_rule?: string,
        margin_long?: number,
        margin_short?: number,
        explicit_plot_zorder?: boolean,
        max_lines_count?: number,
        max_labels_count?: number,
        max_boxes_count?: number,
        risk_free_rate?: number,
        use_bar_magnifier?: boolean,
        fill_orders_on_standard_ohlc?: boolean,
        max_polylines_count?: number
    ): void;

    // Constants
    readonly direction: typeof direction;
    readonly oca: typeof oca_type;
    readonly commission: typeof commission_type;
    readonly position: typeof position;
    readonly cash: typeof cash;
    readonly fixed: typeof fixed;
    readonly percent_of_equity: typeof percent_of_equity;
    readonly long: 'long';
    readonly short: 'short';

    // Sub-namespaces
    opentrades: OpentradesNamespace;
    closedtrades: ClosedtradesNamespace;

    // Action methods
    entry: ReturnType<typeof actionMethods.entry>;
    exit: ReturnType<typeof actionMethods.exit>;
    close: ReturnType<typeof actionMethods.close>;
    close_all: ReturnType<typeof actionMethods.close_all>;
    order: ReturnType<typeof actionMethods.order>;
    cancel: ReturnType<typeof actionMethods.cancel>;
    cancel_all: ReturnType<typeof actionMethods.cancel_all>;
    param: ReturnType<typeof actionMethods.param>;

    // Properties
    readonly position_size: number;
    readonly position_avg_price: number;
    readonly equity: number;
    readonly initial_capital: number;
    readonly openprofit: number;
    readonly netprofit: number;
    readonly grossprofit: number;
    readonly grossloss: number;
    readonly wintrades: number;
    readonly losstrades: number;
    readonly eventrades: number;
    readonly max_drawdown: number;
    readonly max_runup: number;
    readonly profit_factor: number;
    readonly avg_trade: number;
    readonly avg_winning_trade: number;
    readonly avg_losing_trade: number;
    readonly win_rate: number;
    readonly sharpe_ratio: number;

    // Process orders method
    processOrders(): void;
}

/**
 * Create a PineStrategy callable namespace
 */
export function PineStrategy(context: any): PineStrategyFunction {
    // Initialize strategy engine if not present
    if (!context._strategyEngine) {
        context._strategyEngine = new StrategyEngine(context);
    }

    // Property cache for getters
    const _propertyCache: Record<string, () => number> = {};

    // Create the strategy function (callable)
    const strategyFn = actionMethods.strategy(context);

    // Create the callable namespace by wrapping the strategy function
    const ns = function (...args: any[]) {
        return strategyFn(...args);
    } as unknown as PineStrategyFunction;

    // Add constants
    Object.defineProperties(ns, {
        direction: { value: direction, enumerable: true },
        oca: { value: oca_type, enumerable: true },
        commission: { value: commission_type, enumerable: true },
        position: { value: position, enumerable: true },
        cash: { value: cash, enumerable: true },
        fixed: { value: fixed, enumerable: true },
        percent_of_equity: { value: percent_of_equity, enumerable: true },
        long: { value: 'long', enumerable: true },
        short: { value: 'short', enumerable: true },
    });

    // Add action methods (except strategy which is the callable itself)
    Object.entries(actionMethods).forEach(([name, factory]) => {
        if (name !== 'strategy') {
            (ns as any)[name] = factory(context);
        }
    });

    // Add property methods as getters
    Object.entries(propertyMethods).forEach(([name, factory]) => {
        _propertyCache[name] = factory(context);
        Object.defineProperty(ns, name, {
            get: () => _propertyCache[name](),
            enumerable: true,
        });
    });

    // Create opentrades sub-namespace (callable + has methods)
    const opentradesCountFn = subNamespaceCountMethods.opentrades(context);
    const opentradesNs = Object.assign(
        () => opentradesCountFn(),
        Object.fromEntries(
            Object.entries(opentradesMethods).map(([name, factory]) => [name.replace('opentrades_', ''), factory(context)])
        )
    ) as OpentradesNamespace;
    (ns as any).opentrades = opentradesNs;

    // Create closedtrades sub-namespace (callable + has methods)
    const closedtradesCountFn = subNamespaceCountMethods.closedtrades(context);
    const closedtradesNs = Object.assign(
        () => closedtradesCountFn(),
        Object.fromEntries(
            Object.entries(closedtradesMethods).map(([name, factory]) => [name.replace('closedtrades_', ''), factory(context)])
        )
    ) as ClosedtradesNamespace;
    (ns as any).closedtrades = closedtradesNs;

    // Add processOrders method
    (ns as any).processOrders = function () {
        if (context._strategyEngine) {
            context._strategyEngine.processOrders();
        }
    };

    return ns;
}

export default PineStrategy;
