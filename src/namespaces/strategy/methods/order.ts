// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { calculateOrderQty, parseDirection } from '../utils';
import { Order } from '../types';
import { Series } from '../../../Series';

/**
 * Places a basic order
 * Usage: strategy.order(id, direction, qty=na, limit=na, stop=na, ...)
 */
export function order(context: any) {
    return (id: any, direction: any, qty?: any, limit?: any, stop?: any, ...rest: any[]) => {
        if (!context.strategy) {
            throw new Error('strategy.order() called before strategy() declaration');
        }

        // Check if first parameter is an object with named parameters (Pine Script style)
        let idParam = id;
        let directionParam = direction;
        let qtyParam = qty;
        let limitParam = limit;
        let stopParam = stop;

        if (typeof id === 'object' && id !== null && !Array.isArray(id) && !(id instanceof Series)) {
            // Named parameters passed as object
            idParam = id.id;
            directionParam = id.direction;
            qtyParam = id.qty;
            limitParam = id.limit;
            stopParam = id.stop;
        }

        // Helper to extract value from Series or return as-is
        const extractValue = (val: any) => {
            if (val === undefined || val === null) return val;
            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
            // If it's a function, call it to get the actual value (transpiler may wrap values in functions)
            if (typeof val === 'function') return val();
            if (val instanceof Series) return val.get(0);
            if (Array.isArray(val)) return val[val.length - 1];
            // If it's an object, try to get its current value
            if (typeof val === 'object' && val.get !== undefined) return val.get(0);
            return val;
        };

        // Extract values from Series if needed
        const idValue = extractValue(idParam);
        const directionValue = extractValue(directionParam);
        const qtyValue = extractValue(qtyParam);
        const limitValue = extractValue(limitParam);
        const stopValue = extractValue(stopParam);

        // Parse direction to numeric
        const dir = parseDirection(directionValue);

        // Get current price (Close) for quantity calculation
        const currentPrice = Series.from(context.data.close).get(0);
        
        // Calculate order quantity immediately
        // This locks in the quantity based on the price/equity at order placement time
        const calculatedQty = calculateOrderQty(context, qtyValue, dir, currentPrice);

        // Determine order type
        let orderType: 'market' | 'limit' | 'stop' | 'stop-limit' = 'market';
        if (limitValue !== undefined && stopValue !== undefined) {
            orderType = 'stop-limit';
        } else if (limitValue !== undefined) {
            orderType = 'limit';
        } else if (stopValue !== undefined) {
            orderType = 'stop';
        }

        // Get current time
        const currentTime = Series.from(context.data.openTime).get(0);

        // Create order object
        const orderObj: Order = {
            id: idValue,
            direction: dir,
            qty: calculatedQty,
            type: orderType,
            limitPrice: limitValue,
            stopPrice: stopValue,
            bar: context.idx,
            time: currentTime,
            status: 'pending',
        };

        // Add to pending orders
        context.strategy.pendingOrders.push(orderObj);

        return orderObj;
    };
}
