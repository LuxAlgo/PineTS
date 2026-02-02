// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Strategy Namespace', () => {
    describe('Basic Functionality', () => {
        it('should access strategy getters', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { strategy, plotchar } = $.pine;

                // Access equity (should be 0 initially or have a value)
                const eq = strategy.equity;
                plotchar(eq, 'Equity');

                // Access netprofit
                const np = strategy.netprofit;
                plotchar(np, 'NetProfit');
            });

            expect(plots['Equity']).toBeDefined();
            expect(plots['NetProfit']).toBeDefined();
        });

        it('should access position_size getter', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { strategy, plotchar } = $.pine;

                const posSize = strategy.position_size;
                plotchar(posSize, 'PosSize');
            });

            expect(plots['PosSize']).toBeDefined();
        });
    });

    describe('Strategy Constants', () => {
        it('should have all direction constants available', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const { plots } = await pineTS.run(($) => {
                const { strategy, plotchar } = $.pine;

                // Verify constants exist
                plotchar(strategy.long, 'LongConst');
                plotchar(strategy.short, 'ShortConst');
                plotchar(strategy.cash, 'CashConst');
                plotchar(strategy.percent_of_equity, 'PercentConst');
                plotchar(strategy.fixed, 'FixedConst');
            });

            expect(plots['LongConst']).toBeDefined();
            expect(plots['ShortConst']).toBeDefined();
            expect(plots['CashConst']).toBeDefined();
            expect(plots['PercentConst']).toBeDefined();
            expect(plots['FixedConst']).toBeDefined();
        });
    });
});
