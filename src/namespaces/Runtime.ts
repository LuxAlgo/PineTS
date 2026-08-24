// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { Series } from '../Series';
import { Context } from '..';
import { PineRuntimeError } from '../errors/PineRuntimeError';

/**
 * Pine Script `runtime` namespace.
 *
 * `runtime.error(message)` halts script execution with a runtime error,
 * mirroring TradingView behavior. The thrown PineRuntimeError propagates
 * out of the run loop so consumers can catch it (see PineRuntimeError docs).
 */
export class Runtime {
    constructor(private context: Context) {}

    param(source: any, index: number = 0, _name?: string) {
        return Series.from(source).get(index);
    }

    error(message: any): never {
        const msg = Series.from(message).get(0);
        throw new PineRuntimeError(typeof msg === 'string' ? msg : String(msg ?? ''), 'runtime.error');
    }
}
