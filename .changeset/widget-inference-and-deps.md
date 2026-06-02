---
"@tmelliott/react-rserve": minor
---

Improve `useWidget` inference for `ts_compile`-generated connectors, including child widgets and empty R `methods` lists. `state` now reflects property `get()` values with rserve list metadata stripped; widget constructors accept Zod-wrapped ocaps.

**Breaking:** removed `dispatchAction`, `undo`, `redo`, and `actionState` from `useWidget` — call widget methods on `methods` directly. Moved `rserve-ts` and `zod` from peer dependencies to direct dependencies.
