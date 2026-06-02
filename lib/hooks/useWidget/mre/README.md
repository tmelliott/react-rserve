# MRE: VIT-style child widget + `useWidget`

This folder reproduces the TypeScript issue from the VIT app: a **static child** connector (`children.samplingVariation`) returned from the root `vitWidget` ocap is passed to `useWidget`, but its inferred ctor / resolved widget shape does not match `useWidget`’s parameter type (notably `methods` from an empty R `list()` vs `WidgetMethods`).

## What is here

- `vit.rserve.ts` — copy of VIT’s generated `vit.rserve.ts` (from `RserveTS::ts_compile('vit.R')`), so inferred types match production.
- `child-useWidget.typetest.tsx` — minimal `useWidget(childCtor)` call using `Awaited<ReturnType<TVitApp['vitWidget']>>['children']['samplingVariation']`.

## How to run

From `ws1_tools/react-rserve`:

```bash
bun run test:mre
```

This runs `tsc --noEmit -p tsconfig.mre.json` **only** on the MRE files. It should stay **green** with `useWidget` accepting generated child connector ctors (optional `fn`, empty R `methods` list typing). The main library check remains `bun run test:types` (MRE is excluded from `tsconfig.lib.json`).

## Regression check

After changing widget typing, run `bun run test:mre`, then `bun run test:types` and `bun test`.
