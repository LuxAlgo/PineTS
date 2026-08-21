// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';

// Regression guard for the `runtime` namespace (runtime.error).
// Previously the namespace didn't exist at all, so any script referencing
// `runtime.error(...)` — even inside a never-taken branch executed at
// runtime — crashed with "runtime is not defined" instead of behaving
// like TradingView (no-op when unreached, halt with the message when hit).

const GUARDED_SCRIPT = `
//@version=6
indicator("Runtime error guard", overlay = true)
if timeframe.in_seconds(timeframe.period) < 86400
    runtime.error('Only the daily timeframe or higher are available for this model')
plot(close, 'c')
`;

describe('runtime.error', () => {
    it('does not block execution when the guard condition is false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1D', null, new Date('2024-01-01').getTime(), new Date('2024-03-01').getTime());

        const { plots } = await pineTS.run(GUARDED_SCRIPT);

        expect(plots['c'].data.length).toBeGreaterThan(0);
    });

    it('halts the script with the given message when called', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-05').getTime());

        await expect(pineTS.run(GUARDED_SCRIPT)).rejects.toThrow('Only the daily timeframe or higher are available for this model');
    });

    it('throws a catchable PineRuntimeError with method "runtime.error"', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-05').getTime());

        let caught: unknown;
        try {
            await pineTS.run(GUARDED_SCRIPT);
        } catch (err) {
            caught = err;
        }

        expect(caught).toBeInstanceOf(PineRuntimeError);
        expect((caught as PineRuntimeError).method).toBe('runtime.error');
    });

    it('works in PineTS syntax as well', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-05').getTime());

        await expect(
            pineTS.run(($: any) => {
                const { runtime } = $.pine;
                runtime.error('boom');
            }),
        ).rejects.toThrow('boom');
    });
});
