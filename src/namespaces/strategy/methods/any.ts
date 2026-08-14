// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { parseStrategyOptions, initializeStrategy } from '../utils';

/**
 * Declares a strategy and initializes strategy state
 * Usage: strategy(title, overlay=false, ...)
 */
export function any(context: any) {
    return (...args: any[]) => {
        const options = parseStrategyOptions(args);

        // Initialize strategy state if not already initialized
        if (!context.strategy) {
            initializeStrategy(context, options);
        } else {
            // Update config if called again (though this shouldn't happen normally).
            // User .prop overrides re-apply on top so the same layer order holds across calls.
            context.strategy.config = { ...context.strategy.config, ...options, ...(context._propOverrides ?? {}) };
        }

        return context.strategy.config;
    };
}
