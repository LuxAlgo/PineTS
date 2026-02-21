---
layout: default
title: Input (input)
parent: Namespaces
nav_order: 5
permalink: /architecture/namespaces/input/
---

# PineTS Input (`input`) Namespace

This directory contains the implementation of Pine Script's `input.*` namespace functions. These functions handle user inputs/parameters for indicators.

## Architecture

Functions are factory functions accessing the `context`.

### Runtime Input Resolution

Starting with v0.8.0, `input` functions automatically resolve values from `context.inputs` if available. This allows passing custom values at runtime using the `Indicator` class.

1.  **Check `context.inputs`**: The function looks for a key matching the input's `title`.
2.  **Fallback**: If no runtime input is found for that title, the `defval` (default value) specified in the script is used.

## The `param()` Method

The `input.param()` method returns the value using Series.from(source).get(index)

### Purpose

This wrapping might be a historical artifact or used to distinguish input values from standard scalar values in the `Context.init()` logic, similar to how tuple returns are wrapped in double brackets.

## Implementation Specifics

### 1. Constant Nature

In Pine Script, `input` values are constant throughout the script execution (except for `input.source` or `input.price` which might vary if mapped to changing data).

### 2. Types

Functions like `input.int`, `input.float`, `input.bool` perform validation or casting to ensure the provided value matches the expected type.

## Generating the Barrel File

To regenerate the `input.index.ts` file:

```bash
npm run generate:input-index
```
