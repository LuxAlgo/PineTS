# Source modes

`PineTS.run()`, `stream()`, `update()`, and `Indicator.prepare()` accept only native Pine Script with a `//@version=5` or newer marker by default. A missing marker or a JavaScript `Function` is rejected before compilation. This is a breaking change for applications that previously passed PineTS JavaScript syntax without an explicit choice.

For first-party JavaScript that you trust to execute with the host's privileges, opt in at each entry point:

```typescript
await pine.run(jsSource, undefined, undefined, { sourceMode: 'trustedJavaScript' });
pine.stream(jsSource, { sourceMode: 'trustedJavaScript' });
await pine.update(jsSource, { sourceMode: 'trustedJavaScript' });
indicator.prepare({ sourceMode: 'trustedJavaScript' });
```

The default is `sourceMode: 'nativePine'`. The mode is part of the prepared-artifact cache key, so preparing an `Indicator` as trusted JavaScript cannot make a later native-Pine run reuse that artifact. The mode also follows secondary `request.security` and `request.security_lower_tf` executions.

Native-Pine mode verifies the exact generated program and every request slice before compilation. A slice that loses a required binding is skipped, and the verified full-program path handles that request. JavaScript mode is intentionally trusted and does not apply the Pine closed-world verifier.

`runPretranspiled()` also requires an artifact produced by this compiler. A trusted-JavaScript artifact needs an explicit fourth argument, `{ sourceMode: 'trustedJavaScript' }`; an arbitrary function or an artifact made from versioned Pine with `verify: false` is rejected.

The lower-level `transpile()` function follows the same default: markerless JavaScript needs an explicit `{ debug: false, sourceMode: 'trustedJavaScript' }`. Passing that option does not downgrade versioned Pine; it is still verified and remains a native-Pine artifact.

Compilation now enforces structural ceilings before and after transformation: 262,144 input code units (at most 524,288 UTF-8 bytes), 10,000 lines, 16,384 code units per line, 50,000 Pine tokens, 256 nesting levels, 100,000 AST nodes, and 2,000,000 generated code units. The 10-second phase check is cooperative; it cannot interrupt a parser already blocked inside one synchronous call.

`str.match` uses a step-bounded Java-flavor matcher rather than JavaScript's synchronous `RegExp` engine. Patterns are limited to 256 code units and subjects to 4,096. Matching steps are charged to the run-wide work and memory budgets, so pathological patterns stop with a runtime error instead of running indefinitely. Java-style groups, lookarounds, backreferences and quantifiers are supported within these limits.

Source mode is an input classification and compiler check. Applications running community scripts still need a separately terminable, capability-limited execution unit and resource limits for CPU, memory, and provider work.

Resource, cancellation, deadline, invalid-argument, and provider failures expose a stable `PineRuntimeError.code` (`RESOURCE_LIMIT`, `CANCELLED`, `DEADLINE_EXCEEDED`, `INVALID_ARGUMENT`, or `PROVIDER_FAILURE`). Other runtime errors use `RUNTIME_ERROR`. Hosts should branch on `code`, not parse error messages.
