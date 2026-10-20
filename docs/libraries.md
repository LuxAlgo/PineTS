---
layout: default
title: Libraries (import / export)
nav_order: 7.5
permalink: /libraries/
---

# Libraries: `import` and `export`

PineTS runs Pine Script scripts that import [libraries](https://www.tradingview.com/pine-script-docs/concepts/libraries/), and libraries themselves (`library()` declaration, `export` keyword).

```pine
//@version=6
indicator("Using a library")
import PineCoders/AllTimeHighLow/1 as allTime

plot(allTime.hi())
plot(allTime.lo(close))
```

## Table of Contents

- [Import Resolvers](#import-resolvers)
- [GitHub](#github)
- [Local Files](#local-files)
- [URL](#url)
- [In-Memory Sources](#in-memory-sources)
- [Combining Resolvers](#combining-resolvers)
- [Caching](#caching)
- [Custom Resolvers](#custom-resolvers)
- [What is Supported](#what-is-supported)
- [Limitations](#limitations)

---

## Import Resolvers

PineTS does not download libraries from TradingView. An **import resolver** tells it where library sources come from: given an import path (`user/library/version`), it returns the library's Pine Script source. Set one on the `PineTS` instance before running a script that imports libraries:

**1. Singleton** (from the `ImportResolver` registry):

```typescript
import { PineTS, Provider, ImportResolver } from 'pinets';

ImportResolver.GitHub.configure({ url: 'https://github.com/acme/pine-libraries/tree/main/libraries' });

const pine = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 500);
pine.setImportResolver(ImportResolver.GitHub);
const { plots } = await pine.run(scriptSource);
```

**2. Direct instantiation** (for an instance with its own configuration):

```typescript
import { PineTS, Provider, GitHubImportResolver } from 'pinets';

const github = new GitHubImportResolver({ url: 'https://github.com/acme/private-libraries/tree/main/libraries', token: process.env.GITHUB_TOKEN });

const pine = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 500);
pine.setImportResolver(github);
```

Before transpiling, PineTS asks the resolver for every library the script imports, and for the libraries those import in turn. `request.security()` contexts use the resolver of the script that created them. A script that imports a library fails to run when no resolver is set, or when the resolver does not know one of the script's own imports.

| Resolver                 | Registry                | Source of the libraries             |
| ------------------------ | ----------------------- | ----------------------------------- |
| `GitHubImportResolver`   | `ImportResolver.GitHub` | A GitHub repository, folder or file |
| `FileImportResolver`     | `ImportResolver.File`   | Local files (Node.js only)          |
| `UrlImportResolver`      | `ImportResolver.Url`    | Any URL                             |
| `MapImportResolver`      | `ImportResolver.Map`    | Sources held in memory              |
| `ChainImportResolver`    | -                       | Several resolvers, asked in turn    |
| `FunctionImportResolver` | -                       | A function `(path, info) => source` |

---

## GitHub

Reads libraries from a GitHub repository. **Requires a location** (`url`, or `owner` and `repo`); private repositories also need a token.

```typescript
// a folder holding one file per library, named after the library
ImportResolver.GitHub.configure({ url: 'https://github.com/acme/pine-libraries/tree/main/libraries' });

// a private repository
const github = new GitHubImportResolver({ url: 'https://github.com/acme/private-libraries/tree/main/libraries', token: process.env.GITHUB_TOKEN });

// one file: serves the library named after it
const signals = new GitHubImportResolver({ url: 'https://github.com/acme/pine-libraries/blob/main/libraries/Signals' });
```

| Option       | Type       | Required                  | Description                                                                     |
| ------------ | ---------- | ------------------------- | ------------------------------------------------------------------------------- |
| `url`        | `string`   | Yes (or `owner` + `repo`) | Repository, folder (`/tree/<ref>/<folder>`) or file (`/blob/<ref>/<file>`) URL  |
| `owner`      | `string`   | No                        | Repository owner, instead of `url`                                              |
| `repo`       | `string`   | No                        | Repository name, instead of `url`                                               |
| `ref`        | `string`   | No                        | Branch, tag or commit; the default branch otherwise                             |
| `path`       | `string`   | No                        | Folder, or template with `{user}`, `{name}`, `{version}`, `{path}` placeholders |
| `token`      | `string`   | No                        | Access token, for private repositories                                          |
| `extensions` | `string[]` | No                        | Suffixes tried after the path. Default `['', '.pine']`                          |
| `fetch`      | `function` | No                        | `fetch` implementation; the global one by default                               |

Without a token, files are read from `raw.githubusercontent.com`; with one, through the GitHub contents API, which also serves private repositories. A missing file means "unknown library".

**Versions.** The default file path is the folder plus the library name: the version in the import is not part of it, since a repository usually holds the latest version of each library. To serve several versions, use a `path` template with `{version}` (`libraries/{name}/v{version}.pine`), or point a second resolver at an older `ref`.

---

## Local Files

Reads libraries from local files. **Node.js only**: not available in browser builds.

```typescript
ImportResolver.File.configure({ dir: './pine/libraries' });
// ./pine/libraries/<name>, then <name>.pine, then <name>.txt

const versioned = new FileImportResolver({ dir: './pine/{user}/{name}-v{version}.pine', extensions: [''] });
```

| Option       | Type       | Required | Description                                                                     |
| ------------ | ---------- | -------- | ------------------------------------------------------------------------------- |
| `dir`        | `string`   | Yes      | Folder holding one file per library, or a path template (placeholders as above) |
| `extensions` | `string[]` | No       | Suffixes tried after the path. Default `['', '.pine', '.txt']`                  |

---

## URL

Fetches each library from a URL. A 404 response means "unknown library"; any other error status throws.

```typescript
ImportResolver.Url.configure({
    url: 'https://example.com/pine/{user}/{name}/{version}.pine',
    headers: { Authorization: `Bearer ${token}` },
});
```

| Option    | Type                 | Required | Description                                              |
| --------- | -------------------- | -------- | -------------------------------------------------------- |
| `url`     | `string \| function` | Yes      | URL template (placeholders as above), or `(info) => url` |
| `headers` | `object`             | No       | Request headers                                          |
| `fetch`   | `function`           | No       | `fetch` implementation; the global one by default        |

---

## In-Memory Sources

Library sources you already hold as strings: read from disk, a database, an API, a bundled import. Keys are looked up by full path, then by `user/library` (any version), then by library name alone.

```typescript
ImportResolver.Map.configure({
    libraries: {
        'PineCoders/AllTimeHighLow/1': athSource, // this version only
        'TradingView/ta': taSource, // any version of TradingView/ta
        Signals: signalsSource, // any library named "Signals"
    },
});
```

| Option      | Type            | Required | Description                     |
| ----------- | --------------- | -------- | ------------------------------- |
| `libraries` | `object \| Map` | No       | Library sources, keyed as above |

Lookups are not cached: a source added to the `libraries` object later is found.

---

## Combining Resolvers

`ChainImportResolver` asks each resolver in turn; the first source found wins. Functions are accepted next to resolvers.

```typescript
import { ChainImportResolver, MapImportResolver, GitHubImportResolver } from 'pinets';

pine.setImportResolver(
    new ChainImportResolver({
        resolvers: [
            new MapImportResolver({ libraries: { 'PineCoders/AllTimeHighLow/1': localCopy } }),
            new GitHubImportResolver({ url: 'https://github.com/acme/pine-libraries/tree/main/libraries', token }),
        ],
    }),
);
```

---

## Caching

Each resolver keeps what it resolves: the source of a library, or the fact that it does not know it. A library is therefore fetched **once per resolver**, across runs, across the `PineTS` instances sharing the resolver, and by `request.security()` contexts. Concurrent requests for one library share one fetch, and a failed fetch is tried again on the next run.

| Option          | Type     | Default                 | Description                                |
| --------------- | -------- | ----------------------- | ------------------------------------------ |
| `cacheDuration` | `number` | the resolver's lifetime | How long a resolved library is kept, in ms |

`configure()` and `clearCache()` empty the cache. `MapImportResolver` and `ChainImportResolver` do not cache themselves (lookups are in memory, and each chained resolver has its own cache).

---

## Custom Resolvers

A plain function `(path, info) => source | null` works as a resolver; `setImportResolver` wraps it in a `FunctionImportResolver`, which caches like the others. `info` holds `path`, `user`, `name`, `version`, and `importer`, the path of the library holding the import (undefined for the script itself). Return `null` for a library you do not know.

```typescript
pine.setImportResolver(async (path, { name }) => {
    const res = await fetch(`https://my-server/libraries/${name}`);
    return res.ok ? res.text() : null;
});
```

For a reusable resolver, implement the `IImportResolver` interface or extend `BaseImportResolver`, which provides the caching and the configuration check:

```typescript
import { BaseImportResolver, ImportResolver } from 'pinets';
import type { ImportInfo, BaseImportResolverConfig } from 'pinets';

interface MyConfig extends BaseImportResolverConfig {
    apiKey: string;
}

class MyImportResolver extends BaseImportResolver<MyConfig> {
    private _apiKey: string | null = null;

    constructor(config?: MyConfig) {
        super({ requiresConfig: true, resolverName: 'My' });
        if (config) this.configure(config);
    }

    configure(config: MyConfig): void {
        super.configure(config);
        this._apiKey = config.apiKey;
    }

    protected async _resolveNative(info: ImportInfo) {
        const res = await fetch(`https://my-server/libraries/${info.user}/${info.name}/${info.version}`, { headers: { 'X-Key': this._apiKey! } });
        return res.ok ? res.text() : null;
    }
}

// Optional: add it to the registry
ImportResolver['My'] = new MyImportResolver();
```

To fetch the libraries of a script yourself, ahead of a run, use `resolveImports(source, resolver)`: it returns `{ [path]: source }` for the script's imports and theirs.

---

## What is Supported

- **Exported functions, methods, types and enums**: `alias.f()`, `alias.Type.new()`, `alias.Type` in type annotations (`alias.Type p = ...`, `array<alias.Type>`), `alias.Enum.field`, imported enums in `input.enum()`.
- **Methods** with either syntax: `obj.method()` or `alias.method(obj)`.
- **Named arguments** and default parameter values.
- **State per call site**: `var` variables and `ta.*` calls inside a library function keep separate state for each call in the script, as on TradingView.
- **No name collisions**: the script may declare functions, types or variables with the same names as a library's; non-exported methods stay private to their library.
- **The alias defaults to the library name**: `import TradingView/ta/7` is used as `ta.*`. An alias named like a built-in namespace (`ta`, `math`, ...) still reaches the built-ins for the members the library does not export.
- **Libraries importing libraries**, each linked once, whatever the number of importers.
- **Only what the script uses is linked**: a library's import that the resolver does not know is only an error if the script uses code needing it.
- **Running a library directly**: its global code runs as an indicator's would.

## Limitations

- A library runs with the language semantics of the importing script's Pine Script version. They differ in a few cases between v5 and v6 (lazy `and` / `or`, division of `const int` values), which matters when a v6 script imports a v5 library.
- Library sources are not fetched from TradingView: provide them through a resolver.
- A function declared with a library type as its return type (`export alias.Type f() =>`) does not parse yet.
