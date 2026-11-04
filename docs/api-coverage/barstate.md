---
layout: default
title: Barstate
parent: API Coverage
---

## Barstate

### Bar State Flags

| Function                          | Status | Description                   |
| --------------------------------- | ------ | ----------------------------- |
| `barstate.isconfirmed`            | ✅     | Bar is confirmed              |
| `barstate.isfirst`                | ✅     | First bar of dataset          |
| `barstate.ishistory`              | ✅     | Bar is historical             |
| `barstate.islast`                 | ✅     | Last bar of dataset           |
| `barstate.islastconfirmedhistory` | ✅     | Last confirmed historical bar |
| `barstate.isnew`                  | ✅     | New bar                       |
| `barstate.isrealtime`             | ✅     | Bar is real-time (receives live data: not closed, market open) |
