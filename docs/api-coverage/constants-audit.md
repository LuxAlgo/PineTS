# Constants Audit — TV vs PineTS String Values

> Generated 2026-03-01 via `diag/types_audit.pine` on BTCUSDC Weekly

## Mismatched (28)

### shape (12) — TV uses `shape_` prefix + underscored words

| Constant | TV Value | PineTS Value |
|---|---|---|
| `shape.arrowdown` | `shape_arrow_down` | `arrowdown` |
| `shape.arrowup` | `shape_arrow_up` | `arrowup` |
| `shape.circle` | `shape_circle` | `circle` |
| `shape.cross` | `shape_cross` | `cross` |
| `shape.diamond` | `shape_diamond` | `diamond` |
| `shape.flag` | `shape_flag` | `flag` |
| `shape.labeldown` | `shape_label_down` | `labeldown` |
| `shape.labelup` | `shape_label_up` | `labelup` |
| `shape.square` | `shape_square` | `square` |
| `shape.triangledown` | `shape_triangle_down` | `triangledown` |
| `shape.triangleup` | `shape_triangle_up` | `triangleup` |
| `shape.xcross` | `shape_xcross` | `xcross` |

### location (5) — TV uses PascalCase

| Constant | TV Value | PineTS Value |
|---|---|---|
| `location.abovebar` | `AboveBar` | `abovebar` |
| `location.belowbar` | `BelowBar` | `belowbar` |
| `location.absolute` | `Absolute` | `absolute` |
| `location.bottom` | `Bottom` | `bottom` |
| `location.top` | `Top` | `top` |

### xloc (2) — TV uses abbreviations

| Constant | TV Value | PineTS Value |
|---|---|---|
| `xloc.bar_index` | `bi` | `bar_index` |
| `xloc.bar_time` | `bt` | `bar_time` |

### yloc (3) — TV uses abbreviations

| Constant | TV Value | PineTS Value |
|---|---|---|
| `yloc.price` | `pr` | `price` |
| `yloc.abovebar` | `ab` | `abovebar` |
| `yloc.belowbar` | `bl` | `belowbar` |

### font (2) — TV drops `family_` prefix

| Constant | TV Value | PineTS Value |
|---|---|---|
| `font.family_default` | `default` | `family_default` |
| `font.family_monospace` | `monospace` | `family_monospace` |

### text (5) — TV drops `align_`/`wrap_` prefix

| Constant | TV Value | PineTS Value |
|---|---|---|
| `text.align_left` | `left` | `align_left` |
| `text.align_center` | `center` | `align_center` |
| `text.align_right` | `right` | `align_right` |
| `text.wrap_auto` | `auto` | `wrap_auto` |
| `text.wrap_none` | `none` | `wrap_none` |

## Correct (11)

### size (6) — match as-is

| Constant | TV Value | PineTS Value |
|---|---|---|
| `size.auto` | `auto` | `auto` |
| `size.tiny` | `tiny` | `tiny` |
| `size.small` | `small` | `small` |
| `size.normal` | `normal` | `normal` |
| `size.large` | `large` | `large` |
| `size.huge` | `huge` | `huge` |

### format (5) — match as-is

| Constant | TV Value | PineTS Value |
|---|---|---|
| `format.inherit` | `inherit` | `inherit` |
| `format.mintick` | `mintick` | `mintick` |
| `format.percent` | `percent` | `percent` |
| `format.price` | `price` | `price` |
| `format.volume` | `volume` | `volume` |

## Not tested (opaque / numeric types)

| Namespace | Reason |
|---|---|
| `display` | Opaque `plot_simple_display` type — `str.tostring()` not supported |
| `order` | Numeric `sort_order` type — TV test errors |
| `barmerge` | Opaque `barmerge_gaps`/`barmerge_lookahead` types — TV test errors |
| `currency` | Already passing all tests |
| `dayofweek` | Already passing all tests |
