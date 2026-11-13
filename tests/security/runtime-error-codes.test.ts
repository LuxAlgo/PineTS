import { describe, expect, it } from 'vitest';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { transpile } from '../../src/transpiler';

describe('stable runtime error codes', () => {
    it('distinguishes resource exhaustion and invalid charges', () => {
        const budget = new ExecutionBudget(1, { maxWorkUnits: 1 });
        expect(() => budget.chargeWork(2)).toThrowError(PineRuntimeError);
        try { budget.chargeWork(2); } catch (error) {
            expect((error as PineRuntimeError).code).toBe('RESOURCE_LIMIT');
        }
        try { budget.chargeMemory(-1); } catch (error) {
            expect((error as PineRuntimeError).code).toBe('INVALID_ARGUMENT');
        }
    });

    it('distinguishes cancellation from deadline exhaustion', () => {
        const controller = new AbortController();
        const cancelled = new ExecutionBudget(1, { signal: controller.signal });
        controller.abort();
        expect(() => cancelled.chargeBar()).toThrowError(PineRuntimeError);
        try { cancelled.chargeBar(); } catch (error) {
            expect((error as PineRuntimeError).code).toBe('CANCELLED');
        }
        const expired = new ExecutionBudget(1, { deadline: Date.now() - 1 });
        expect(() => expired.chargeBar()).toThrowError(PineRuntimeError);
        try { expired.chargeBar(); } catch (error) {
            expect((error as PineRuntimeError).code).toBe('DEADLINE_EXCEEDED');
        }
    });

    it('classifies compiler limits as resource exhaustion', () => {
        const source = '//@version=6\n' + 'x'.repeat(262_145);
        expect(() => transpile(source)).toThrowError(PineRuntimeError);
        try { transpile(source); } catch (error) {
            expect((error as PineRuntimeError).code).toBe('RESOURCE_LIMIT');
        }
    });
});
