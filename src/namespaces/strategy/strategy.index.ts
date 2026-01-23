// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:strategy-index

import { avg_losing_trade } from './methods/avg_losing_trade';
import { avg_losing_trade_percent } from './methods/avg_losing_trade_percent';
import { avg_trade } from './methods/avg_trade';
import { avg_trade_percent } from './methods/avg_trade_percent';
import { avg_winning_trade } from './methods/avg_winning_trade';
import { avg_winning_trade_percent } from './methods/avg_winning_trade_percent';
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
import { grossloss_percent } from './methods/grossloss_percent';
import { grossprofit } from './methods/grossprofit';
import { grossprofit_percent } from './methods/grossprofit_percent';
import { initial_capital } from './methods/initial_capital';
import { losstrades } from './methods/losstrades';
import { max_drawdown } from './methods/max_drawdown';
import { max_drawdown_percent } from './methods/max_drawdown_percent';
import { max_runup } from './methods/max_runup';
import { max_runup_percent } from './methods/max_runup_percent';
import { netprofit } from './methods/netprofit';
import { netprofit_percent } from './methods/netprofit_percent';
import { openprofit } from './methods/openprofit';
import { openprofit_percent } from './methods/openprofit_percent';
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
  avg_losing_trade_percent,
  avg_trade_percent,
  avg_winning_trade_percent,
  cancel,
  cancel_all,
  close,
  close_all,
  entry,
  exit,
  grossloss_percent,
  grossprofit_percent,
  max_drawdown_percent,
  max_runup_percent,
  netprofit_percent,
  openprofit_percent,
  order,
  param,
  strategy
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
  wintrades
};

const subNamespaceCountMethods = {
  closedtrades,
  opentrades
};

const opentradesMethods = {
  opentrades_entry_bar_index,
  opentrades_entry_id,
  opentrades_entry_price,
  opentrades_entry_time,
  opentrades_profit,
  opentrades_size
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
  closedtrades_size
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

export class PineStrategy {
  private context: any;
  private _propertyCache: Record<string, () => number> = {};

  // Constants
  readonly direction = direction;
  readonly oca = oca_type;
  readonly commission = commission_type;
  readonly position = position;
  readonly cash = cash;
  readonly fixed = fixed;
  readonly percent_of_equity = percent_of_equity;
  readonly long = 'long' as const;
  readonly short = 'short' as const;

  // Sub-namespaces (callable with methods attached)
  opentrades: OpentradesNamespace;
  closedtrades: ClosedtradesNamespace;

  // Action methods
  avg_losing_trade_percent: ReturnType<typeof actionMethods.avg_losing_trade_percent>;
  avg_trade_percent: ReturnType<typeof actionMethods.avg_trade_percent>;
  avg_winning_trade_percent: ReturnType<typeof actionMethods.avg_winning_trade_percent>;
  cancel: ReturnType<typeof actionMethods.cancel>;
  cancel_all: ReturnType<typeof actionMethods.cancel_all>;
  close: ReturnType<typeof actionMethods.close>;
  close_all: ReturnType<typeof actionMethods.close_all>;
  entry: ReturnType<typeof actionMethods.entry>;
  exit: ReturnType<typeof actionMethods.exit>;
  grossloss_percent: ReturnType<typeof actionMethods.grossloss_percent>;
  grossprofit_percent: ReturnType<typeof actionMethods.grossprofit_percent>;
  max_drawdown_percent: ReturnType<typeof actionMethods.max_drawdown_percent>;
  max_runup_percent: ReturnType<typeof actionMethods.max_runup_percent>;
  netprofit_percent: ReturnType<typeof actionMethods.netprofit_percent>;
  openprofit_percent: ReturnType<typeof actionMethods.openprofit_percent>;
  order: ReturnType<typeof actionMethods.order>;
  param: ReturnType<typeof actionMethods.param>;
  strategy: ReturnType<typeof actionMethods.strategy>;

  // Properties (using Object.defineProperty for getters)
  readonly position_size!: number;
  readonly position_avg_price!: number;
  readonly equity!: number;
  readonly initial_capital!: number;
  readonly openprofit!: number;
  readonly netprofit!: number;
  readonly grossprofit!: number;
  readonly grossloss!: number;
  readonly wintrades!: number;
  readonly losstrades!: number;
  readonly eventrades!: number;
  readonly max_drawdown!: number;
  readonly max_runup!: number;
  readonly profit_factor!: number;
  readonly avg_trade!: number;
  readonly avg_winning_trade!: number;
  readonly avg_losing_trade!: number;
  readonly win_rate!: number;
  readonly sharpe_ratio!: number;

  constructor(context: any) {
    this.context = context;

    // Initialize strategy engine if not present
    if (!context._strategyEngine) {
      context._strategyEngine = new StrategyEngine(context);
    }

    // Install action methods
    Object.entries(actionMethods).forEach(([name, factory]) => {
      (this as any)[name] = factory(context);
    });

    // Install property methods as getters
    Object.entries(propertyMethods).forEach(([name, factory]) => {
      this._propertyCache[name] = factory(context);
      Object.defineProperty(this, name, {
        get: () => this._propertyCache[name](),
        enumerable: true,
      });
    });

    // Create opentrades sub-namespace (callable + has methods)
    const opentradesCountFn = subNamespaceCountMethods.opentrades(context);
    const opentradesNs = Object.assign(
      () => opentradesCountFn(),
      Object.fromEntries(
        Object.entries(opentradesMethods).map(([name, factory]) => [
          name.replace('opentrades_', ''),
          factory(context),
        ])
      )
    ) as unknown as OpentradesNamespace;
    this.opentrades = opentradesNs;

    // Create closedtrades sub-namespace (callable + has methods)
    const closedtradesCountFn = subNamespaceCountMethods.closedtrades(context);
    const closedtradesNs = Object.assign(
      () => closedtradesCountFn(),
      Object.fromEntries(
        Object.entries(closedtradesMethods).map(([name, factory]) => [
          name.replace('closedtrades_', ''),
          factory(context),
        ])
      )
    ) as unknown as ClosedtradesNamespace;
    this.closedtrades = closedtradesNs;
  }

  /**
   * Process pending orders - called at the start of each bar
   */
  processOrders(): void {
    if (this.context._strategyEngine) {
      this.context._strategyEngine.processOrders();
    }
  }
}

export default PineStrategy;
