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

- [Providing library sources](#providing-library-sources)
- [Built-in resolvers](#built-in-resolvers)
- [Writing a resolver](#writing-a-resolver)
- [What is supported](#what-is-supported)
- [Limitations](#limitations)

---

## Providing library sources

PineTS does not download libraries from TradingView. You tell it where library sources come from with an **import resolver**: a function that receives the import path (`user/library/version`) and returns the library's Pine Script source.

```javascript
import { PineTS, Provider, ImportResolver } from 'pinets';

const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1h', 500);

pineTS.setImportResolver(
    ImportResolver.fromMap({
        'PineCoders/AllTimeHighLow/1': allTimeHighLowSource,
    })
);

const { plots } = await pineTS.run(scriptSource);
```

Before transpiling, PineTS asks the resolver for every library the script imports, and for the libraries those import in turn. Each path is requested **once per resolver**: results are cached, across runs and for the secondary contexts of `request.security()`. A resolver that throws is asked again on the next run.

A script that imports a library fails to run when no resolver is set, or when the resolver does not know one of the script's own imports.

## Built-in resolvers

| Resolver                                   | Source of the libraries                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `ImportResolver.fromMap(sources)`          | Strings in memory (object or `Map`)                                                     |
| `ImportResolver.fromFiles(dir, options?)`  | Local files, Node.js only                                                               |
| `ImportResolver.fromUrl(url, options?)`    | Any URL, with `{user}`, `{name}`, `{version}`, `{path}` placeholders                    |
| `ImportResolver.fromGitHub(location, options?)` | A GitHub repository, folder or file                                                |
| `ImportResolver.chain(...resolvers)`       | Each resolver in turn; the first source found wins                                      |

### `fromMap`

Keys are looked up by full path, then by `user/library` (any version), then by library name alone:

```javascript
ImportResolver.fromMap({
    'PineCoders/AllTimeHighLow/1': athSource, // this version only
    'TradingView/ta': taSource, // any version of TradingView/ta
    Signals: signalsSource, // any library named "Signals"
});
```

### `fromFiles`

A folder holding one file per library, named after the library, with no extension or `.pine` / `.txt`; or a path template:

```javascript
ImportResolver.fromFiles('./pine/libraries');
ImportResolver.fromFiles('./pine/{user}/{name}-v{version}.pine', { extensions: [''] });
```

### `fromUrl`

```javascript
ImportResolver.fromUrl('https://example.com/pine/{user}/{name}/{version}.pine', {
    headers: { Authorization: `Bearer ${token}` },
});
```

A 404 response means "unknown library"; any other error status throws.

### `fromGitHub`

Takes a repository, folder (`/tree/...`) or file (`/blob/...`) URL, or `{ owner, repo, ref?, path? }`:

```javascript
// a folder holding one file per library, named after the library
ImportResolver.fromGitHub('https://github.com/acme/pine-libraries/tree/main/libraries');

// a private repository: pass a token
ImportResolver.fromGitHub('https://github.com/acme/private-libraries/tree/main/libraries', { token: process.env.GITHUB_TOKEN });

// one file: serves the library named after it
ImportResolver.fromGitHub('https://github.com/acme/pine-libraries/blob/main/libraries/Signals');
```

Without a token, files are read from `raw.githubusercontent.com`; with one, through the GitHub contents API, which also serves private repositories. A file path is the folder plus the library name, then `.pine` (`extensions` option). The version is not part of it, since a repository usually holds the latest version of each library; use a `path` template with `{version}` if yours keeps several.

### Combining resolvers

```javascript
pineTS.setImportResolver(
    ImportResolver.chain(
        ImportResolver.fromMap({ 'PineCoders/AllTimeHighLow/1': localCopy }),
        ImportResolver.fromGitHub('https://github.com/acme/pine-libraries/tree/main/libraries', { token })
    )
);
```

## Writing a resolver

Any function `(path, info) => string | null` (or one returning a promise), or an object with such a `resolve` method, is a resolver. `info` holds `user`, `name`, `version`, and `importer`, the path of the library holding the import (undefined for the script itself). Return `null` for a library you do not know.

```javascript
pineTS.setImportResolver(async (path, { name }) => {
    const res = await fetch(`https://my-server/libraries/${name}`);
    return res.ok ? res.text() : null;
});
```

To fetch the libraries of a script yourself, ahead of a run, use `resolveImports(source, resolver)`: it returns `{ [path]: source }` for the script's imports and theirs.

## What is supported

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
