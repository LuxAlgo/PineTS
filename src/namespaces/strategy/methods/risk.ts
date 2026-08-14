// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * `strategy.risk` is a nested namespace with 6 setter functions that
 * configure pre-trade risk rules. Each call mutates `context.strategy.risk_rules`;
 * the actual blocking is performed by `checkRiskRules()` in utils.ts,
 * invoked before each entry fills.
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
            context.strategy.risk_rules.allow_entry_in = value;
        },
        max_cons_loss_days: (count: number, alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_cons_loss_days = { count, alert_message };
        },
        max_drawdown: (value: number, type: 'cash' | 'percent_of_equity', _alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_drawdown = { value, type };
        },
        max_intraday_filled_orders: (count: number, alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_intraday_filled_orders = { count, alert_message };
        },
        max_intraday_loss: (value: number, type: 'cash' | 'percent_of_equity', _alert_message?: string) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_intraday_loss = { value, type };
        },
        max_position_size: (contracts: number) => {
            if (!context.strategy) return;
            context.strategy.risk_rules.max_position_size = contracts;
        },
    };
}
