// SPDX-License-Identifier: AGPL-3.0-only

import { PineRuntimeError } from '../errors/PineRuntimeError';

/** Mutable resource counters for one run, including all of its secondary contexts. */
export class ExecutionBudget {
    public maxLoopIterations: number;
    public readonly maxWorkUnits: number;
    public readonly maxMemoryBytes: number;
    public readonly maxProviderCalls: number;
    public readonly maxProviderPages: number;
    public readonly maxProviderRawBars: number;
    public readonly maxProviderResponseBytes: number;

    public loopIterations = 0;
    public workUnits = 0;
    public chargedMemoryBytes = 0;
    public bars = 0;
    public functionCalls = 0;
    public callDepth = 0;
    public providerCalls = 0;
    public providerPages = 0;
    public providerRawBars = 0;
    public providerResponseBytes = 0;
    private reservedProviderRawBars = 0;

    private deadline?: number;
    private signal?: AbortSignal;
    private readonly providerAbortController = new AbortController();
    private signalListener?: () => void;

    constructor(
        maxLoopIterations = 500000,
        options: {
            deadline?: number;
            signal?: AbortSignal;
            maxWorkUnits?: number;
            maxMemoryBytes?: number;
            maxProviderCalls?: number;
            maxProviderPages?: number;
            maxProviderRawBars?: number;
            maxProviderResponseBytes?: number;
        } = {}
    ) {
        if (!Number.isSafeInteger(maxLoopIterations) || maxLoopIterations < 1) {
            throw new RangeError('maxLoops must be a positive safe integer');
        }
        this.maxLoopIterations = maxLoopIterations;
        this.maxWorkUnits = options.maxWorkUnits ?? 50_000_000;
        this.maxMemoryBytes = options.maxMemoryBytes ?? 64 * 1024 * 1024;
        this.maxProviderCalls = options.maxProviderCalls ?? 200;
        this.maxProviderPages = options.maxProviderPages ?? 200;
        this.maxProviderRawBars = options.maxProviderRawBars ?? 100_000;
        this.maxProviderResponseBytes = options.maxProviderResponseBytes ?? 64 * 1024 * 1024;
        if (!Number.isSafeInteger(this.maxWorkUnits) || this.maxWorkUnits < 1 ||
            !Number.isSafeInteger(this.maxMemoryBytes) || this.maxMemoryBytes < 1 ||
            !Number.isSafeInteger(this.maxProviderCalls) || this.maxProviderCalls < 1 ||
            !Number.isSafeInteger(this.maxProviderPages) || this.maxProviderPages < 1 ||
            !Number.isSafeInteger(this.maxProviderRawBars) || this.maxProviderRawBars < 1 ||
            !Number.isSafeInteger(this.maxProviderResponseBytes) || this.maxProviderResponseBytes < 1) {
            throw new RangeError('Execution budget limits must be positive safe integers');
        }
        if (options.deadline !== undefined && (!Number.isSafeInteger(options.deadline) || options.deadline < 0)) {
            throw new RangeError('deadline must be a nonnegative safe integer timestamp');
        }
        this.deadline = options.deadline;
        if (options.signal) this.setAbortSignal(options.signal);
    }

    public chargeLoopIteration(): void {
        // Checking the clock on every iteration dominates small Pine loops;
        // poll at entry and then every 256 iterations while still charging
        // the iteration counter exactly on every entry.
        if ((this.loopIterations & 255) === 0) this.checkInterruption();
        if (this.loopIterations >= this.maxLoopIterations) this.exhausted('loop iterations');
        this.loopIterations++;
    }

    public chargeBar(): void {
        this.checkInterruption();
        if (this.bars >= 100000) this.exhausted('bars');
        this.bars++;
    }

    public enterFunctionCall(): void {
        this.checkInterruption();
        if (this.functionCalls >= 500000) this.exhausted('function calls');
        if (this.callDepth >= 512) this.exhausted('function call depth');
        this.functionCalls++;
        this.callDepth++;
    }

    public leaveFunctionCall(): void {
        this.callDepth--;
    }

    /** Charge predicted native work before the built-in starts. */
    public chargeWork(units: number, method?: string): void {
        this.checkInterruption();
        this.chargeAmount(units, this.workUnits, this.maxWorkUnits, 'work units', method);
        this.workUnits += units;
    }

