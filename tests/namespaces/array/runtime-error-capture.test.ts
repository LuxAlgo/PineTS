// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Runtime Error Capture Tests
 *
 * Verifies that:
 * - Array/matrix OOB access halts the script with a PineRuntimeError
 *   (TradingView parity — "Index xx is out of bounds, array size is yy")
 * - The error is catchable and carries the offending method name
 * - stream() emits an 'error' event on OOB access
 * - Loop guard violations still throw (blocking errors)
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';

describe('Runtime Error Capture', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    // -- run() API: OOB errors --

    describe('run() API - OOB runtime errors', () => {
        it('array.get OOB throws PineRuntimeError', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                return array.get(arr, 10);
            };

            let caught: unknown;
            try {
                await pineTS.run(code);
            } catch (err) {
                caught = err;
            }

            expect(caught).toBeInstanceOf(PineRuntimeError);
            expect((caught as PineRuntimeError).method).toBe('array.get');
            expect((caught as PineRuntimeError).message).toContain('out of bounds');
        });

        it('array.set OOB throws PineRuntimeError', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.set(arr, 5, 42);
                return array.get(arr, 0);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('array.remove OOB throws PineRuntimeError', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                return array.remove(arr, 5);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('matrix.get OOB throws PineRuntimeError', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(3, 3, 0);
                return matrix.get(m, 5, 0);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('loop guard violation still throws (blocking)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setMaxLoops(10);

            const code = `
//@version=6
indicator("Loop Guard Test")
i = 0
while true
    i += 1
plot(i)
            `;

            await expect(pineTS.run(code)).rejects.toThrow(/loop/i);
        });
    });

    // -- stream() API: error events --

    describe('stream() API - error events', () => {
        it('emits error event on array OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready();
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.get(arr, 10);
            };

            const error = await new Promise<any>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    resolve(err);
                });

                stream.on('data', () => {
                    clearTimeout(timeout);
                    reject(new Error('Should not emit data'));
                });
            });

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toContain('out of bounds');
        });

        it('loop guard still emits error event (blocking)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready();
            pineTS.setMaxLoops(10);

            const code = `
//@version=6
indicator("Loop Guard Test")
i = 0
while true
    i += 1
plot(i)
            `;

            const error = await new Promise<any>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    resolve(err);
                });

                stream.on('data', () => {
                    clearTimeout(timeout);
                    reject(new Error('Should not emit data'));
                });
            });

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toMatch(/loop/i);
        });
    });
});
