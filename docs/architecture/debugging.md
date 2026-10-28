---
layout: default
title: Debugging Guide
parent: Architecture
nav_order: 5
permalink: /architecture/debugging/
---

# Debugging Guide

This guide covers practical debugging techniques for PineTS development.

## Viewing Transpiled Code

To see what the transpiler generates:

```javascript
const transformer = transpile.bind(context);
const transpiledFn = transformer(userCode);
console.log(transpiledFn.toString());
```

This shows the actual JavaScript that will execute, helping identify transformation issues.

## Inspecting Context State

### Market Data (Forward Storage)

```javascript
// Check raw market data (forward arrays: oldest to newest)
const close = context.data.close;
console.log('Close array:', close);
console.log('Current close:', close[close.length - 1]); // Last element = current
console.log('Previous close:', close[close.length - 2]); // Second-to-last = previous
console.log('Oldest close:', close[0]); // First element = oldest
```

### Using $.get() (Pine Script Semantics)

```javascript
// Pine Script-style access (reverse indexing)
console.log('close[0] (current):', context.get(close, 0));
console.log('close[1] (previous):', context.get(close, 1));
console.log('close[2] (2 bars ago):', context.get(close, 2));
```

### User Variables

```javascript
// Check user-defined variables
console.log('All let variables:', context.let);
console.log('All const variables:', context.const);
console.log('All var variables:', context.var);

// Check specific variable history (forward array)
console.log('ema9 series:', context.let.glb1_ema9);
console.log('ema9 current:', context.let.glb1_ema9[context.let.glb1_ema9.length - 1]);
```

### Function State

```javascript
// Check TA function internal state
console.log('All TA state:', context.taState);
console.log('Specific EMA state:', context.taState['_ta0']);
```

### Parameter Cache

```javascript
// Check param() transformed values
console.log('All params:', context.params);
console.log('Specific param:', context.params['p0']);
```

## Inspecting Series Objects

```javascript
// Check Series wrapper details
const series = context.ta.param(close, 1, 'test');
console.log('Series data (forward array):', series.data);
console.log('Series offset (lookback):', series.offset);
console.log('Series.get(0):', series.get(0)); // Value with offset applied
console.log('Actual index accessed:', series.data.length - 1 - series.offset);
```

## Common Debug Patterns

### Pattern 1: Value Mismatch

**Problem:** Calculated value doesn't match expected.

**Debug:**

```javascript
// In your TA function
export function myIndicator(context: any) {
    return (source: any, period: any, _callId?: string) => {
        const currentValue = Series.from(source).get(0);
        console.log(`[${_callId}] Current value:`, currentValue);

        const periodValue = Series.from(period).get(0);
        console.log(`[${_callId}] Period:`, periodValue);

        const state = context.taState[_callId];
        console.log(`[${_callId}] State:`, state);

        // ... calculation
        const result = /* ... */;
        console.log(`[${_callId}] Result:`, result);
        return result;
    };
}
```

### Pattern 2: Incorrect Array Access

**Problem:** Getting wrong historical values.

**Debug:**

```javascript
const close = context.data.close;

// Forward storage check
console.log('Total bars:', close.length);
console.log('Last 5 (newest to oldest):', [
    close[close.length - 1], // Current
    close[close.length - 2], // Previous
    close[close.length - 3],
    close[close.length - 4],
    close[close.length - 5],
]);

// Pine Script access check
console.log('Last 5 via $.get():', [
    context.get(close, 0), // Current
    context.get(close, 1), // Previous
    context.get(close, 2),
    context.get(close, 3),
    context.get(close, 4),
]);

// These should match!
```

### Pattern 3: State Corruption

**Problem:** Function state becomes `NaN` or corrupted.

**Debug:**

```javascript
export function ema(context: any) {
    return (source: any, period: any, _callId?: string) => {
        const stateKey = _callId || `ema_${period}`;
        const state = context.taState[stateKey];

        const currentValue = Series.from(source).get(0);

        // Debug NaN propagation
        if (isNaN(currentValue)) {
            console.warn(`[${stateKey}] NaN input detected at idx ${context.idx}`);
        }

        if (state && isNaN(state.prevEma)) {
            console.error(`[${stateKey}] State corrupted! prevEma is NaN`);
            console.log('State:', state);
        }

        // ... rest of calculation
    };
}
```

### Pattern 4: Scope Issues

**Problem:** Variable not found or accessing wrong scope.

**Debug:**

```javascript
// Check what variables exist in each scope
console.log(
    'Global variables (glb1_*):',
    Object.keys(context.let).filter((k) => k.startsWith('glb1_'))
);
console.log(
    'Function scope variables (fn*):',
    Object.keys(context.let).filter((k) => k.match(/^fn\d+_/))
);
console.log(
    'If scope variables (if*):',
    Object.keys(context.let).filter((k) => k.match(/^if\d+_/))
);
```

## Debugging Transpiler Issues

### Check Scope Manager State