    /** Charge output and temporary bytes before allocation. Charges are cumulative per run. */
    public chargeMemory(bytes: number, method?: string): void {
        this.checkInterruption();
        this.chargeAmount(bytes, this.chargedMemoryBytes, this.maxMemoryBytes, 'memory bytes', method);
        this.chargedMemoryBytes += bytes;
    }

    /** Count a logical provider fetch, including cache hits. */
    public chargeProviderCall(): void {
        this.checkInterruption();
        if (this.providerCalls >= this.maxProviderCalls) this.exhausted('provider calls', 'request.provider');
        this.providerCalls++;
    }

    /** Count a physical provider page / HTTP attempt, including retries and probes. */
    public chargeProviderPage(): void {
        this.checkInterruption();
        if (this.providerPages >= this.maxProviderPages) this.exhausted('provider pages', 'request.provider');
        this.providerPages++;
    }

    /** Reserve an explicit requested raw-bar ceiling before dispatching the provider. */
    public reserveProviderRawBars(count?: number): () => void {
        this.checkInterruption();
        if (count === undefined) return () => {};
        this.chargeAmount(count, this.providerRawBars + this.reservedProviderRawBars,
            this.maxProviderRawBars, 'provider raw bars', 'request.provider');
        this.reservedProviderRawBars += count;
        let released = false;
        return () => {
            if (released) return;
            this.reservedProviderRawBars -= count;
            released = true;
        };
    }

    public chargeProviderRawBars(count: number): void {
        this.checkInterruption();
        this.chargeAmount(count, this.providerRawBars + this.reservedProviderRawBars,
            this.maxProviderRawBars, 'provider raw bars', 'request.provider');
        this.providerRawBars += count;
    }

    public chargeProviderResponseBytes(count: number): void {
        this.checkInterruption();
        this.chargeAmount(count, this.providerResponseBytes,
            this.maxProviderResponseBytes, 'provider response bytes', 'request.provider');
        this.providerResponseBytes += count;
    }

    /** Providers use the same cancellation/deadline as their calling run. */
    public get providerSignal(): AbortSignal { return this.providerAbortController.signal; }
    public get providerDeadline(): number | undefined { return this.deadline; }
    public checkProviderInterruption(): void { this.checkInterruption(); }

    /** Run settings may be supplied after PineTS's eager initial data load starts. */
    public setLoopLimit(maxLoopIterations: number): void {
        if (!Number.isSafeInteger(maxLoopIterations) || maxLoopIterations < 1 || maxLoopIterations < this.loopIterations) {
            throw new RangeError('maxLoops must be a positive safe integer above current usage');
        }
        this.maxLoopIterations = maxLoopIterations;
    }

    public setDeadline(deadline: number): void {
        if (!Number.isSafeInteger(deadline) || deadline < 0) throw new RangeError('deadline must be a nonnegative safe integer timestamp');
        this.deadline = deadline;
    }

    public setAbortSignal(signal: AbortSignal): void {
        if (this.signal && this.signalListener) this.signal.removeEventListener('abort', this.signalListener);
        this.signal = signal;
        this.signalListener = () => this.providerAbortController.abort();
        if (signal.aborted) this.signalListener();
        else signal.addEventListener('abort', this.signalListener, { once: true });
    }

    private chargeAmount(amount: number, used: number, maximum: number, dimension: string, method?: string): void {
        if (!Number.isSafeInteger(amount) || amount < 0) {
            throw new PineRuntimeError(`Invalid ${dimension} charge.`, method ?? 'execution.budget', 'INVALID_ARGUMENT');
        }
        if (amount > maximum - used) this.exhausted(dimension, method);
    }

    private checkInterruption(): void {
        if (this.providerAbortController.signal.aborted) throw new PineRuntimeError('Script execution was cancelled.', 'execution.cancelled', 'CANCELLED');
        if (this.deadline !== undefined && Date.now() >= this.deadline) {
            throw new PineRuntimeError('Script execution deadline exceeded.', 'execution.deadline', 'DEADLINE_EXCEEDED');
        }
    }

    private exhausted(dimension: string, method?: string): never {
        throw new PineRuntimeError(`Script execution budget exceeded: ${dimension}.`, method ?? 'execution.budget', 'RESOURCE_LIMIT');
    }
}
