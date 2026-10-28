import { describe, expect, it } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { PineRuntimeError } from '../../src/errors/PineRuntimeError';
import { transpile } from '../../src/transpiler';
import { ExecutionBudget } from '../../src/security/ExecutionBudget';
import { Context } from '../../src/Context.class';

const header = '//@version=6\nindicator("Loop budget")\n';

function runner(maxLoops: number): PineTS {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '60', null, new Date('2024-01-01').getTime(), new Date('2024-01-02').getTime());
    pineTS.setMaxLoops(maxLoops);
    return pineTS;
}

async function expectBudgetFailure(run: Promise<unknown>): Promise<void> {
    try {
        await run;
    } catch (error) {
        expect(error).toBeInstanceOf(PineRuntimeError);
        expect((error as PineRuntimeError).message).toContain('budget exceeded: loop iterations');
        expect((error as PineRuntimeError).method).toBe('execution.budget');
        return;
    }
    throw new Error('Expected the shared loop budget to stop execution');
}

describe('one loop budget across a Pine evaluation', () => {
    it('instruments loops lowered inside initializer IIFEs', () => {
        const forCode = transpile(header + 'result = for i = 1 to 6\n    i\nplot(result)').toString();
        const whileCode = transpile(header + 'int n = 0\nresult = while n < 6\n    n += 1\n    n\nplot(result)').toString();
        expect(forCode).toContain('$.chargeLoopIteration()');
        expect(whileCode).toContain('$.chargeLoopIteration()');
    });

    it('stops finite for and while expressions in initializers', async () => {
        await expectBudgetFailure(runner(3).run(header + 'result = for i = 1 to 6\n    i\nplot(result)', 1));
        await expectBudgetFailure(runner(3).run(header + 'int n = 0\nresult = while n < 6\n    n += 1\n    n\nplot(result)', 1));
        await expectBudgetFailure(runner(3).run(header + 'result = while true\n    1\nplot(result)', 1));
    });

    it('covers loop expressions in assignments, branches, and function bodies', async () => {
        const assignedBranch = header + 'int result = 0\nif true\n    result := for i = 1 to 6\n        i\nplot(result)';
        const functionBody = header + 'f() =>\n    int n = 0\n    result = while n < 6\n        n += 1\n        n\n    result\nplot(f())';
        await expectBudgetFailure(runner(3).run(assignedBranch, 1));
        await expectBudgetFailure(runner(3).run(functionBody, 1));
    });

    it('counts nested and sequential loops together', async () => {
        const nested = header + 'int total = 0\nfor i = 1 to 2\n    for j = 1 to 2\n        total += 1\nplot(total)';
        const sequential = header + 'int total = 0\nfor i = 1 to 2\n    total += 1\nfor j = 1 to 2\n    total += 1\nplot(total)';
        await expectBudgetFailure(runner(5).run(nested, 1));
        await expectBudgetFailure(runner(3).run(sequential, 1));
    });

    it('does not reset the loop budget between bars', async () => {
        const source = header + 'int total = 0\nfor i = 1 to 2\n    total += 1\nplot(total)';
        await expectBudgetFailure(runner(5).run(source, 3));
    });

    it('shares the loop budget with a secondary request', async () => {
        const source = header + 'work = for i = 1 to 2\n    i\nremote = request.security(syminfo.tickerid, "D", work, calc_bars_count = 1)\nplot(remote)';
        await expectBudgetFailure(runner(3).run(source, 1));
        await expect(runner(4).run(source, 1)).resolves.toBeDefined();
    });

    it('rejects native work and memory charges before changing counters', () => {
        const budget = new ExecutionBudget(3, { maxWorkUnits: 3, maxMemoryBytes: 3 });
        budget.chargeWork(2, 'str.test');
        budget.chargeMemory(2, 'str.test');
        expect(() => budget.chargeWork(2, 'str.test')).toThrow(PineRuntimeError);
        expect(() => budget.chargeMemory(2, 'str.test')).toThrow(PineRuntimeError);
        expect(budget.workUnits).toBe(2);
        expect(budget.chargedMemoryBytes).toBe(2);
    });

    it('bounds recursive user calls and unwinds the depth counter', () => {
        const budget = new ExecutionBudget(3);
        const context = new Context({ marketData: [], source: [], executionBudget: budget });
        const recurse = (depth: number): number => depth === 0 ? 0 : context.call(recurse, 'recursive', depth - 1);
        expect(() => context.call(recurse, 'recursive', 513)).toThrow(/function call depth/);
        expect(budget.callDepth).toBe(0);
    });

    it('checks cancellation and deadlines before charging work', () => {
        const controller = new AbortController();
        controller.abort();
        const cancelled = new ExecutionBudget(3, { signal: controller.signal });
        expect(() => cancelled.chargeLoopIteration()).toThrow(/cancelled/);
        expect(cancelled.loopIterations).toBe(0);
        const expired = new ExecutionBudget(3, { deadline: Date.now() - 1 });
        expect(() => expired.chargeBar()).toThrow(/deadline/);
        expect(expired.bars).toBe(0);
    });

    it('preserves ordinary bounded loop results', async () => {
        const source = header + 'int total = 0\nfor i = 1 to 2\n    total += i\nfor j = 1 to 2\n    total += j\nplot(total, "sum")';
        const { plots } = await runner(4).run(source, 1);
        expect(plots.sum.data.at(-1)?.value).toBe(6);
    });
});
