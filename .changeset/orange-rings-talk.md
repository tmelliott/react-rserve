---
"@tmelliott/react-rserve": patch
---

Fix test discovery to ignore built artifacts in `dist`.

This prevents Vitest from executing compiled test files outside the test runner context, which caused CI failures in `npm test`.
