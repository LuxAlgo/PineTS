# Pine Script to JavaScript Transpiler (`pineToJS`)

This module is a core component of the PineTS project responsible for transpiling native Pine Script code (v5/v6) into executable JavaScript compatible with the PineTS Runtime.

## 🎯 Purpose

While the core PineTS engine executes logic using a JavaScript-based syntax (e.g., `context.pine.ta.sma(...)`), this transpiler bridges the gap for users who want to write or paste actual Pine Script code directly. It handles the syntactical differences—most notably significant indentation and specific control flow structures—transforming them into standard JavaScript.

## 🏗 Architecture & The Transpilation Pipeline

PineTS employs a **2-stage transpilation process** to convert Pine Script into executable low-level JavaScript. This approach treats JavaScript (with PineTS API calls) as an Intermediate Representation (IR).

```text
+-------------------+
| Pine Script Code  |
+-------------------+
        |
        | pineToJS
        v
+------------------------+
| JavaScript / PineTS API|  <-- Intermediate Representation (IR)
+------------------------+
        |
        | Core Transpiler
        v
+-------------------------+
| Low-Level Executable JS |
+-------------------------+
        |
        | Execution
        v
+-----------------+
|  PineTS Engine  |
+-----------------+
```

### 1. Stage 1: Pine Script → PineTS JS (The "IR")

This module (`pineToJS`) performs the first translation. It converts Pine Script syntax into valid JavaScript that calls PineTS API methods.

-   **Input**: Native Pine Script (v5/v6)
-   **Output**: JavaScript equivalent code compatible with PineTS syntax
-   **Role**: Handles syntax translation (indentation to blocks, `:=` to assignments, etc.) without worrying about execution details.

### 2. Stage 2: PineTS JS → Executable JS

The core PineTS transpiler takes the output from Stage 1 and optimizes it for the runtime engine.

-   **Input**: JavaScript / PineTS API code
-   **Output**: Optimized Low-level JavaScript
-   **Role**: Handles variable remapping (scopes), series access optimization, and runtime-specific transformations required by the execution loop.

This architecture simplifies the process by separating **syntax translation** (Pine Script specific) from **runtime optimization** (Execution specific).

## 🛠 Internal Architecture of `pineToJS`

The Stage 1 transpiler follows a standard 3-stage compiler pipeline:

```text
[Pine Script Source] -> [Lexer] -> [Parser] -> [Code Generator] -> [JavaScript Code]
```

### 1. Lexer (`lexer.ts`)

The Lexer tokenizes the input string. Its most critical role is handling **Python-style significant indentation**, which is fundamental to Pine Script scopes.

-   **Indentation Tracking**: Maintains an indentation stack to emit virtual `INDENT` and `DEDENT` tokens. The rules mirror TradingView (verified with `tv-extractor`):
    -   Indentation is measured in columns; a tab is four columns, fixed (not a tab stop).
    -   A width that is a multiple of four is a block level. One level deeper than the enclosing block emits `INDENT`; more than one is an error, as on TradingView.
    -   Any other width is **line wrapping**: the line is spliced onto the previous logical line (the separating `NEWLINE` / comment tokens are dropped), whatever it starts with — `- r2`, `.size()`, `2`. Its first token is tagged `wrapped` so the parser can explain a resulting syntax error.
    -   A line that follows a trailing binary/assignment/ternary operator, comma, or `and`/`or` is also spliced even when its width is a multiple of four (TradingView rejects this; PineTS accepts it because the intent is unambiguous).
    -   Blank lines, comment-only lines, and lines inside `(` `)` / `[` `]` carry no block structure.
    -   Because wrapping is resolved here, the parser never crosses a `NEWLINE` to continue an expression: `-x` on its own line at the block indent is a unary statement, not a continuation.
-   **Literals**: Parses Pine Script specific literals like Colors (`#FF5500`), Strings (including triple-quoted multiline strings), and Numbers.
-   **Comments**: Filters out comments while preserving line information for source mapping.

### 2. Parser (`parser.ts`)

The Parser consumes tokens to build a custom Abstract Syntax Tree (AST).

-   **Recursive Descent**: Implements a standard recursive descent parser.
-   **AST Nodes**: Defined in `ast.ts`, these nodes represent Pine Script constructs (e.g., `TypeDefinition`, `SwitchExpression`, `MethodDeclaration`).
-   **Scope Handling**: Understands Pine Script's variable declaration rules (`var`, `varip`, typed declarations).

### 3. Code Generator (`codegen.ts`)

The Code Generator traverses the AST and outputs valid JavaScript.

-   **Class Transformation**: Converts `type` definitions into JavaScript ES6 `class` structures.
-   **Control Flow Normalization**: Transforms Pine Script's expression-based control flow (e.g., `x = if ...`) into JavaScript equivalents (Ternaries or IIFEs).
-   **Operator Mapping**: Maps Pine Script operators (`and`, `or`, `:=`) to JavaScript equivalents (`&&`, `||`, `=`).

## 🔌 Integration with PineTS Runtime

This transpiler is designed to feed into the PineTS Runtime (`PineTS.class.ts`).

1.  **Input**: User provides a Pine Script string.
2.  **Transpilation**: `pineToJS` converts this string into a JavaScript function body.
3.  **Context Injection**: The PineTS Runtime wraps this body in a function that injects the necessary context:
    -   **Data Series**: `open`, `close`, `high`, `low` (mapped from `context.data`).
    -   **Namespaces**: `ta`, `math`, `request` (mapped from `context.pine`).
4.  **Execution**: The resulting function is executed iteratively over the market data by the PineTS engine.

## ✨ Key Features

-   **Indentation Support**: Correctly interprets block scopes defined by indentation.
-   **Method Syntax**: Supports the `method` keyword and method calls (e.g., `array.new<float>()`).
-   **Variable Persistence**: Maps `var` and `varip` keywords to appropriate JavaScript variable declarations.
-   **Complex Expressions**: Handles nested `if` expressions and `switch` statements by normalizing them into executable JavaScript logic.

## 🚀 Usage

```typescript
import { pineToJS } from './pineToJS.index';

const pineCode = `
    //@version=5
    indicator("My Script")
    x = close > open ? 1 : 0
    plot(x)
`;

const result = pineToJS(pineCode);

if (result.success) {
    console.log(result.code);
    // Outputs JS that can be evaluated within a PineTS Context
}
```
