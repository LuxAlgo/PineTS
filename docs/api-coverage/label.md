---
layout: default
title: Label
parent: API Coverage
---

## Label

### Styles

| Function                        | Status | Description             |
| ------------------------------- | ------ | ----------------------- |
| `label.style_arrowdown`         | ✅     | Arrow down style        |
| `label.style_arrowup`           | ✅     | Arrow up style          |
| `label.style_circle`            | ✅     | Circle style            |
| `label.style_cross`             | ✅     | Cross style             |
| `label.style_diamond`           | ✅     | Diamond style           |
| `label.style_flag`              | ✅     | Flag style              |
| `label.style_label_center`      | ✅     | Label center style      |
| `label.style_label_down`        | ✅     | Label down style        |
| `label.style_label_left`        | ✅     | Label left style        |
| `label.style_label_lower_left`  | ✅     | Label lower left style  |
| `label.style_label_lower_right` | ✅     | Label lower right style |
| `label.style_label_right`       | ✅     | Label right style       |
| `label.style_label_up`          | ✅     | Label up style          |
| `label.style_label_upper_left`  | ✅     | Label upper left style  |
| `label.style_label_upper_right` | ✅     | Label upper right style |
| `label.style_none`              | ✅     | No style                |
| `label.style_square`            | ✅     | Square style            |
| `label.style_text_outline`      | ✅     | Text outline style      |
| `label.style_triangledown`      | ✅     | Triangle down style     |
| `label.style_triangleup`        | ✅     | Triangle up style       |
| `label.style_xcross`            | ✅     | X-cross style           |

### Management

| Function         | Status | Description           |
| ---------------- | ------ | --------------------- |
| `label.all`      | ✅     | All labels collection |
| `label`          | ✅     | Casts na to label     |
| `label.copy()`   | ✅     | Copy label            |
| `label.delete()` | ✅     | Delete label          |
| `label.new()`    | ✅     | Create new label (supports both `x, y` and `point` signatures, with `force_overlay`) |

### Getters

| Function           | Status | Description      |
| ------------------ | ------ | ---------------- |
| `label.get_text()` | ✅     | Get label text   |
| `label.get_x()`    | ✅     | Get x coordinate |
| `label.get_y()`    | ✅     | Get y coordinate |

### Setters

| Function                       | Status | Description             |
| ------------------------------ | ------ | ----------------------- |
| `label.set_color()`            | ✅     | Set label color         |
| `label.set_point()`            | ✅     | Set label point         |
| `label.set_size()`             | ✅     | Set label size          |
| `label.set_style()`            | ✅     | Set label style         |
| `label.set_text()`             | ✅     | Set label text          |
| `label.set_text_font_family()` | ✅     | Set text font family    |
| `label.set_text_formatting()`  | ✅     | Set text formatting     |
| `label.set_textalign()`        | ✅     | Set text alignment      |
| `label.set_textcolor()`        | ✅     | Set text color          |
| `label.set_tooltip()`          | ✅     | Set tooltip             |
| `label.set_x()`                | ✅     | Set x coordinate        |
| `label.set_xloc()`             | ✅     | Set x-location          |
| `label.set_xy()`               | ✅     | Set x and y coordinates |
| `label.set_y()`                | ✅     | Set y coordinate        |
| `label.set_yloc()`             | ✅     | Set y-location          |
