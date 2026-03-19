---
"@tmelliott/react-rserve": patch
---

Harden `useWidget` method invocation by supporting both function-shaped methods and `{ call }` wrappers without fallback retries based on caught errors.

Expose widget `children` in hook snapshots for nested widget rendering, improve `dispatchAction` type inference for `(type, payload)` signatures, and add colocated regression tests while excluding test/typecheck files from library build entries.