```javascript
// In transformer code
console.log('Current scope:', scopeManager.currentScope);
console.log('Scope tree:', scopeManager.scopeTree);
console.log('Variable mapping:', scopeManager.variableMap);
console.log('Context-bound vars:', scopeManager.contextBoundVariables);
```

### Trace AST Transformation

```javascript
// Add logging to transformer
transform(node: any) {
    console.log('Transforming:', node.type, node);
    const result = this.transformNode(node);
    console.log('Result:', result);
    return result;
}
```

## Performance Debugging

### Measure Execution Time

```javascript
const startTime = performance.now();
const result = await pineTS.run(code);
const endTime = performance.now();
console.log(`Execution time: ${endTime - startTime}ms`);
```

### Check Memory Usage

```javascript
const memBefore = process.memoryUsage();
const result = await pineTS.run(code);
const memAfter = process.memoryUsage();

console.log('Memory delta:', {
    heapUsed: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024,
    external: (memAfter.external - memBefore.external) / 1024 / 1024,
});
```

### Profile TA Function Calls

```javascript
// Wrap TA function with timing
const originalEma = context.ta.ema;
const calls = { count: 0, totalTime: 0 };

context.ta.ema = (...args) => {
    const start = performance.now();
    const result = originalEma(...args);
    const elapsed = performance.now() - start;

    calls.count++;
    calls.totalTime += elapsed;

    return result;
};

// After execution
console.log(`EMA called ${calls.count} times, avg: ${calls.totalTime / calls.count}ms`);
```

## Common Issues and Solutions

### Issue: `NaN` Results

**Symptoms:** Function returns `NaN` unexpectedly.

**Debug:**

```javascript
// Check inputs
console.log('Source:', Series.from(source).get(0));
console.log('Is NaN?', isNaN(Series.from(source).get(0)));

// Check state
console.log('State:', context.taState[_callId]);

// Check initialization
if (!state.initialized) {
    console.log('Still initializing, need more data');
}
```

**Common Causes:**

-   Not enough data for initialization (e.g., EMA needs `period` bars)
-   State corruption from `NaN` input
-   Missing null/undefined checks

### Issue: Wrong Historical Values

**Symptoms:** `close[1]` doesn't return previous bar.

**Debug:**

```javascript
// Verify storage order
console.log(
    'Is forward storage?',
    close[0] < close[close.length - 1] // Should be true (oldest < newest)
);

// Verify Series offset
const series = Series.from(close);
console.log('Offset:', series.offset); // Should be 0 for close
console.log('get(1) index:', series.data.length - 1 - (series.offset + 1));
```

**Common Causes:**

-   Using direct array access instead of `$.get()`
-   Confusing forward storage with reverse access
-   Incorrect offset in Series wrapper

### Issue: State Shared Between Calls

**Symptoms:** Two `ta.ema(close, 9)` calls return identical values.

**Debug:**

```javascript
// Check call IDs
console.log('Call 1 ID:', _callId1);
console.log('Call 2 ID:', _callId2);
console.log('Are different?', _callId1 !== _callId2); // Should be true

// Check state keys
console.log('State keys:', Object.keys(context.taState));
```

**Common Causes:**

-   Missing `_callId` parameter in function signature
-   Not using `_callId` in state key
-   Transpiler not injecting unique IDs

## Testing Strategies

### Unit Test Pattern

```javascript
it('should calculate correctly', async () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

    const sourceCode = (context) => {
        const { close } = context.data;
        const { ta } = context.pine;

        const sma = ta.sma(close, 20);

        // Debug output
        console.log('Context at idx', context.idx);
        console.log('close:', context.get(close, 0));
        console.log('sma:', context.get(sma, 0));

        return { sma };
    };

    const { result } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

    // Assertions
    expect(result.sma).toBeDefined();
    expect(result.sma[result.sma.length - 1]).toBeCloseTo(expectedValue);
});
```

### Snapshot Testing

```javascript
// Capture full context state
const snapshot = {
    idx: context.idx,
    close: context.data.close.slice(-5), // Last 5 bars
    variables: { ...context.let },
    taState: { ...context.taState },
};

// Compare with expected
expect(snapshot).toMatchSnapshot();
```

## Visual Debugging Tools

### Plot All Values

```javascript
const sourceCode = (context) => {
    const { close } = context.data;
    const { ta, plotchar } = context.pine;

    const sma = ta.sma(close, 20);
    const ema = ta.ema(close, 20);

    // Plot for visual inspection
    plotchar(close, 'close', { color: 'blue' });
    plotchar(sma, 'sma', { color: 'red' });
    plotchar(ema, 'ema', { color: 'green' });

    return { sma, ema };
};
```

### Export to CSV

```javascript
const { result, plots } = await pineTS.run(sourceCode, undefined, undefined, { sourceMode: 'trustedJavaScript' });

const csv = plots['sma'].data.map((p) => `${new Date(p.time).toISOString()},${p.value}`).join('\n');

fs.writeFileSync('debug.csv', 'time,sma\n' + csv);
```
