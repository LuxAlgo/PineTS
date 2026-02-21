---
layout: default
title: Chart
parent: API Coverage
---

## Chart

### Chart Properties

| Function         | Status | Description      |
| ---------------- | ------ | ---------------- |
| `chart.bg_color` | ✅     | Background color |
| `chart.fg_color` | ✅     | Foreground color |

### Chart Type Detection

| Function              | Status | Description                   |
| --------------------- | ------ | ----------------------------- |
| `chart.is_heikinashi` | ✅     | Check if Heikin Ashi chart    |
| `chart.is_kagi`       | ✅     | Check if Kagi chart           |
| `chart.is_linebreak`  | ✅     | Check if Line Break chart     |
| `chart.is_pnf`        | ✅     | Check if Point & Figure chart |
| `chart.is_range`      | ✅     | Check if Range chart          |
| `chart.is_renko`      | ✅     | Check if Renko chart          |
| `chart.is_standard`   | ✅     | Check if standard chart       |

### Visible Range

| Function                       | Status | Description            |
| ------------------------------ | ------ | ---------------------- |
| `chart.left_visible_bar_time`  |        | Left visible bar time  |
| `chart.right_visible_bar_time` |        | Right visible bar time |

### Chart Point

| Function                   | Status | Description             |
| -------------------------- | ------ | ----------------------- |
| `chart.point.copy()`       | ✅     | Copy chart point        |
| `chart.point.from_index()` | ✅     | Create point from index |
| `chart.point.from_time()`  | ✅     | Create point from time  |
| `chart.point.new()`        | ✅     | Create new chart point  |
| `chart.point.now()`        | ✅     | Get current chart point |

### Chart Point Fields

| Field                | Status | Description         |
| -------------------- | ------ | ------------------- |
| `chart.point.index`  | ✅     | Bar index of point  |
| `chart.point.price`  | ✅     | Price of point      |
| `chart.point.time`   | ✅     | Timestamp of point  |
