---
layout: default
title: Architecture
nav_order: 7
has_children: true
permalink: /architecture/
---

# Architecture Guide

This section provides a deep dive into the internal architecture of PineTS. It is intended for **contributors** and **developers** who need to understand the transpilation pipeline, runtime execution model, and core design decisions to extend or debug the engine.

## Overview

PineTS bridges the gap between Pine Script's unique time-series semantics and standard JavaScript execution through a three-layer architecture:

```
┌─────────────────────────────────────────────────┐
│          User PineTS Code (Input)           │
│    (Looks like Pine Script, uses JS syntax) │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Transpiler Layer                  │
│  • AST Parsing (acorn)                      │
│  • Scope Analysis                           │
│  • Code Transformation                      │
│  • Context Variable Management              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Runtime Execution Layer             │
│  • Context Object ($)                       │
│  • Series Management                        │
│  • Namespace Functions (ta, math, etc.)     │
│  • State Management                         │
└─────────────────────────────────────────────────┘
```

### Main Components

1.  **PineTS Class**: Orchestrates market data loading, execution, and pagination
2.  **Context Class**: Maintains execution state, series data, and namespaces
3.  **Transpiler**: Transforms PineTS code into executable JavaScript
4.  **Namespaces**: Provide Pine Script functions (ta.ema, math.abs, etc.)

## Documentation Structure

### Core Architecture

- [Transpiler Architecture](./transpiler/index.md): Details on AST parsing, scope analysis, and code transformation.
    - [Scope Manager](./transpiler/scope-manager.md): Variable renaming and unique ID generation
    - [Transformers](./transpiler/transformers.md): AST transformation logic
    - [Real Examples](./transpiler/examples.md): Actual transpilation output examples
- [Runtime Engine](./runtime/index.md): How the `Context`, `Series`, and execution loop work.
    - [Context Class](./runtime/context.md): The global state object
    - [Series Class](./runtime/series.md): Forward storage with reverse access
    - [Execution Flow](./runtime/execution-flow.md): Run loop and pagination
- [Namespaces](./namespaces/index.md): Implementation of `ta`, `math`, `request`, etc.
    - [Technical Analysis (ta)](./namespaces/ta.md): TA functions implementation
    - [Math (math)](./namespaces/math.md): Mathematical operations
    - [Array (array)](./namespaces/array.md): Array operations
    - [Request (request)](./namespaces/request.md): Multi-timeframe analysis
    - [Input (input)](./namespaces/input.md): User input handling
- [Critical Implementation Details](./specifics/index.md): Deep dives into tuple handling, `request.security`, and other complex features.
    - [Tuple Handling](./specifics/tuples.md): Double bracket convention
    - [Request Security](./specifics/request-security.md): Secondary context architecture

### Developer Resources

- [Debugging Guide](./debugging.md): Practical debugging techniques and common issues
- [Best Practices](./best-practices.md): Common pitfalls and recommended patterns
- [Syntax Evolution](./syntax-evolution.md): Migration from old to new syntax

## Key Design Principles

1.  **Series-First**: Everything is a time-series. The `Series` class is the fundamental data unit.
2.  **Forward Storage, Reverse Access**: Data is stored chronologically (push to end) but accessed with reverse indexing (`close[1]` is previous).
3.  **Incremental Calculation**: Functions utilize state to calculate values O(1) per bar rather than recalculating history.
4.  **State Isolation**: Unique IDs ensure that multiple calls to the same function maintain separate internal states.
