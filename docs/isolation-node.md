# Opt-in Node child execution

`pinets/isolation/node` runs one native Pine script in a fresh, terminable Node child process. It is an opt-in adapter for an embedding application, not the default `PineTS.run()` implementation and **not a complete sandbox**.

```typescript
import { runIsolatedPine } from 'pinets/isolation/node';

const output = await runIsolatedPine({
    source: '//@version=5\nindicator("Close")\nplot(close, "close")',
    tickerId: 'TEST',
    timeframe: '1',
    bars: [
        { openTime: 1700000000000, closeTime: 1700000060000, open: 10, high: 12, low: 9, close: 11, volume: 100 },
    ],
});
console.log(output.plots.close);
```

Only a versioned Pine string and plain OHLCV bars with explicit `openTime` and `closeTime` are accepted. The close time must be the actual session close for the bar; the adapter does not guess it from the timeframe. JavaScript functions, markerless scripts, provider objects, callbacks, and arbitrary host objects are not passed to the child. The returned `{ result, plots, alerts, warnings }` is JSON data; non-finite Pine numbers become `null`, and custom class identities are not preserved. The host must obtain and validate its own market data before calling the adapter. The child has no provider keys or direct host provider reference. Secondary `request.*` market-data operations fail closed until a validated parent-side capability broker is implemented; this adapter does not silently serve them from the chart series.

Each call creates a dedicated temporary working directory and launches Node with an empty environment, an explicit Node-argument list, standard pipes plus a dedicated length-framed response pipe, and a V8 old-space ceiling. The parent counts response bytes *before* JSON parsing, enforces a total wall-clock timeout, and kills the child on timeout, protocol failure, or excessive stdout/stderr. Defaults are 5 seconds, 256 MiB old space, 2 MiB serialized request and response, and 32 KiB combined stdout/stderr. Callers can lower or raise these within the adapter's hard limits (60 seconds, 512 MiB old space, 8 MiB per message, 1 MiB stdout/stderr). One process is used per job; there is no pool, retry, or global concurrency cap. Embedding hosts must bound simultaneous jobs.

For a source checkout, run `npm run build:dev:es` first: the child loads `dist/pinets.dev.es.js` so it never needs a TypeScript loader or source-tree aliases in its temporary directory. The published Node subpath loads `dist/pinets.min.es.js` and a copied `dist/isolation-worker.mjs`. Import the Node subpath only on Node; it is intentionally absent from the browser-facing main entry point.

## Residual risks and deployment requirements

A Node child with an empty environment and separate heap can still read files, open network connections, or spawn descendants available to its OS identity. A future verifier bypass or native-library defect could exercise those capabilities. The V8 old-space option is not an RSS, CPU, disk, or kernel resource limit; terminating the direct child does not guarantee termination of descendants. An application processing hostile public scripts must additionally use OS/container isolation with a non-privileged account, a read-only/minimal filesystem, no secrets or inherited mounts, denied egress by default, and CPU/memory/process limits. A dedicated execution service may be preferable for multi-tenant deployments.

The current adapter does not broker `request.security`, `request.security_lower_tf`, or `request.footprint`; those need an explicit parent protocol, root-wide budgets, and validated symbol/timeframe access rules before being enabled. Do not substitute a real provider object in the child. The browser needs its own Worker and origin/network policy; this Node adapter must not be bundled into browser builds.
