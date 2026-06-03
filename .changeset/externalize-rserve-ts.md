---
"@tmelliott/react-rserve": patch
---

Stop bundling `rserve-ts` and `zod` in the library build (Vite `external`). Bump minimum `rserve-ts` to `0.9.3` so list `r_attributes.names` accepts arrays from R.
