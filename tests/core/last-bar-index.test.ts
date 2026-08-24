// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo
import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

/**
 * TV semantics: `last_bar_index` is the bar_index of the LAST bar of the
 * chart's history — a CONSTANT across the whole historical run (it only
 * grows when new realtime bars are appended). It must NOT track the
 * current bar_index during the historical run.
 *
 * Regression guard for: `last_bar_index` returning `close.length - 1`
 * (the progressively-fed window size), which made it equal bar_index on
 * every bar, so `bar_index < last_bar_index` was never true.
 */
describe('last_bar_index', () => {
    it('is constant across the historical run and equals the final bar_index', async () => {
        const pineTS = new PineTS(
            Provider.Mock,
            'BTCUSDC',
            '60',
            null,
            new Date('2024-01-01').getTime(),
            new Date('2024-01-10').getTime()
        );

        const { plots } = await pineTS.run(($) => {
            const { plotchar, bar_index, last_bar_index } = $.pine;

            const isNotLast = bar_index < last_bar_index ? 1 : 0;

            plotchar(bar_index, 'bi');
            plotchar(last_bar_index, 'lbi');
            plotchar(isNotLast, 'isNotLast');

            return { bar_index, last_bar_index };
        });

        const biData = plots['bi'].data;
        const lbiData = plots['lbi'].data;
        const isNotLastData = plots['isNotLast'].data;

        const barCount = biData.length;
        expect(barCount).toBeGreaterThan(2);

        const finalBarIndex = biData[barCount - 1].value;
        expect(finalBarIndex).toBe(barCount - 1);

        // TV: last_bar_index plots the same value (the final bar's index) on EVERY bar.
        for (let i = 0; i < barCount; i++) {
            expect(lbiData[i].value, `last_bar_index at bar ${i}`).toBe(finalBarIndex);
        }

        // TV: bar_index < last_bar_index is true on all bars except the last one.
        for (let i = 0; i < barCount - 1; i++) {
            expect(isNotLastData[i].value, `bar_index < last_bar_index at bar ${i}`).toBe(1);
        }
        expect(isNotLastData[barCount - 1].value).toBe(0);
    });
});
