---
"@tmelliott/react-rserve": patch
---

Fix a generated TypeScript declaration regression in `useWidget` that could break
consumer IntelliSense by emitting an invalid generic reference in `.d.ts` output.

Add a declaration validation script and run it in CI/prepublish so invalid `dist`
types are caught before release.
