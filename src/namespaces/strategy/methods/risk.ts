// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { argValue } from '../utils';

/**
 * `strategy.risk` is a nested namespace with 6 setter functions that
 * configure risk rules. Each call mutates `context.strategy.risk_rules`;
 * the rules are applied by the engine in utils.ts (riskStartBar,
 * riskAfterFill, riskEndOfBarFills, and fillEntryOrder for
 * allow_entry_in / max_position_size).
 *
 * Pine signatures:
 *   strategy.risk.allow_entry_in(value)                         → void
 *   strategy.risk.max_cons_loss_days(count, alert_message)      → void
 *   strategy.risk.max_drawdown(value, type, alert_message)      → void
 *   strategy.risk.max_intraday_filled_orders(count, alert_message) → void
 *   strategy.risk.max_intraday_loss(value, type, alert_message) → void
 *   strategy.risk.max_position_size(contracts)                  → void
 */
export function risk(context: any) {
    return {
        allow_entry_in: (value: 'long' | 'short' | 'all') => {
            if (!context.strategy) return;
            context.strategy.risk_rules.allow_entry_in = argValue(value);
        },
        max_cons_loss_days: (count: number, alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_cons_loss_days = { count: Number(argValue(count)), alert_message: argValue(alert_message) };
        },
        max_drawdown: (value: number, type: 'cash' | 'percent_of_equity', alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_drawdown = { value: Number(argValue(value)), type: argValue(type), alert_message: argValue(alert_message) };
        },
        max_intraday_filled_orders: (count: number, alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_intraday_filled_orders = { count: Number(argValue(count)), alert_message: argValue(alert_message) };
        },
        max_intraday_loss: (value: number, type: 'cash' | 'percent_of_equity', alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_intraday_loss = { value: Number(argValue(value)), type: argValue(type), alert_message: argValue(alert_message) };
        },
        max_position_size: (contracts: number) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_position_size = Number(argValue(contracts));
        },
    };
}
