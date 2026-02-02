// SPDX-License-Identifier: AGPL-3.0-only
// This file is manually created. Can be auto-generated in the future.
// TODO: Create npm run generate:strategy-index script

export type { StrategyConfig, StrategyState, Trade, Order, Position } from './types';

import { any } from './methods/any';
import { order } from './methods/order';
import { param } from './methods/param';
import { opentrades } from './methods/opentrades';
import { closedtrades } from './methods/closedtrades';
import { netprofit } from './methods/netprofit';
import { position_size } from './methods/position_size';
import { position_avg_price } from './methods/position_avg_price';
import { position_entry } from './methods/position_entry';
import { equity } from './methods/equity';
import { long } from './methods/long';
import { short } from './methods/short';
import { cash } from './methods/cash';
import { percent_of_equity } from './methods/percent_of_equity';
import { fixed } from './methods/fixed';

const methods = {
    any,
    order,
    param,
    opentrades,
    closedtrades,
    netprofit,
    position_size,
    position_avg_price,
    position_entry,
    equity,
    long,
    short,
    cash,
    percent_of_equity,
    fixed,
};

export class Strategy {
    any: ReturnType<typeof methods.any>;
    order: ReturnType<typeof methods.order>;
    param: ReturnType<typeof methods.param>;
    opentrades: ReturnType<typeof methods.opentrades>;
    closedtrades: ReturnType<typeof methods.closedtrades>;
    netprofit: ReturnType<typeof methods.netprofit>;
    position_size: ReturnType<typeof methods.position_size>;
    position_avg_price: ReturnType<typeof methods.position_avg_price>;
    position_entry: ReturnType<typeof methods.position_entry>;
    equity: ReturnType<typeof methods.equity>;
    long: ReturnType<typeof methods.long>;
    short: ReturnType<typeof methods.short>;
    cash: ReturnType<typeof methods.cash>;
    percent_of_equity: ReturnType<typeof methods.percent_of_equity>;
    fixed: ReturnType<typeof methods.fixed>;

    constructor(private context: any) {
        // Install methods
        Object.entries(methods).forEach(([name, factory]) => {
            this[name] = factory(context);
        });
    }
}

export default Strategy;
