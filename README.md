# react-rserve

[![R-CMD-check](https://github.com/tmelliott/react-rserve/actions/workflows/ci.yml/badge.svg)](https://github.com/tmelliott/react-rserve/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@tmelliott/react-rserve)](https://www.npmjs.com/package/@tmelliott/react-rserve)

A React library that provides utilities for connecting to and using Rserve.

## Development

### Changesets

This project uses [changesets](https://github.com/changesets/changesets) for version management and releases.

To create a new changeset:

```bash
pnpm changeset
```

This will prompt you to select the type of change (patch, minor, major) and to provide a description of the change.

The repository is configured with GitHub Actions that will automatically create a Release PR when changesets are pushed to the main branch.

## Example usage

1. Connect to R using the hook:

```tsx
// DemoComponent.tsx
import { useRserve, useOcap } from "tmelliott/react-rserve";
import appSchema from "./path/to/app.rserve.ts";

export default function DemoComponent() {
  const { app } = useRserve(appSchema, {
    host: "https://localhost:6311",
  });
  const { result, loading, error } = useOcap(app?.fun);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return <p>{result}</p>; // "Hello, world!"
}
```

If an Ocap returns more Ocaps, you can use conditional components (and make use of the `AppType` helper):

```tsx
import { useRserve, useOcap, type AppType } from "@tmelliott/react-rserve";
type App = AppType<typeof appSchema>;

// AnotherComponent.tsx
function AnotherComponent() {
  const { app } = useRserve(appSchema, {...});
  const { result, loading } = useOcap(app?.anotherFun);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error !== undefined) {
    return <p>Error: {error}</p>;
  }

  return <SubComponent ocap={result} />;
}

type AnotherFunResult = Awaited<ReturnType<App.anotherFun>>;

function SubComponent({ features }: { features: AnotherFunResult }) {
  const { result, loading, error } = useOcap(features.secondaryFunction);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error !== undefined) {
    return <p>Error: {error}</p>;
  }

  return <p>{result}</p>;
}
```

Alternatively, you can bypass hooks and use `<Suspense>` instead:

```tsx
import { Suspense } from "react";
import { useRserve, type AppType } from "@tmelliott/react-rserve";
type App = AppType<typeof appSchema>;

function MyComponent() {
  const { app } = useRserve(appSchema, { host: "ip-of-host" });

  return (
    <div>
      <h1>Compute results using suspense</h1>
      <Suspense fallback={<>Loading ...</>}>
        <ResultComponent fn={app.fn} />
      </Suspense>
    </div>
  );
}

async function ResultComponent({ fn }: { app: App.fn }) {
  const result = await fn();

  return <div>Result: {result}</div>;
}
```
