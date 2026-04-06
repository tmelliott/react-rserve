# `useWidget` Generated Ctor Compatibility MRE

This MRE documents and enforces compatibility between:

- constructors generated from `RserveTS::ts_compile()` style schemas, and
- the ctor type accepted by `useWidget()` in `@tmelliott/react-rserve`.

## Why this is here

This is a library contract test. Consumer apps should not need compatibility
adapters for generated widget constructors.

## Validation

Run:

```bash
bun run test:types
```

The companion `repro.ts` file is compiled as part of the library typecheck and
must compile without `@ts-expect-error`.
