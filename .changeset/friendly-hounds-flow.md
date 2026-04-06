---
"@tmelliott/react-rserve": patch
---

Widen `useWidget` constructor typing to accept generated `RserveTS` widget shapes and normalize raw capabilities metadata (`strict`, `types`, `enabled`) into a stable action-capabilities contract. This removes the need for consumer-side compatibility adapters and moves the generated-ctor compatibility MRE into the library test surface.
