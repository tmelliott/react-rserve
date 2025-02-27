**react-rserve**

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

1. Create Rserve context provider:

```tsx
// utils/rserve.ts
import { createRserveProvider } from "react-rserve";

// generated using the `ts` R package: github.com/tmelliott/ts
import app from "../path/to/app.ts";

export const { RserveContext, RserveProvider, useRserve } =
  createRserveProvider(app, {
    host: "localhost:6311",
  });
```

TODO: create this file with the `ts` package.

2. Set up the provider:

```tsx
// App.tsx
import { RserveProvider } from "./utils/rserve";
import DemoComponent from "./DemoComponent";

export default function App() {
  return (
    <RserveProvider>
      <div>
        <h1>React Rserve</h1>
        <DemoComponent />
      </div>
    </RserveProvider>
  );
}
```

3. Use the app in components:

```tsx
// DemoComponent.tsx
import { rserve } from "./utils/rserve";

export default function DemoComponent() {
  const { app } = useRserve();
  const { result, loading, error } = useOcap(app.fun);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return <p>{result}</p>; // "Hello, world!"
}
```

If an Ocap returns more Ocaps, you need to use conditional components.

```tsx
import type { App } from "../path/to/app.ts";

// AnotherComponent.tsx
function AnotherComponent() {
  const { app } = useRserve();
  const { result, loading } = useOcap(app.anotherFun);

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
